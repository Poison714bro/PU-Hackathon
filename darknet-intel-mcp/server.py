# ═══════════════════════════════════════════════════════════════════════════
#  Darknet-Intel MCP Server
#  Built with MCPServer (official MCP Python SDK v2.0)
#
#  Resources: neo4j://case-graphs/{id}, osint://forum-dumps/{id}
#  Tools:     query_blockchain_ledger, run_stylometry_analysis
#  Prompts:   generate_threat_dossier
# ═══════════════════════════════════════════════════════════════════════════

import json
import sys
from pathlib import Path
from mcp.server import MCPServer

# Add parent directory to sys.path to access analysis modules
sys.path.insert(0, str(Path(__file__).parent.parent))

from analysis.correlation import CorrelationEngine
from analysis.extraction.ner import CybercrimeNER
from analysis.exporters.dossier_exporter import DossierExporter

# ── Initialize the server and correlation engine ────────────────────────────
mcp = MCPServer("Darknet-Intel-Server")
_CORRELATION_ENGINE = CorrelationEngine()
_CYBERCRIME_NER = CybercrimeNER()


# ═══════════════════════════════════════════════════════════════════════════
#  SIMULATED DATABASE LAYER
#  In production, these would query Neo4j, Elasticsearch, or a blockchain
#  node.  The mock data here mirrors the entities and wallet addresses from
#  the NEXUS frontend's mockIntelligenceData.ts so results look consistent.
# ═══════════════════════════════════════════════════════════════════════════

