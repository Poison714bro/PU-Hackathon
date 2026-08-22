from backend.audit import log_tamper_evident, verify_audit_chain, _AUDIT_DB
import json

def test_tamper_evidence():
    print("--- 1. Generating Immutable Logs ---")
    log_tamper_evident("LOGIN", "Investigator_Smith", "Logged in via MFA.")
    log_tamper_evident("SEARCH", "Investigator_Smith", "Searched for DarkFox")
    log_tamper_evident("REPORT_GENERATED", "Investigator_Smith", "Exported report for DarkFox")
    
    print(f"Generated {len(_AUDIT_DB)} logs.")
    
    is_valid = verify_audit_chain()
    if is_valid:
        print("[SUCCESS]: Audit chain is valid. Cryptographic hashes match.")
    else:
        print("[FAIL]: Chain should be valid but failed.")

    print("\n--- 2. Simulating Malicious Admin Tampering ---")
    print("An admin tries to delete the 'SEARCH' query to cover their tracks by modifying the log details...")
    
    # The admin maliciously edits the 2nd log entry
    _AUDIT_DB[1]["details"] = "Searched for InnocentPerson"
    
    is_valid_after_tamper = verify_audit_chain()
    
    if not is_valid_after_tamper:
        print("[SUCCESS]: Tampering detected! The cryptographic chain was broken.")
    else:
        print("[FAIL]: Tampering was not detected. The chain is vulnerable.")

if __name__ == "__main__":
    test_tamper_evidence()
