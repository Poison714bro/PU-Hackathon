import networkx as nx
import hashlib
import csv
import os
from datetime import datetime, timedelta

class AlertManager:
    """
    Handles alert generation and deduplication to prevent spamming investigators.
    """
    def __init__(self):
        # Store alert hashes to prevent duplicate spam
        # In production, this would be a database table (e.g., Redis or Prisma model)
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
    Analyzes connections between entities to uncover criminal networks.
    """
    def __init__(self, in_memory_limit: int = 100000, dump_dir: str = "data_dumps"):
        self.graph = nx.DiGraph()
        self.alert_manager = AlertManager()
        self.in_memory_limit = in_memory_limit
        self.dump_dir = dump_dir
        self.nodes_file = os.path.join(dump_dir, "nodes_dump.csv")
        self.edges_file = os.path.join(dump_dir, "edges_dump.csv")
        
        if not os.path.exists(self.dump_dir):
            os.makedirs(self.dump_dir)

    def _check_memory_limit(self):
        if self.graph.number_of_nodes() + self.graph.number_of_edges() >= self.in_memory_limit:
            self.flush_to_disk()

    def add_entity_node(self, entity_id: str, node_type: str, is_public_infrastructure: bool = False):
        """
        node_type: 'Person', 'Wallet', 'IP_Address', 'Exchange', 'Mixer'
        is_public_infrastructure: True for Exchanges, Tor Exits, VPNs.
        """
        self.graph.add_node(entity_id, type=node_type, public_infra=is_public_infrastructure)
        self._check_memory_limit()

    def add_entity_link(self, source: str, target: str, relation: str, weight: float, timestamp: datetime):
        """
        Creates a directed edge between two entities.
        """
        self.graph.add_edge(source, target, relation=relation, weight=weight, timestamp=timestamp.isoformat() if isinstance(timestamp, datetime) else timestamp)
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
        In a real scenario with massive data, this could yield chunks instead.
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
        to prevent massive false positives where innocent users are linked via a shared service.
        """
        if target_entity not in self.graph:
            return []
            
        def filter_node(node):
            # Don't traverse through public exchanges or VPNs
            return not self.graph.nodes[node].get('public_infra', False)

        # Create a subgraph without public infrastructure hubs
        filtered_subgraph = nx.subgraph_view(self.graph, filter_node=filter_node)
        
        if target_entity not in filtered_subgraph:
            return [target_entity]
            
        # Get the "ego graph" - the network surrounding the target
        network = nx.ego_graph(filtered_subgraph, target_entity, radius=depth)
        return list(network.nodes(data=True))

    def detect_suspicious_patterns(self):
        """
        Scans the graph for behavioral patterns indicative of illicit activity.
        """
        alerts = []
        for node, data in self.graph.nodes(data=True):
            # Skip alerts for known public infrastructure (e.g., Binance hot wallets naturally have high convergence)
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
                    cooldown_hours=24 # Prevents spamming this alert for 24 hours
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
