"""
Semantica Data Ingestion Pipeline
═══════════════════════════════════════════════════════════════════════════════
Utilizes semantica.ingest.FileIngestor to ingest raw darknet forum dumps,
market listings, and seized evidence logs, extracting entities and injecting
them directly into the Semantica ContextGraph pipeline.
═══════════════════════════════════════════════════════════════════════════════
"""

import sys
import os
import json
import re
from pathlib import Path
from typing import Dict, List, Any, Optional

# Ensure semantica and analysis are in path
PU_HACKATHON_ROOT = str(Path(__file__).parent.parent)
SEMANTICA_PATH = str(Path(__file__).parent.parent.parent / "semantica")

for p in [PU_HACKATHON_ROOT, SEMANTICA_PATH]:
    if p not in sys.path:
        sys.path.insert(0, p)

try:
    from semantica.ingest.file_ingestor import FileIngestor
except ImportError:
    FileIngestor = None

from analysis.extraction.ner import CybercrimeNER
from analysis.semantica_graph_service import SemanticaGraphService


class SemanticaIngestionPipeline:
    """
    Automated ingestion pipeline powered by Semantica's FileIngestor and ContextGraph.
    """

    def __init__(self, graph_service: Optional[SemanticaGraphService] = None):
        self.ingestor = FileIngestor() if FileIngestor else None
        self.ner = CybercrimeNER()
        self.graph_service = graph_service or SemanticaGraphService()

    def ingest_raw_feed_text(self, text: str, source_name: str = "Live Feed", timestamp: Optional[str] = None) -> Dict[str, Any]:
        """
        Extracts entities and relational triplets from raw text feed and inserts into graph.
        """
        extracted = self.ner.extract_entities(text)
        new_nodes = []
        new_edges = []

        # 1. Primary Persona (detect username/alias pattern if present)
        user_matches = re.findall(r"\b(?:vendor|user|alias|handle|seller)\s*[:=]?\s*([a-zA-Z0-9_\-]{3,30})\b", text, re.IGNORECASE)
        primary_vendor = None
        if user_matches:
            vendor_name = user_matches[0]
            primary_vendor = f"user-{vendor_name.lower()}"
            v_node = {
                "id": primary_vendor,
                "label": vendor_name,
                "nodeType": "username",
                "suspectRole": "dealer",
                "riskScore": 85,
                "metadata": {"Source": source_name, "Ingested": "Semantica FileIngestor"},
                "details": f"Ingested from {source_name} feed."
            }
            self.graph_service.add_node(v_node)
            new_nodes.append(v_node)

        # 2. Crypto Wallets
        for btc in extracted.get("BTC_WALLET", []):
            val = btc["value"]
            w_id = f"wallet-{val[:8]}"
            w_node = {
                "id": w_id,
                "label": f"{val[:6]}...{val[-4:]}",
                "nodeType": "wallet",
                "suspectRole": "unknown",
                "riskScore": 90,
                "metadata": {"Blockchain": "Bitcoin", "Address": val},
                "details": f"Discovered in {source_name}."
            }
            self.graph_service.add_node(w_node)
            new_nodes.append(w_node)

            if primary_vendor:
                edge = {
                    "id": f"e-{primary_vendor}-{w_id}",
                    "source": primary_vendor,
                    "target": w_id,
                    "label": "OWNS_WALLET",
                    "relationship": "financial",
                    "method": "crypto",
                    "confidence": 0.95
                }
                self.graph_service.add_edge(edge)
                new_edges.append(edge)

        for xmr in extracted.get("XMR_WALLET", []):
            val = xmr["value"]
            w_id = f"wallet-xmr-{val[:8]}"
            w_node = {
                "id": w_id,
                "label": f"{val[:6]}...{val[-4:]}",
                "nodeType": "wallet",
                "suspectRole": "unknown",
                "riskScore": 93,
                "metadata": {"Blockchain": "Monero", "Address": val},
                "details": f"Discovered in {source_name}."
            }
            self.graph_service.add_node(w_node)
            new_nodes.append(w_node)

            if primary_vendor:
                edge = {
                    "id": f"e-{primary_vendor}-{w_id}",
                    "source": primary_vendor,
                    "target": w_id,
                    "label": "OWNS_WALLET",
                    "relationship": "financial",
                    "method": "crypto",
                    "confidence": 0.95
                }
                self.graph_service.add_edge(edge)
                new_edges.append(edge)

        # 3. PGP Keys
        for pgp in extracted.get("PGP_FINGERPRINT", []):
            val = pgp["value"]
            p_id = f"pgp-{val[:8]}"
            p_node = {
                "id": p_id,
                "label": f"PGP: {val[:8]}",
                "nodeType": "pgp",
                "suspectRole": "unknown",
                "riskScore": 80,
                "metadata": {"Fingerprint": val},
                "details": f"Key verified from {source_name}."
            }
            self.graph_service.add_node(p_node)
            new_nodes.append(p_node)

            if primary_vendor:
                edge = {
                    "id": f"e-{primary_vendor}-{p_id}",
                    "source": primary_vendor,
                    "target": p_id,
                    "label": "SIGNS_WITH",
                    "relationship": "infrastructure",
                    "method": "cryptography",
                    "confidence": 0.98
                }
                self.graph_service.add_edge(edge)
                new_edges.append(edge)

        # 4. Telegram & Comms
        for comm in extracted.get("TELEGRAM_HANDLE", []):
            val = comm["value"]
            c_id = f"tg-{val.replace('@', '')}"
            c_node = {
                "id": c_id,
                "label": val,
                "nodeType": "email",
                "suspectRole": "unknown",
                "riskScore": 75,
                "metadata": {"Platform": "Telegram", "Handle": val},
                "details": f"Telegram communication channel identified."
            }
            self.graph_service.add_node(c_node)
            new_nodes.append(c_node)

            if primary_vendor:
                edge = {
                    "id": f"e-{primary_vendor}-{c_id}",
                    "source": primary_vendor,
                    "target": c_id,
                    "label": "COMMUNICATES_WITH",
                    "relationship": "communication",
                    "method": "telegram",
                    "confidence": 0.96
                }
                self.graph_service.add_edge(edge)
                new_edges.append(edge)

        return {
            "source": source_name,
            "extractedCount": len(new_nodes),
            "newNodes": new_nodes,
            "newEdges": new_edges
        }

    def ingest_directory_files(self, dir_path: str) -> List[Dict[str, Any]]:
        """
        Scans a directory of intelligence logs or dumps and streams them into the graph.
        """
        results = []
        path_obj = Path(dir_path)
        if not path_obj.exists():
            return results

        if self.ingestor:
            try:
                files = self.ingestor.ingest_directory(str(path_obj), recursive=True)
                for f in files:
                    text_content = f.text if hasattr(f, "text") and f.text else ""
                    if not text_content and hasattr(f, "path") and f.path:
                        try:
                            with open(f.path, "r", encoding="utf-8", errors="ignore") as fp:
                                text_content = fp.read()
                        except Exception:
                            pass
                    
                    if text_content:
                        res = self.ingest_raw_feed_text(text_content, source_name=f.name if hasattr(f, "name") else "File")
                        results.append(res)
            except Exception as err:
                print(f"Directory ingestion note: {err}")
        else:
            for file_path in path_obj.glob("**/*"):
                if file_path.is_file() and file_path.suffix in [".txt", ".json", ".csv", ".log", ".md"]:
                    try:
                        with open(file_path, "r", encoding="utf-8", errors="ignore") as fp:
                            content = fp.read()
                            if content:
                                res = self.ingest_raw_feed_text(content, source_name=file_path.name)
                                results.append(res)
                    except Exception:
                        pass

        return results


if __name__ == "__main__":
    pipeline = SemanticaIngestionPipeline()
    test_sample = "AlphaBay vendor ToxicViper posted bulk 1000x pressed pills. Contact on Telegram @ToxicViper_Direct. Payment to bc1qa93784hkjsdf98234jksdf89234. PGP: A8B3C4D5E6F70123456789ABCDEF0123456789AB"
    out = pipeline.ingest_raw_feed_text(test_sample, source_name="Sample AlphaBay Scrape")
    print(json.dumps(out, indent=2))
