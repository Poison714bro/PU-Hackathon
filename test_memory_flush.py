from analysis.correlation import CorrelationEngine
from datetime import datetime
import os

def test_flush():
    dump_dir = "test_dumps"
    # Set a very low limit to force a flush
    engine = CorrelationEngine(in_memory_limit=5, dump_dir=dump_dir)
    now = datetime.now()
    
    print("--- 1. Testing Memory Limit Flush ---")
    
    engine.add_entity_node("A", "Person") # 1
    engine.add_entity_node("B", "Person") # 2
    engine.add_entity_node("C", "Person") # 3
    engine.add_entity_node("D", "Person") # 4
    engine.add_entity_link("A", "B", "LINK", 1.0, now) # 5 -> Flushes here
    
    if engine.graph.number_of_nodes() == 0:
        print("[SUCCESS]: Memory flush triggered correctly and graph is cleared.")
    else:
        print("[FAIL]: Graph was not cleared.")

    engine.add_entity_node("E", "Person")
    
    # Force a final flush
    engine.flush_to_disk()

    print("\n--- 2. Testing Disk Load ---")
    merged = engine.load_from_disk()
    if merged.number_of_nodes() == 5:
        print(f"[SUCCESS]: Loaded exactly 5 nodes from disk.")
    else:
        print(f"[FAIL]: Loaded {merged.number_of_nodes()} nodes instead of 5.")

    # Cleanup
    if os.path.exists(f"{dump_dir}/nodes_dump.csv"):
        os.remove(f"{dump_dir}/nodes_dump.csv")
    if os.path.exists(f"{dump_dir}/edges_dump.csv"):
        os.remove(f"{dump_dir}/edges_dump.csv")
    if os.path.exists(dump_dir):
        os.rmdir(dump_dir)

if __name__ == "__main__":
    test_flush()