# Master entity lookup (mirrors entities in mockIntelligenceData.ts)
_ENTITY_GRAPH_DB: dict[str, dict] = {
    "ent-001": {
        "suspect": "ent-001",
        "primary_alias": "DarkPhoenix_77",
        "linked_wallets": [
            "bc1q9hk7m3x2v8p5c6e4f0r1t7w9y2u3i4o5p6a7s8d9f0g1h2j3k4l5x4k2",
            "42xM7q9Lr5kB3pN2vT1wH4yG6fD8cE0zA7sJ5mK9oI3uR6tY1wQ4eP2xL",
        ],
        "pgp_fingerprint": "F9B24A321109E77A8C3D5F6B7E2A9D014C8F3B62",
        "known_aliases": ["DP_Supply", "Ph03nix_Rx", "DarkP77"],
        "risk_score": 94,
        "status": "Active",
        "linked_entities": ["ent-002", "ent-004"],
    },
    "ent-002": {
        "suspect": "ent-002",
        "primary_alias": "bc1q9h...x4k2",
        "linked_wallets": [
            "bc1q9hk7m3x2v8p5c6e4f0r1t7w9y2u3i4o5p6a7s8d9f0g1h2j3k4l5x4k2",
            "0x7a3B9fCd2E8a1b4F6c5D0e9A3b7C2d8E4f1A6b9C",
        ],
        "pgp_fingerprint": "F9B24A321109E77A8C3D5F6B7E2A9D014C8F3B62",
        "known_aliases": ["DarkPhoenix_77"],
        "risk_score": 87,
        "status": "Under Investigation",
        "linked_entities": ["ent-001"],
    },
    "ent-003": {
        "suspect": "ent-003",
        "primary_alias": "@Ghost_Supply",
        "linked_wallets": [
            "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh",
            "48nR3c7Y2vK5bL9mP1oQ4tU8xW3eF6gH0jJ2kS5iM7nA",
        ],
        "pgp_fingerprint": "A1C3E5G7I9K2M4O6Q8S0U2W4Y6B8D0F2H4J6L8N0",
        "known_aliases": ["GhostBulk", "G_Supply_EU", "SpeedGhost"],
        "risk_score": 78,
        "status": "Active",
        "linked_entities": ["ent-005"],
    },
    "ent-004": {
        "suspect": "ent-004",
        "primary_alias": "S11kR0ad_Vendor",
        "linked_wallets": [
            "bc1q5v8n2m7k4j3h6g9f0d1s2a4p7o0i3u8y5t2r1e",
            "44AFFq5kSiGBoZ4NMDwYtN18obc8AemS33DBLWs3H7otXft3XjrpDtQGv7SqSsaBYBb98uNbr2VBBEt7f2wfn3RVGQBEP3A",
        ],
        "pgp_fingerprint": "3D7C9A1B5E8F2D4C6A0B3E5D7F9A1C3E5G7I9K20",
        "known_aliases": ["SilkRoad_Legacy", "SR_Vendor2023", "TheSilkMan"],
        "risk_score": 91,
        "status": "Under Investigation",
        "linked_entities": ["ent-001"],
    },
    "ent-005": {
        "suspect": "ent-005",
        "primary_alias": "ChemKing2026",
        "linked_wallets": [
            "bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq",
            "0xdAC17F958D2ee523a2206206994597C13D831ec7",
        ],
        "pgp_fingerprint": "7F2A4C6E8B0D3F5A7C9E1B3D5F7A9C1E3B5D7F90",
        "known_aliases": ["CK_2026", "ChemicalKingpin", "CK_NL"],
        "risk_score": 82,
        "status": "Active",
        "linked_entities": ["ent-003"],
    },
    "ent-006": {
        "suspect": "ent-006",
        "primary_alias": "NightOwl_Pharm",
        "linked_wallets": ["bc1q7kw2uepvmd7p4q5mvr6ax3mykwpz7q42gy3yr2"],
        "pgp_fingerprint": "B4D6F8A0C2E4G6I8K0M2O4Q6S8U0W2Y4A6C8E0G2",
        "known_aliases": ["OwlPharm", "NightScript_Rx"],
        "risk_score": 65,
        "status": "Active",
        "linked_entities": ["ent-009"],
    },
    "ent-007": {
        "suspect": "ent-007",
        "primary_alias": "AcidWizard420",
        "linked_wallets": [
            "bc1qm34lsc65zpw79lxes69zkqmk6ee3ewf0j77s3h",
            "46BeWrHpwXmHDpDEUmZBWZfoQpdc6HaERCNmx1pEYL2rAcuwufPN9rXHHtyUA4QVy68t3cJmAk65sR4qUUKnuJR2r5s8Rnq",
        ],
        "pgp_fingerprint": "C5E7G9I1K3M5O7Q9S1U3W5Y7A9C1E3G5I7K9M1O3",
        "known_aliases": ["WizardLSD", "Acid_W420", "BlotterKing"],
        "risk_score": 56,
        "status": "Active",
        "linked_entities": [],
    },
    "ent-008": {
        "suspect": "ent-008",
        "primary_alias": "El_Chapo_Junior",
        "linked_wallets": [
            "bc1qzlf9t6v8j0s1h3k5m7n9p2r4t6u8w0x2y4z6a8",
            "0x3fC91A3afd70395Cd496C647d5a6CC9D4B2b7FAD",
        ],
        "pgp_fingerprint": "1A3B5C7D9E1F3A5B7C9D1E3F5A7B9C1D3E5F7A9B",
        "known_aliases": ["ChapoGreen", "GreenKingMX", "CaliBud_Premium"],
        "risk_score": 73,
        "status": "Under Investigation",
        "linked_entities": [],
    },
    "ent-009": {
        "suspect": "ent-009",
        "primary_alias": "PharmaGrad_RU",
        "linked_wallets": ["bc1qnkf5d2r7t8y3e6u9i2o5p8a1s4d7f0g3h6j9k2"],
        "pgp_fingerprint": "2B4D6F8A0C2E4F6A8C0E2F4A6C8E0F2A4C6E8F0A",
        "known_aliases": ["RU_Pharma", "GradPharm", "Moscow_Meds"],
        "risk_score": 69,
        "status": "Active",
        "linked_entities": ["ent-006"],
    },
    "ent-010": {
        "suspect": "ent-010",
        "primary_alias": "MethLabMike",
        "linked_wallets": [
            "bc1qp3w7e2r5t8y1u4i7o0p3a6s9d2f5g8h1j4k7l0",
            "47tJ4e6bL8mP2oQ5uR8wX1yZ4cA7fB0gD3hE6iK9lM",
        ],
        "pgp_fingerprint": "9E1F3A5B7C9D1E3F5A7B9C1D3E5F7A9B1C3D5E7F",
        "known_aliases": ["MethMan_USA", "MM_Crystal", "LabMike_Direct"],
        "risk_score": 96,
        "status": "Seized",
        "linked_entities": [],
    },
}

