from datetime import datetime
from analysis.correlation import CorrelationEngine

def run_verification():
    engine = CorrelationEngine()
    now = datetime.now()

    print("--- 1. Testing Node Typology & Traversal Pruning ---")
    
    # Add an innocent person
    engine.add_entity_node("Innocent_User_Bob", "Person", is_public_infrastructure=False)
    # Add a suspect
    engine.add_entity_node("Suspect_Alice", "Person", is_public_infrastructure=False)
    
    # Add a public exchange hot wallet
    engine.add_entity_node("Binance_Hot_Wallet_1", "Wallet", is_public_infrastructure=True)

    # Add a private wallet belonging to Alice
    engine.add_entity_node("Alice_Private_Wallet", "Wallet", is_public_infrastructure=False)

    # Bob and Alice both send money to Binance (very common)
    engine.add_entity_link("Innocent_User_Bob", "Binance_Hot_Wallet_1", "DEPOSIT", 100.0, now)
    engine.add_entity_link("Suspect_Alice", "Binance_Hot_Wallet_1", "DEPOSIT", 5000.0, now)
    
    # Alice also sends money to her private wallet
    engine.add_entity_link("Suspect_Alice", "Alice_Private_Wallet", "TRANSFER", 1000.0, now)

    # If we traverse Alice's network, does Bob show up?
    alice_network = engine.find_criminal_network("Suspect_Alice", depth=2)
    network_nodes = [node[0] for node in alice_network]
    
    print(f"Alice's Criminal Network: {network_nodes}")
    if "Innocent_User_Bob" in network_nodes:
        print("[FAIL]: False Positive! Bob was linked to Alice through a public exchange.")
    else:
        print("[SUCCESS]: Public infrastructure pruned. Bob is safe.")


    print("\n--- 2. Testing Dynamic Pattern Detection & Deduplication ---")
    
    # Add 3 people who all send money to a private wallet
    engine.add_entity_node("Buyer_1", "Person", is_public_infrastructure=False)
    engine.add_entity_node("Buyer_2", "Person", is_public_infrastructure=False)
    engine.add_entity_node("Buyer_3", "Person", is_public_infrastructure=False)
    
    engine.add_entity_link("Buyer_1", "Alice_Private_Wallet", "PAYMENT", 50.0, now)
    engine.add_entity_link("Buyer_2", "Alice_Private_Wallet", "PAYMENT", 50.0, now)
    engine.add_entity_link("Buyer_3", "Alice_Private_Wallet", "PAYMENT", 50.0, now)

    print("Running detection pass 1...")
    alerts = engine.detect_suspicious_patterns()
    for a in alerts:
        print(f"   Alert: {a['message']}")
        
    if len(alerts) == 1:
        print("[SUCCESS]: Alert fired successfully.")
    else:
        print(f"[FAIL]: Expected 1 alert, got {len(alerts)}")

    print("\nRunning detection pass 2 (simulating a cron job running 5 minutes later)...")
    alerts_pass_2 = engine.detect_suspicious_patterns()
    if len(alerts_pass_2) == 0:
        print("[SUCCESS]: Alert was properly deduplicated! No spam.")
    else:
        print("[FAIL]: Duplicate alert fired.")

if __name__ == "__main__":
    run_verification()
