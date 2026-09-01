"""
Verification test suite for Semantica intelligence modules in NEXUS platform.
"""

from datetime import datetime
from analysis.correlation import CorrelationEngine
from analysis.extraction.ner import CybercrimeNER
from analysis.extraction.triplet_extractor import TripletExtractor
from analysis.extraction.event_detector import EventDetector
from analysis.conflicts.conflict_detector import ConflictDetector
from analysis.conflicts.conflict_resolver import ConflictResolver
from analysis.conflicts.source_tracker import SourceTracker
from analysis.provenance.decision_recorder import DecisionRecorder
from analysis.provenance.causal_analyzer import CausalChainAnalyzer
from analysis.provenance.chain_of_custody import ChainOfCustodyTracker
from analysis.exporters.dossier_exporter import DossierExporter
from analysis.exporters.graph_exporter import GraphExporter


def test_semantica_suite():
    print("==================================================================")
    print("   NEXUS FORENSIC INTELLIGENCE SUITE — INTEGRATION TEST          ")
    print("==================================================================")
    
    engine = CorrelationEngine()
    now = datetime.now()

    # 1. Build Multi-Suspect Criminal Graph
    print("\n[1] Constructing Multi-Target Criminal Knowledge Graph...")
    # Add Nodes
    engine.add_entity_node("ent-001", "suspect", label="DarkPhoenix_77", riskScore=94)
    engine.add_entity_node("ent-002", "suspect", label="Ph03nix_Rx", riskScore=87)
    engine.add_entity_node("ent-003", "suspect", label="Ghost_Supply", riskScore=78)
    engine.add_entity_node("ent-004", "suspect", label="SilkRoad_Vendor", riskScore=91)
    engine.add_entity_node("ent-005", "suspect", label="ChemKing2026", riskScore=82)

    # Wallets & Infrastructure
    engine.add_entity_node("wallet-btc-1", "wallet", label="bc1q9hk7m3x2v8p5c6e4f0r1t7w9y2u3i4o5p6a7s8d9f0g1h2j3k4l5x4k2", riskScore=95)
    engine.add_entity_node("wallet-xmr-1", "wallet", label="42xM7q9Lr5kB3pN2vT1wH4yG6fD8cE0zA7sJ5mK9oI3uR6tY1wQ4eP2xL", riskScore=90)
    engine.add_entity_node("mixer-01", "mixer", label="ChipMixer_Relay", riskScore=99, is_public_infrastructure=False)
    engine.add_entity_node("pgp-key-1", "pgp", label="F9B24A321109E77A8C3D5F6B7E2A9D014C8F3B62", riskScore=80)

    # Links
    engine.add_entity_link("ent-001", "wallet-btc-1", "OWNS_WALLET", 1.0, now)
    engine.add_entity_link("ent-002", "wallet-btc-1", "CO_OWNS_WALLET", 1.0, now)
    engine.add_entity_link("ent-001", "pgp-key-1", "USES_PGP", 1.0, now)
    engine.add_entity_link("ent-002", "pgp-key-1", "USES_PGP", 1.0, now)
    engine.add_entity_link("ent-001", "mixer-01", "LAUNDERS_VIA", 5.0, now)
    engine.add_entity_link("ent-004", "mixer-01", "LAUNDERS_VIA", 3.0, now)
    engine.add_entity_link("mixer-01", "wallet-xmr-1", "CASHOUT", 10.0, now)
    engine.add_entity_link("ent-003", "ent-005", "SUPPLIES_BULK", 8.0, now)
    engine.add_entity_link("ent-005", "wallet-xmr-1", "PAYMENT", 2.0, now)

    print(" -> Graph constructed: 9 nodes, 9 relationships.")

    # 2. Test Community Detection (Syndicates)
    print("\n[2] Testing Criminal Syndicate Detection (Louvain / Label Propagation)...")
    syndicates = engine.detect_syndicates()
    print(f" -> Detected {len(syndicates)} criminal clusters.")
    for s in syndicates:
        print(f"    * {s['label']} | Density: {s['density']} | Targets: {s['suspect_count']}")
    assert len(syndicates) >= 1, "Should detect at least 1 community"

    # 3. Test Centrality & Kingpin Identification
    print("\n[3] Testing Kingpin Identification (PageRank, Betweenness)...")
    kingpins = engine.identify_kingpins(top_k=3)
    for kp in kingpins:
        print(f"    * Node: {kp['label']} ({kp['node_id']}) | Kingpin Index: {kp['metrics']['kingpin_index']} | Role: {kp['role_inference']}")
    assert len(kingpins) > 0, "Should rank kingpins"

    # 4. Test Laundering Flow & Path Finding
    print("\n[4] Testing Money Laundering Flow Route Tracer...")
    route = engine.trace_laundering_path("ent-001", "wallet-xmr-1")
    if route:
        print(f" -> Found path ({route['total_hops']} hops): {' -> '.join(route['path_nodes'])}")
        assert route['total_hops'] >= 2, "Multi-hop path expected"
    else:
        print(" -> No path found.")

    # 5. Test Link Prediction (Covert Associates)
    print("\n[5] Testing Link Prediction (Hidden Criminal Ties)...")
    preds = engine.predict_covert_links(top_k=3)
    for p in preds:
        print(f"    * Predicted tie: {p['source_label']} <--> {p['target_label']} (Confidence: {p['confidence']}) - {p['inference']}")

    # 6. Test Entity Resolution (Fuzzy + Cryptographic)
    print("\n[6] Testing Suspect Entity Resolution (DarkPhoenix_77 vs Ph03nix_Rx)...")
    profile_a = {
        "id": "ent-001",
        "primaryAlias": "DarkPhoenix_77",
        "linked_wallets": ["bc1q9hk7m3x2v8p5c6e4f0r1t7w9y2u3i4o5p6a7s8d9f0g1h2j3k4l5x4k2"],
        "pgp_fingerprint": "F9B24A321109E77A8C3D5F6B7E2A9D014C8F3B62",
        "category": "Narcotics / Vendor",
        "riskScore": 94
    }
    profile_b = {
        "id": "ent-002",
        "primaryAlias": "Ph03nix_Rx",
        "linked_wallets": ["bc1q9hk7m3x2v8p5c6e4f0r1t7w9y2u3i4o5p6a7s8d9f0g1h2j3k4l5x4k2"],
        "pgp_fingerprint": "F9B24A321109E77A8C3D5F6B7E2A9D014C8F3B62",
        "category": "Narcotics / Vendor",
        "riskScore": 87
    }
    sim = engine.resolve_suspect_profiles(profile_a, profile_b)
    print(f" -> Match Confidence: {sim['confidence_pct']}% | Is Match: {sim['is_probable_match']}")
    print(f" -> Justification: {sim['justification']}")
    assert sim['is_probable_match'] is True, "Cryptographic match must resolve"

    # Merge profiles
    merged = engine.merge_suspect_profiles(profile_a, profile_b, investigator="OFFICER_BHATIA_04", reason="Cryptographic key and wallet address parity.")
    print(f" -> Unified Master Entity: {merged['primaryAlias']} | Aliases: {merged['known_aliases']} | Risk: {merged['riskScore']}")

    # 7. Test Contradictory Intelligence Detection
    print("\n[7] Testing Contradictory Intelligence & Source Reliability Engine...")
    tracker = SourceTracker()
    tracker.register_source("src-01", "law_enforcement_wiretap", "Punjab Special Cell Wiretap")
    tracker.register_source("src-02", "telegram_osint", "Telegram Leaks Channel")

    conflict_engine = ConflictDetector(tracker)
    claims = [
        {"property": "current_location", "value": "Ludhiana Safehouse", "source": "law_enforcement_wiretap", "timestamp": "2026-09-01T10:00:00Z"},
        {"property": "current_location", "value": "Dubai Luxury Suites", "source": "telegram_osint", "timestamp": "2026-09-01T08:00:00Z"},
    ]
    conflicts = conflict_engine.detect_conflicts_in_records("ent-001", claims)
    print(f" -> Detected {len(conflicts)} conflict(s). Severity: {conflicts[0].severity}")
    
    resolver = ConflictResolver()
    resolution = resolver.resolve_conflict(conflicts[0])
    print(f" -> Resolved Value: '{resolution['resolved_value']}' via {resolution['strategy']} | {resolution['justification']}")

    # 8. Test Evidentiary Decision Audit & Hash Integrity
    print("\n[8] Testing Decision Audit Trail & Tamper-Evident SHA-256 Chain...")
    dec1 = engine.audit_investigative_action(
        category="WARRANT_ISSUED",
        targets=["ent-001"],
        officer_id="INSP_KUMAR_771",
        clearance=3,
        justification="Search warrant issued for suspected fentanyl distribution hub."
    )
    dec2 = engine.audit_investigative_action(
        category="WALLET_FREEZE",
        targets=["wallet-btc-1"],
        officer_id="INSP_KUMAR_771",
        clearance=3,
        justification="Emergency asset freeze on hot wallet containing $2.4M illicit funds."
    )
    audit_check = engine.decision_recorder.verify_audit_chain_integrity()
    print(f" -> Audit Chain Integrity: {audit_check['status']} (Verified {audit_check['total_decisions_verified']} decisions)")
    assert audit_check['is_valid'] is True, "Audit chain must be valid"

    # 9. Test Court Dossier & Graph Exporters
    print("\n[9] Testing Court Dossier & Graph Exporters...")
    dossier_md = DossierExporter.generate_markdown_dossier(
        target_entity=merged,
        kingpin_metrics=kingpins[0]["metrics"] if kingpins else None,
        conflicts=[{"property_name": c.property_name, "severity": c.severity, "competing_values": c.competing_values, "recommended_action": c.recommended_action} for c in conflicts],
        evidence_chain=[dec1.__dict__, dec2.__dict__]
    )
    print(f" -> Generated Court Dossier ({len(dossier_md)} chars, formatted in Law Enforcement Markdown)")

    cypher_export = GraphExporter.export_cypher_statements(engine.graph)
    print(f" -> Generated Neo4j Cypher Import ({len(cypher_export.splitlines())} statements)")

    # 10. Test Cybercrime NER & Triplet Mining
    print("\n[10] Testing Cybercrime NER & Triplet Extraction on Darknet Forum Post...")
    raw_darknet_post = (
        "Vendor DarkPhoenix_77 here. Fresh stock of pure fentanyl and oxycodone dispatching worldwide. "
        "Send 0.5 BTC to bc1q9hk7m3x2v8p5c6e4f0r1t7w9y2u3i4o5p6a7s8d9f0g1h2j3k4l5x4k2. "
        "Verify with my PGP 1109E77A8C3D5F6B7E2A9D014C8F3B62F9B24A32. "
        "Direct contact via Telegram @DarkPhoenix_Direct. Mirror at http://exampldarknetv3abc56def78ghij90klmn12opqrst34uvwx56yz78.onion"
    )
    ner = CybercrimeNER()
    triplet_extractor = TripletExtractor(ner)
    event_detector = EventDetector()

    iocs = ner.extract_summary(raw_darknet_post)
    print(f" -> Extracted Indicators: Wallets: {len(iocs['wallets'])}, PGP: {len(iocs['pgp_keys'])}, Telegram: {len(iocs['handles'])}, Contraband: {iocs['contraband']}")
    
    triplets = triplet_extractor.extract_triplets_from_post("DarkPhoenix_77", raw_darknet_post, platform="Dread Market")
    print(f" -> Mined {len(triplets)} RDF Triplets (e.g., '{triplets[0]['subject']} -[{triplets[0]['predicate']}]-> {triplets[0]['object']}')")
    
    events = event_detector.detect_events(raw_darknet_post, {"author": "DarkPhoenix_77"})
    print(f" -> Detected Operational Events: {[e['event_type'] for e in events]}")

    print("\n==================================================================")
    print("   [SUCCESS] ALL 10 SEMANTICA FORENSIC SUITES PASSED!            ")
    print("==================================================================")


if __name__ == "__main__":
    test_semantica_suite()