# Wallet-level blockchain data
_BLOCKCHAIN_DB: dict[str, dict] = {
    "bc1q9hk7m3x2v8p5c6e4f0r1t7w9y2u3i4o5p6a7s8d9f0g1h2j3k4l5x4k2": {
        "currency": "BTC",
        "total_volume_usd": 482000,
        "genesis_date": "2024-03-12",
        "peak_operation": "2026-05",
        "status": "Active",
        "coinjoin_rounds_30d": 14,
        "linked_entity": "ent-001 / ent-002",
    },
    "42xM7q9Lr5kB3pN2vT1wH4yG6fD8cE0zA7sJ5mK9oI3uR6tY1wQ4eP2xL": {
        "currency": "XMR",
        "total_volume_usd": 195000,
        "genesis_date": "2024-06-20",
        "peak_operation": "2026-03",
        "status": "Active",
        "coinjoin_rounds_30d": 0,
        "linked_entity": "ent-001",
    },
    "bc1q5v8n2m7k4j3h6g9f0d1s2a4p7o0i3u8y5t2r1e": {
        "currency": "BTC",
        "total_volume_usd": 920000,
        "genesis_date": "2023-11-02",
        "peak_operation": "2026-04",
        "status": "Active",
        "coinjoin_rounds_30d": 3,
        "linked_entity": "ent-004",
    },
    "bc1qp3w7e2r5t8y1u4i7o0p3a6s9d2f5g8h1j4k7l0": {
        "currency": "BTC",
        "total_volume_usd": 1240000,
        "genesis_date": "2023-06-15",
        "peak_operation": "2026-06",
        "status": "Seized",
        "coinjoin_rounds_30d": 0,
        "linked_entity": "ent-010",
    },
    "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh": {
        "currency": "BTC",
        "total_volume_usd": 128000,
        "genesis_date": "2025-06-18",
        "peak_operation": "2026-07",
        "status": "Active",
        "coinjoin_rounds_30d": 0,
        "linked_entity": "ent-003",
    },
    "bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq": {
        "currency": "BTC",
        "total_volume_usd": 215000,
        "genesis_date": "2025-09-14",
        "peak_operation": "2026-08",
        "status": "Active",
        "coinjoin_rounds_30d": 0,
        "linked_entity": "ent-005",
    },
    "bc1qzlf9t6v8j0s1h3k5m7n9p2r4t6u8w0x2y4z6a8": {
        "currency": "BTC",
        "total_volume_usd": 340000,
        "genesis_date": "2024-11-18",
        "peak_operation": "2026-05",
        "status": "Under Investigation",
        "coinjoin_rounds_30d": 7,
        "linked_entity": "ent-008",
    },
}

