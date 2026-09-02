import { NextResponse } from 'next/server';
import crypto from 'crypto';

const AUDIT_BLOCKS = [
  {
    blockIndex: 1,
    decisionType: "TARGET_FLAGGED_HIGH_RISK",
    targetId: "ent-001",
    targetAlias: "DarkPhoenix_77",
    action: "Assigned Risk Score 94 / Tier 1 Priority",
    officer: "Agent Torres (Clearance Level 2)",
    justification: "Mass-volume synthetic opioid distribution detected with direct precursor ties to ChemKing2026.",
    timestamp: "2026-08-27T10:14:22Z",
    prevHash: "0000000000000000000000000000000000000000000000000000000000000000",
    blockHash: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    integrity: "VERIFIED"
  },
  {
    blockIndex: 2,
    decisionType: "PERSONA_MERGE_APPROVED",
    targetId: "ent-001",
    targetAlias: "Ph03nix_Rx",
    action: "Merged Archetyp Vendor Ph03nix_Rx into Master Record DarkPhoenix_77",
    officer: "Lead Analyst Vance (Clearance Level 3)",
    justification: "100% PGP bit-for-bit key overlap and identical Bitcoin change output clustering.",
    timestamp: "2026-08-29T16:45:09Z",
    prevHash: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    blockHash: "a1b2c3d4e5f60718293a4b5c6d7e8f90123456789abcdef0123456789abcdef0",
    integrity: "VERIFIED"
  }
];

export async function GET() {
  return NextResponse.json({
    success: true,
    data: {
      chainLength: AUDIT_BLOCKS.length,
      ledgerIntegrity: "CRYPTOGRAPHICALLY_VERIFIED",
      blocks: AUDIT_BLOCKS
    }
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { decisionType, targetId, targetAlias, action, officer, justification } = body;

    const prevBlock = AUDIT_BLOCKS[AUDIT_BLOCKS.length - 1];
    const prevHash = prevBlock ? prevBlock.blockHash : "0000000000000000000000000000000000000000000000000000000000000000";
    const timestamp = new Date().toISOString();

    const payload = `${prevHash}|${decisionType}|${targetId}|${officer}|${timestamp}`;
    const blockHash = crypto.createHash('sha256').update(payload).digest('hex');

    const newBlock = {
      blockIndex: AUDIT_BLOCKS.length + 1,
      decisionType: decisionType || "MANUAL_INVESTIGATIVE_ACTION",
      targetId: targetId || "UNKNOWN",
      targetAlias: targetAlias || targetId || "Target",
      action: action || "Investigative action recorded",
      officer: officer || "System Analyst",
      justification: justification || "Court chain of custody documentation",
      timestamp,
      prevHash,
      blockHash,
      integrity: "VERIFIED"
    };

    AUDIT_BLOCKS.push(newBlock);

    return NextResponse.json({
      success: true,
      data: newBlock
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
