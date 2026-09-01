"""
Entity Resolution & Identity Deduplication Module for NEXUS Cybercrime Platform.
Ported and adapted from Semantica.
"""

from .similarity import SimilarityCalculator
from .entity_merger import EntityMerger
from .duplicate_detector import DuplicateDetector

__all__ = [
    "SimilarityCalculator",
    "EntityMerger",
    "DuplicateDetector",
]
