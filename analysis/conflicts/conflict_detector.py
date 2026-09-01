"""
Contradictory Intelligence Detector
Ported & adapted from Semantica for law enforcement cybercrime intelligence.
Detects value mismatches, contradictory suspect locations, disputed crypto ownership,
and conflicting cartel roles across OSINT, darknet, and surveillance feeds.
"""

from dataclasses import dataclass
from typing import Any, Dict, List, Optional
from .source_tracker import SourceTracker


@dataclass
class Conflict:
    conflict_id: str
    entity_id: str
    property_name: str
    severity: str  # 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'
    competing_values: List[Dict[str, Any]]
    confidence: float
    recommended_action: str


class ConflictDetector:
    """
    Scans intelligence feeds and suspect dossiers to uncover contradictions.
    """

    def __init__(self, source_tracker: Optional[SourceTracker] = None):
        self.source_tracker = source_tracker or SourceTracker()

    def detect_conflicts_in_records(
        self,
        entity_id: str,
        claims: List[Dict[str, Any]]
    ) -> List[Conflict]:
        """
        Scans a list of claims about an entity.
        Each claim format: {"property": "location", "value": "Dubai", "source": "telegram_osint", "timestamp": "2026-08-30"}
        """
        # Group by property
        by_property: Dict[str, List[Dict[str, Any]]] = {}
        for c in claims:
            prop = c.get("property")
            if prop:
                by_property.setdefault(prop, []).append(c)

        conflicts: List[Conflict] = []

        for prop, prop_claims in by_property.items():
            # Check unique values
            unique_vals = set(str(c.get("value")).strip().lower() for c in prop_claims)
            if len(unique_vals) > 1:
                # Disagreement detected
                severity = self._assess_severity(prop)
                
                competing = []
                for c in prop_claims:
                    src_type = c.get("source", "darknet_forum_unsigned")
                    cred = self.source_tracker.get_source_credibility(src_type)
                    competing.append({
                        "value": c.get("value"),
                        "source": src_type,
                        "credibility": cred,
                        "timestamp": c.get("timestamp")
                    })

                # Calculate dispute confidence
                avg_cred = sum(x["credibility"] for x in competing) / len(competing)

                conflicts.append(Conflict(
                    conflict_id=f"conf_{entity_id}_{prop}",
                    entity_id=entity_id,
                    property_name=prop,
                    severity=severity,
                    competing_values=competing,
                    confidence=round(avg_cred, 2),
                    recommended_action=self._recommend_action(severity, prop)
                ))

        return conflicts

    def _assess_severity(self, property_name: str) -> str:
        critical_props = {"pgp_fingerprint", "crypto_wallet", "primary_alias", "real_identity"}
        high_props = {"current_location", "suspect_role", "organization", "cartel_boss"}
        medium_props = {"status", "phone_number", "email"}

        prop_lower = property_name.lower()
        if prop_lower in critical_props:
            return "CRITICAL"
        elif prop_lower in high_props:
            return "HIGH"
        elif prop_lower in medium_props:
            return "MEDIUM"
        return "LOW"

    def _recommend_action(self, severity: str, property_name: str) -> str:
        if severity == "CRITICAL":
            return f"Immediate manual investigator review required: Cryptographic/identity contradiction in '{property_name}'."
        elif severity == "HIGH":
            return f"Cross-reference with high-credibility surveillance or blockchain ledger to resolve '{property_name}'."
        else:
            return f"Retain most credible source value and log conflict in audit history."
