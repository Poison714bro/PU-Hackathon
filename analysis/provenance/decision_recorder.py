"""
Investigator Decision & Audit Recorder
Ported & adapted from Semantica for law enforcement cybercrime intelligence.
Logs critical investigative decisions (wallet freeze, entity merge, warrant issuance)
with justification, officer badge ID, clearance level, and compliance policy checks.
"""

from dataclasses import dataclass, field
from datetime import datetime
import hashlib
import json
from typing import Any, Dict, List, Optional
import uuid


@dataclass
class InvestigatorDecision:
    decision_id: str
    action_category: str  # 'WALLET_FREEZE', 'ENTITY_MERGE', 'WARRANT_ISSUED', 'SURVEILLANCE_ESCALATION', 'EVIDENCE_SEIZED'
    target_entity_ids: List[str]
    investigator_id: str
    clearance_level: int
    justification: str
    outcome: str
    timestamp: str
    policy_id: Optional[str] = None
    cryptographic_hash: str = ""
    preceding_decision_id: Optional[str] = None


class DecisionRecorder:
    """
    Maintains a tamper-evident audit log of all human investigator and AI agent actions
    on case files, targets, and evidence.
    """

    def __init__(self):
        self.decisions_log: List[InvestigatorDecision] = []
        self.previous_hash: str = "GENESIS_AUDIT_BLOCK_0000000000"

    def record_decision(
        self,
        action_category: str,
        target_entity_ids: List[str],
        investigator_id: str,
        clearance_level: int,
        justification: str,
        outcome: str = "EXECUTED",
        policy_id: Optional[str] = None,
        preceding_decision_id: Optional[str] = None
    ) -> InvestigatorDecision:
        """
        Records an investigative action and seals it with a cryptographic hash linked to the audit chain.
        """
        decision_id = f"dec_{uuid.uuid4().hex[:8]}"
        now = datetime.now().isoformat()

        # Generate tamper-evident block hash
        payload = f"{self.previous_hash}|{decision_id}|{action_category}|{','.join(target_entity_ids)}|{investigator_id}|{clearance_level}|{justification}|{now}"
        block_hash = hashlib.sha256(payload.encode("utf-8")).hexdigest()
        self.previous_hash = block_hash

        decision = InvestigatorDecision(
            decision_id=decision_id,
            action_category=action_category,
            target_entity_ids=target_entity_ids,
            investigator_id=investigator_id,
            clearance_level=clearance_level,
            justification=justification,
            outcome=outcome,
            timestamp=now,
            policy_id=policy_id,
            cryptographic_hash=block_hash,
            preceding_decision_id=preceding_decision_id
        )

        self.decisions_log.append(decision)
        return decision

    def verify_audit_chain_integrity(self) -> Dict[str, Any]:
        """
        Verifies that no decisions have been modified or deleted after creation.
        """
        current_hash = "GENESIS_AUDIT_BLOCK_0000000000"
        for idx, dec in enumerate(self.decisions_log):
            payload = f"{current_hash}|{dec.decision_id}|{dec.action_category}|{','.join(dec.target_entity_ids)}|{dec.investigator_id}|{dec.clearance_level}|{dec.justification}|{dec.timestamp}"
            expected_hash = hashlib.sha256(payload.encode("utf-8")).hexdigest()
            if dec.cryptographic_hash != expected_hash:
                return {
                    "is_valid": False,
                    "tampered_at_index": idx,
                    "decision_id": dec.decision_id,
                    "error": "Cryptographic checksum mismatch. Audit log was tampered with."
                }
            current_hash = dec.cryptographic_hash

        return {
            "is_valid": True,
            "total_decisions_verified": len(self.decisions_log),
            "latest_chain_hash": current_hash,
            "status": "SECURE_AUDIT_CHAIN"
        }

    def get_decisions_for_target(self, entity_id: str) -> List[Dict[str, Any]]:
        """Returns chronological decisions affecting a specific target."""
        return [
            dec.__dict__
            for dec in self.decisions_log
            if entity_id in dec.target_entity_ids
        ]

    def export_audit_trail_json(self) -> str:
        return json.dumps([d.__dict__ for d in self.decisions_log], indent=2)