# Darknet forum post data
_FORUM_POSTS: dict[str, dict] = {
    "post-001": {
        "source": "AlphaBay Reborn",
        "author": "DarkPhoenix_77",
        "entity_id": "ent-001",
        "timestamp": "2026-08-17T14:32:00Z",
        "raw_text": (
            "LISTING UPDATE: 500g Fentanyl HCL pressed pills. Multi-sig escrow ONLY. "
            "Ships US domestic via USPS Priority. Stealth shipping guaranteed. "
            "2-of-3 multisig only. PGP encrypt all comms or you will be ignored. "
            "Relocating to new market next month — use my old PGP to verify."
        ),
    },
    "post-002": {
        "source": "Dread Forum",
        "author": "ChemKing2026",
        "entity_id": "ent-005",
        "timestamp": "2026-08-17T07:30:00Z",
        "raw_text": (
            "Looking for bulk 4-FA supplier. Can move 5kg/month EU-EU. "
            "PGP verified only. Stealth shipping guaranteed. "
            "Previous vendor fell through. Need reliable NL source."
        ),
    },
    "post-003": {
        "source": "Versus Market",
        "author": "S11kR0ad_Vendor",
        "entity_id": "ent-004",
        "timestamp": "2026-08-17T09:00:00Z",
        "raw_text": (
            "NEW LISTING: M30 OxyContin Pressed (10-pack). Domestic US only. "
            "FE required for new buyers. Returning customers get escrow. "
            "2-of-3 multisig only. Quality guaranteed or reship."
        ),
    },
    "post-004": {
        "source": "Telegram Channel",
        "author": "@Ghost_Supply",
        "entity_id": "ent-003",
        "timestamp": "2026-08-17T10:15:00Z",
        "raw_text": (
            "🔥 RESTOCK — Pure NL speed paste & MDMA crystal. "
            "DM @GhostBulk_Orders for wholesale. Stealth shipping guaranteed. "
            "PostNL tracked. Minimum order 50g."
        ),
    },
    "post-005": {
        "source": "AlphaBay Reborn",
        "author": "AcidWizard420",
        "entity_id": "ent-007",
        "timestamp": "2026-08-16T17:55:00Z",
        "raw_text": (
            "Gamma Goblin 250µg tabs. 10/25/50/100-sheet pricing. "
            "Free sample with orders over $200. International shipping. "
            "XMR preferred. PGP required for address."
        ),
    },
}

# IP Geolocation data
_IP_GEO_DB: dict[str, dict] = {
    "184.22.99.12": {
        "ip": "184.22.99.12",
        "country": "United States",
        "region": "Florida",
        "city": "Miami",
        "isp": "Comcast Cable Communications",
        "is_vpn": False,
        "is_tor_exit": False
    },
    "193.23.44.11": {
        "ip": "193.23.44.11",
        "country": "Netherlands",
        "region": "North Holland",
        "city": "Amsterdam",
        "isp": "Mullvad VPN",
        "is_vpn": True,
        "is_tor_exit": False
    }
}

# Image EXIF data
_IMAGE_EXIF_DB: dict[str, dict] = {
    "hash_a1b2c3": {
        "image_hash": "hash_a1b2c3",
        "camera_make": "Apple",
        "camera_model": "iPhone 14 Pro Max",
        "datetime_original": "2026-08-15T14:30:00Z",
        "gps_latitude": "33.5721 N",
        "gps_longitude": "112.0880 W",
        "software": "iOS 17.4"
    }
}

# Market Pricing data
_MARKET_PRICING_DB: dict[str, dict] = {
    "fentanyl_hcl_1kg": {
        "substance": "Fentanyl HCL (1kg)",
        "global_average_usd": 14500,
        "trend": "+5% over 30 days",
        "wholesale_availability": "High"
    },
    "mdma_crystal_1kg": {
        "substance": "MDMA Crystal (1kg)",
        "global_average_usd": 3200,
        "trend": "-2% over 30 days",
        "wholesale_availability": "Very High (NL dominant)"
    }
}


# ═══════════════════════════════════════════════════════════════════════════
#  RESOURCES — Read-only data URIs the AI can access for context
# ═══════════════════════════════════════════════════════════════════════════

@mcp.resource("neo4j://case-graphs/{suspect_id}")
def get_suspect_graph(suspect_id: str) -> str:
    """
    Read live graph data connecting buyers, sellers, and crypto wallets
    for a given suspect entity ID (e.g., 'ent-001').

    Returns a JSON object with linked wallets, aliases, PGP fingerprint,
    risk score, and connected entity IDs.
    """
    if suspect_id in _ENTITY_GRAPH_DB:
        return json.dumps(_ENTITY_GRAPH_DB[suspect_id], indent=2)
    return json.dumps({"error": f"No graph data found for entity '{suspect_id}'"})


@mcp.resource("osint://forum-dumps/{post_id}")
def get_darknet_post(post_id: str) -> str:
    """
    Retrieve scraped HTML/Text from encrypted darknet forums for
    OpSec and stylometric analysis.

    Returns a JSON object with the source, author, timestamp, and
    raw text content of the forum post.
    """
    if post_id in _FORUM_POSTS:
        return json.dumps(_FORUM_POSTS[post_id], indent=2)
    return json.dumps({"error": f"No forum post found for ID '{post_id}'"})


