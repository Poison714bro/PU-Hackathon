"""
Kingpin & Centrality Measure Calculator
Ported & adapted from Semantica for law enforcement cybercrime intelligence.
Identifies kingpins, financial hubs, darknet brokers, and critical infrastructure bridges.
"""

from typing import Any, Dict, List, Optional
import networkx as nx


class CentralityCalculator:
    """
    Calculates forensic centrality measures to determine key criminal actors,
    money laundering hubs, and vital communication bridges.
    """

    def __init__(self, **config):
        self.config = config

    def _to_networkx(self, graph: Any) -> nx.Graph:
        if isinstance(graph, (nx.Graph, nx.DiGraph)):
            return graph
        g = nx.DiGraph()
        if isinstance(graph, dict):
            for n in graph.get("nodes", []):
                nid = n.get("id") if isinstance(n, dict) else str(n)
                attrs = n if isinstance(n, dict) else {}
                g.add_node(nid, **attrs)
            for e in graph.get("edges", []):
                if isinstance(e, dict):
                    src = e.get("source") or e.get("from")
                    tgt = e.get("target") or e.get("to")
                    g.add_edge(src, tgt, **e)
                elif isinstance(e, (list, tuple)) and len(e) >= 2:
                    g.add_edge(e[0], e[1])
        return g

    def calculate_all_centrality(
        self,
        graph: Any,
        damping_factor: float = 0.85,
    ) -> Dict[str, Dict[str, float]]:
        """
        Calculates PageRank, Betweenness (broker score), Degree, Closeness,
        and an aggregated 'Kingpin Index' for every node in the network.
        """
        g = self._to_networkx(graph)
        if g.number_of_nodes() == 0:
            return {}

        # PageRank (influence/authority in network)
        try:
            pagerank = nx.pagerank(g, alpha=damping_factor, max_iter=200)
        except Exception:
            pagerank = {n: 1.0 / max(1, g.number_of_nodes()) for n in g.nodes()}

        # Betweenness (critical bridge / broker / money mule hub)
        try:
            betweenness = nx.betweenness_centrality(g)
        except Exception:
            betweenness = {n: 0.0 for n in g.nodes()}

        # Degree centrality (raw connectivity)
        try:
            degree = nx.degree_centrality(g)
        except Exception:
            degree = {n: 0.0 for n in g.nodes()}

        # Closeness centrality (rapid propagation/reach)
        try:
            closeness = nx.closeness_centrality(g)
        except Exception:
            closeness = {n: 0.0 for n in g.nodes()}

        results: Dict[str, Dict[str, float]] = {}
        for n in g.nodes():
            pr = round(pagerank.get(n, 0.0), 4)
            bet = round(betweenness.get(n, 0.0), 4)
            deg = round(degree.get(n, 0.0), 4)
            clo = round(closeness.get(n, 0.0), 4)
            
            # Kingpin Composite Score (0 - 100)
            # Weighted: 35% PageRank + 35% Betweenness + 20% Degree + 10% Closeness
            kingpin_raw = (pr * 40.0) + (bet * 35.0) + (deg * 15.0) + (clo * 10.0)
            kingpin_score = round(min(100.0, max(0.0, kingpin_raw * 100.0)), 1)

            results[n] = {
                "pagerank": pr,
                "betweenness": bet,
                "degree": deg,
                "closeness": clo,
                "kingpin_index": kingpin_score,
            }

        return results

    def get_top_kingpins(
        self,
        graph: Any,
        top_k: int = 5,
        metric: str = "kingpin_index"
    ) -> List[Dict[str, Any]]:
        """
        Returns top-k nodes ranked by the specified centrality measure or Kingpin Index.
        """
        all_metrics = self.calculate_all_centrality(graph)
        g = self._to_networkx(graph)

        ranked = sorted(
            all_metrics.items(),
            key=lambda item: item[1].get(metric, 0.0),
            reverse=True
        )[:top_k]

        return [
            {
                "node_id": node_id,
                "label": g.nodes[node_id].get("label", node_id),
                "type": g.nodes[node_id].get("type", "unknown"),
                "risk_score": g.nodes[node_id].get("riskScore") or g.nodes[node_id].get("risk_score", 0),
                "metrics": scores,
                "role_inference": self._infer_role(scores)
            }
            for node_id, scores in ranked
        ]

    def _infer_role(self, metrics: Dict[str, float]) -> str:
        bet = metrics.get("betweenness", 0.0)
        pr = metrics.get("pagerank", 0.0)
        deg = metrics.get("degree", 0.0)

        if bet > 0.25 and pr > 0.05:
            return "Primary Kingpin / Central Coordinator"
        elif bet > 0.20:
            return "Key Broker / Cash-out Mixer Gatekeeper"
        elif deg > 0.30:
            return "High-Volume Hub / Bulk Supplier"
        elif pr > 0.05:
            return "Influential Operator"
        else:
            return "Peripheral Actor / Mule"
