import networkx as nx
import hashlib
import csv
import os
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional

# Semantica-powered Intelligence Sub-modules
from .kg.community_detector import CommunityDetector
from .kg.centrality_calculator import CentralityCalculator
from .kg.path_finder import PathFinder
from .kg.link_predictor import LinkPredictor
from .kg.temporal_reasoning import TemporalReasoner
from .resolution.similarity import SimilarityCalculator
from .resolution.entity_merger import EntityMerger
from .resolution.duplicate_detector import DuplicateDetector
from .conflicts.conflict_detector import ConflictDetector
from .conflicts.source_tracker import SourceTracker
from .conflicts.conflict_resolver import ConflictResolver
from .extraction.ner import CybercrimeNER
from .extraction.triplet_extractor import TripletExtractor
from .extraction.event_detector import EventDetector
from .provenance.decision_recorder import DecisionRecorder
from .provenance.causal_analyzer import CausalChainAnalyzer
from .provenance.chain_of_custody import ChainOfCustodyTracker
from .exporters.dossier_exporter import DossierExporter
from .exporters.graph_exporter import GraphExporter


class AlertManager:
    """
    Handles alert generation and deduplication to prevent spamming investigators.
    """
    def __init__(self):
        self.active_alerts = {}

    def generate_alert(self, entity_id: str, rule_name: str, message: str, cooldown_hours: int = 24):
        """
        Generates an alert if one hasn't been fired for this entity/rule within the cooldown period.
        """
        alert_hash = hashlib.md5(f"{entity_id}_{rule_name}".encode()).hexdigest()
        now = datetime.now()
        
        # Deduplication check
        if alert_hash in self.active_alerts:
            last_fired = self.active_alerts[alert_hash]
            if now - last_fired < timedelta(hours=cooldown_hours):
                return None # Suppress duplicate
                
        self.active_alerts[alert_hash] = now
        return {
            "entity_id": entity_id,
            "rule": rule_name,
            "message": message,
            "timestamp": now.isoformat()
        }