# ═══════════════════════════════════════════════════════════════════════════
#  TOOLS — Executable actions the AI can invoke
# ═══════════════════════════════════════════════════════════════════════════

@mcp.tool()
def query_blockchain_ledger(wallet_address: str, currency: str = "BTC") -> str:
    """
    Queries a blockchain node for transaction volume, first/last active
    dates, and operational status for a given cryptocurrency wallet.

    Use this tool to build the Operational Scaling Graph and to assess
    the financial footprint of a suspect entity.

    Args:
        wallet_address: The full cryptocurrency wallet address to query.
        currency: The cryptocurrency type — "BTC", "ETH", or "XMR".
                  Defaults to "BTC".

    Returns:
        JSON string with wallet analytics: total_volume_usd, genesis_date,
        peak_operation month, current status, and CoinJoin activity.
    """
    try:
        if not isinstance(wallet_address, str) or not isinstance(currency, str):
            return json.dumps({"error": "Invalid input: wallet_address and currency must be strings."}, indent=2)

        data = _BLOCKCHAIN_DB.get(wallet_address)
        if data:
            return json.dumps({
                "wallet": wallet_address,
                "currency": data["currency"],
                "total_volume_usd": data["total_volume_usd"],
                "genesis_date": data["genesis_date"],
                "peak_operation": data["peak_operation"],
                "status": data["status"],
                "coinjoin_rounds_30d": data["coinjoin_rounds_30d"],
                "linked_entity": data["linked_entity"],
            }, indent=2)

        # Fallback for unknown wallets — return a plausible mock response
        return json.dumps({
            "wallet": wallet_address,
            "currency": currency,
            "total_volume_usd": 0,
            "genesis_date": "unknown",
            "peak_operation": "unknown",
            "status": "Not Found",
            "coinjoin_rounds_30d": 0,
            "linked_entity": "none",
        }, indent=2)
    except Exception as e:
        return json.dumps({"error": f"Internal server error: {str(e)}"}, indent=2)


@mcp.tool()
def run_stylometry_analysis(text_sample_a: str, text_sample_b: str) -> str:
    """
    Runs NLP stylometry comparing two darknet text samples (listings,
    forum posts, messages) to detect if they were written by the same
    vendor alias.

    Uses n-gram frequency analysis, punctuation patterns, vocabulary
    richness, and sentence-length distribution to compute a similarity
    score.

    Args:
        text_sample_a: The first text sample (e.g., a listing from Market A).
        text_sample_b: The second text sample (e.g., a listing from Market B).

    Returns:
        JSON string containing:
          - match_confidence_score (0–100)
          - matching_n_grams: shared distinctive phrases
          - recommendation: human-readable assessment
    """
    try:
        if not isinstance(text_sample_a, str) or not isinstance(text_sample_b, str):
            return json.dumps({"error": "Invalid input: text samples must be strings."}, indent=2)

        # ── Simulated NLP processing ──
        # In production, this would use scikit-learn, spaCy, or a custom
        # transformer model trained on darknet vendor writing styles.

        # Extract shared phrases (simple bigram overlap simulation)
        common_phrases = []
        marker_phrases = [
            "stealth shipping guaranteed",
            "2-of-3 multisig only",
            "PGP verified only",
            "domestic US only",
            "ships US domestic",
            "quality guaranteed",
            "free sample",
        ]
        a_lower = text_sample_a.lower()
        b_lower = text_sample_b.lower()
        for phrase in marker_phrases:
            if phrase in a_lower and phrase in b_lower:
                common_phrases.append(phrase)

        # Compute a confidence score based on shared markers
        if common_phrases:
            base_score = min(60 + len(common_phrases) * 12, 99)
        else:
            # Even without exact matches, check character-level similarity
            shared_chars = set(a_lower) & set(b_lower)
            base_score = max(15, min(len(shared_chars) * 2, 50))

        if base_score >= 80:
            recommendation = "High probability aliases belong to the same entity."
        elif base_score >= 50:
            recommendation = "Moderate similarity — further investigation recommended."
        else:
            recommendation = "Low similarity — likely different authors."

        return json.dumps({
            "match_confidence_score": round(base_score, 1),
            "matching_n_grams": common_phrases if common_phrases else ["(no exact n-gram overlap detected)"],
            "recommendation": recommendation,
            "text_a_length": len(text_sample_a),
            "text_b_length": len(text_sample_b),
        }, indent=2)
    except Exception as e:
        return json.dumps({"error": f"Internal server error: {str(e)}"}, indent=2)


