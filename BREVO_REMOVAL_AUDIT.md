# Brevo Integration Audit & Removal Plan

**Date**: April 29, 2026  
**Status**: Complete audit of all Brevo references  
**Scope**: Full removal of Brevo integration from Corevision CRM

---

## Executive Summary

The Corevision CRM has a **comprehensive Brevo integration** across 4 main backend modules:
- Email routes for client communication
- Email webhook for tracking email events (delivered, opened, clicked, bounced)
- Electronic signature document sending
- Bilan patrimonial (assessment) signature and notifications

**Total files to modify**: 5 files  
**Total Brevo API calls**: ~8 distinct fetch calls to `api.brevo.com`  
**Environment variables to remove**: `BREVO_API_KEY`

---

## Detailed Brevo Integration Breakdown

### 1. Email Webhook Handler
**File**: `src/app/supabase/functions/server/email_webhook.tsx`

**Purpose**: Tracks email events from Brevo webhooks (delivered, opened, clicked, bounced)

**Brevo References**:
- Line 10: Webhook endpoint for Brevo events
  - Route: `/make-server-cac859af/webhook/brevo-email` (PUBLIC)
  - Route: `/make-server-cac859af/webhook/brevo-email/test` (PROTECTED for debug)
- Lines 15-33: Brevo event mapping and status tracking
- Updates task `emailHistory` when Brevo sends event notifications

**Scope of Removal**:
- ✗ Remove entire webhook handler function `setupEmailWebhookRoutes()`
- ✗ Remove Brevo event types and status mapping logic
- ✓ Keep: Task history update mechanism (can be repurposed for new email service)

**Replacement Strategy**: 
- Replace webhook with OAuth-based email service status tracking
- Gmail API natively provides email delivery status via labels and flags
- Will update task history when syncing from Gmail API

---

### 2. Email Routes (Main Sending)
**File**: `src/app/supabase/functions/server/email_routes.tsx`

**Purpose**: Send emails to clients via Brevo SMTP API

**Brevo References**:

