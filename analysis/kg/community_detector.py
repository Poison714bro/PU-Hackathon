"""
Criminal Community & Syndicate Detection Engine
Ported & adapted from Semantica for law enforcement cybercrime intelligence.
"""

from collections import defaultdict
from typing import Any, Dict, List, Optional, Set
import networkx as nx


class CommunityDetector:
    """
    Detects criminal rings, money-laundering clusters, and darknet syndicates
    within cyber intelligence knowledge graphs.
    """

    def __init__(self, **config):
        self.config = config

    def _to_networkx(self, graph: Any) -> nx.Graph:
        if isinstance(graph, (nx.Graph, nx.DiGraph)):
            return graph.to_undirected() if graph.is_directed() else graph
        
        # Build from dict structure
        g = nx.Graph()
        if isinstance(graph, dict):
            nodes = graph.get("nodes", [])
            edges = graph.get("edges", [])
            for n in nodes:
                nid = n.get("id") if isinstance(n, dict) else str(n)
                attrs = n if isinstance(n, dict) else {}
                g.add_node(nid, **attrs)
            for e in edges:
                if isinstance(e, dict):
                    src = e.get("source") or e.get("from")
                    tgt = e.get("target") or e.get("to")
                    g.add_edge(src, tgt, **e)
                elif isinstance(e, (list, tuple)) and len(e) >= 2:
                    g.add_edge(e[0], e[1])
        return g

    def detect_communities(
        self,
        graph: Any,
        algorithm: str = "louvain",
        resolution: float = 1.0,
    ) -> List[Dict[str, Any]]:
        """
        Detects communities in the graph using the specified algorithm.
        Supported algorithms: 'louvain', 'label_propagation', 'connected_components', 'greedy_modularity'.
        """
        g = self._to_networkx(graph)
        if g.number_of_nodes() == 0:
            return []

        algo = algorithm.lower()
        communities_set: List[Set[Any]] = []

        try:
            if algo == "louvain":
                try:
                    import networkx.algorithms.community as nx_comm
                    communities_set = list(nx_comm.louvain_communities(g, resolution=resolution, seed=42))
                except (ImportError, AttributeError):
                    communities_set = self._fallback_label_propagation(g)
            elif algo == "label_propagation":
                import networkx.algorithms.community as nx_comm
                communities_set = list(nx_comm.label_propagation_communities(g))
            elif algo == "greedy_modularity":
                import networkx.algorithms.community as nx_comm
                communities_set = list(nx_comm.greedy_modularity_communities(g))
            elif algo == "connected_components":
                communities_set = list(nx.connected_components(g))
            else:
                communities_set = list(nx.connected_components(g))
        except Exception:
            communities_set = self._fallback_label_propagation(g)

        result: List[Dict[str, Any]] = []
        for idx, members in enumerate(communities_set):
            subgraph = g.subgraph(members)
            
            # Identify internal roles and high-risk nodes
            suspect_count = sum(1 for n in members if g.nodes[n].get("type") in ("suspect", "username", "Person"))
            wallet_count = sum(1 for n in members if g.nodes[n].get("type") in ("wallet", "Wallet"))
            
            # Modularity density
            internal_edges = subgraph.number_of_edges()
            possible_edges = len(members) * (len(members) - 1) / 2 if len(members) > 1 else 1
            density = round(internal_edges / max(1, possible_edges), 3)

            result.append({
                "community_id": f"syndicate_{idx + 1:02d}",
                "size": len(members),
                "members": list(members),
                "suspect_count": suspect_count,
                "wallet_count": wallet_count,
                "density": density,
                "internal_edges": internal_edges,
                "label": f"Cluster #{idx + 1} ({len(members)} nodes, {suspect_count} targets)"
            })

        # Sort largest / highest risk first
        result.sort(key=lambda c: (c["suspect_count"], c["size"]), reverse=True)
        return result

    def _fallback_label_propagation(self, g: nx.Graph) -> List[Set[Any]]:
        labels = {node: i for i, node in enumerate(g.nodes())}
        nodes = list(g.nodes())
        
        for _ in range(10):
            changed = False
            for node in nodes:
                neighbors = list(g.neighbors(node))
                if not neighbors:
                    continue
                neighbor_labels = [labels[nbr] for nbr in neighbors]
                most_common = max(set(neighbor_labels), key=neighbor_labels.count)
                if labels[node] != most_common:
                    labels[node] = most_common
                    changed = True
            if not changed:
                break
                
        groups = defaultdict(set)
        for node, lbl in labels.items():
            groups[lbl].add(node)
        return list(groups.values())

    def calculate_community_metrics(self, graph: Any, communities: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Calculates global modularity and quality metrics for the detected communities."""
        g = self._to_networkx(graph)
        node_count = g.number_of_nodes()
        edge_count = g.number_of_edges()

        if not communities or node_count == 0:
            return {"modularity": 0.0, "coverage": 0.0, "total_communities": 0}

        community_sets = [set(c["members"]) for c in communities]
        
        try:
            import networkx.algorithms.community as nx_comm
            modularity = round(nx_comm.modularity(g, community_sets), 4)
        except Exception:
            modularity = 0.0

        covered_nodes = sum(len(c["members"]) for c in communities)
        coverage = round(covered_nodes / max(1, node_count), 4)

        return {
            "total_communities": len(communities),
            "total_nodes": node_count,
            "total_edges": edge_count,
            "modularity": modularity,
            "coverage": coverage,
            "avg_community_size": round(covered_nodes / max(1, len(communities)), 2),
        }
