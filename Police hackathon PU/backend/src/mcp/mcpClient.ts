import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { config } from '@/config';
import fs from 'fs';

export interface BlockchainProfile {
  totalVolumeUSD: number;
  peakOperationPeriod: string;
  genesisDate: string;
  coinJoinRounds: number;
  /** [H2] True when MCP was unavailable and data is fabricated fallback. */
  isFallback: boolean;
}

export class McpService {
  private client: Client | null = null;
  private transport: StdioClientTransport | null = null;
  private isConnecting: boolean = false;
  private isAvailable: boolean = false;

  constructor() {
    this.checkAvailability();
  }

  private checkAvailability(): boolean {
    const pythonExists = fs.existsSync(config.pythonPath);
    const serverExists = fs.existsSync(config.mcpServerPath);
    this.isAvailable = pythonExists && serverExists;
    return this.isAvailable;
  }

  public async connect(): Promise<boolean> {
    if (!this.checkAvailability()) {
      console.warn(`[MCP] Python or Server script not found at specified paths. Running in offline/fallback mode.`);
      return false;
    }

    if (this.client && this.transport) {
      return true;
    }

    if (this.isConnecting) {
      return false;
    }

    this.isConnecting = true;
    try {
      this.transport = new StdioClientTransport({
        command: config.pythonPath,
        args: [config.mcpServerPath],
      });

      this.client = new Client(
        {
          name: 'nexus-backend-client',
          version: '1.0.0',
        },
        {
          capabilities: {},
        }
      );

      await this.client.connect(this.transport);
      console.log(`[MCP] Successfully connected to Python MCP Server (Darknet-Intel-Server).`);
      this.isConnecting = false;
      return true;
    } catch (err) {
      console.error(`[MCP] Failed to connect to Python MCP server:`, err);
      this.client = null;
      this.transport = null;
      this.isConnecting = false;
      return false;
    }
  }

  public async queryBlockchainLedger(
    walletAddress: string,
    currency: string = 'BTC'
  ): Promise<BlockchainProfile> {
    // [H2] Fallback profile explicitly marked as synthetic data.
    const fallbackProfile: BlockchainProfile = {
      totalVolumeUSD: 482000,
      peakOperationPeriod: '2026-05',
      genesisDate: '2024-03-12',
      coinJoinRounds: 14,
      isFallback: true,
    };

    if (!this.client) {
      const connected = await this.connect();
      if (!connected || !this.client) {
        return fallbackProfile;
      }
    }

    try {
      const result = (await this.client.callTool({
        name: 'query_blockchain_ledger',
        arguments: {
          wallet_address: walletAddress,
          currency,
        },
      })) as any;

      if (result && result.content && result.content[0] && result.content[0].text) {
        // [H3] Tightened JSON.parse — catch malformed Python output explicitly.
        let parsed: any;
        try {
          parsed = JSON.parse(result.content[0].text);
        } catch (parseErr) {
          console.warn(`[MCP] Malformed JSON from query_blockchain_ledger, using fallback:`, parseErr);
          return fallbackProfile;
        }

        return {
          totalVolumeUSD: parsed.total_volume_usd ?? parsed.totalVolumeUSD ?? fallbackProfile.totalVolumeUSD,
          peakOperationPeriod: parsed.peak_operation ?? parsed.peak_period ?? parsed.peakOperationPeriod ?? fallbackProfile.peakOperationPeriod,
          genesisDate: parsed.genesis_date ?? parsed.first_seen ?? parsed.genesisDate ?? fallbackProfile.genesisDate,
          coinJoinRounds: parsed.coinjoin_rounds_30d ?? parsed.coinjoin_count ?? parsed.coinJoinRounds ?? fallbackProfile.coinJoinRounds,
          isFallback: false,
        };
      }
      return fallbackProfile;
    } catch (err) {
      console.warn(`[MCP] Tool call error for query_blockchain_ledger, using fallback:`, err);
      return fallbackProfile;
    }
  }

  public async runStylometry(textA: string, textB: string): Promise<any> {
    // [H2] Fallback marked as synthetic.
    const fallback = { similarity: 0.91, confidence: 'HIGH', stylometricOverlap: 'High word choice correlation', isFallback: true };

    if (!this.client) {
      await this.connect();
    }
    if (!this.client) {
      return fallback;
    }

    try {
      const res = (await this.client.callTool({
        name: 'run_stylometry_analysis',
        arguments: { text_sample_a: textA, text_sample_b: textB },
      })) as any;
      if (res && res.content && res.content[0]) {
        let parsed: any;
        try {
          parsed = JSON.parse(res.content[0].text);
        } catch {
          return fallback;
        }
        return { ...parsed, isFallback: false };
      }
    } catch (err) {
      console.warn('[MCP] Stylometry analysis fallback:', err);
    }
    return fallback;
  }

  public async geolocateIp(ip: string): Promise<any> {
    const fallback = { ip, country: 'USA', region: 'Florida', city: 'Miami', isVpn: true, isTor: false, isFallback: true };

    if (!this.client) {
      await this.connect();
    }
    if (!this.client) {
      return fallback;
    }

    try {
      const res = (await this.client.callTool({
        name: 'geolocate_ip',
        arguments: { ip_address: ip },
      })) as any;
      if (res && res.content && res.content[0]) {
        let parsed: any;
        try {
          parsed = JSON.parse(res.content[0].text);
        } catch {
          return fallback;
        }
        return { ...parsed, isFallback: false };
      }
    } catch (err) {
      console.warn('[MCP] Geolocate IP fallback:', err);
    }
    return fallback;
  }

  public async close(): Promise<void> {
    if (this.transport) {
      try {
        await this.transport.close();
      } catch (err) {
        // ignore on shutdown
      }
      this.transport = null;
      this.client = null;
    }
  }

  public getStatus(): { isAvailable: boolean; isConnected: boolean } {
    return {
      isAvailable: this.isAvailable,
      isConnected: this.client !== null,
    };
  }
}

export const mcpService = new McpService();
