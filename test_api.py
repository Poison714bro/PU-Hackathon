import asyncio
from backend.api import get_entity_network

async def run_verification():
    print("--- Testing Network Endpoint Pruning ---")
    
    # Call the endpoint to get the network for a mock entity
    # We pass 'depth=2'
    response = await get_entity_network("ent-001", 2)
    
    num_nodes = len(response["nodes"])
    num_edges = len(response["edges"])
    
    print(f"Total Nodes Returned: {num_nodes}")
    print(f"Total Edges Returned: {num_edges}")
    
    if num_nodes == 300:
        print("[SUCCESS]: Network graph successfully pruned to MAX_NODES (300).")
    else:
        print(f"[FAIL]: Expected 300 nodes, got {num_nodes}")
        
if __name__ == "__main__":
    asyncio.run(run_verification())
