import json
import os
import sys
try:
    import psycopg2
    from psycopg2 import sql
except ImportError:
    print("Error: psycopg2 is not installed. Please run 'pip install psycopg2-binary'")
    sys.exit(1)

def get_db_connection():
    # Attempt to read DATABASE_URL from .env if not in os.environ
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
        print("Error: DATABASE_URL not found in environment or .env file.")
        sys.exit(1)
        
    try:
        conn = psycopg2.connect(db_url)
        return conn
    except Exception as e:
        print(f"Failed to connect to database: {e}")
        sys.exit(1)

def seed_database():
    json_path = os.path.join("prisma", "osint_data.json")
    if not os.path.exists(json_path):
        print(f"Error: Could not find {json_path}")
        sys.exit(1)
        
    with open(json_path, "r") as f:
        data = json.load(f)

    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        # Note: Prisma quotes table names by default, so we use exact case matching via sql.Identifier
        
        # 1. Insert IntelEntity
        print("Seeding IntelEntity (Targets)...")
        for entity in data.get("IntelEntity", []):
            cursor.execute(
                sql.SQL("""
                    INSERT INTO "IntelEntity" ("id", "primaryAlias", "category", "colorHex", "riskScore", "status", "firstSeen", "lastActive", "summary")
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                    ON CONFLICT ("id") DO UPDATE SET
                        "primaryAlias" = EXCLUDED."primaryAlias",
                        "summary" = EXCLUDED."summary",
                        "status" = EXCLUDED."status";
                """),
                (entity["id"], entity["primaryAlias"], entity["category"], entity["colorHex"], 
                 entity["riskScore"], entity["status"], entity["firstSeen"], entity["lastActive"], entity["summary"])
            )

        # 2. Insert CryptoWallet
        print("Seeding CryptoWallet (Digital Footprints)...")
        for cw in data.get("CryptoWallet", []):
            cursor.execute(
                sql.SQL("""
                    INSERT INTO "CryptoWallet" ("id", "address", "currency", "observedVolumeUSD", "entityId")
                    VALUES (%s, %s, %s, %s, %s)
                    ON CONFLICT ("address") DO UPDATE SET
                        "observedVolumeUSD" = EXCLUDED."observedVolumeUSD";
                """),
                (cw["id"], cw["address"], cw["currency"], cw["observedVolumeUSD"], cw["entityId"])
            )

        # 3. Insert FeedEntry
        print("Seeding FeedEntry (Evidence Records)...")
        for fe in data.get("FeedEntry", []):
            cursor.execute(
                sql.SQL("""
                    INSERT INTO "FeedEntry" ("id", "source", "sourceType", "riskScore", "category", "details", "timestamp", "severity", "entityId")
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                    ON CONFLICT ("id") DO UPDATE SET
                        "details" = EXCLUDED."details";
                """),
                (fe["id"], fe["source"], fe["sourceType"], fe["riskScore"], fe["category"], 
                 fe["details"], fe["timestamp"], fe["severity"], fe["entityId"])
            )

        conn.commit()
        print("\n✅ SUCCESS: Database successfully populated with real OSINT data!")
        print(f"Inserted/Upserted {len(data.get('IntelEntity', []))} targets.")
        print(f"Inserted/Upserted {len(data.get('CryptoWallet', []))} digital footprints.")
        print(f"Inserted/Upserted {len(data.get('FeedEntry', []))} evidence records.")
        
    except Exception as e:
        conn.rollback()
        print(f"\n❌ ERROR during seeding: {e}")
    finally:
        cursor.close()
        conn.close()

if __name__ == "__main__":
    seed_database()
