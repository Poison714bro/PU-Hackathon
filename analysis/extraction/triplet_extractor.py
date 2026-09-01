"""
Cybercrime Triplet Extractor
Ported & adapted from Semantica for law enforcement cybercrime intelligence.
Extracts Subject-Predicate-Object triplets: (Suspect -[ACCEPTS_PAYMENT]-> Wallet),
(Vendor -[OPERATES_ON]-> Marketplace), (User -[COMMUNICATES_VIA]-> Telegram).
"""

from typing import Any, Dict, List, Optional
from .ner import CybercrimeNER


class TripletExtractor:
    """
    Extracts semantic relationships connecting suspects to assets, venues, and associates.
    """

    def __init__(self, ner: Optional[CybercrimeNER] = None):
        self.ner = ner or CybercrimeNER()

    def extract_triplets_from_post(
        self,
        author_alias: str,
        post_text: str,
        platform: str = "Darknet Forum",
        timestamp: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """
        Mines semantic triplets from an intelligence item or forum post.
        """
        extracted_iocs = self.ner.extract_entities(post_text)
        triplets: List[Dict[str, Any]] = []

        # 1. Author operates on Platform
        triplets.append({
            "subject": author_alias,
            "subject_type": "suspect",
            "predicate": "OPERATES_ON",
            "object": platform,
            "object_type": "marketplace",
            "confidence": 0.95,
            "timestamp": timestamp
        })

        # 2. Author accepts Crypto Wallets
        for w_type in ["BTC_WALLET", "ETH_WALLET", "XMR_WALLET"]:
            for match in extracted_iocs.get(w_type, []):
                triplets.append({
                    "subject": author_alias,
                    "subject_type": "suspect",
                    "predicate": "ACCEPTS_PAYMENT",
                    "object": match["value"],
                    "object_type": "wallet",
                    "confidence": 0.90,
                    "timestamp": timestamp
                })

        # 3. Author uses PGP key
        for match in extracted_iocs.get("PGP_FINGERPRINT", []):
            triplets.append({
                "subject": author_alias,
                "subject_type": "suspect",
                "predicate": "USES_PGP_KEY",
                "object": match["value"],
                "object_type": "pgp",
                "confidence": 0.98,
                "timestamp": timestamp
            })

        # 4. Author communicates on Telegram
        for match in extracted_iocs.get("TELEGRAM_HANDLE", []):
            triplets.append({
                "subject": author_alias,
                "subject_type": "suspect",
                "predicate": "COMMUNICATES_VIA",
                "object": f"@{match['value']}",
                "object_type": "handle",
                "confidence": 0.85,
                "timestamp": timestamp
            })

        # 5. Author sells Contraband
        for match in extracted_iocs.get("CONTRABAND", []):
            triplets.append({
                "subject": author_alias,
                "subject_type": "suspect",
                "predicate": "SUPPLIES_CONTRABAND",
                "object": match["keyword"].title(),
                "object_type": "contraband",
                "confidence": 0.88,
                "timestamp": timestamp
            })

        # 6. Author hosts Onion Site
        for match in extracted_iocs.get("ONION_V3", []):
            triplets.append({
                "subject": author_alias,
                "subject_type": "suspect",
                "predicate": "HOSTS_HIDDEN_SERVICE",
                "object": match["value"],
                "object_type": "darkweb_service",
                "confidence": 0.90,
                "timestamp": timestamp
            })

        return triplets
