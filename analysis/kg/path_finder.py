"""
Forensic Path Finder & Laundering Flow Tracer
Ported & adapted from Semantica for law enforcement cybercrime intelligence.
Traces shortest paths, multi-hop transaction routes, and bottleneck choke points between suspects.
"""

from typing import Any, Dict, List, Optional
import networkx as nx


class PathFinder:
    """
    Finds connection paths, financial flows, and critical intermediary nodes
    linking targets across darknet marketplaces, wallets, and communication channels.
    """

    def __init__(self, **config):
        self.config = config

    def _to_networkx(self, graph: Any) -> nx.DiGraph:
        if isinstance(graph, (nx.Graph, nx.DiGraph)):
            return graph if graph.is_directed() else graph.to_directed()
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

    def find_shortest_path(
        self,
        graph: Any,
        source: str,
        target: str,
        weight_attribute: Optional[str] = "weight"
    ) -> Optional[Dict[str, Any]]:
        """
        Finds the shortest forensic connection path between two entities.
        """
        g = self._to_networkx(graph)
        if source not in g or target not in g:
            # Try undirected search
            gu = g.to_undirected()
            if source in gu and target in gu:
                try:
                    path = nx.shortest_path(gu, source=source, target=target, weight=weight_attribute)
                    return self._format_path(gu, path)
                except nx.NetworkXNoPath:
                    return None
            return None

        try:
            path = nx.shortest_path(g, source=source, target=target, weight=weight_attribute)
            return self._format_path(g, path)
        except nx.NetworkXNoPath:
            # Fallback to undirected path if directional flow is reversed
            try:
                path = nx.shortest_path(g.to_undirected(), source=source, target=target)
                return self._format_path(g.to_undirected(), path)
            except nx.NetworkXNoPath:
                return None

    def find_all_paths(
        self,
        graph: Any,
        source: str,
        target: str,
        max_depth: int = 4,
        limit: int = 5
    ) -> List[Dict[str, Any]]:
        """
        Finds all alternate routes and money laundering hops between source and target up to max_depth.
        """
        g = self._to_networkx(graph).to_undirected()
        if source not in g or target not in g:
            return []

        try:
            paths_generator = nx.all_simple_paths(g, source=source, target=target, cutoff=max_depth)
            results = []
            for idx, p in enumerate(paths_generator):
                if idx >= limit:
                    break
                results.append(self._format_path(g, p))
            return results
        except Exception:
            return []

    def find_bottlenecks(self, graph: Any, source: str, target: str) -> List[Dict[str, Any]]:
        """
        Finds node cut sets / critical bottlenecks where intervening nodes
        can sever the entire criminal pipeline if seized.
        """
        g = self._to_networkx(graph).to_undirected()
        if source not in g or target not in g:
            return []

        try:
            cut_nodes = nx.minimum_node_cut(g, s=source, t=target)
            return [
                {
                    "node_id": nid,
                    "label": g.nodes[nid].get("label", nid),
                    "type": g.nodes[nid].get("type", "unknown"),
                    "role": "Critical Intermediary Choke Point"
                }
                for nid in cut_nodes
            ]
        except Exception:
            return []

    def _format_path(self, g: nx.Graph, path: List[str]) -> Dict[str, Any]:
        hops = len(path) - 1
        steps = []
        for i in range(len(path)):
            node_id = path[i]
            node_data = g.nodes[node_id]
            step_info = {
                "step": i + 1,
                "node_id": node_id,
                "label": node_data.get("label", node_id),
                "type": node_data.get("type", "node"),
            }
            if i < len(path) - 1:
                next_id = path[i + 1]
                edge_data = g.get_edge_data(node_id, next_id) or {}
                step_info["relationship"] = edge_data.get("relation") or edge_data.get("label") or "connected_to"
            steps.append(step_info)

        return {
            "source": path[0],
            "target": path[-1],
            "total_hops": hops,
            "path_nodes": path,
            "steps": steps,
            "summary": f"Direct link via {hops} hop{'s' if hops != 1 else ''}"
        }
