"""
Semantica Backend Engine Test Suite
═══════════════════════════════════════════════════════════════════════════════
Comprehensive integration tests verifying:
1. Semantica ContextGraph & GraphBuilder management
2. Centrality and Kingpin Index computations
3. Ingestion pipeline (FileIngestor & NER extraction)
4. Entity Resolution (DuplicateDetector & candidate detection)
5. Frontend JSON serialization schema
═══════════════════════════════════════════════════════════════════════════════
"""

import sys
import os
import json
import unittest
from pathlib import Path

# Add paths
PU_HACKATHON_ROOT = str(Path(__file__).parent)
SEMANTICA_PATH = str(Path(__file__).parent.parent / "semantica")

for p in [PU_HACKATHON_ROOT, SEMANTICA_PATH]:
    if p not in sys.path:
        sys.path.insert(0, p)

from analysis.semantica_graph_service import SemanticaGraphService
from ingestion.semantica_pipeline import SemanticaIngestionPipeline
from analysis.semantica_entity_resolver import SemanticaEntityResolver


class TestSemanticaEngine(unittest.TestCase):

    def setUp(self):
        self.graph_service = SemanticaGraphService()
        self.ingestion_pipeline = SemanticaIngestionPipeline(self.graph_service)
        self.entity_resolver = SemanticaEntityResolver(self.graph_service)

    def test_01_graph_service_initialization(self):
        """Verify ContextGraph is populated with seed entities."""
        self.assertGreater(len(self.graph_service.nodes), 10)
        self.assertGreater(len(self.graph_service.edges), 10)
        self.assertIn("ent-001", self.graph_service.nodes)
        self.assertEqual(self.graph_service.nodes["ent-001"]["label"], "DarkPhoenix_77")

    def test_02_analytics_and_kingpin_index(self):
        """Verify centrality metrics and Kingpin Index calculations."""
        analytics = self.graph_service.compute_analytics()
        self.assertIn("pagerank", analytics)
        self.assertIn("betweenness", analytics)
        self.assertIn("kingpinScores", analytics)
        self.assertIn("communities", analytics)

        kingpin_score = analytics["kingpinScores"].get("ent-001", 0)
        self.assertGreater(kingpin_score, 80.0, "DarkPhoenix_77 should have a high kingpin index")

    def test_03_frontend_json_serialization(self):
        """Verify JSON export format matches EvidenceGraph simulation schema."""
        frontend_data = self.graph_service.to_frontend_json()
        self.assertTrue(frontend_data["success"])
        self.assertIn("nodes", frontend_data["data"])
        self.assertIn("edges", frontend_data["data"])
        self.assertIn("stats", frontend_data["data"])

        nodes = frontend_data["data"]["nodes"]
        edges = frontend_data["data"]["edges"]
        self.assertGreater(len(nodes), 0)
        self.assertGreater(len(edges), 0)

        # Check required fields for physics simulation
        sample_node = nodes[0]
        self.assertIn("id", sample_node)
        self.assertIn("label", sample_node)
        self.assertIn("type", sample_node)
        self.assertIn("nodeType", sample_node)
        self.assertIn("kingpinIndex", sample_node)

        sample_edge = edges[0]
        self.assertIn("id", sample_edge)
        self.assertIn("source", sample_edge)
        self.assertIn("target", sample_edge)
        self.assertIn("confidence", sample_edge)

    def test_04_laundering_flow_tracer(self):
        """Verify Dijkstra shortest path laundering tracer."""
        flow = self.graph_service.trace_laundering_flow("ent-001", "wallet-mixer-1")
        self.assertTrue(flow["found"])
        self.assertGreaterEqual(flow["hops"], 1)
        self.assertIn("ent-001", flow["pathNodes"])
        self.assertIn("wallet-mixer-1", flow["pathNodes"])

    def test_05_data_ingestion_pipeline(self):
        """Verify automated ingestion from raw intelligence feed."""
        raw_text = "Vendor GhostRecon advertised 500x fentanyl pills on AlphaBay. BTC: bc1qghost992348723489234. PGP: 1234567890ABCDEF1234567890ABCDEF12345678"
        result = self.ingestion_pipeline.ingest_raw_feed_text(raw_text, source_name="AlphaBay Post")
        self.assertGreater(result["extractedCount"], 0)
        self.assertIn("newNodes", result)
        self.assertIn("newEdges", result)

    def test_06_entity_resolution_and_duplicate_detection(self):
        """Verify candidate duplicate persona pairs and merging."""
        matches = self.entity_resolver.get_candidate_matches()
        self.assertGreaterEqual(len(matches), 1)
        first_match = matches[0]
        self.assertIn("primaryEntity", first_match)
        self.assertIn("secondaryEntity", first_match)
        self.assertIn("signals", first_match)
        self.assertGreater(first_match["confidence"], 0.8)

        # Test merge
        merge_res = self.entity_resolver.merge_candidate_personas("ent-001", "ent-001-alias-1", "Automated test merge")
        self.assertTrue(merge_res["success"])
        self.assertEqual(merge_res["status"], "MERGED")


if __name__ == "__main__":
    unittest.main(verbosity=2)