@mcp.tool()
def geolocate_ip(ip_address: str) -> str:
    """
    Simulates querying an IP geolocation database (like MaxMind) to return the 
    physical location, ISP, and VPN/Tor exit node status of an IP address.
    """
    try:
        if not isinstance(ip_address, str):
            return json.dumps({"error": "Invalid input: ip_address must be a string."}, indent=2)

        if ip_address in _IP_GEO_DB:
            return json.dumps(_IP_GEO_DB[ip_address], indent=2)
        return json.dumps({
            "ip": ip_address,
            "status": "Unknown or Unallocated",
            "is_vpn": False,
            "is_tor_exit": False
        }, indent=2)
    except Exception as e:
        return json.dumps({"error": f"Internal server error: {str(e)}"}, indent=2)


@mcp.tool()
def analyze_image_exif(image_hash: str) -> str:
    """
    Simulates extracting hidden EXIF metadata (GPS, camera model, timestamps) 
    from intercepted images (e.g., photos of drug packaging or lab equipment).
    """
    try:
        if not isinstance(image_hash, str):
            return json.dumps({"error": "Invalid input: image_hash must be a string."}, indent=2)

        if image_hash in _IMAGE_EXIF_DB:
            return json.dumps(_IMAGE_EXIF_DB[image_hash], indent=2)
        return json.dumps({"error": "No EXIF data found for this image hash or EXIF was scrubbed."})
    except Exception as e:
        return json.dumps({"error": f"Internal server error: {str(e)}"}, indent=2)


@mcp.tool()
def query_market_pricing(substance: str) -> str:
    """
    Simulates querying current wholesale darknet market prices for specific substances.
    Useful for comparing a vendor's pricing against the global average to determine 
    their tier in the supply chain.
    """
    try:
        if not isinstance(substance, str):
            return json.dumps({"error": "Invalid input: substance must be a string."}, indent=2)

        if not substance.strip():
            return json.dumps({"error": "Invalid input: substance cannot be empty."}, indent=2)

        sub_lower = substance.lower()
        for key, data in _MARKET_PRICING_DB.items():
            if sub_lower in key or sub_lower in data["substance"].lower():
                return json.dumps(data, indent=2)
        return json.dumps({"error": f"No pricing data found for substance '{substance}'."})
    except Exception as e:
        return json.dumps({"error": f"Internal server error: {str(e)}"}, indent=2)


# ── Semantica Forensic Intelligence Tools ──────────────────────────────────

def _init_correlation_graph():
    """Populates the in-memory correlation graph with active database entities."""
    for ent_id, ent_data in _ENTITY_GRAPH_DB.items():
        _CORRELATION_ENGINE.add_entity_node(
            ent_id,
            node_type="suspect",
            label=ent_data.get("primary_alias", ent_id),
            riskScore=ent_data.get("risk_score", 0),
            category=ent_data.get("status", "Active")
        )
        for w in ent_data.get("linked_wallets", []):
            _CORRELATION_ENGINE.add_entity_node(w, node_type="wallet", label=f"Wallet {w[:8]}...")
            _CORRELATION_ENGINE.add_entity_link(ent_id, w, relation="OWNS_WALLET", weight=1.0, timestamp="2026-09-01")
        for linked in ent_data.get("linked_entities", []):
            if linked in _ENTITY_GRAPH_DB:
                _CORRELATION_ENGINE.add_entity_link(ent_id, linked, relation="ASSOCIATED_WITH", weight=2.0, timestamp="2026-09-01")

_init_correlation_graph()


