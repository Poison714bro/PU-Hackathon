import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { text } = await request.json();

    if (!text) {
      return NextResponse.json({ success: false, error: "Text is required" }, { status: 400 });
    }

    const btcMatches = text.match(/\b(bc1[a-zA-HJ-NP-Z0-9]{25,62}|[13][a-km-zA-HJ-NP-Z1-9]{25,34})\b/g) || [];
    const pgpMatches = text.match(/\b[0-9A-Fa-f]{40}\b/g) || [];
    const tgMatches = text.match(/@([a-zA-Z0-9_]{5,32})\b/g) || [];
    const onionMatches = text.match(/\b[a-z2-7]{56}\.onion\b/g) || [];

    const contrabandKeywords = ["fentanyl", "methamphetamine", "cocaine", "heroin", "oxycodone", "mdma", "precursor", "4-anpp", "alprazolam"];
    const foundContraband = contrabandKeywords.filter(k => text.toLowerCase().includes(k));

    const triplets = [];
    if (tgMatches.length > 0 && btcMatches.length > 0) {
      triplets.push({ subject: tgMatches[0], predicate: "ACCEPTS_PAYMENT_TO", object: btcMatches[0] });
    }
    if (tgMatches.length > 0 && pgpMatches.length > 0) {
      triplets.push({ subject: tgMatches[0], predicate: "SIGNS_WITH_PGP", object: pgpMatches[0] });
    }
    if (tgMatches.length > 0 && foundContraband.length > 0) {
      triplets.push({ subject: tgMatches[0], predicate: "SUPPLIES_CONTRABAND", object: foundContraband[0] });
    }

    return NextResponse.json({
      success: true,
      data: {
        iocs: {
          wallets: Array.from(new Set(btcMatches)),
          pgpKeys: Array.from(new Set(pgpMatches)),
          telegramHandles: Array.from(new Set(tgMatches)),
          onionLinks: Array.from(new Set(onionMatches)),
          contraband: Array.from(new Set(foundContraband)),
          totalFound: btcMatches.length + pgpMatches.length + tgMatches.length + onionMatches.length + foundContraband.length
        },
        triplets
      }
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