class CorrelationEngine:
    """
    Master Cybercrime Intelligence Correlation Engine.
    Analyzes connections between entities to uncover criminal networks, detect syndicates,
    identify kingpins, resolve duplicate personas, and trace money laundering routes.
    """
    def __init__(self, in_memory_limit: int = 100000, dump_dir: str = "data_dumps"):
        self.graph = nx.DiGraph()
        self.alert_manager = AlertManager()
        self.in_memory_limit = in_memory_limit
        self.dump_dir = dump_dir
        self.nodes_file = os.path.join(dump_dir, "nodes_dump.csv")
        self.edges_file = os.path.join(dump_dir, "edges_dump.csv")
        
        # Advanced Semantica Engines
        self.community_detector = CommunityDetector()
        self.centrality_calculator = CentralityCalculator()
        self.path_finder = PathFinder()
        self.link_predictor = LinkPredictor()
        self.temporal_reasoner = TemporalReasoner()
        self.similarity_calculator = SimilarityCalculator()
        self.entity_merger = EntityMerger()
        self.duplicate_detector = DuplicateDetector()
        self.source_tracker = SourceTracker()
        self.conflict_detector = ConflictDetector(self.source_tracker)
        self.conflict_resolver = ConflictResolver()
        self.ner = CybercrimeNER()
        self.triplet_extractor = TripletExtractor(self.ner)
        self.event_detector = EventDetector()
        self.decision_recorder = DecisionRecorder()
        self.causal_analyzer = CausalChainAnalyzer()
        self.custody_tracker = ChainOfCustodyTracker()
        self.dossier_exporter = DossierExporter()
        self.graph_exporter = GraphExporter()
        
        if not os.path.exists(self.dump_dir):
            os.makedirs(self.dump_dir)

    def _check_memory_limit(self):
        if self.graph.number_of_nodes() + self.graph.number_of_edges() >= self.in_memory_limit:
            self.flush_to_disk()

    def add_entity_node(self, entity_id: str, node_type: str, is_public_infrastructure: bool = False, **attrs):
        """
        node_type: 'Person', 'Wallet', 'IP_Address', 'Exchange', 'Mixer', 'pgp', 'listing'
        is_public_infrastructure: True for Exchanges, Tor Exits, VPNs.
        """
        attrs_copy = dict(attrs)
        label = attrs_copy.pop("label", entity_id)
        self.graph.add_node(entity_id, type=node_type, public_infra=is_public_infrastructure, label=label, **attrs_copy)
        self._check_memory_limit()

    def add_entity_link(self, source: str, target: str, relation: str, weight: float, timestamp: Any, **attrs):
        """
        Creates a directed edge between two entities.
        """
        ts_str = timestamp.isoformat() if isinstance(timestamp, datetime) else str(timestamp)
        self.graph.add_edge(source, target, relation=relation, weight=weight, timestamp=ts_str, **attrs)
        self._check_memory_limit()

    def flush_to_disk(self):
        """
        Flushes the current in-memory nodes and edges to CSV files and clears the graph.
        """
        if self.graph.number_of_nodes() == 0 and self.graph.number_of_edges() == 0:
            return

        # Write Nodes
        file_exists = os.path.isfile(self.nodes_file)
        with open(self.nodes_file, 'a', newline='', encoding='utf-8') as f:
            writer = csv.writer(f)
            if not file_exists:
                writer.writerow(['entity_id', 'type', 'public_infra'])
            for node, data in self.graph.nodes(data=True):
                writer.writerow([node, data.get('type', ''), data.get('public_infra', False)])

        # Write Edges
        file_exists = os.path.isfile(self.edges_file)
        with open(self.edges_file, 'a', newline='', encoding='utf-8') as f:
            writer = csv.writer(f)
            if not file_exists:
                writer.writerow(['source', 'target', 'relation', 'weight', 'timestamp'])
            for u, v, data in self.graph.edges(data=True):
                writer.writerow([u, v, data.get('relation', ''), data.get('weight', 0.0), data.get('timestamp', '')])

        # Clear the memory
        self.graph.clear()

    def load_from_disk(self):
        """
        Reads the dumped files and merges them back into a NetworkX graph.
        """
        merged_graph = nx.DiGraph()
        
        if os.path.isfile(self.nodes_file):
            with open(self.nodes_file, 'r', encoding='utf-8') as f:
                reader = csv.DictReader(f)
                for row in reader:
                    merged_graph.add_node(
                        row['entity_id'], 
                        type=row['type'], 
                        public_infra=(row['public_infra'] == 'True')
                    )

        if os.path.isfile(self.edges_file):
            with open(self.edges_file, 'r', encoding='utf-8') as f:
                reader = csv.DictReader(f)
                for row in reader:
                    merged_graph.add_edge(
                        row['source'], 
                        row['target'], 
                        relation=row['relation'], 
                        weight=float(row['weight']), 
                        timestamp=row['timestamp']
                    )
                    
        return merged_graph

    def find_criminal_network(self, target_entity: str, depth: int = 2):
        """
        Finds connected network but PRUNES public infrastructure (like Exchanges) 
        to prevent false positives where innocent users are linked via a shared service.
        """
        if target_entity not in self.graph:
            return []
            
        def filter_node(node):
            return not self.graph.nodes[node].get('public_infra', False)

        filtered_subgraph = nx.subgraph_view(self.graph, filter_node=filter_node)
        
        if target_entity not in filtered_subgraph:
            return [target_entity]
            
        network = nx.ego_graph(filtered_subgraph, target_entity, radius=depth)
        return list(network.nodes(data=True))

    def detect_suspicious_patterns(self):
        """
        Scans the graph for behavioral patterns indicative of illicit activity.
        """
        alerts = []
        for node, data in self.graph.nodes(data=True):
            if data.get('public_infra', False):
                continue
                
            in_degree = self.graph.in_degree(node)
            node_type = data.get('type', 'Unknown')
            
            # Dynamic Rule 1: High convergence on a private wallet
            if node_type == 'Wallet' and in_degree >= 3:
                alert = self.alert_manager.generate_alert(
                    entity_id=node,
                    rule_name="HIGH_CONVERGENCE",
                    message=f"High traffic private wallet detected: {node} ({in_degree} incoming connections)",
                    cooldown_hours=24
                )
                if alert:
                    alerts.append(alert)
                    
            # Dynamic Rule 2: Suspect controlling multiple wallets
            if node_type == 'Person':
                out_degree = self.graph.out_degree(node)
                if out_degree >= 5:
                    alert = self.alert_manager.generate_alert(
                        entity_id=node,
                        rule_name="WALLET_HOARDER",
                        message=f"Suspect {node} controls unusually high number of wallets ({out_degree})",
                        cooldown_hours=24
                    )
                    if alert:
                        alerts.append(alert)
                        
        return alerts

    # ── Advanced Semantica Intelligence Methods ──

    def detect_syndicates(self, algorithm: str = "louvain") -> List[Dict[str, Any]]:
        """Detects criminal communities / cartels using Semantica community algorithms."""
        return self.community_detector.detect_communities(self.graph, algorithm=algorithm)

    def identify_kingpins(self, top_k: int = 5) -> List[Dict[str, Any]]:
        """Calculates PageRank & Betweenness to rank key criminal coordinators and brokers."""
        return self.centrality_calculator.get_top_kingpins(self.graph, top_k=top_k)

    def trace_laundering_path(self, source_entity: str, target_entity: str) -> Optional[Dict[str, Any]]:
        """Traces the shortest connection path between two suspects/wallets."""
        return self.path_finder.find_shortest_path(self.graph, source_entity, target_entity)

    def predict_covert_links(self, top_k: int = 10) -> List[Dict[str, Any]]:
        """Predicts hidden unobserved links between suspects using topological heuristics."""
        return self.link_predictor.predict_links(self.graph, top_k=top_k)

    def resolve_suspect_profiles(self, entity_a: Dict[str, Any], entity_b: Dict[str, Any]) -> Dict[str, Any]:
        """Calculates multi-factor similarity between two candidate suspect personas."""
        return self.similarity_calculator.calculate_entity_similarity(entity_a, entity_b)

    def merge_suspect_profiles(self, primary: Dict[str, Any], secondary: Dict[str, Any], investigator: str, reason: str) -> Dict[str, Any]:
        """Merges two suspect personas into a unified profile while logging audit trail."""
        return self.entity_merger.merge_entities(primary, secondary, merged_by=investigator, justification=reason)

    def audit_investigative_action(self, category: str, targets: List[str], officer_id: str, clearance: int, justification: str):
        """Cryptographically records an officer action to the audit chain."""
        return self.decision_recorder.record_decision(
            action_category=category,
            target_entity_ids=targets,
            investigator_id=officer_id,
            clearance_level=clearance,
            justification=justification
        )
