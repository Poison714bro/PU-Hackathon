"""
Intelligence Source Credibility & Reliability Tracker
Ported & adapted from Semantica for law enforcement cybercrime intelligence.
Weights OSINT, darknet forums, blockchain nodes, and lawful intercept feeds.
"""

from dataclasses import dataclass
from typing import Any, Dict, List, Optional


@dataclass
class SourceReference:
    source_name: str
    source_type: str  # 'law_enforcement_wiretap', 'blockchain_ledger', 'darknet_forum', 'telegram_osint', 'anonymous_tip'
    credibility_score: float  # 0.0 to 1.0
    timestamp: str
    raw_reference_id: Optional[str] = None


class SourceTracker:
    """
    Maintains reliability ratings across intelligence sources and calculates
    weighted confidence for multi-source intelligence claims.
    """

    # Baseline credibility weights by source category
    DEFAULT_SOURCE_CREDIBILITY = {
        "blockchain_ledger": 0.98,
        "law_enforcement_wiretap": 0.95,
        "forensic_disk_image": 0.92,
        "seized_server_dump": 0.88,
        "telecom_cdr": 0.85,
        "darknet_forum_pgp_signed": 0.75,
        "telegram_osint": 0.60,
        "darknet_forum_unsigned": 0.45,
        "anonymous_tip": 0.30,
    }

    def __init__(self, custom_weights: Optional[Dict[str, float]] = None):
        self.credibility_map = {**self.DEFAULT_SOURCE_CREDIBILITY, **(custom_weights or {})}
        self.sources_registry: Dict[str, Dict[str, Any]] = {}

    def register_source(
        self,
        source_id: str,
        source_type: str,
        name: str,
        custom_credibility: Optional[float] = None
    ):
        base_score = self.credibility_map.get(source_type, 0.50)
        final_score = custom_credibility if custom_credibility is not None else base_score

        self.sources_registry[source_id] = {
            "id": source_id,
            "type": source_type,
            "name": name,
            "credibility_score": final_score,
        }

    def get_source_credibility(self, source_type_or_id: str) -> float:
        if source_type_or_id in self.sources_registry:
            return self.sources_registry[source_type_or_id]["credibility_score"]
        return self.credibility_map.get(source_type_or_id, 0.50)

    def calculate_aggregate_credibility(self, source_types: List[str]) -> float:
        """
        Combines multiple independent sources into a Bayesian/ensemble confidence score.
        """
        if not source_types:
            return 0.50
        scores = [self.get_source_credibility(s) for s in source_types]
        # Independent probability of at least one source being accurate
        # P = 1 - product(1 - p_i)
        prob_wrong = 1.0
        for s in scores:
            prob_wrong *= (1.0 - s)
        return round(1.0 - prob_wrong, 4)
