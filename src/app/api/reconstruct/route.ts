import { NextResponse } from 'next/server';
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import path from "path";

export async function POST(request: Request) {
  let transport: StdioClientTransport | null = null;
  
  try {
    const { query } = await request.json();

    if (!query) {
      return NextResponse.json({ error: "Query is required" }, { status: 400 });
    }

    // Attempt to map the query to an entity ID. If not found, default to ent-001
    let entityId = query;
    if (query === 'F9B2 4A32 1109 E77A' || query.toLowerCase().includes('darkphoenix') || query.includes('bc1q9hk7')) {
      entityId = 'ent-001';
    } else if (query.toLowerCase().includes('ghost') || query.includes('ent-003')) {
      entityId = 'ent-003';
    } else if (!query.startsWith('ent-')) {
      // For any other random text, just demo with ent-001
      entityId = 'ent-001';
    }

    const pythonPath = path.join(process.cwd(), 'darknet-intel-mcp', 'venv', 'Scripts', 'python.exe');
    const serverScript = path.join(process.cwd(), 'darknet-intel-mcp', 'server.py');

    transport = new StdioClientTransport({
      command: pythonPath,
      args: [serverScript]
    });

    const client = new Client(
      { name: "nexus-frontend", version: "1.0.0" },
      { capabilities: {} }
    );

    await client.connect(transport);

    // 1. Read the Neo4j graph resource to find the linked wallets
    let graphData: any;
    try {
      const resourceResult = await client.readResource({
        uri: `neo4j://case-graphs/${entityId}`
      });
      
      const textContent = resourceResult.contents[0];
      if ('text' in textContent) {
        graphData = JSON.parse(textContent.text as string);
      } else {
        throw new Error("Resource returned non-text content");
      }
    } catch (e) {
      console.error("Resource error:", e);
      // Fallback to ent-001 if not found
      const fbResult = await client.readResource({ uri: 'neo4j://case-graphs/ent-001' });
      const textContent = fbResult.contents[0];
      if ('text' in textContent) {
          graphData = JSON.parse(textContent.text as string);
      }
    }

    if (graphData.error) {
      // Fallback if entity not in our mock DB
      const fbResult = await client.readResource({ uri: 'neo4j://case-graphs/ent-001' });
      const textContent = fbResult.contents[0];
      if ('text' in textContent) {
          graphData = JSON.parse(textContent.text as string);
      }
    }

    // 2. Query the blockchain ledger tool for the primary wallet
    const primaryWallet = graphData.linked_wallets?.[0] || 'bc1q9hk7m3x2v8p5c6e4f0r1t7w9y2u3i4o5p6a7s8d9f0g1h2j3k4l5x4k2';
    
    const toolResult = await client.callTool({
      name: "query_blockchain_ledger",
      arguments: { wallet_address: primaryWallet }
    });

    const toolContent = toolResult.content[0];
    let ledgerData: any = {};
    if ('text' in toolContent) {
      ledgerData = JSON.parse(toolContent.text as string);
    }

    // 3. Construct a simplified dossier response for the frontend
    const dossier = {
      entityId: graphData.suspect,
      primaryAlias: graphData.primary_alias,
      riskScore: graphData.risk_score,
      status: graphData.status,
      financialProfile: {
        totalVolumeUSD: ledgerData.total_volume_usd,
        peakOperationPeriod: ledgerData.peak_operation,
        genesisDate: ledgerData.genesis_date,
        coinJoinRounds: ledgerData.coinjoin_rounds_30d
      }
    };

    return NextResponse.json(dossier);
    
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json({ error: "Failed to reconstruct timeline" }, { status: 500 });
  } finally {
    if (transport) {
      try {
        await transport.close();
      } catch (e) {}
    }
  }
}
