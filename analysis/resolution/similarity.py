"""
Multi-Factor Similarity Calculator
Ported & adapted from Semantica for law enforcement cybercrime intelligence.
Computes string similarity (Levenshtein, Jaro-Winkler), property overlap,
and crypto/PGP exact/fuzzy matches to resolve darknet personas.
"""

from typing import Any, Dict, List, Optional, Set, Tuple


class SimilarityCalculator:
    """
    Computes multi-component similarity between two suspect profiles or intelligence entities.
    """

    def __init__(
        self,
        string_weight: float = 0.35,
        wallet_weight: float = 0.35,
        pgp_weight: float = 0.15,
        property_weight: float = 0.15,
    ):
        self.string_weight = string_weight
        self.wallet_weight = wallet_weight
        self.pgp_weight = pgp_weight
        self.property_weight = property_weight

    # ── String Similarity Metrics ──

    @staticmethod
    def levenshtein_distance(s1: str, s2: str) -> int:
        if len(s1) < len(s2):
            return SimilarityCalculator.levenshtein_distance(s2, s1)
        if len(s2) == 0:
            return len(s1)
        previous_row = range(len(s2) + 1)
        for i, c1 in enumerate(s1):
            current_row = [i + 1]
            for j, c2 in enumerate(s2):
                insertions = previous_row[j + 1] + 1
                deletions = current_row[j] + 1
                substitutions = previous_row[j] + (c1 != c2)
                current_row.append(min(insertions, deletions, substitutions))
            previous_row = current_row
        return previous_row[-1]

    @classmethod
    def levenshtein_similarity(cls, s1: str, s2: str) -> float:
        if not s1 and not s2:
            return 1.0
        if not s1 or not s2:
            return 0.0
        dist = cls.levenshtein_distance(s1.lower(), s2.lower())
        max_len = max(len(s1), len(s2))
        return round(1.0 - (dist / max_len), 4)

    @classmethod
    def jaro_similarity(cls, s1: str, s2: str) -> float:
        s1, s2 = s1.lower(), s2.lower()
        if s1 == s2:
            return 1.0
        len1, len2 = len(s1), len(s2)
        if len1 == 0 or len2 == 0:
            return 0.0

        max_dist = (max(len1, len2) // 2) - 1
        s1_matches = [False] * len1
        s2_matches = [False] * len2
        matches = 0
        transpositions = 0

        for i in range(len1):
            start = max(0, i - max_dist)
            end = min(i + max_dist + 1, len2)
            for j in range(start, end):
                if s2_matches[j] or s1[i] != s2[j]:
                    continue
                s1_matches[i] = True
                s2_matches[j] = True
                matches += 1
                break

        if matches == 0:
            return 0.0

        k = 0
        for i in range(len1):
            if not s1_matches[i]:
                continue
            while not s2_matches[k]:
                k += 1
            if s1[i] != s2[k]:
                transpositions += 1
            k += 1

        transpositions //= 2
        return (
            (matches / len1) + (matches / len2) + ((matches - transpositions) / matches)
        ) / 3.0

    @classmethod
    def jaro_winkler_similarity(cls, s1: str, s2: str, p: float = 0.1) -> float:
        jaro_dist = cls.jaro_similarity(s1, s2)
        prefix_len = 0
        for c1, c2 in zip(s1.lower(), s2.lower()):
            if c1 == c2:
                prefix_len += 1
            else:
                break
            if prefix_len == 4:
                break
        return round(jaro_dist + (prefix_len * p * (1.0 - jaro_dist)), 4)

    @classmethod
    def jaccard_set_similarity(cls, set1: Set[Any], set2: Set[Any]) -> float:
        if not set1 and not set2:
            return 1.0
        if not set1 or not set2:
            return 0.0
        intersection = len(set1.intersection(set2))
        union = len(set1.union(set2))
        return round(intersection / union, 4)

    # ── Full Profile Multi-Factor Resolution ──

    def calculate_entity_similarity(
        self,
        entity_a: Dict[str, Any],
        entity_b: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Calculates composite similarity between two target profiles.
        """
        alias_a = entity_a.get("primaryAlias") or entity_a.get("primary_alias") or entity_a.get("label", "")
        alias_b = entity_b.get("primaryAlias") or entity_b.get("primary_alias") or entity_b.get("label", "")

        known_a = set(entity_a.get("known_aliases", []) + [alias_a])
        known_b = set(entity_b.get("known_aliases", []) + [alias_b])

        # Maximum alias similarity
        max_string_sim = 0.0
        best_pair = (alias_a, alias_b)
        for a in known_a:
            for b in known_b:
                if a and b:
                    sim = self.jaro_winkler_similarity(a, b)
                    if sim > max_string_sim:
                        max_string_sim = sim
                        best_pair = (a, b)

        # Wallet address overlap
        wallets_a = set(entity_a.get("linked_wallets", []) or [w.get("address") for w in entity_a.get("cryptoWallets", []) if isinstance(w, dict)])
        wallets_b = set(entity_b.get("linked_wallets", []) or [w.get("address") for w in entity_b.get("cryptoWallets", []) if isinstance(w, dict)])
        wallet_sim = 1.0 if wallets_a.intersection(wallets_b) else 0.0

        # PGP Key comparison
        pgp_a = entity_a.get("pgp_fingerprint") or entity_a.get("pgpFingerprint")
        pgp_b = entity_b.get("pgp_fingerprint") or entity_b.get("pgpFingerprint")
        pgp_sim = 1.0 if (pgp_a and pgp_b and pgp_a.lower() == pgp_b.lower()) else 0.0

        # Category/Role match
        cat_a = entity_a.get("category", "")
        cat_b = entity_b.get("category", "")
        cat_sim = 1.0 if (cat_a and cat_b and cat_a.lower() == cat_b.lower()) else 0.5

        # Weighted Total Score
        total_score = (
            (max_string_sim * self.string_weight) +
            (wallet_sim * self.wallet_weight) +
            (pgp_sim * self.pgp_weight) +
            (cat_sim * self.property_weight)
        )
        total_score = round(min(1.0, max(0.0, total_score)), 4)

        is_match = total_score >= 0.70 or wallet_sim == 1.0 or pgp_sim == 1.0

        return {
            "overall_similarity": total_score,
            "is_probable_match": is_match,
            "confidence_pct": round(total_score * 100, 1),
            "matched_alias_pair": best_pair,
            "components": {
                "alias_similarity": max_string_sim,
                "shared_wallets": list(wallets_a.intersection(wallets_b)),
                "shared_pgp": pgp_a if pgp_sim == 1.0 else None,
                "category_consistency": cat_sim,
            },
            "justification": self._generate_match_justification(total_score, wallet_sim, pgp_sim, best_pair)
        }

    def _generate_match_justification(
        self,
        score: float,
        wallet_sim: float,
        pgp_sim: float,
        best_pair: Tuple[str, str]
    ) -> str:
        if wallet_sim == 1.0 and pgp_sim == 1.0:
            return f"Definitive cryptographic match: Identical crypto wallet and PGP key fingerprint shared between '{best_pair[0]}' and '{best_pair[1]}'."
        elif wallet_sim == 1.0:
            return f"Financial link: Shared on-chain crypto address observed across identities."
        elif pgp_sim == 1.0:
            return f"Cryptographic identity link: Exact PGP key fingerprint match."
        elif score >= 0.80:
            return f"High-confidence alias match ('{best_pair[0]}' ~ '{best_pair[1]}') with consistent behavioral markers."
        else:
            return f"Potential correlation with {round(score*100)}% confidence score."
