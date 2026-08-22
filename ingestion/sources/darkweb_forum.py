import asyncio
from typing import List, Dict, Any, Optional
import time
import random
from datetime import datetime

# In a real project, add `tenacity` and `aiolimiter` to requirements.txt
try:
    from tenacity import retry, wait_exponential, stop_after_attempt, retry_if_exception_type
    from aiolimiter import AsyncLimiter
except ImportError:
    # Fallbacks for demonstration if not installed
    def retry(*args, **kwargs):
        def decorator(func):
            return func
        return decorator
    class AsyncLimiter:
        def __init__(self, *args, **kwargs): pass
        async def __aenter__(self): return self
        async def __aexit__(self, exc_type, exc_val, exc_tb): pass

from ..base_source import IntelligenceSource

# Example Exception for rate limits
class RateLimitError(Exception):
    pass

class DarkwebForumSource(IntelligenceSource):
    """
    Concrete implementation of IntelligenceSource.
    Simulates scraping a darkweb forum with strict rate limits and Tor connection drops.
    """

    def __init__(self):
        super().__init__()
        # Limit to 5 requests per second to avoid triggering anti-DDoS
        self.limiter = AsyncLimiter(5, 1)

    def get_source_name(self) -> str:
        return "AlphaBay_Forum_Scraper"

    @retry(
        wait=wait_exponential(multiplier=1, min=4, max=60),
        stop=stop_after_attempt(5),
        retry=retry_if_exception_type(RateLimitError)
    )
    async def _fetch_page(self, page_num: int) -> Dict[str, Any]:
        """
        Simulated network call with exponential backoff on RateLimitError.
        """
        async with self.limiter:
            self.logger.info(f"Fetching page {page_num}...")
            # Simulate network latency
            await asyncio.sleep(random.uniform(0.1, 0.5))
            
            # Simulate random 429 Too Many Requests
            if random.random() < 0.1:
                self.logger.warning(f"Rate limited on page {page_num}! Backing off...")
                raise RateLimitError("429 Too Many Requests")

            # Simulated response
            return {
                "page": page_num,
                "posts": [
                    {
                        "post_id": f"post-10{page_num}",
                        "author": "AcidWizard420",
                        "content": "New batch of LSD available. Escrow only.",
                        "timestamp": datetime.now().isoformat(),
                        "url": f"http://alphabay.onion/forum/t/{page_num}"
                    }
                ]
            }

    async def fetch_data(self) -> List[Dict[str, Any]]:
        """
        Fetches multiple pages concurrently while respecting the rate limit.
        """
        self.logger.info(f"Starting ingestion for {self.get_source_name()}")
        
        # Scrape 5 pages concurrently
        tasks = [self._fetch_page(i) for i in range(1, 6)]
        pages = await asyncio.gather(*tasks, return_exceptions=True)
        
        raw_payloads = []
        for result in pages:
            if isinstance(result, Exception):
                self.logger.error(f"Failed to fetch a page after retries: {result}")
            else:
                raw_payloads.append(result)
                
        return raw_payloads

    def normalize_entity(self, raw_payload: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        Extracts vendor info as an IntelEntity.
        """
        # In a real scenario, this parses the raw HTML or JSON payload
        # For this demo, let's just return a static extraction for the first post
        if not raw_payload.get("posts"):
            return None
            
        post = raw_payload["posts"][0]
        return {
            "id": f"ent-{post['author']}",
            "primaryAlias": post['author'],
            "category": "Vendor",
            "colorHex": "#FF0000",
            "riskScore": 85.0,
            "status": "Active",
            "firstSeen": post['timestamp'],
            "lastActive": post['timestamp'],
            "summary": "Extracted from forum post.",
            "rawData": raw_payload # store the raw unstructured data!
        }

    def normalize_feed_entry(self, raw_payload: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        Extracts the post content as a FeedEntry.
        """
        if not raw_payload.get("posts"):
            return None
            
        post = raw_payload["posts"][0]
        return {
            "id": post["post_id"],
            "source": self.get_source_name(),
            "sourceType": "Darkweb Forum",
            "riskScore": 75.0,
            "category": "Drug Sales",
            "details": post["content"],
            "timestamp": post["timestamp"],
            "severity": "High",
            "entityId": f"ent-{post['author']}",
            "rawData": raw_payload # store the raw unstructured data!
        }