#### Function: `sendDERSignatureEmail()` (Lines 8-170)
- **Purpose**: Send DER (Document d'Entrée en Relation) signature emails to client and spouse
- **Brevo API calls**: 2 (client + spouse)
- **Lines**: 99, 132 - Direct fetch to `https://api.brevo.com/v3/smtp/email`
- **Parameters passed**:
  - API key: Line 19, 31, 104, 137
  - Sender: `contact@cvh-patrimoine.com`
  - Recipients: Client and spouse emails
  - HTML content with signature links

#### Route: `POST /send-presentation-email` (Lines 174-445)
- **Purpose**: Send presentation email with DER signature token link
- **Brevo API calls**: 2 (client + spouse)
- **Lines**: 322, 401 - Direct fetch to Brevo SMTP
- **Brevo dependencies**:
  - Line 269: Retrieves `BREVO_API_KEY` from env
  - Lines 281, 322, 401: Sends via Brevo API

#### Route: `POST /send-email` (Lines 447-575)
- **Purpose**: Generic email sending route
- **Brevo API calls**: 1
- **Lines**: 537 - Direct fetch to Brevo SMTP
- **Brevo dependencies**:
  - Line 492: Retrieves `BREVO_API_KEY` from env
  - Line 537: Sends via Brevo API

**Scope of Removal**:
- ✗ Remove `sendDERSignatureEmail()` function entirely
- ✗ Remove `/send-presentation-email` route
- ✗ Remove `/send-email` route
- ✗ Remove all Brevo API key retrievals
- ✗ Remove HTML email wrapping logic (keep for reference, adapt to new service)

**Replacement Strategy**:
- Create `src/app/services/emailService.ts` abstraction layer
- Implement `sendEmail(to, subject, htmlContent)` via Gmail API
- Gmail API: `gmail.users.messages.send()`

---

### 3. Signature Routes (Document Signing)
**File**: `src/app/supabase/functions/server/signature_routes.tsx`

**Purpose**: Send documents for electronic signature and track signatures

**Brevo References**:

#### Function: `sendSignatureEmail()` (Lines 281-431)
- **Purpose**: Send signature email with custom message to client
- **Brevo API calls**: 1
- **Lines**: 406 - Direct fetch to `https://api.brevo.com/v3/smtp/email`
- **Brevo dependencies**:
  - Line 282: Retrieves `BREVO_API_KEY` from env
  - Lines 300-403: Builds email content
  - Line 406: Sends via Brevo API

#### Function: `sendCGPNotificationEmail()` (Lines 434-508)
- **Purpose**: Notify CGP when documents have been signed
- **Brevo API calls**: 1
- **Lines**: 486 - Direct fetch to Brevo SMTP
- **Brevo dependencies**:
  - Line 435: Retrieves `BREVO_API_KEY` from env

**Scope of Removal**:
- ✗ Remove `sendSignatureEmail()` function
- ✗ Remove `sendCGPNotificationEmail()` function
- ✗ Remove all Brevo API key retrievals

**Replacement Strategy**:
- Implement `sendSignatureEmail()` via abstracted emailService
- Implement `sendCGPNotificationEmail()` via abstracted emailService

---

### 4. Bilan Routes (Assessment Signatures)
**File**: `src/app/supabase/functions/server/bilan_routes.tsx`

**Purpose**: Generate and track electronic signatures for wealth assessments

**Brevo References**:

#### Route: `POST /bilan-signatures/send-email` (Lines 173-406)
- **Purpose**: Send bilan signature email to client and spouse
- **Brevo API calls**: 2 (client + spouse)
- **Lines**: 333, 370 - Direct fetch to `https://api.brevo.com/v3/smtp/email`
- **Brevo dependencies**:
  - Line 205: Retrieves `BREVO_API_KEY` from env
  - Lines 333, 370: Sends via Brevo API
  - Lines 242-312: Generates HTML content for Brevo

**Scope of Removal**:
- ✗ Remove Brevo API key retrieval (Line 205)
- ✗ Remove all fetch calls to Brevo SMTP (Lines 333, 370)
- ✗ Keep: HTML email generation logic (adapt to new service)

**Replacement Strategy**:
- Use abstracted emailService to send bilan emails
- Reuse email generation logic with new service parameters

---

### 5. Server Index Registration
**File**: `src/app/supabase/functions/server/index.tsx`

**Brevo References**:
- Line 8: `import { setupBilanRoutes } from "./bilan_routes.tsx";`
- Line 12: `import { setupEmailRoutes } from "./email_routes.tsx";`
- Line 14: `import { setupSignatureRoutes } from "./signature_routes.tsx";`
- Line 16: `import { setupEmailWebhookRoutes } from "./email_webhook.tsx";`
- Line 266: `setupBilanRoutes(app, verifyAuth);`
- Line 270: `setupEmailRoutes(app, verifyAuth);`
- Line 274: `setupSignatureRoutes(app, supabaseAdminCompat, kv);`
- Line 278: `setupEmailWebhookRoutes(app);`

**Scope of Removal**:
- ✓ Keep imports (modules still exist, just abstracted internally)
- ✓ Keep route registrations (endpoints stay, just use new email service)

---

## Environment Variables

**File**: `deploy.env.example`

**Brevo Variables to Remove**:
- `BREVO_API_KEY` - Brevo SMTP API key

**New Variables to Add**:
- `GMAIL_OAUTH_CLIENT_ID` - Gmail OAuth client ID
- `GMAIL_OAUTH_CLIENT_SECRET` - Gmail OAuth client secret
- `GMAIL_REFRESH_TOKEN` - Gmail refresh token

---

## Summary Table

| Module | File | Brevo Calls | Lines | Action |
|--------|------|-------------|-------|--------|
| Email Webhook | email_webhook.tsx | 0 (handler) | 10, 116 | Remove entire file/function |
| Email Routes | email_routes.tsx | 3 | 99, 132, 322, 401, 537 | Remove functions, keep routes |
| Signature Routes | signature_routes.tsx | 2 | 406, 486 | Remove functions |
| Bilan Routes | bilan_routes.tsx | 2 | 333, 370 | Remove API calls, keep routes |
| Server Index | index.tsx | 0 | 266, 270, 274, 278 | No changes needed |

---

## Implementation Plan

### Phase 1: Create Abstraction Layer (2-3 hours)
- [ ] Create `src/app/services/emailService.ts` with abstract interface
- [ ] Create `src/app/services/gmailService.ts` with Gmail implementation
- [ ] Define types for email operations (send, read, get attachments)

### Phase 2: Gmail OAuth Setup (1-2 hours)
- [ ] Configure Gmail OAuth 2.0 credentials
- [ ] Create Supabase Function for OAuth callback
- [ ] Implement token refresh mechanism

### Phase 3: Remove Brevo Code (1-2 hours)
- [ ] Remove `sendDERSignatureEmail()` function from email_routes.tsx
- [ ] Remove Brevo API calls from signature_routes.tsx
- [ ] Remove Brevo API calls from bilan_routes.tsx
- [ ] Remove webhook handler from email_webhook.tsx
- [ ] Remove/update imports in index.tsx if needed

### Phase 4: Update Routes to Use emailService (2-3 hours)
- [ ] Update `/send-presentation-email` route to use emailService
- [ ] Update `/send-email` route to use emailService
- [ ] Update signature routes to use emailService
- [ ] Update bilan routes to use emailService

### Phase 5: Testing & Documentation (1-2 hours)
- [ ] Test Gmail OAuth flow
- [ ] Test email sending from different routes
- [ ] Test attachment handling
- [ ] Document new email service usage

**Total Estimated Removal Time**: 7-12 hours of development

---

## Critical Notes

1. **Webhook Handler**: The webhook handler at `/webhook/brevo-email` won't be needed with Gmail. Email status tracking will come from Gmail's label system instead.

2. **Email Templates**: Current HTML templates for emails are not Brevo-specific—they're just styled HTML and can be reused as-is with any email service.

3. **Signature Links**: DER signature and document signature links are generated and stored in KV store. They're independent of the email service, so no changes needed there.

4. **Backwards Compatibility**: All email routes (`/send-email`, `/send-presentation-email`, etc.) stay as public interfaces. Only the internal implementation changes from Brevo to Gmail.

5. **Database**: No database schema changes needed. All email data is already abstracted in the KV store.

---

## Next Steps

This audit is complete. Ready to proceed with:

1. **Option A**: Create the abstract emailService layer first (architectural foundation)
2. **Option B**: Start Gmail OAuth integration immediately (demonstrates new pattern)
3. **Option C**: Proceed with full Brevo removal first, then add Gmail integration

Recommend: **Option A → Option B → Option C** for safest, most testable approach.
