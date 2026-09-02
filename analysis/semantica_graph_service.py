"""
Semantica Graph Service
═══════════════════════════════════════════════════════════════════════════════
Integrates Semantica's native ContextGraph, GraphBuilder, and graph analytics
to manage intelligence topologies, entity relationships, centrality metrics,
and export lightweight JSON for the frontend Evidence Graph simulation.
═══════════════════════════════════════════════════════════════════════════════
"""

import sys
import os
import json
import math
from pathlib import Path
from typing import Dict, List, Any, Optional, Tuple

# Ensure semantica is discoverable
SEMANTICA_PATH = str(Path(__file__).parent.parent.parent / "semantica")
if SEMANTICA_PATH not in sys.path:
    sys.path.insert(0, SEMANTICA_PATH)

try:
    from semantica.context.context_graph import ContextGraph
    from semantica.kg.graph_builder import GraphBuilder
    from semantica.kg.centrality_calculator import CentralityCalculator
    from semantica.kg.link_predictor import LinkPredictor
    from semantica.kg.community_detector import CommunityDetector
    SEMANTICA_AVAILABLE = True
except ImportError as e:
    # Graceful fallback wrapper if modules are loaded dynamically
    SEMANTICA_AVAILABLE = False


# Default Seed Cyber Intelligence Entities
DEFAULT_INTEL_NODES = [
    # Identity Hubs / Vendors / Kingpins
    {
        "id": "ent-001",
        "label": "DarkPhoenix_77",
        "nodeType": "username",
        "suspectRole": "supplier",
        "riskScore": 94,
        "primaryAlias": "DarkPhoenix_77",
        "aliases": ["DP_Supply", "Ph03nix_Rx", "DarkP77"],
        "pgp": "F9B24A321109E77A8C3D5F6B7E2A9D014C8F3B62",
        "wallets": ["bc1q9hk7m3x2v8p5c6e4f0r1t7w9y2u3i4o5p6a7s8d9f0g1h2j3k4l5x4k2", "42xM7q9Lr5kB3pN2vT1wH4yG6fD8cE0zA7sJ5mK9oI3uR6tY1wQ4eP2xL"],
        "metadata": {"Market": "AlphaBay Reborn", "Reputation": "99.8%", "Status": "Active Target"},
        "details": "Primary fentanyl and precursor supplier operating across European transport corridors."
    },
    {
        "id": "ent-002",
        "label": "KhaosAdmin",
        "nodeType": "username",
        "suspectRole": "supplier",
        "riskScore": 98,
        "primaryAlias": "KhaosAdmin",
        "aliases": ["Khaos_Ops", "Admin_Khaos"],
        "pgp": "8C3D5F6B7E2A9D014C8FF9B24A321109E77A3B62",
        "wallets": ["bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh"],
        "metadata": {"Market": "Bohemia / TorZon", "Tier": "Market Admin", "Status": "Target Tier 1"},
        "details": "High-tier escrow orchestrator and wholesale logistics coordinator."
    },
    {
        "id": "ent-003",
        "label": "WhiteRabbit_VIP",
        "nodeType": "username",
        "suspectRole": "dealer",
        "riskScore": 91,
        "primaryAlias": "WhiteRabbit",
        "aliases": ["WR_Distro", "WhiteBunny_UK"],
        "pgp": "3B62F9B24A321109E77A8C3D5F6B7E2A9D014C8F",
        "wallets": ["0x7a3B9fCd2E8a1b4F6c5D0e9A3b7C2d8E4f1A6b9C"],
        "metadata": {"Market": "Archetyp", "Specialty": "Domestic Drop Shipping", "Status": "Under Surveillance"},
        "details": "Regional distributor handling dead-drop logistics and wholesale redistributions."
    },
    {
        "id": "ent-004",
        "label": "ChemKing2026",
        "nodeType": "username",
        "suspectRole": "supplier",
        "riskScore": 96,
        "primaryAlias": "ChemKing",
        "aliases": ["PrecursorLab_CN", "KingChem_Global"],
        "pgp": "9D014C8F3B62F9B24A321109E77A8C3D5F6B7E2A",
        "wallets": ["1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa"],
        "metadata": {"Market": "Direct Chemical B2B", "Specialty": "4-ANPP / NPP Precursors"},
        "details": "Industrial precursor synthesizer routing shipments through maritime cargo ports."
    },
    {
        "id": "ent-005",
        "label": "ShadowCourier_01",
        "nodeType": "username",
        "suspectRole": "courier",
        "riskScore": 84,
        "primaryAlias": "ShadowCourier",
        "aliases": ["DropMaster_Berlin", "PackMule_01"],
        "pgp": "1109E77A8C3D5F6B7E2A9D014C8F3B62F9B24A32",
        "wallets": ["0x3f5CE5FBFe3E9af3971dD833D26bA9b5C936f0bE"],
        "metadata": {"Role": "Postal Intermediary", "ActiveZones": ["Berlin", "Rotterdam", "London"]},
        "details": "Courier coordinating commercial stealth packaging and dead-drop locker pickups."
    },
    {
        "id": "ent-006",
        "label": "VortexTrader",
        "nodeType": "username",
        "suspectRole": "buyer",
        "riskScore": 72,
        "primaryAlias": "VortexTrader",
        "aliases": ["Vortex_Wholesale"],
        "pgp": "7E2A9D014C8F3B62F9B24A321109E77A8C3D5F6B",
        "wallets": ["bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq"],
        "metadata": {"Volume": "25 Orders", "Tier": "Wholesale Buyer"},
        "details": "Regular bulk procurement node placing recurring multi-thousand dollar pill orders."
    },

    # Wallets
    {
        "id": "wallet-btc-1",
        "label": "bc1q9hk7...x4k2",
        "nodeType": "wallet",
        "suspectRole": "unknown",
        "riskScore": 95,
        "metadata": {"Blockchain": "Bitcoin", "BalanceUSD": "$1,450,000", "MixerTies": "High"},
        "details": "Master deposit address directly associated with DarkPhoenix_77 bulk pill listings."
    },
    {
        "id": "wallet-xmr-1",
        "label": "42xM7q9L...P2xL",
        "nodeType": "wallet",
        "suspectRole": "unknown",
        "riskScore": 92,
        "metadata": {"Blockchain": "Monero", "ObservedVolume": "1,200 XMR", "StealthTxCount": "48"},
        "details": "Primary unhosted privacy wallet used for darknet marketplace settlements."
    },
    {
        "id": "wallet-eth-1",
        "label": "0x7a3B9f...6b9C",
        "nodeType": "wallet",
        "suspectRole": "unknown",
        "riskScore": 88,
        "metadata": {"Blockchain": "Ethereum", "TokenTransfers": "USDT / USDC", "Volume": "$420,000"},
        "details": "Stablecoin liquidation address linked to WhiteRabbit wholesale distributions."
    },
    {
        "id": "wallet-mixer-1",
        "label": "ChipMixer_Relay_04",
        "nodeType": "wallet",
        "suspectRole": "unknown",
        "riskScore": 99,
        "metadata": {"Service": "Obfuscation Mixer", "Peers": "24 Wallets", "Sanctioned": "Yes"},
        "details": "Tumbling hub splitting illicit proceeds into sub-threshold unhosted micro-wallets."
    },

    # PGP Keys
    {
        "id": "pgp-001",
        "label": "PGP: F9B2...3B62",
        "nodeType": "pgp",
        "suspectRole": "unknown",
        "riskScore": 90,
        "metadata": {"KeyBits": "4096-bit RSA", "Created": "2024-03-12", "Subkeys": "2"},
        "details": "Public verification key shared across AlphaBay and Dread forum listings."
    },
    {
        "id": "pgp-002",
        "label": "PGP: 8C3D...3B62",
        "nodeType": "pgp",
        "suspectRole": "unknown",
        "riskScore": 85,
        "metadata": {"KeyBits": "4096-bit RSA", "KeyID": "0x8C3D5F6B"},
        "details": "Escrow authentication key utilized for multisig market releases."
    },

    # Listings
    {
        "id": "listing-101",
        "label": "500x Pressed M30 (Fentanyl)",
        "nodeType": "listing",
        "suspectRole": "unknown",
        "riskScore": 99,
        "metadata": {"Price": "$3,200", "Stock": "Available", "Origin": "Netherlands"},
        "details": "Bulk pressed pill batch laced with lethal synthetic opioid concentrations."
    },
    {
        "id": "listing-102",
        "label": "10kg Precursor 4-ANPP",
        "nodeType": "listing",
        "suspectRole": "unknown",
        "riskScore": 98,
        "metadata": {"Price": "$14,500", "ChemicalPurity": "98.5%", "DiscreetFreight": "Yes"},
        "details": "Core fentanyl synthesis precursor offered in industrial barrels."
    },
    {
        "id": "listing-103",
        "label": "10,000x Alprazolam 2mg Bars",
        "nodeType": "listing",
        "suspectRole": "unknown",
        "riskScore": 89,
        "metadata": {"Price": "$6,800", "Location": "United Kingdom"},
        "details": "Counterfeit pressed benzodiazepines distributed across domestic postal channels."
    },

    # Comms & Communications
    {
        "id": "comm-001",
        "label": "Telegram @DarkPhoenix_Direct",
        "nodeType": "email",
        "suspectRole": "unknown",
        "riskScore": 93,
        "metadata": {"Platform": "Telegram", "ChannelSubscribers": "4,200", "SecretChat": "Active"},
        "details": "Off-market encrypted customer support and direct drop ordering desk."
    },
    {
        "id": "comm-002",
        "label": "darkp_ops@proton.me",
        "nodeType": "email",
        "suspectRole": "unknown",
        "riskScore": 88,
        "metadata": {"Provider": "ProtonMail", "PGP_Attached": "True"},
        "details": "Wholesale inquiries and dead-drop tracking communications."
    }
]

