# Security Specification: SmartResponse Firestore Rules

## 1. Data Invariants

1. **User Profile Ownership**: A user document at `/profiles/{userId}` can only be written by the authenticated user whose `request.auth.uid == userId`. Role cannot be spoofed to ADMIN unless already an admin.
2. **Patient Records**: Patients at `/patients/{patientId}` can only be read or written by the owning user (`resource.data.user_id == request.auth.uid`) or authorized medical/admin staff.
3. **Emergency Records**:
   - Create: An emergency document can be created by authenticated users where `reported_by == request.auth.uid`, or anonymous public users with strict payload validation.
   - Read: Public read of emergency records by ID or participant roles (Admin, Driver, Doctor, Hospital, Reporter).
   - Update: Updates must adhere to strict status progression and field modification boundaries.
4. **Ambulance Fleet Records**:
   - Read: Responders and admins can view ambulance statuses.
   - Update: Drivers can only update their assigned ambulance status and coordinates.
5. **Hospital Registry**:
   - Read: Open read for emergency response dispatch and triage recommendations.
   - Write: Restricted to Hospital admins or Platform Admins.
6. **Audit Timeline**:
   - Read: Open to participants of the emergency case.
   - Create: Append-only with verified timestamps.
7. **Notifications**:
   - Read/Update: Scoped to the recipient user ID or role.

## 2. The Dirty Dozen Payloads (Negative Test Cases)

1. **Payload 1 (Identity Spoofing)**: Non-admin user tries to create a profile with `role: "ADMIN"` or modify someone else's profile.
2. **Payload 2 (Ghost Field Injection)**: Attempting to write unexpected fields (`isSuperAdmin: true`) to `/profiles/{userId}`.
3. **Payload 3 (Arbitrary Emergency Status Jump)**: Regular reporter attempting to update `status` to `"COMPLETED"` directly without being assigned driver/hospital.
4. **Payload 4 (Orphaned Write)**: Creating timeline event with empty or non-existent `emergency_id`.
5. **Payload 5 (Huge String Poisoning)**: Submitting a 1MB payload in `description` to exhaust quota.
6. **Payload 6 (Unauthorized Ambulance Hijack)**: Driver trying to reassign another driver's ambulance vehicle ID.
7. **Payload 7 (Unauthenticated Hospital Edit)**: Anonymous user trying to change hospital bed availability.
8. **Payload 8 (Foreign Notification Access)**: User A attempting to read User B's private notifications.
9. **Payload 9 (Client Timestamp Forgery)**: Submitting future or invalid timestamp instead of server time.
10. **Payload 10 (Invalid ID Path Poisoning)**: Using paths containing dangerous characters like `../` or excessive lengths (>128 chars).
11. **Payload 11 (Terminal State Override)**: Modifying a completed emergency record after closure.
12. **Payload 12 (Blanket Query Leak)**: Querying arbitrary user records without owner constraint.
