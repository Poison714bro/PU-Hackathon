"""
Temporal Reasoning Engine
Ported & adapted from Semantica for law enforcement cybercrime intelligence.
Correlates chronological events, overlapping active intervals, and temporal anomalies across targets.
"""

from datetime import datetime
from typing import Any, Dict, List, Optional, Tuple


class TemporalReasoner:
    """
    Handles temporal logic, bi-temporal fact intervals, and timeline anomaly detection
    (e.g., impossible travel velocity, simultaneous multi-forum activity).
    """

    def __init__(self, **config):
        self.config = config

    def _parse_ts(self, timestamp: Any) -> Optional[datetime]:
        if isinstance(timestamp, datetime):
            return timestamp
        if isinstance(timestamp, (int, float)):
            try:
                # Handle millis vs seconds
                sec = timestamp / 1000 if timestamp > 1e11 else timestamp
                return datetime.fromtimestamp(sec)
            except Exception:
                return None
        if isinstance(timestamp, str):
            for fmt in ("%Y-%m-%dT%H:%M:%S.%fZ", "%Y-%m-%dT%H:%M:%SZ", "%Y-%m-%d %H:%M:%S", "%Y-%m-%d"):
                try:
                    return datetime.strptime(timestamp, fmt)
                except ValueError:
                    continue
        return None

    def correlate_event_timeline(self, events: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Sorts and enriches events into a continuous chronological narrative,
        calculating time deltas and flagging rapid activity bursts.
        """
        parsed_events = []
        for e in events:
            raw_ts = e.get("timestamp") or e.get("date") or e.get("time")
            dt = self._parse_ts(raw_ts)
            if dt:
                parsed_events.append({**e, "_dt": dt, "formatted_time": dt.isoformat()})

        parsed_events.sort(key=lambda x: x["_dt"])

        enriched = []
        for idx, ev in enumerate(parsed_events):
            delta_seconds = None
            is_burst = False
            if idx > 0:
                prev_dt = parsed_events[idx - 1]["_dt"]
                delta_seconds = (ev["_dt"] - prev_dt).total_seconds()
                # If events happened within 5 minutes of each other across different channels
                if delta_seconds < 300:
                    is_burst = True

            clean_ev = {k: v for k, v in ev.items() if k != "_dt"}
            clean_ev["delta_from_previous_seconds"] = delta_seconds
            clean_ev["is_rapid_succession"] = is_burst
            enriched.append(clean_ev)

        return enriched

    def check_temporal_overlap(
        self,
        interval_a: Tuple[Any, Any],
        interval_b: Tuple[Any, Any]
    ) -> Dict[str, Any]:
        """
        Checks if two suspect active periods overlap (Allen's interval algebra).
        """
        start_a, end_a = self._parse_ts(interval_a[0]), self._parse_ts(interval_a[1])
        start_b, end_b = self._parse_ts(interval_b[0]), self._parse_ts(interval_b[1])

        if not all([start_a, end_a, start_b, end_b]):
            return {"overlaps": False, "error": "Invalid timestamps"}

        overlaps = (start_a <= end_b) and (start_b <= end_a)
        
        overlap_start = max(start_a, start_b)
        overlap_end = min(end_a, end_b)
        duration_hours = max(0.0, (overlap_end - overlap_start).total_seconds() / 3600.0) if overlaps else 0.0

        return {
            "overlaps": overlaps,
            "overlap_start": overlap_start.isoformat() if overlaps else None,
            "overlap_end": overlap_end.isoformat() if overlaps else None,
            "duration_hours": round(duration_hours, 2),
        }
