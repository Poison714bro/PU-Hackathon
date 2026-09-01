"""
Knowledge Graph Exporter
Ported & adapted from Semantica for law enforcement cybercrime intelligence.
Exports case graphs to GraphML (Gephi / i2 Analyst Notebook), Cypher (Neo4j), and JSON-LD.
"""

import json
from typing import Any, Dict, List, Optional
import networkx as nx


class GraphExporter:
    """
    Exports criminal knowledge graphs for visualization in external law enforcement tools
    (e.g., i2 Analyst Notebook, Maltego, Neo4j Bloom, Gephi).
    """

    @staticmethod
    def _to_networkx(graph: Any) -> nx.DiGraph:
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

    @classmethod
    def export_cypher_statements(cls, graph: Any) -> str:
        """
        Generates Cypher statements to import the case graph into Neo4j.
        """
        g = cls._to_networkx(graph)
        lines = ["// ── NEXUS Cypher Case Import ──"]

        for n, data in g.nodes(data=True):
            clean_id = str(n).replace("'", "\\'")
            label = str(data.get("label", n)).replace("'", "\\'")
            ntype = str(data.get("type", "Entity")).replace(" ", "_").capitalize()
            risk = data.get("riskScore", 0)
            lines.append(f"MERGE (n:`{ntype}` {{id: '{clean_id}'}}) SET n.label = '{label}', n.riskScore = {risk};")

        for u, v, data in g.edges(data=True):
            clean_u = str(u).replace("'", "\\'")
            clean_v = str(v).replace("'", "\\'")
            rel = str(data.get("relation") or data.get("label") or "CONNECTED_TO").replace(" ", "_").upper()
            weight = data.get("weight", 1.0)
            lines.append(f"MATCH (a {{id: '{clean_u}'}}), (b {{id: '{clean_v}'}}) MERGE (a)-[r:`{rel}` {{weight: {weight}}}]->(b);")

        return "\n".join(lines)

    @classmethod
    def export_json_ld(cls, graph: Any) -> str:
        """
        Exports the graph in W3C JSON-LD standard format.
        """
        g = cls._to_networkx(graph)
        nodes_ld = []
        for n, data in g.nodes(data=True):
            nodes_ld.append({
                "@id": f"nexus:entity/{n}",
                "@type": f"nexus:{data.get('type', 'IntelEntity')}",
                "name": data.get("label", n),
                "riskScore": data.get("riskScore", 0),
                "category": data.get("category", "General")
            })

        edges_ld = []
        for u, v, data in g.edges(data=True):
            edges_ld.append({
                "@id": f"nexus:edge/{u}_{v}",
                "@type": "nexus:Relationship",
                "source": f"nexus:entity/{u}",
                "target": f"nexus:entity/{v}",
                "predicate": data.get("relation") or data.get("label") or "connectedTo"
            })

        doc = {
            "@context": {
                "nexus": "https://nexus-police.gov.in/ontology#",
                "name": "https://schema.org/name",
                "riskScore": "nexus:riskScore",
                "predicate": "nexus:predicate"
            },
            "@graph": nodes_ld + edges_ld
        }
        return json.dumps(doc, indent=2)
