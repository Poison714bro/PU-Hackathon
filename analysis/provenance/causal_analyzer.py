"""
Causal Chain & Decision Impact Analyzer
Ported & adapted from Semantica for law enforcement cybercrime intelligence.
Traces causal ancestry of investigative actions (e.g. Threat Alert -> Warrant -> Seizure -> Wallet Freeze).
"""

from typing import Any, Dict, List, Optional
import networkx as nx
from .decision_recorder import InvestigatorDecision


class CausalChainAnalyzer:
    """
    Builds and analyzes directed causal graphs of investigative actions,
    allowing law enforcement officers to demonstrate why each enforcement step was taken in court.
    """

    def __init__(self):
        self.causal_graph = nx.DiGraph()

    def add_decision_step(
        self,
        decision: InvestigatorDecision,
        caused_by_decision_id: Optional[str] = None
    ):
        self.causal_graph.add_node(
            decision.decision_id,
            category=decision.action_category,
            officer=decision.investigator_id,
            targets=decision.target_entity_ids,
            justification=decision.justification,
            timestamp=decision.timestamp
        )
        if caused_by_decision_id and self.causal_graph.has_node(caused_by_decision_id):
            self.causal_graph.add_edge(caused_by_decision_id, decision.decision_id, relation="triggers")
        elif decision.preceding_decision_id and self.causal_graph.has_node(decision.preceding_decision_id):
            self.causal_graph.add_edge(decision.preceding_decision_id, decision.decision_id, relation="triggers")

    def trace_causal_ancestry(self, decision_id: str) -> List[Dict[str, Any]]:
        """
        Traces the full upstream justification chain that led to a given action.
        """
        if not self.causal_graph.has_node(decision_id):
            return []

        ancestors = nx.ancestors(self.causal_graph, decision_id)
        sub_nodes = list(ancestors) + [decision_id]
        
        # Sort in topological/chronological order
        subgraph = self.causal_graph.subgraph(sub_nodes)
        try:
            ordered_node_ids = list(nx.topological_sort(subgraph))
        except Exception:
            ordered_node_ids = sorted(sub_nodes, key=lambda n: self.causal_graph.nodes[n].get("timestamp", ""))

        chain = []
        for idx, nid in enumerate(ordered_node_ids):
            data = self.causal_graph.nodes[nid]
            chain.append({
                "step": idx + 1,
                "decision_id": nid,
                "category": data.get("category"),
                "officer": data.get("officer"),
                "justification": data.get("justification"),
                "timestamp": data.get("timestamp"),
            })

        return chain

    def analyze_downstream_impact(self, decision_id: str) -> List[Dict[str, Any]]:
        """
        Shows all downstream enforcement actions that flowed from an initial discovery.
        """
        if not self.causal_graph.has_node(decision_id):
            return []

        descendants = nx.descendants(self.causal_graph, decision_id)
        return [
            {
                "decision_id": nid,
                "category": self.causal_graph.nodes[nid].get("category"),
                "officer": self.causal_graph.nodes[nid].get("officer"),
                "timestamp": self.causal_graph.nodes[nid].get("timestamp"),
            }
            for nid in descendants
        ]
