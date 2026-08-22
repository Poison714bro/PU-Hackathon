export type Role = 'ANALYST' | 'INVESTIGATOR' | 'SUPERVISOR' | 'ADMIN';

export interface UserPayload {
  id: string;
  username: string;
  role: Role;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    statusCode: number;
    details?: any;
  };
  meta?: {
    timestamp: string;
    requestId?: string;
    pagination?: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  };
}

export type DrugCategory =
  | 'Opioids/Fentanyl'
  | 'Stimulants'
  | 'Cannabis'
  | 'Psychedelics'
  | 'Prescription/Other';

export type EntityStatus = 'Active' | 'Under Investigation' | 'Seized' | 'Migrated';

export interface CryptoWallet {
  address: string;
  currency: 'BTC' | 'XMR' | 'ETH';
  balanceUSD: number;
  isPrimary: boolean;
}

export interface PGPKey {
  keyId: string;
  fingerprint: string;
  verified: boolean;
}

export interface EncryptedHandle {
  platform: 'Telegram' | 'Session' | 'Tox' | 'Jabber' | 'Signal';
  handle: string;
}

export interface KnownAlias {
  alias: string;
  platform: string;
  firstSeen: string;
}

export interface Entity {
  id: string;
  primaryAlias: string;
  category: DrugCategory;
  colorHex: string;
  riskScore: number;
  status: EntityStatus;
  firstSeen: string;
  lastActive: string;
  sources: Array<'Darknet' | 'Blockchain' | 'OSINT' | 'Encrypted Comms'>;
  identifiers: {
    cryptoWallets: CryptoWallet[];
    pgpKeyFingerprint: PGPKey;
    encryptedHandles: EncryptedHandle[];
    knownAliases: KnownAlias[];
  };
  summary: string;
}

export interface TimelineEvent {
  eventId: string;
  entityId: string;
  timestamp: string;
  eventType: 'GENESIS' | 'MARKET_MIGRATION' | 'FINANCIAL_SPIKE' | 'OPSEC_FAILURE' | 'SEIZURE';
  title: string;
  description: string;
  monthlyVolumeUSD: number;
  activeListingsCount: number;
  artifactHash: string;
}

export interface TrackerEntity {
  id: string;
  date: string;
  alias: string;
  category: string;
  risk: number;
  status: string;
  source: string;
  platform: string;
  evidence: string;
  wallet: string;
  pgp: string;
  comms: string;
  location: string;
  lat: number;
  lng: number;
}
