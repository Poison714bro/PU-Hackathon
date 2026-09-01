"""
Forensic Event Detector
Ported & adapted from Semantica for law enforcement cybercrime intelligence.
Identifies transactional, logistical, and operational security events from intelligence streams.
"""

import re
from typing import Any, Dict, List, Optional


class EventDetector:
    """
    Detects critical cybercrime and drug trafficking events from unstructured text.
    """

    EVENT_TRIGGERS = {
        "BULK_SUPPLY_OFFER": [
            r"\b(bulk|kg|kilo|kilos|wholesale|reseller discount|in stock now)\b",
            r"\b(minimum order|moq|dispatching today)\b"
        ],
        "DEAD_DROP_COURIER": [
            r"\b(dead drop|drop location|geo coordinate|hidden in|coordinates|gps)\b",
            r"\b(stash|pickup point|courier route)\b"
        ],
        "CRYPTO_ESCROW_RELEASE": [
            r"\b(escrow released|multisig signed|tx confirmed|payment sent|hash:)\b",
            r"\b(auto-finalize|fe allowed|funds in escrow)\b"
        ],
        "OPSEC_EMERGENCY_CANARY": [
            r"\b(compromised|compromise|warrant|seized|busted|exit scam|feds|police raid)\b",
            r"\b(burn account|moved to backup|new pgp)\b"
        ],
        "NEW_MARKET_OPENING": [
            r"\b(new market|mirror online|new vendor shop|v3 link live)\b"
        ]
    }

    def __init__(self):
        self.trigger_regexes = {
            event_type: [re.compile(p, re.IGNORECASE) for p in patterns]
            for event_type, patterns in self.EVENT_TRIGGERS.items()
        }

    def detect_events(self, text: str, metadata: Optional[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
        """
        Detects operational events from text and returns structured event records.
        """
        detected: List[Dict[str, Any]] = []
        meta = metadata or {}

        for event_type, regex_list in self.trigger_regexes.items():
            for rx in regex_list:
                m = rx.search(text)
                if m:
                    severity = "CRITICAL" if "EMERGENCY" in event_type else ("HIGH" if "DEAD_DROP" in event_type else "MEDIUM")
                    detected.append({
                        "event_type": event_type,
                        "trigger_phrase": m.group(0),
                        "severity": severity,
                        "matched_at": m.start(),
                        "author": meta.get("author") or meta.get("suspect"),
                        "timestamp": meta.get("timestamp"),
                        "confidence": 0.85,
                        "summary": f"Detected {event_type.replace('_', ' ')}: '{m.group(0)}'"
                    })
                    break  # Avoid multiple triggers of same event type per text snippet

        return detected
