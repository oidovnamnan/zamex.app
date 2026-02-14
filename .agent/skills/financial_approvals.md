---
description: Workflow for managing financial change approvals on the Zamex platform.
---

# Financial Change Request Workflow

This system ensures that sensitive financial information (payment accounts) cannot be modified directly by Cargo or Transport admins without Super Admin approval.

## 1. Overview

- **Entities**: `CompanyPaymentAccount`
- **Roles**: 
  - `CARGO_ADMIN` / `TRANSPORT_ADMIN`: Can only *request* changes (Create, Update, Delete).
  - `SUPER_ADMIN`: Can make direct changes AND approve/reject requests.
- **Model**: `FinancialChangeRequest` stores the pending change data.

## 2. Authorization Logic

All modification routes (`POST`, `PATCH`, `DELETE` on `/api/companies/:id/payment-accounts`) follow this logic:

1.  **Auth Check**: User must be `SUPER_ADMIN` OR (`CARGO_ADMIN` | `TRANSPORT_ADMIN` of the specific company).
2.  **Super Admin Path**:
    - Executes the change directly on `CompanyPaymentAccount`.
    - Returns `201` (Created) or `200` (OK).
3.  **Company Admin Path**:
    - Creates a `FinancialChangeRequest` with status `PENDING`.
    - Returns `202` (Accepted) with the request ID.

## 3. Approval Process

1.  **View Requests**:
    - Endpoint: `GET /api/companies/admin/financial-requests?status=PENDING`
    - Frontend: `/admin/financial-approvals`
2.  **Review**:
    - Endpoint: `PATCH /api/companies/admin/financial-requests/:id/review`
    - Body: `{ status: 'APPROVED' | 'REJECTED', rejectionReason?: string }`
3.  **Execution (On Approval)**:
    - Backend applies the `requestedData` to the `CompanyPaymentAccount` table inside a transaction.
    - Updates request status to `APPROVED`.

## 4. Database Schema

```prisma
model FinancialChangeRequest {
  id              String   @id @default(uuid())
  companyId       String
  entityType      String   @default("PAYMENT_ACCOUNT")
  entityId        String?  // ID of account being updated/deleted
  changeType      FinancialChangeType // CREATE, UPDATE, DELETE
  requestedData   Json
  status          VerificationStatus @default(PENDING)
  // ... relations
}
```

## 5. Security Notes

- **Input Validation**: `zod` schemas are used to validate `requestedData` at the time of request creation AND application.
- **Audit Trail**: The `FinancialChangeRequest` table serves as an audit log of who requested what and who approved it.
