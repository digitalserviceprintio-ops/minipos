# Security Specification: Firebase Security Rules & Data Invariants

## Data Invariants
1. **Master Gate Isolation**: All store subcollections (`storeProfile`, `accounts`, `transactions`, `products`, `posSales`, `mutations`, `members`) reside under `/users/{userId}`. Subcollection records can only be accessed or modified by the authenticated user whose `request.auth.uid == userId` or an explicitly verified Admin.
2. **User Identity Invariant**: A user document at `/users/{userId}` must strictly match `request.auth.uid == userId`. Users cannot impersonate other users or modify other user data.
3. **Immutable Ownership**: Any `ownerId` or `userId` attribute within subcollections must match the path's `userId` and cannot be mutated after creation.
4. **ID Hardening**: Document IDs and path variables must adhere to `isValidId()` (`id is string && id.size() <= 128 && id.matches('^[a-zA-Z0-9_\\-]+$')`).
5. **Role Escalation Protection**: Kasir users cannot elevate their own role to Admin. Admin status is validated against trusted database records or verified email credentials (`digitalserviceprint.io@gmail.com`).
6. **Strict Field Schema**: Updates and creations must not include ghost/shadow fields and must pass boundary validation.

---

## The "Dirty Dozen" Adversarial Payloads

1. **Payload 1: Unauthenticated Read (Identity Failure)**
   - Target: `/users/victim_123/transactions/trx_999`
   - Actor: Unauthenticated (`request.auth == null`)
   - Intent: Read financial records without login. Expected: `PERMISSION_DENIED`.

2. **Payload 2: Cross-User Read (Tenant Breach)**
   - Target: `/users/victim_123/transactions/trx_999`
   - Actor: Authenticated user `attacker_456`
   - Intent: Read victim's transaction ledger. Expected: `PERMISSION_DENIED`.

3. **Payload 3: Cross-User Write / Tampering (Tenant Breach)**
   - Target: `/users/victim_123/accounts/acc_1`
   - Actor: Authenticated user `attacker_456`
   - Intent: Update victim's account balance. Expected: `PERMISSION_DENIED`.

4. **Payload 4: ID Injection / Oversized ID Attack (DoS / Buffer Overflow)**
   - Target: `/users/user_123/transactions/very_long_invalid_id_with_symbols!@#$%^&*()_+`
   - Payload: Overlong or special character document ID.
   - Intent: Inject invalid key into Firestore. Expected: `PERMISSION_DENIED`.

5. **Payload 5: Self-Assigned Privilege Escalation (RBAC Bypass)**
   - Target: `/users/user_123`
   - Payload: `{ "userId": "user_123", "role": "Admin", "name": "Hacker", "username": "hacker", "createdAt": "..." }`
   - Actor: Non-admin user trying to set own role to Admin. Expected: `PERMISSION_DENIED`.

6. **Payload 6: Shadow Field Injection (Ghost Field Attack)**
   - Target: `/users/user_123/products/prod_1`
   - Payload: `{ "id": "prod_1", "name": "Item", "code": "SKU1", "category": "Barang", "price": 1000, "stock": 10, "ownerId": "user_123", "isSuperAdmin": true }`
   - Intent: Sneak unauthorized fields into document. Expected: `PERMISSION_DENIED`.

7. **Payload 7: Negative Financial Balance / Type Violation (Integrity Breach)**
   - Target: `/users/user_123/accounts/acc_1`
   - Payload: `{ "id": "acc_1", "balance": "NOT_A_NUMBER", "name": "Kas", "type": "Kas", "ownerId": "user_123" }`
   - Intent: Corrupt financial balance with non-numeric value. Expected: `PERMISSION_DENIED`.

8. **Payload 8: Owner ID Tampering on Update (Orphan Attack)**
   - Target: `/users/user_123/transactions/trx_1`
   - Payload: Updating `ownerId` from `"user_123"` to `"attacker_456"`.
   - Intent: Steal transaction ownership. Expected: `PERMISSION_DENIED`.

9. **Payload 9: Extreme String Payload / Resource Exhaustion (Denial of Wallet)**
   - Target: `/users/user_123/mutations/mut_1`
   - Payload: `notes` field containing 50,000 characters.
   - Intent: Storage bloat and cost attack. Expected: `PERMISSION_DENIED`.

10. **Payload 10: Email Spoofing without Verification (Impersonation Attack)**
    - Target: Admin protected operations
    - Actor: `request.auth.token.email == 'digitalserviceprint.io@gmail.com'` but `token.email_verified == false`.
    - Intent: Bypass admin gates with unverified email. Expected: `PERMISSION_DENIED`.

11. **Payload 11: Illegitimate Status Shortcutting (State Machine Breach)**
    - Target: `/users/user_123/transactions/trx_1`
    - Payload: Arbitrary status string `"HackedStatus"`.
    - Intent: Corrupt business state machine. Expected: `PERMISSION_DENIED`.

12. **Payload 12: Blanket List Scrape (Query Enforcer Bypass)**
    - Target: Collection group or unscoped list without user scoping.
    - Intent: Query all records across all users. Expected: `PERMISSION_DENIED`.
