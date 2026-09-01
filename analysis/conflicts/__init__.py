"""
Contradictory Intelligence Detection & Source Reliability Module.
Ported and adapted from Semantica.
"""

from .source_tracker import SourceTracker, SourceReference
from .conflict_detector import ConflictDetector, Conflict
from .conflict_resolver import ConflictResolver

__all__ = [
    "SourceTracker",
    "SourceReference",
    "ConflictDetector",
    "Conflict",
    "ConflictResolver",
]