@mcp.tool()
def detect_criminal_syndicates(algorithm: str = "louvain") -> str:
    """
    Detects criminal rings, money-laundering clusters, and darknet syndicates
    using advanced community detection (Louvain / Label Propagation).
    """
    try:
        syndicates = _CORRELATION_ENGINE.detect_syndicates(algorithm=algorithm)
        metrics = _CORRELATION_ENGINE.community_detector.calculate_community_metrics(_CORRELATION_ENGINE.graph, syndicates)
        return json.dumps({"syndicates": syndicates, "metrics": metrics}, indent=2)
    except Exception as e:
        return json.dumps({"error": f"Syndicate detection failed: {str(e)}"}, indent=2)


@mcp.tool()
def identify_network_kingpins(top_k: int = 5) -> str:
    """
    Identifies kingpins, financial hubs, and critical brokers in the network
    using PageRank and Betweenness Centrality.
    """
    try:
        kingpins = _CORRELATION_ENGINE.identify_kingpins(top_k=top_k)
        return json.dumps({"top_kingpins": kingpins}, indent=2)
    except Exception as e:
        return json.dumps({"error": f"Kingpin identification failed: {str(e)}"}, indent=2)


@mcp.tool()
def trace_laundering_path(source_entity: str, target_entity: str) -> str:
    """
    Traces the shortest connection path and transaction route between two entities or wallets.
    """
    try:
        route = _CORRELATION_ENGINE.trace_laundering_path(source_entity, target_entity)
        if route:
            return json.dumps(route, indent=2)
        return json.dumps({"message": f"No active connection path between '{source_entity}' and '{target_entity}'."}, indent=2)
    except Exception as e:
        return json.dumps({"error": f"Path tracing failed: {str(e)}"}, indent=2)


@mcp.tool()
def predict_hidden_links(top_k: int = 5) -> str:
    """
    Predicts hidden or covert connections between suspects based on shared infrastructure.
    """
    try:
        predictions = _CORRELATION_ENGINE.predict_covert_links(top_k=top_k)
        return json.dumps({"predicted_links": predictions}, indent=2)
    except Exception as e:
        return json.dumps({"error": f"Link prediction failed: {str(e)}"}, indent=2)


@mcp.tool()
def resolve_suspect_profiles(entity_a_id: str, entity_b_id: str) -> str:
    """
    Performs multi-factor cryptographic, alias, and property matching to determine
    if two suspect IDs belong to the same real-world persona.
    """
    try:
        ent_a = _ENTITY_GRAPH_DB.get(entity_a_id)
        ent_b = _ENTITY_GRAPH_DB.get(entity_b_id)
        if not ent_a or not ent_b:
            return json.dumps({"error": f"One or both entities not found ({entity_a_id}, {entity_b_id})."}, indent=2)
        
        result = _CORRELATION_ENGINE.resolve_suspect_profiles(ent_a, ent_b)
        return json.dumps(result, indent=2)
    except Exception as e:
        return json.dumps({"error": f"Entity resolution failed: {str(e)}"}, indent=2)


@mcp.tool()
def extract_cybercrime_iocs(raw_text: str) -> str:
    """
    Extracts forensic artifacts (Bitcoin/Monero/Ethereum wallets, PGP fingerprints,
    .onion addresses, Telegram handles, contraband keywords) from unstructured text.
    """
    try:
        iocs = _CYBERCRIME_NER.extract_summary(raw_text)
        return json.dumps(iocs, indent=2)
    except Exception as e:
        return json.dumps({"error": f"IOC extraction failed: {str(e)}"}, indent=2)


@mcp.tool()
def audit_investigative_action(
    action_category: str,
    target_entity_ids_comma_separated: str,
    investigator_id: str,
    clearance_level: int,
    justification: str
) -> str:
    """
    Cryptographically records an investigative action to the tamper-evident audit chain.
    """
    try:
        targets = [t.strip() for t in target_entity_ids_comma_separated.split(",") if t.strip()]
        decision = _CORRELATION_ENGINE.audit_investigative_action(
            category=action_category,
            targets=targets,
            officer_id=investigator_id,
            clearance=clearance_level,
            justification=justification
        )
        return json.dumps({
            "status": "RECORDED_TO_AUDIT_CHAIN",
            "decision": decision.__dict__,
            "block_hash": decision.cryptographic_hash
        }, indent=2)
    except Exception as e:
        return json.dumps({"error": f"Audit recording failed: {str(e)}"}, indent=2)


