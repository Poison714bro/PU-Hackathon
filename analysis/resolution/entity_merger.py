"""
Suspect Entity Merger Engine
Ported & adapted from Semantica for law enforcement cybercrime intelligence.
Combines multiple suspect personas, preserving all alias records, wallet lists,
provenance trails, and recording merge history for legal auditability.
"""

from datetime import datetime
from typing import Any, Dict, List, Optional, Set
import uuid


class EntityMerger:
    """
    Merges duplicate suspect profiles into unified Master Entities while
    retaining full chain of custody and provenance.
    """

    def __init__(self, conflict_strategy: str = "keep_most_complete"):
        self.conflict_strategy = conflict_strategy
        self.merge_history: List[Dict[str, Any]] = []

    def merge_entities(
        self,
        primary_entity: Dict[str, Any],
        secondary_entity: Dict[str, Any],
        merged_by: str = "NEXUS_RESOLVER_AGENT",
        justification: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Merges secondary_entity into primary_entity, creating a unified master profile.
        """
        # Collect aliases
        alias_p = primary_entity.get("primaryAlias") or primary_entity.get("primary_alias") or "Target_P"
        alias_s = secondary_entity.get("primaryAlias") or secondary_entity.get("primary_alias") or "Target_S"
        
        all_aliases: Set[str] = set()
        for k in ["known_aliases", "knownAliases"]:
            all_aliases.update(primary_entity.get(k, []))
            all_aliases.update(secondary_entity.get(k, []))
        all_aliases.add(alias_p)
        all_aliases.add(alias_s)

        # Collect crypto wallets
        wallets_p = primary_entity.get("linked_wallets") or [w.get("address") for w in primary_entity.get("cryptoWallets", []) if isinstance(w, dict)] or []
        wallets_s = secondary_entity.get("linked_wallets") or [w.get("address") for w in secondary_entity.get("cryptoWallets", []) if isinstance(w, dict)] or []
        all_wallets = list(set(wallets_p + wallets_s))

        # PGP Key
        pgp = primary_entity.get("pgp_fingerprint") or secondary_entity.get("pgp_fingerprint") or primary_entity.get("pgpFingerprint")

        # Risk score (take maximum observed risk)
        risk_p = float(primary_entity.get("riskScore") or primary_entity.get("risk_score", 0))
        risk_s = float(secondary_entity.get("riskScore") or secondary_entity.get("risk_score", 0))
        merged_risk = max(risk_p, risk_s)

        # Linked entities
        links_p = primary_entity.get("linked_entities", [])
        links_s = secondary_entity.get("linked_entities", [])
        merged_links = list(set(links_p + links_s) - {primary_entity.get("id"), secondary_entity.get("id")})

        now = datetime.now().isoformat()
        operation_id = f"merge_{uuid.uuid4().hex[:8]}"

        merged_entity = {
            **primary_entity,
            "id": primary_entity.get("id") or f"master_{uuid.uuid4().hex[:6]}",
            "primaryAlias": alias_p,
            "primary_alias": alias_p,
            "known_aliases": list(all_aliases - {alias_p}),
            "linked_wallets": all_wallets,
            "pgp_fingerprint": pgp,
            "riskScore": merged_risk,
            "risk_score": merged_risk,
            "status": "Under Active Monitoring",
            "linked_entities": merged_links,
            "lastUpdated": now,
            "provenance": {
                "merged_from": [
                    primary_entity.get("id") or alias_p,
                    secondary_entity.get("id") or alias_s
                ],
                "operation_id": operation_id,
                "timestamp": now,
                "author": merged_by,
                "justification": justification or "Automated resolution based on cryptographic and alias similarity."
            }
        }

        # Log merge event to history
        self.merge_history.append({
            "operation_id": operation_id,
            "timestamp": now,
            "primary_id": primary_entity.get("id"),
            "secondary_id": secondary_entity.get("id"),
            "merged_aliases": [alias_p, alias_s],
            "merged_wallets_count": len(all_wallets),
            "merged_by": merged_by,
            "justification": justification
        })

        return merged_entity

    def get_merge_audit_log(self) -> List[Dict[str, Any]]:
        """Returns the full historical audit log of all entity mergers."""
        return self.merge_history
