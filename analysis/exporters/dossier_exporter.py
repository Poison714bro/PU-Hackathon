"""
Court Intelligence Dossier & Report Exporter
Ported & adapted from Semantica for law enforcement cybercrime intelligence.
Generates comprehensive evidentiary reports for prosecutors, judges, and senior commanders.
"""

from datetime import datetime
import json
from typing import Any, Dict, List, Optional


class DossierExporter:
    """
    Exports structured intelligence files into courtroom-admissible dossier formats.
    """

    @staticmethod
    def generate_markdown_dossier(
        target_entity: Dict[str, Any],
        evidence_chain: Optional[List[Dict[str, Any]]] = None,
        kingpin_metrics: Optional[Dict[str, Any]] = None,
        associated_targets: Optional[List[Dict[str, Any]]] = None,
        conflicts: Optional[List[Dict[str, Any]]] = None,
        case_id: str = "CASE-2026-CYBER-09"
    ) -> str:
        """
        Generates a comprehensive Markdown intelligence dossier.
        """
        alias = target_entity.get("primaryAlias") or target_entity.get("primary_alias") or target_entity.get("label", "Unknown Target")
        entity_id = target_entity.get("id", "N/A")
        category = target_entity.get("category", "Cybercrime Actor")
        risk_score = target_entity.get("riskScore") or target_entity.get("risk_score", 0)
        status = target_entity.get("status", "Active Target")
        
        wallets = target_entity.get("linked_wallets", [])
        pgp = target_entity.get("pgp_fingerprint") or target_entity.get("pgpFingerprint", "None Registered")
        known_aliases = target_entity.get("known_aliases", [])

        now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S UTC")

        lines = [
            f"# OFFICIAL LAW ENFORCEMENT INTELLIGENCE DOSSIER",
            f"**Classification:** LAW ENFORCEMENT SENSITIVE // RESTRICTED",
            f"**Case Reference:** `{case_id}`",
            f"**Generated:** {now_str}",
            f"**Target Identifier:** `{entity_id}` ({alias})",
            "",
            "---",
            "",
            "## 1. Executive Target Summary",
            f"- **Primary Known Alias:** `{alias}`",
            f"- **Category:** {category}",
            f"- **Forensic Risk Score:** **{risk_score}/100**",
            f"- **Investigative Status:** {status}",
            f"- **Associated Aliases:** {', '.join(f'`{a}`' for a in known_aliases) if known_aliases else 'None documented'}",
            "",
            "## 2. Cryptographic & Financial Identifiers",
            f"- **PGP Fingerprint:** `{pgp}`",
            "- **Associated Crypto Wallets:**"
        ]

        if wallets:
            for w in wallets:
                lines.append(f"  - `{w}`")
        else:
            lines.append("  - *No crypto wallets linked yet.*")

        lines.extend([
            "",
            "## 3. Network Position & Kingpin Analytics"
        ])

        if kingpin_metrics:
            lines.extend([
                f"- **Kingpin Centrality Index:** **{kingpin_metrics.get('kingpin_index', 'N/A')}/100**",
                f"- **Betweenness Centrality (Broker Score):** `{kingpin_metrics.get('betweenness', 'N/A')}`",
                f"- **PageRank (Network Authority):** `{kingpin_metrics.get('pagerank', 'N/A')}`",
                f"- **Inferred Network Role:** *{kingpin_metrics.get('role_inference', 'Operator')}*"
            ])
        else:
            lines.append("- *Graph centrality calculation pending.*")

        if associated_targets:
            lines.extend([
                "",
                "## 4. Known Co-Conspirators & Direct Associations",
                "| Entity ID | Alias | Category | Risk Score |",
                "| :--- | :--- | :--- | :--- |"
            ])
            for assoc in associated_targets:
                a_id = assoc.get("id", "N/A")
                a_alias = assoc.get("primaryAlias") or assoc.get("label", "N/A")
                a_cat = assoc.get("category", "Associate")
                a_risk = assoc.get("riskScore", "N/A")
                lines.append(f"| `{a_id}` | `{a_alias}` | {a_cat} | {a_risk} |")

        if conflicts:
            lines.extend([
                "",
                "## 5. Disputed Intelligence & Multi-Source Contradictions",
                "| Property | Severity | Disputed Claims | Recommended Action |",
                "| :--- | :--- | :--- | :--- |"
            ])
            for conf in conflicts:
                prop = conf.get("property_name", "N/A")
                sev = conf.get("severity", "MEDIUM")
                comp = len(conf.get("competing_values", []))
                rec = conf.get("recommended_action", "Review")
                lines.append(f"| `{prop}` | **{sev}** | {comp} competing sources | {rec} |")

        if evidence_chain:
            lines.extend([
                "",
                "## 6. Evidentiary Chain of Custody (Court Admissible)",
                "| Transfer / Log ID | Timestamp | Custodian / Action | Verified SHA-256 Hash |",
                "| :--- | :--- | :--- | :--- |"
            ])
            for ev in evidence_chain:
                tid = ev.get("transfer_id") or ev.get("decision_id", "LOG")
                ts = ev.get("timestamp", "N/A")
                cust = ev.get("to_custodian") or ev.get("investigator_id") or ev.get("action_category", "Action")
                h = (ev.get("verified_hash") or ev.get("cryptographic_hash", ""))[:16] + "..."
                lines.append(f"| `{tid}` | {ts} | {cust} | `{h}` |")

        lines.extend([
            "",
            "---",
            "*Document electronically signed by NEXUS Forensic Intelligence Suite. SHA-256 integrity verifiable on local audit chain.*"
        ])

        return "\n".join(lines)

    @staticmethod
    def generate_json_dossier(target_entity: Dict[str, Any], **kwargs) -> str:
        dossier_data = {
            "dossier_version": "2.0",
            "target": target_entity,
            "metadata": {
                "generated_at": datetime.now().isoformat(),
                "system": "NEXUS Cybercrime Platform (Semantica Core)"
            },
            **kwargs
        }
        return json.dumps(dossier_data, indent=2)