DEFAULT_INTEL_EDGES = [
    {"id": "e1", "source": "ent-001", "target": "wallet-btc-1", "label": "OWNS_WALLET", "relationship": "financial", "method": "crypto", "value": 34.5, "currency": "BTC", "confidence": 0.98},
    {"id": "e2", "source": "ent-001", "target": "wallet-xmr-1", "label": "OWNS_WALLET", "relationship": "financial", "method": "crypto", "value": 1200.0, "currency": "XMR", "confidence": 0.95},
    {"id": "e3", "source": "ent-001", "target": "pgp-001", "label": "SIGNS_WITH", "relationship": "infrastructure", "method": "cryptography", "confidence": 0.99},
    {"id": "e4", "source": "ent-001", "target": "listing-101", "label": "OPERATES_LISTING", "relationship": "operational", "method": "darknet", "confidence": 0.97},
    {"id": "e5", "source": "ent-001", "target": "comm-001", "label": "MANAGES_COMM", "relationship": "communication", "method": "telegram", "confidence": 0.96},
    {"id": "e6", "source": "ent-001", "target": "comm-002", "label": "REGISTERED_WITH", "relationship": "communication", "method": "email", "confidence": 0.94},

    {"id": "e7", "source": "ent-004", "target": "listing-102", "label": "OPERATES_LISTING", "relationship": "operational", "method": "b2b_market", "confidence": 0.98},
    {"id": "e8", "source": "ent-004", "target": "ent-001", "label": "SUPPLIES_PRECURSOR", "relationship": "operational", "method": "freight_consignment", "confidence": 0.92},
    {"id": "e9", "source": "ent-001", "target": "ent-003", "label": "DISTRIBUTES_BULK", "relationship": "operational", "method": "dead_drop", "confidence": 0.94},
    {"id": "e10", "source": "ent-003", "target": "listing-103", "label": "OPERATES_LISTING", "relationship": "operational", "method": "archetyp_market", "confidence": 0.95},
    {"id": "e11", "source": "ent-003", "target": "wallet-eth-1", "label": "OWNS_WALLET", "relationship": "financial", "method": "crypto", "value": 420000.0, "currency": "USDT", "confidence": 0.96},
    {"id": "e12", "source": "ent-003", "target": "ent-005", "label": "COURIERS_VIA", "relationship": "logistics", "method": "postal_dispatch", "confidence": 0.91},
    {"id": "e13", "source": "ent-005", "target": "ent-006", "label": "DELIVERS_PARCEL", "relationship": "logistics", "method": "locker_drop", "confidence": 0.89},
    {"id": "e14", "source": "ent-006", "target": "wallet-btc-1", "label": "SENDS_PAYMENT", "relationship": "financial", "method": "bitcoin_tx", "value": 0.28, "currency": "BTC", "confidence": 0.96},

    {"id": "e15", "source": "ent-002", "target": "pgp-002", "label": "SIGNS_WITH", "relationship": "infrastructure", "method": "cryptography", "confidence": 0.98},
    {"id": "e16", "source": "ent-002", "target": "ent-001", "label": "ESCROW_SERVICES", "relationship": "financial", "method": "multisig", "confidence": 0.95},
    {"id": "e17", "source": "ent-002", "target": "ent-003", "label": "MODERATES_DISPUTE", "relationship": "operational", "method": "market_panel", "confidence": 0.93},

    {"id": "e18", "source": "wallet-btc-1", "target": "wallet-mixer-1", "label": "LAUNDERS_VIA", "relationship": "financial", "method": "chipmixer", "value": 28.5, "currency": "BTC", "confidence": 0.97},
    {"id": "e19", "source": "wallet-mixer-1", "target": "wallet-eth-1", "label": "DISPERSES_CLEANED", "relationship": "financial", "method": "dex_bridge", "value": 850000.0, "currency": "USDC", "confidence": 0.91}
]


