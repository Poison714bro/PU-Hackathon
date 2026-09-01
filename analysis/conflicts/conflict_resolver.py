"""
Conflict Resolver Module
Ported & adapted from Semantica for law enforcement cybercrime intelligence.
Resolves contradictory intelligence using credibility weighting, recency, or investigator override.
"""

from typing import Any, Dict, List, Optional
from .conflict_detector import Conflict


class ConflictResolver:
    """
    Applies resolution strategies to reconcile conflicting claims across intelligence sources.
    """

    def __init__(self, default_strategy: str = "credibility_weighted"):
        self.default_strategy = default_strategy
        self.resolution_history: List[Dict[str, Any]] = []

    def resolve_conflict(
        self,
        conflict: Conflict,
        strategy: Optional[str] = None,
        investigator_override_value: Optional[Any] = None,
        resolved_by: str = "NEXUS_CONFLICT_ENGINE",
        reason: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Resolves a single conflict according to the chosen strategy.
        Supported strategies: 'credibility_weighted', 'most_recent', 'manual_override', 'preserve_all'.
        """
        strat = strategy or ("manual_override" if investigator_override_value is not None else self.default_strategy)

        chosen_value = None
        confidence = conflict.confidence

        if strat == "manual_override" and investigator_override_value is not None:
            chosen_value = investigator_override_value
            confidence = 1.0
            justification = f"Investigator override by {resolved_by}: {reason or 'Manual verification'}"
        elif strat == "most_recent":
            sorted_by_time = sorted(
                conflict.competing_values,
                key=lambda x: str(x.get("timestamp") or ""),
                reverse=True
            )
            chosen_value = sorted_by_time[0]["value"]
            justification = f"Resolved to most recently observed claim (from {sorted_by_time[0]['source']})."
        elif strat == "preserve_all":
            chosen_value = [x["value"] for x in conflict.competing_values]
            justification = "Preserved all disputed values as alternative possibilities."
        else:
            # credibility_weighted (default)
            sorted_by_cred = sorted(
                conflict.competing_values,
                key=lambda x: float(x.get("credibility", 0.0)),
                reverse=True
            )
            chosen_value = sorted_by_cred[0]["value"]
            highest_cred = sorted_by_cred[0]["credibility"]
            justification = f"Resolved in favor of highest-credibility source '{sorted_by_cred[0]['source']}' (score: {highest_cred})."

        resolution = {
            "conflict_id": conflict.conflict_id,
            "entity_id": conflict.entity_id,
            "property_name": conflict.property_name,
            "resolved_value": chosen_value,
            "confidence": confidence,
            "strategy": strat,
            "justification": justification,
            "resolved_by": resolved_by,
            "disputed_claims_count": len(conflict.competing_values)
        }

        self.resolution_history.append(resolution)
        return resolution
