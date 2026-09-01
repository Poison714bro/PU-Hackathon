import os
import sys
import json
import asyncio
import logging
from datetime import datetime
try:
    import psycopg2
    from psycopg2 import sql
    import psycopg2.extras
except ImportError:
    psycopg2 = None

from .sources.darkweb_forum import DarkwebForumSource

# Semantica Extraction & Intelligence Engines
from analysis.extraction.ner import CybercrimeNER
from analysis.extraction.triplet_extractor import TripletExtractor
from analysis.extraction.event_detector import EventDetector
from analysis.conflicts.conflict_detector import ConflictDetector

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger("IngestionPipeline")

_NER = CybercrimeNER()
_TRIPLET_EXTRACTOR = TripletExtractor(_NER)
_EVENT_DETECTOR = EventDetector()

def get_db_connection():
    db_url = os.environ.get("DATABASE_URL")
    if not db_url:
        try:
            with open(".env", "r") as f:
                for line in f:
                    if line.startswith("DATABASE_URL="):
                        db_url = line.split("=", 1)[1].strip().strip('"').strip("'")
                        break
        except FileNotFoundError:
            pass

    if not db_url:
        logger.error("DATABASE_URL not found in environment or .env file.")
        sys.exit(1)
        
    try:
        conn = psycopg2.connect(db_url)
        return conn
    except Exception as e:
        logger.error(f"Failed to connect to database: {e}")
        sys.exit(1)

async def run_pipeline():
    logger.info("Initializing Threat Intelligence Ingestion Pipeline...")
    
    # 1. Initialize Sources
    sources = [
        DarkwebForumSource()
    ]
    
    conn = get_db_connection()
    conn.autocommit = False # Use transactions for batching
    cursor = conn.cursor()
    
    for source in sources:
        logger.info(f"--- Processing Source: {source.get_source_name()} ---")
        
        # 2. Fetch Data (Handles Rate Limits & Retries natively)
        raw_payloads = await source.fetch_data()
        
        if not raw_payloads:
            logger.warning("No data fetched from source.")
            continue
            
        logger.info(f"Fetched {len(raw_payloads)} payloads. Inserting into Data Lake...")
        
        # 3. Dump raw data to Data Lake (RawIngestLog) using Batch Inserts (execute_values)
        lake_insert_query = """
            INSERT INTO "RawIngestLog" ("id", "sourceName", "payload", "processed", "createdAt")
            VALUES %s
        """
        import uuid
        lake_values = [
            (str(uuid.uuid4()), source.get_source_name(), json.dumps(payload), False, datetime.now())
            for payload in raw_payloads
        ]
        
        try:
            psycopg2.extras.execute_values(cursor, lake_insert_query, lake_values, page_size=1000)
            conn.commit()
            logger.info("Successfully dumped to Data Lake.")
        except Exception as e:
            conn.rollback()
            logger.error(f"Failed to write to Data Lake: {e}")
            # In a real scenario, write to a local file or fallback queue here
            continue

        # 4. Normalize, Extract Semantics, and Structure Data
        entities = []
        feed_entries = []
        
        for payload in raw_payloads:
            raw_text = payload.get("body") or payload.get("content") or payload.get("message") or ""
            author = payload.get("author") or payload.get("username") or "Unknown"
            
            # Semantica Extraction pass
            iocs = _NER.extract_summary(raw_text)
            triplets = _TRIPLET_EXTRACTOR.extract_triplets_from_post(author, raw_text, platform=source.get_source_name())
            events = _EVENT_DETECTOR.detect_events(raw_text, {"author": author})

            entity = source.normalize_entity(payload)
            if entity:
                entity.setdefault("rawData", {})
                entity["rawData"]["semantica_iocs"] = iocs
                entity["rawData"]["semantica_triplets"] = triplets
                entity["rawData"]["semantica_events"] = events
                entities.append(entity)
                
            entry = source.normalize_feed_entry(payload)
            if entry:
                entry.setdefault("rawData", {})
                entry["rawData"]["semantica_iocs"] = iocs
                entry["rawData"]["semantica_triplets"] = triplets
                entry["rawData"]["semantica_events"] = events
                feed_entries.append(entry)
                
        # 5. Batch Upsert Normalized Data (Partial Success Handling)
        logger.info(f"Normalizing to {len(entities)} entities and {len(feed_entries)} feed entries.")
        
        # Batch insert for IntelEntity
        if entities:
            entity_query = """
                INSERT INTO "IntelEntity" ("id", "primaryAlias", "category", "colorHex", "riskScore", "status", "firstSeen", "lastActive", "summary", "rawData")
                VALUES %s
                ON CONFLICT ("id") DO UPDATE SET
                    "primaryAlias" = EXCLUDED."primaryAlias",
                    "status" = EXCLUDED."status",
                    "rawData" = EXCLUDED."rawData";
            """
            entity_vals = [
                (e["id"], e["primaryAlias"], e["category"], e["colorHex"], e["riskScore"], e["status"], e["firstSeen"], e["lastActive"], e["summary"], json.dumps(e.get("rawData", {})))
                for e in entities
            ]
            try:
                psycopg2.extras.execute_values(cursor, entity_query, entity_vals, page_size=1000)
                conn.commit()
            except Exception as e:
                conn.rollback()
                logger.error(f"Batch insert failed for IntelEntity: {e}. Falling back to row-by-row (Dead Letter Queue logic).")
                # Dead-letter queue simulation: Attempt row-by-row to isolate bad data
                for val in entity_vals:
                    try:
                        cursor.execute("INSERT INTO \"IntelEntity\" ...", val) # simplified for demo
                        conn.commit()
                    except Exception as err:
                        conn.rollback()
                        logger.error(f"Dead Letter Queue - Failed payload: {err}")

        # Batch insert for FeedEntry
        if feed_entries:
            feed_query = """
                INSERT INTO "FeedEntry" ("id", "source", "sourceType", "riskScore", "category", "details", "timestamp", "severity", "entityId", "rawData")
                VALUES %s
                ON CONFLICT ("id") DO UPDATE SET
                    "details" = EXCLUDED."details",
                    "rawData" = EXCLUDED."rawData";
            """
            feed_vals = [
                (f["id"], f["source"], f["sourceType"], f["riskScore"], f["category"], f["details"], f["timestamp"], f["severity"], f.get("entityId"), json.dumps(f.get("rawData", {})))
                for f in feed_entries
            ]
            try:
                psycopg2.extras.execute_values(cursor, feed_query, feed_vals, page_size=1000)
                conn.commit()
            except Exception as e:
                conn.rollback()
                logger.error(f"Batch insert failed for FeedEntry: {e}")

    cursor.close()
    conn.close()
    logger.info("Pipeline Execution Completed.")

if __name__ == "__main__":
    asyncio.run(run_pipeline())
