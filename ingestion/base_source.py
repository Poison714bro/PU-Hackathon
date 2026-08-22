import abc
import logging
from typing import List, Dict, Any, Optional

class IntelligenceSource(abc.ABC):
    """
    Abstract Base Class for all threat intelligence data sources.
    Enforces a standard interface for fetching raw data and normalizing it.
    """

    def __init__(self):
        self.logger = logging.getLogger(self.get_source_name())

    @abc.abstractmethod
    def get_source_name(self) -> str:
        """Return a unique identifier for this source (e.g., 'AlphaBay_Forum')."""
        pass

    @abc.abstractmethod
    async def fetch_data(self) -> List[Dict[str, Any]]:
        """
        Fetch raw data from the external source.
        Implementations MUST include rate-limiting and exponential backoff
        (e.g., using `tenacity` and `aiolimiter`).
        
        Returns:
            A list of raw JSON/Dict payloads.
        """
        pass

    @abc.abstractmethod
    def normalize_entity(self, raw_payload: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        Convert a raw payload into the standardized `IntelEntity` schema format.
        Return None if the payload does not represent an entity or is malformed.
        """
        pass

    @abc.abstractmethod
    def normalize_feed_entry(self, raw_payload: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        Convert a raw payload into the standardized `FeedEntry` schema format.
        Return None if the payload does not represent a feed entry or is malformed.
        """
        pass
