import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const matches = [
      {
        aliasA: {
          name: "KhaosAdmin",
          joinDate: "2023-01-14",
          market: "AlphaBay",
          pgp: "-----BEGIN PGP PUBLIC KEY BLOCK-----\n\nmQINBF... (Truncated for display)\n-----END PGP PUBLIC KEY BLOCK-----",
          description: "Offering premium quality pharmaceuticals globally. PGP only. No tracking provided unless order is over $500.",
          image: "https://images.unsplash.com/photo-1587825140708-dfaf72ae4b04?q=80&w=150&auto=format&fit=crop"
        },
        aliasB: {
          name: "TorZonOp",
          joinDate: "2023-01-16",
          market: "Hydra Market",
          pgp: "-----BEGIN PGP PUBLIC KEY BLOCK-----\n\nmQINBF... (Identical key structure matched)\n-----END PGP PUBLIC KEY BLOCK-----",
          description: "Premium pharma vendor. Strictly encrypted comms. Free tracking on large bulk orders.",
          image: "https://images.unsplash.com/photo-1587825140708-dfaf72ae4b04?q=80&w=150&auto=format&fit=crop"
        },
        similarity: 94,
        confidence: "94",
        visionScore: "96%",
        nlpScore: "91%",
        matchingSignals: ["PGP Fingerprint Overlap", "Wallet Co-spending"],
        status: "Verified",
        cryptoWallet: "bc1q9h...x4k2",
        cryptoTotal: "$48,200",
        temporalCorrelation: "48-Hour Migration Window detected between Hydra exit and AlphaBay listing creation."
      },
      {
        aliasA: {
          name: "WhiteRabbit",
          joinDate: "2022-11-04",
          market: "Dream Market",
          pgp: "-----BEGIN PGP PUBLIC KEY BLOCK-----\n\nmQINBG...\n-----END PGP PUBLIC KEY BLOCK-----",
          description: "High purity stimulants. Escrow finalized early gets a discount.",
          image: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?q=80&w=150&auto=format&fit=crop"
        },
        aliasB: {
          name: "AliceInW",
          joinDate: "2022-12-01",
          market: "Empire Market",
          pgp: "-----BEGIN PGP PUBLIC KEY BLOCK-----\n\nmQINBG... (Partial key overlap)\n-----END PGP PUBLIC KEY BLOCK-----",
          description: "Top grade stims. Always finalize early for best rates.",
          image: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?q=80&w=150&auto=format&fit=crop"
        },
        similarity: 88,
        confidence: "88",
        visionScore: "82%",
        nlpScore: "94%",
        matchingSignals: ["Linguistic Stylometry", "Active Hours Sync"],
        status: "Probable",
        cryptoWallet: "3J98t1...WpM7",
        cryptoTotal: "$12,450",
        temporalCorrelation: "Consistent 2-hour offline synchronization periods across both accounts."
      },
      {
        aliasA: {
          name: "OxyKing",
          joinDate: "2021-05-19",
          market: "Silk Road 3",
          pgp: "-----BEGIN PGP PUBLIC KEY BLOCK-----\n\nmQINBH...\n-----END PGP PUBLIC KEY BLOCK-----",
          description: "Prescription only. Genuine blister packs. Shipped from EU.",
          image: "https://images.unsplash.com/photo-1550572017-edb9c6b90757?q=80&w=150&auto=format&fit=crop"
        },
        aliasB: {
          name: "PillMasterX",
          joinDate: "2021-08-22",
          market: "Versus Market",
          pgp: "-----BEGIN PGP PUBLIC KEY BLOCK-----\n\nmQINBI...\n-----END PGP PUBLIC KEY BLOCK-----",
          description: "100% genuine blisters. EU dispatch. Fast stealth shipping.",
          image: "https://images.unsplash.com/photo-1550572017-edb9c6b90757?q=80&w=150&auto=format&fit=crop"
        },
        similarity: 72,
        confidence: "72",
        visionScore: "68%",
        nlpScore: "75%",
        matchingSignals: ["Product Metadata", "Shipping Regions"],
        status: "Investigating",
        cryptoWallet: "1A1zP1...qB29",
        cryptoTotal: "$8,900",
        temporalCorrelation: "No clear temporal bridge identified; match based strictly on product catalog."
      }
    ];

    return NextResponse.json({ success: true, data: matches });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: { message: error.message } }, { status: 500 });
  }
}
