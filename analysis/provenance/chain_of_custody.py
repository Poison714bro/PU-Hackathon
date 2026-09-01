"""
Evidentiary Chain of Custody & Integrity Tracker
Ported & adapted from Semantica for law enforcement cybercrime intelligence.
Tracks digital evidence artifacts (chat logs, crypto transactions, disk images, wiretaps)
with SHA-256 integrity hashes, custodial transfers, and PROV-O provenance structures.
"""

from dataclasses import dataclass, field
from datetime import datetime
import hashlib
from typing import Any, Dict, List, Optional
import uuid


@dataclass
class EvidenceItem:
    evidence_id: str
    case_id: str
    title: str
    evidence_type: str  # 'BLOCKCHAIN_RAW_TX', 'FORUM_DUMP', 'TELEGRAM_EXPORT', 'SEIZED_DEVICE', 'CDR_LOG'
    sha256_hash: str
    collected_by: str
    collected_at: str
    storage_location: str
    chain_of_transfers: List[Dict[str, Any]] = field(default_factory=list)


class ChainOfCustodyTracker:
    """
    Manages cryptographic proof of custody and evidence integrity for court admissibility.
    """

    def __init__(self):
        self.evidence_vault: Dict[str, EvidenceItem] = {}

    def register_evidence(
        self,
        case_id: str,
        title: str,
        evidence_type: str,
        raw_content_bytes: bytes,
        collected_by: str,
        storage_location: str = "SECURE_EVIDENCE_LAKE"
    ) -> EvidenceItem:
        """
        Registers new digital evidence, computes SHA-256 checksum, and initiates custody record.
        """
        evidence_id = f"ev_{uuid.uuid4().hex[:8]}"
        sha256 = hashlib.sha256(raw_content_bytes).hexdigest()
        now = datetime.now().isoformat()

        initial_custody = {
            "transfer_id": f"xfer_01",
            "from_custodian": "COLLECTION_POINT",
            "to_custodian": collected_by,
            "timestamp": now,
            "reason": "Initial Collection & Forensic Preservation",
            "verified_hash": sha256
        }

        item = EvidenceItem(
            evidence_id=evidence_id,
            case_id=case_id,
            title=title,
            evidence_type=evidence_type,
            sha256_hash=sha256,
            collected_by=collected_by,
            collected_at=now,
            storage_location=storage_location,
            chain_of_transfers=[initial_custody]
        )

        self.evidence_vault[evidence_id] = item
        return item

    def transfer_custody(
        self,
        evidence_id: str,
        from_custodian: str,
        to_custodian: str,
        reason: str
    ) -> Dict[str, Any]:
        """
        Logs a custody handover from one officer/lab to another.
        """
        if evidence_id not in self.evidence_vault:
            raise KeyError(f"Evidence {evidence_id} not found in custody vault.")

        item = self.evidence_vault[evidence_id]
        now = datetime.now().isoformat()
        xfer_num = len(item.chain_of_transfers) + 1

        record = {
            "transfer_id": f"xfer_{xfer_num:02d}",
            "from_custodian": from_custodian,
            "to_custodian": to_custodian,
            "timestamp": now,
            "reason": reason,
            "verified_hash": item.sha256_hash
        }
        item.chain_of_transfers.append(record)
        return record

    def verify_evidence_content(self, evidence_id: str, content_bytes: bytes) -> Dict[str, Any]:
        """
        Verifies that current evidence content matches the cryptographic seal at intake.
        """
        if evidence_id not in self.evidence_vault:
            return {"verified": False, "error": "Evidence ID not registered."}

        item = self.evidence_vault[evidence_id]
        current_hash = hashlib.sha256(content_bytes).hexdigest()
        is_intact = current_hash == item.sha256_hash

        return {
            "evidence_id": evidence_id,
            "title": item.title,
            "is_intact": is_intact,
            "original_sha256": item.sha256_hash,
            "checked_sha256": current_hash,
            "status": "VALID_SEAL_OF_CUSTODY" if is_intact else "TAMPER_DETECTED"
        }
