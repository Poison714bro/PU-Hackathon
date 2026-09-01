"""
Cybercrime & Darknet Named Entity Recognizer (NER)
Ported & adapted from Semantica for law enforcement cybercrime intelligence.
Recognizes Bitcoin/Monero/Ethereum wallets, PGP fingerprints, Tor .onion links,
Telegram/Wickr/Tox handles, drug/contraband terms, and threat actors from raw text.
"""

import re
from typing import Any, Dict, List, Set


class CybercrimeNER:
    """
    Extracts forensic artifacts and cybercrime entities from darknet posts,
    chat logs, illicit marketplace listings, and seizure dumps.
    """

    PATTERNS = {
        "BTC_WALLET": r"\b(bc1[a-zA-HJ-NP-Z0-9]{25,62}|[13][a-km-zA-HJ-NP-Z1-9]{25,34})\b",
        "ETH_WALLET": r"\b0x[a-fA-F0-9]{40}\b",
        "XMR_WALLET": r"\b4[0-9AB][1-9A-HJ-NP-Za-km-z]{93}\b",
        "PGP_FINGERPRINT": r"\b[0-9A-Fa-f]{40}\b",
        "ONION_V3": r"\b[a-z2-7]{56}\.onion\b",
        "TELEGRAM_HANDLE": r"(?:^|[\s,;:])@([a-zA-Z0-9_]{5,32})\b",
        "WICKR_ID": r"\bwickr:\s*([a-zA-Z0-9_-]{3,30})\b",
        "TOX_ID": r"\b[0-9A-Fa-f]{76}\b",
        "EMAIL": r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,7}\b",
        "IPV4": r"\b(?:\d{1,3}\.){3}\d{1,3}\b",
    }

    CONTRABAND_KEYWORDS = {
        "fentanyl": "Narcotics / Synthetic Opioid",
        "methamphetamine": "Narcotics / Stimulant",
        "cocaine": "Narcotics / Stimulant",
        "heroin": "Narcotics / Opioid",
        "oxycodone": "Narcotics / Prescription Opioid",
        "carfentanil": "Narcotics / Ultra-potent Opioid",
        "mdma": "Narcotics / Hallucinogen",
        "botnet": "Cybercrime / Infrastructure",
        "ransomware": "Cybercrime / Extortion",
        "rdp access": "Cybercrime / Initial Access",
        "stealer logs": "Cybercrime / Credentials",
        "fullz": "Cybercrime / Identity Theft",
        "carding": "Financial Fraud",
    }

    def __init__(self):
        self.compiled_patterns = {k: re.compile(v, re.IGNORECASE) for k, v in self.PATTERNS.items()}

    def extract_entities(self, text: str) -> Dict[str, List[Dict[str, Any]]]:
        """
        Extracts all recognized technical identifiers and contraband references from raw text.
        """
        if not text:
            return {}

        results: Dict[str, List[Dict[str, Any]]] = {}

        # Regex Pattern Extractions
        for entity_type, regex in self.compiled_patterns.items():
            matches = []
            for m in regex.finditer(text):
                val = m.group(0).strip()
                if entity_type == "PGP_FINGERPRINT":
                    val = val.replace(" ", "").upper()
                matches.append({
                    "value": val,
                    "start": m.start(),
                    "end": m.end(),
                    "type": entity_type
                })
            if matches:
                # Deduplicate by value
                unique_matches = list({m["value"]: m for m in matches}.values())
                results[entity_type] = unique_matches

        # Contraband / Cybercrime Keyword Matches
        found_contraband = []
        text_lower = text.lower()
        for kw, cat in self.CONTRABAND_KEYWORDS.items():
            if kw in text_lower:
                found_contraband.append({
                    "keyword": kw,
                    "category": cat,
                    "confidence": 0.95
                })
        if found_contraband:
            results["CONTRABAND"] = found_contraband

        return results

    def extract_summary(self, text: str) -> Dict[str, Any]:
        """Returns flat list of unique indicators of compromise (IOCs)."""
        extracted = self.extract_entities(text)
        wallets = [m["value"] for m in extracted.get("BTC_WALLET", []) + extracted.get("ETH_WALLET", []) + extracted.get("XMR_WALLET", [])]
        pgp_keys = [m["value"] for m in extracted.get("PGP_FINGERPRINT", [])]
        handles = [m["value"] for m in extracted.get("TELEGRAM_HANDLE", [])]
        onion_links = [m["value"] for m in extracted.get("ONION_V3", [])]
        drugs = [m["keyword"] for m in extracted.get("CONTRABAND", [])]

        return {
            "wallets": wallets,
            "pgp_keys": pgp_keys,
            "handles": handles,
            "onion_links": onion_links,
            "contraband": drugs,
            "total_indicators_found": len(wallets) + len(pgp_keys) + len(handles) + len(onion_links) + len(drugs)
        }