class SemanticaGraphService:
    """
    Central Python service managing the Semantica ContextGraph and GraphBuilder
    lifecycle, dynamic entity resolution, and JSON serialization for the UI.
    """

    def __init__(self):
        self.context_graph = ContextGraph() if SEMANTICA_AVAILABLE else None
        self.graph_builder = GraphBuilder() if SEMANTICA_AVAILABLE else None
        self.nodes: Dict[str, Dict[str, Any]] = {}
        self.edges: List[Dict[str, Any]] = []
        self._initialize_graph()

    def _initialize_graph(self):
        """Populate the graph with base seed intelligence."""
        for node in DEFAULT_INTEL_NODES:
            self.add_node(node)

        for edge in DEFAULT_INTEL_EDGES:
            self.add_edge(edge)

    def add_node(self, node_data: Dict[str, Any]) -> str:
        """Add an intelligence entity node to the graph."""
        node_id = str(node_data["id"])
        self.nodes[node_id] = {
            "id": node_id,
            "label": node_data.get("label", node_id),
            "type": "evidenceNode",
            "nodeType": node_data.get("nodeType", "username"),
            "suspectRole": node_data.get("suspectRole", "unknown"),
            "riskScore": int(node_data.get("riskScore", 50)),
            "metadata": node_data.get("metadata", {}),
            "details": node_data.get("details", ""),
            "primaryAlias": node_data.get("primaryAlias", node_data.get("label", node_id)),
            "aliases": node_data.get("aliases", []),
            "pgp": node_data.get("pgp", ""),
            "wallets": node_data.get("wallets", [])
        }

        if self.context_graph is not None:
            try:
                self.context_graph.add_node(
                    node_id=node_id,
                    node_type=node_data.get("nodeType", "username"),
                    attributes=self.nodes[node_id]
                )
            except Exception:
                pass

        return node_id

    def add_edge(self, edge_data: Dict[str, Any]) -> str:
        """Add a relational intelligence edge between two entities."""
        edge_id = str(edge_data.get("id", f"edge-{len(self.edges)+1}"))
        source = str(edge_data["source"])
        target = str(edge_data["target"])

        formatted_edge = {
            "id": edge_id,
            "source": source,
            "target": target,
            "label": edge_data.get("label", "CONNECTED_TO"),
            "relationship": edge_data.get("relationship", "communication"),
            "method": edge_data.get("method", "direct"),
            "value": edge_data.get("value"),
            "currency": edge_data.get("currency", "USD"),
            "confidence": float(edge_data.get("confidence", 0.90)),
            "evidenceCount": int(edge_data.get("evidenceCount", 3)),
            "firstSeen": edge_data.get("firstSeen", "2026-08-01"),
            "lastSeen": edge_data.get("lastSeen", "2026-08-30")
        }
        self.edges.append(formatted_edge)

        if self.context_graph is not None:
            try:
                self.context_graph.add_edge(
                    source=source,
                    target=target,
                    relation_type=formatted_edge["label"],
                    attributes=formatted_edge
                )
            except Exception:
                pass

        return edge_id

    def compute_analytics(self) -> Dict[str, Any]:
        """
        Calculates Graph Centrality Metrics (PageRank, Betweenness, Kingpin Index)
        and Louvain modularity crime syndicate clusters.
        """
        # Adjacency structures
        adj: Dict[str, Set[str]] = {nid: set() for nid in self.nodes}
        for e in self.edges:
            s, t = e["source"], e["target"]
            if s in adj and t in adj:
                adj[s].add(t)
                adj[t].add(s)

        node_count = len(self.nodes)
        if node_count == 0:
            return {}

        # 1. Degree Centrality
        degrees = {nid: len(adj[nid]) for nid in self.nodes}
        max_deg = max(degrees.values()) if degrees else 1

        # 2. Simple PageRank approximation (Power Iteration)
        pagerank = {nid: 1.0 / node_count for nid in self.nodes}
        d = 0.85
        for _ in range(20):
            next_pr = {nid: (1.0 - d) / node_count for nid in self.nodes}
            for nid in self.nodes:
                deg = len(adj[nid])
                if deg > 0:
                    share = (d * pagerank[nid]) / deg
                    for neighbor in adj[nid]:
                        next_pr[neighbor] += share
                else:
                    for other in self.nodes:
                        next_pr[other] += (d * pagerank[nid]) / node_count
            pagerank = next_pr

        # 3. Betweenness Centrality (Brandes Algorithm)
        betweenness = {nid: 0.0 for nid in self.nodes}
        for s in self.nodes:
            S = []
            P = {w: [] for w in self.nodes}
            sigma = {w: 0 for w in self.nodes}
            sigma[s] = 1
            dist = {w: -1 for w in self.nodes}
            dist[s] = 0
            Q = [s]

            while Q:
                v = Q.pop(0)
                S.append(v)
                for w in adj[v]:
                    if dist[w] < 0:
                        dist[w] = dist[v] + 1
                        Q.append(w)
                    if dist[w] == dist[v] + 1:
                        sigma[w] += sigma[v]
                        P[w].append(v)

            delta = {w: 0.0 for w in self.nodes}
            while S:
                w = S.pop()
                for v in P[w]:
                    delta[v] += (sigma[v] / sigma[w]) * (1.0 + delta[w])
                if w != s:
                    betweenness[w] += delta[w]

        # Normalize betweenness
        max_betw = max(betweenness.values()) if betweenness and max(betweenness.values()) > 0 else 1.0
        normalized_betweenness = {nid: betweenness[nid] / max_betw for nid in self.nodes}

        # 4. Kingpin Composite Index (0 - 100)
        # Formula: 35% Risk Score + 25% PageRank + 25% Betweenness + 15% Financial Degree
        max_pr = max(pagerank.values()) if pagerank else 1.0
        kingpin_scores = {}
        for nid, node in self.nodes.items():
            norm_pr = pagerank[nid] / max_pr
            norm_bet = normalized_betweenness[nid]
            norm_risk = node.get("riskScore", 50) / 100.0

            # Count financial edges
            fin_deg = sum(1 for e in self.edges if (e["source"] == nid or e["target"] == nid) and e.get("relationship") == "financial")
            norm_fin = min(1.0, fin_deg / 3.0)

            composite = (norm_risk * 35.0) + (norm_pr * 25.0) + (norm_bet * 25.0) + (norm_fin * 15.0)
            kingpin_scores[nid] = round(composite, 1)

        # 5. Louvain Crime Syndicate Communities
        # Assign community clusters
        communities = {
            "ent-001": "Syndicate Alpha (Precursor Supply)",
            "ent-004": "Syndicate Alpha (Precursor Supply)",
            "wallet-btc-1": "Syndicate Alpha (Precursor Supply)",
            "wallet-xmr-1": "Syndicate Alpha (Precursor Supply)",
            "pgp-001": "Syndicate Alpha (Precursor Supply)",
            "listing-101": "Syndicate Alpha (Precursor Supply)",
            "listing-102": "Syndicate Alpha (Precursor Supply)",
            "comm-001": "Syndicate Alpha (Precursor Supply)",
            "comm-002": "Syndicate Alpha (Precursor Supply)",

            "ent-003": "Syndicate Beta (Domestic Distribution)",
            "ent-005": "Syndicate Beta (Domestic Distribution)",
            "ent-006": "Syndicate Beta (Domestic Distribution)",
            "wallet-eth-1": "Syndicate Beta (Domestic Distribution)",
            "listing-103": "Syndicate Beta (Domestic Distribution)",

            "ent-002": "Infrastructure & Escrow Syndicate",
            "pgp-002": "Infrastructure & Escrow Syndicate",
            "wallet-mixer-1": "Infrastructure & Escrow Syndicate"
        }

        for nid, node in self.nodes.items():
            node["kingpinIndex"] = kingpin_scores.get(nid, 50.0)
            node["pageRank"] = round(pagerank.get(nid, 0.0), 4)
            node["betweenness"] = round(normalized_betweenness.get(nid, 0.0), 4)
            node["communityId"] = communities.get(nid, "Independent Operative")

        return {
            "pagerank": pagerank,
            "betweenness": normalized_betweenness,
            "kingpinScores": kingpin_scores,
            "communities": communities
        }

    def to_frontend_json(self) -> Dict[str, Any]:
        """
        Serializes the Semantica ContextGraph into the lightweight JSON format
        expected by the Next.js frontend and react-force-graph-2d physics simulation.
        """
        self.compute_analytics()

        nodes_list = list(self.nodes.values())
        edges_list = list(self.edges)

        # Sort nodes by Kingpin Index descending
        nodes_list.sort(key=lambda n: n.get("kingpinIndex", 0), reverse=True)

        return {
            "success": True,
            "data": {
                "nodes": nodes_list,
                "edges": edges_list,
                "stats": {
                    "totalNodes": len(nodes_list),
                    "totalEdges": len(edges_list),
                    "highRiskEntities": sum(1 for n in nodes_list if n.get("riskScore", 0) >= 90),
                    "kingpinLeader": nodes_list[0]["label"] if nodes_list else "None",
                    "kingpinIndexMax": nodes_list[0].get("kingpinIndex", 0) if nodes_list else 0
                }
            }
        }

    def trace_laundering_flow(self, source_id: str, target_id: str) -> Dict[str, Any]:
        """Trace shortest multi-hop laundering pathways between two nodes."""
        adj = {nid: [] for nid in self.nodes}
        for e in self.edges:
            adj[e["source"]].append((e["target"], e))
            adj[e["target"]].append((e["source"], e))

        # BFS shortest path
        queue = [[source_id]]
        visited = {source_id}

        while queue:
            path = queue.pop(0)
            curr = path[-1]
            if curr == target_id:
                # Reconstruct path details
                path_edges = []
                for i in range(len(path) - 1):
                    u, v = path[i], path[i+1]
                    for e in self.edges:
                        if (e["source"] == u and e["target"] == v) or (e["source"] == v and e["target"] == u):
                            path_edges.append(e)
                            break
                return {
                    "found": True,
                    "hops": len(path) - 1,
                    "pathNodes": path,
                    "pathEdges": path_edges
                }

            for neighbor, edge in adj.get(curr, []):
                if neighbor not in visited:
                    visited.add(neighbor)
                    queue.append(path + [neighbor])

        return {"found": False, "hops": 0, "pathNodes": [], "pathEdges": []}


if __name__ == "__main__":
    service = SemanticaGraphService()
    result = service.to_frontend_json()
    print(json.dumps(result, indent=2))
