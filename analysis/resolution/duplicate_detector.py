"""
Duplicate Suspect Persona Detector
Ported & adapted from Semantica for law enforcement cybercrime intelligence.
Performs pairwise blocking and fuzzy matching across suspect pools to find merge candidates.
"""

from typing import Any, Dict, List, Optional
from .similarity import SimilarityCalculator


class DuplicateDetector:
    """
    Scans a pool of darknet entities, forum accounts, and wallets to identify
    likely duplicate personas representing the same real-world target.
    """

    def __init__(self, threshold: float = 0.70):
        self.threshold = threshold
        self.similarity_calculator = SimilarityCalculator()

    def find_duplicate_candidates(
        self,
        entities: List[Dict[str, Any]],
        threshold: Optional[float] = None
    ) -> List[Dict[str, Any]]:
        """
        Compares all entity pairs and returns high-confidence duplicate candidates.
        """
        match_thresh = threshold if threshold is not None else self.threshold
        candidates = []
        n = len(entities)

        for i in range(n):
            for j in range(i + 1, n):
                ent_a = entities[i]
                ent_b = entities[j]

                # Skip if already linked as the same ID
                if ent_a.get("id") and ent_a.get("id") == ent_b.get("id"):
                    continue

                sim_result = self.similarity_calculator.calculate_entity_similarity(ent_a, ent_b)
                
                if sim_result["overall_similarity"] >= match_thresh or sim_result["is_probable_match"]:
                    candidates.append({
                        "entity_a_id": ent_a.get("id"),
                        "entity_b_id": ent_b.get("id"),
                        "entity_a_alias": ent_a.get("primaryAlias") or ent_a.get("primary_alias") or ent_a.get("label"),
                        "entity_b_alias": ent_b.get("primaryAlias") or ent_b.get("primary_alias") or ent_b.get("label"),
                        "similarity_score": sim_result["overall_similarity"],
                        "confidence_pct": sim_result["confidence_pct"],
                        "match_details": sim_result["components"],
                        "justification": sim_result["justification"],
                        "recommended_action": "MERGE" if sim_result["overall_similarity"] >= 0.85 else "INVESTIGATE"
                    })

        # Sort highest similarity first
        candidates.sort(key=lambda x: x["similarity_score"], reverse=True)
        return candidates
