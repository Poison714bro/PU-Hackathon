"""
Link Predictor Module
Ported & adapted from Semantica for law enforcement cybercrime intelligence.
Predicts hidden, unobserved, or covert connections between suspects based on shared infrastructure.
"""

from typing import Any, Dict, List, Optional, Tuple
import networkx as nx


class LinkPredictor:
    """
    Predicts undisclosed relationships between suspects (e.g. shared crypto mixers,
    co-occurring PGP fingerprints, overlapping drop zones).
    """

    def __init__(self, **config):
        self.config = config

    def _to_networkx(self, graph: Any) -> nx.Graph:
        if isinstance(graph, (nx.Graph, nx.DiGraph)):
            return graph.to_undirected() if graph.is_directed() else graph
        g = nx.Graph()
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

    def predict_links(
        self,
        graph: Any,
        top_k: int = 10,
        algorithm: str = "adamic_adar",
        entity_type_filter: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """
        Predicts top-k non-existing links between nodes using topological heuristics.
        Supported algorithms: 'adamic_adar', 'jaccard', 'resource_allocation', 'common_neighbors'.
        """
        g = self._to_networkx(graph)
        if g.number_of_nodes() < 2:
            return []

        # Find candidate non-edge pairs
        non_edges = list(nx.non_edges(g))
        if not non_edges:
            return []

        # Apply entity filter if specified
        if entity_type_filter:
            non_edges = [
                (u, v) for u, v in non_edges
                if g.nodes[u].get("type") == entity_type_filter or g.nodes[v].get("type") == entity_type_filter
            ]

        predictions: List[Tuple[str, str, float]] = []
        algo = algorithm.lower()

        try:
            if algo == "adamic_adar":
                preds = nx.adamic_adar_index(g, non_edges)
                predictions = [(u, v, score) for u, v, score in preds if score > 0]
            elif algo == "jaccard":
                preds = nx.jaccard_coefficient(g, non_edges)
                predictions = [(u, v, score) for u, v, score in preds if score > 0]
            elif algo == "resource_allocation":
                preds = nx.resource_allocation_index(g, non_edges)
                predictions = [(u, v, score) for u, v, score in preds if score > 0]
            else:
                for u, v in non_edges:
                    cn = len(list(nx.common_neighbors(g, u, v)))
                    if cn > 0:
                        predictions.append((u, v, float(cn)))
        except Exception:
            for u, v in non_edges:
                cn = len(list(nx.common_neighbors(g, u, v)))
                if cn > 0:
                    predictions.append((u, v, float(cn)))

        predictions.sort(key=lambda item: item[2], reverse=True)
        top_preds = predictions[:top_k]

        results = []
        for u, v, score in top_preds:
            shared_neighbors = list(nx.common_neighbors(g, u, v))
            shared_labels = [g.nodes[n].get("label", n) for n in shared_neighbors]
            
            confidence = min(1.0, round(score if score <= 1.0 else (score / (score + 1.0)), 3))

            results.append({
                "source": u,
                "target": v,
                "source_label": g.nodes[u].get("label", u),
                "target_label": g.nodes[v].get("label", v),
                "raw_score": round(score, 4),
                "confidence": confidence,
                "shared_intermediaries_count": len(shared_neighbors),
                "shared_intermediaries": shared_labels[:5],
                "inference": f"High probability of co-conspiracy via {len(shared_neighbors)} shared infrastructure node(s)."
            })

        return results
