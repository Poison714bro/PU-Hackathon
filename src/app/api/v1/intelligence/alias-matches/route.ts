import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Alias matching is typically an algorithmic result. 
    // We mock this for now since we don't have algorithmic matching in the SQLite DB.
    const matches = [
      {
        aliasA: "KhaosAdmin",
        aliasB: "TorZonOp",
        similarity: 94,
        matchingSignals: ["PGP Fingerprint Overlap", "Wallet Co-spending"],
        status: "Verified"
      },
      {
        aliasA: "WhiteRabbit",
        aliasB: "AliceInW",
        similarity: 88,
        matchingSignals: ["Linguistic Stylometry", "Active Hours Sync"],
        status: "Probable"
      },
      {
        aliasA: "OxyKing",
        aliasB: "PillMasterX",
        similarity: 72,
        matchingSignals: ["Product Metadata", "Shipping Regions"],
        status: "Investigating"
      }
    ];

    return NextResponse.json({ success: true, data: matches });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: { message: error.message } }, { status: 500 });
  }
}