# ═══════════════════════════════════════════════════════════════════════════
#  PROMPTS — Standardized investigative workflows
# ═══════════════════════════════════════════════════════════════════════════

@mcp.prompt()
def generate_threat_dossier(entity_id: str) -> list[dict]:
    """
    Generates a standardized law-enforcement-grade threat dossier
    for a given entity.

    Instructs the AI to:
      1. Query blockchain data for the entity's wallets
      2. Read the case graph for linked entities
      3. Format output as an IntelligenceDossier JSON schema
    """
    return [{
        "role": "user",
        "content": f"""You are a Cyber Intelligence Analyst working for a multi-agency
task force. I need a comprehensive threat dossier for entity: {entity_id}.

Follow these steps exactly:

1. Read the resource `neo4j://case-graphs/{entity_id}` to retrieve the
   entity's graph data, including linked wallets, aliases, PGP fingerprint,
   and connected entities.

2. For EACH wallet address found in the graph data, use the
   `query_blockchain_ledger` tool to retrieve financial analytics
   (total volume, genesis date, peak operation, CoinJoin activity).

3. If there are linked entities in the graph, read their case graphs
   too to build a complete picture of the network.

4. If any IP addresses or image hashes are discovered in the resources, 
   use `geolocate_ip` and `analyze_image_exif` to extract location data.

5. Compile all intelligence into a structured JSON dossier with this schema:
   {{
     "entityId": "{entity_id}",
     "primaryAlias": "...",
     "riskScore": <number>,
     "status": "Active|Under Investigation|Seized",
     "financialProfile": {{
       "totalVolumeUSD": <number>,
       "wallets": [...],
       "peakOperationPeriod": "...",
       "launderingIndicators": ["..."]
     }},
     "networkGraph": {{
       "linkedEntities": [...],
       "sharedPGP": true/false,
       "sharedWallets": [...]
     }},
     "operationalSecurity": {{
       "pgpKeyRotation": "...",
       "preferredCurrency": "...",
       "communicationChannels": [...]
     }},
     "recommendation": "..."
   }}

5. Return ONLY valid JSON — no conversational text, no markdown fences.
"""
    }]


@mcp.prompt()
def cross_alias_investigation(alias_a: str, alias_b: str) -> list[dict]:
    """
    Guides the AI through a cross-platform alias correlation investigation
    using stylometry and blockchain clustering.
    """
    return [{
        "role": "user",
        "content": f"""You are a Cyber Intelligence Analyst. Investigate whether the
aliases "{alias_a}" and "{alias_b}" belong to the same real-world entity.

Follow these steps:

1. Read `osint://forum-dumps/post-001` through `osint://forum-dumps/post-005`
   to find posts authored by either alias.

2. If you find text samples from both aliases, use `run_stylometry_analysis`
   to compare their writing styles.

3. Read `neo4j://case-graphs/` for both aliases (if they map to entity IDs)
   to check for shared PGP keys, wallet addresses, or Session IDs.

4. Synthesize your findings into a JSON report:
   {{
     "alias_a": "{alias_a}",
     "alias_b": "{alias_b}",
     "stylometry_match_score": <number>,
     "shared_identifiers": {{
       "pgp_match": true/false,
       "shared_wallets": [...],
       "shared_sessions": [...]
     }},
     "overall_confidence": <number 0-100>,
     "assessment": "..."
   }}

5. Return ONLY valid JSON.
"""
    }]


# ═══════════════════════════════════════════════════════════════════════════
#  SERVER ENTRYPOINT
# ═══════════════════════════════════════════════════════════════════════════

if __name__ == "__main__":
    # Run using stdio transport — used for direct agent connections
    # and the MCP Inspector test tool.
    mcp.run(transport="stdio")

