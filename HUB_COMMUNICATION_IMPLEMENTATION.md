# Hub Communication System - Complete Implementation

**Date:** 2026-07-28  
**Version:** 1.0  
**Status:** Backend API Integrated, Frontend Ready for Testing

## Overview

Complete implementation of the Hub Communication system for email/communication management with:
- 4-tab interface (Conversation Client, Interne/Externe, Archive, Appels)
- 5-state mail processing workflow
- Automatic mail classification
- Notes system with full history
- Client association and detection
- Attachment handling
- Call-to-action management
- Reply capabilities

---

## Architecture

### Tech Stack
- **Frontend:** React + TypeScript with Tailwind CSS
- **Backend:** Hono (lightweight framework) running on Deno
- **Database:** Supabase PostgreSQL
- **Authentication:** Bearer token via localStorage
- **State Management:** React hooks

### Directory Structure
```
src/app/
├── components/communications/
│   ├── HubCommunicationView.tsx (Main component - API integrated)
│   ├── MailDetailPanel.tsx (Mail details - API integrated)
│   ├── ReplyModal.tsx (Reply composition)
│   ├── NotesSystem.tsx (Notes management)
│   ├── ClientAssociation.tsx (Client linking)
│   ├── AttachmentsDisplay.tsx (File display)
│   └── InterlocutorsFilter.tsx (Email filtering)
├── services/
│   ├── hubCommunicationAPI.ts (Frontend API client - 200+ lines)
│   ├── hubMailService.ts (Supabase mail service - 280+ lines)
│   └── hubCallsService.ts (Supabase calls service - 200+ lines)
├── backend/
│   ├── supabase.ts (NEW - Supabase client)
│   ├── hubRoutes.ts (Hono routes - 280+ lines)
│   └── migrations/
│       └── 001_create_hub_tables.sql (Database schema)
└── types/
    └── mail.ts (Complete type definitions)

supabase/functions/server/
└── communications_routes.tsx (Server routes - Deno/Hono)
```

---

## Database Schema

### hub_mails Table
```sql
- id: TEXT (Primary Key)
- messageId: TEXT (Outlook ID)
- threadId: TEXT (Conversation ID)
- from: TEXT (Sender email)
- fromName: TEXT (Sender name)
- to: TEXT[] (Recipients array)
- subject: TEXT
- body: TEXT
- isHtml: BOOLEAN
- bodyPreview: TEXT
- sentAt: TIMESTAMPTZ
- direction: TEXT ('received' | 'sent')
- read: BOOLEAN
- clientId: TEXT (FK to client)
- clientName: TEXT
- clientEmail: TEXT
- hubTab: TEXT ('conversation_client' | 'interne_externe' | 'archive' | 'appels')
- traitementStatus: TEXT ('a_traiter' | 'en_cours' | 'a_valider_gl' | 'valide_gl' | 'termine')
- attachments: JSONB (Array of file objects)
- notes: JSONB (Array of note objects)
- createdAt: TIMESTAMPTZ
- updatedAt: TIMESTAMPTZ
- importedFrom: TEXT ('outlook')

Indices: hubTab, traitementStatus, clientId, sentAt, from, threadId
```

### hub_calls Table
```sql
- id: TEXT (Primary Key)
- clientId: TEXT
- clientName: TEXT
- clientPhone: TEXT
- clientEmail: TEXT
- subject: TEXT
- reason: TEXT
- dueDate: TIMESTAMPTZ
- priority: TEXT ('urgent' | 'normal' | 'low')
- status: TEXT ('pending' | 'in_progress' | 'completed')
- linkedMailId: TEXT (FK to hub_mails)
- notes: TEXT
- createdAt: TIMESTAMPTZ
- completedAt: TIMESTAMPTZ

Indices: status, priority, dueDate, clientId, linkedMailId
```

---

## API Endpoints

All endpoints require `Authorization: Bearer <token>` header (except noted).

### Mail Endpoints

#### `GET /api/hub/mails?tab=...&limit=50&skip=0`
Fetch mails for a tab with pagination.

**Query Params:**
- `tab`: 'conversation_client' | 'interne_externe' | 'archive' | 'appels'
- `limit`: number (default 50)
- `skip`: number (default 0)

**Response:**
```json
{
  "mails": [HubMail],
  "total": 120,
  "stats": {
    "conversation_client": 45,
    "interne_externe": 30,
    "archive": 40,
    "appels": 5,
    "a_traiter": 20,
    "en_cours": 15,
    "a_valider_gl": 10,
    "valide_gl": 35,
    "unread": 8
  }
}
```

#### `GET /api/hub/mails/:id`
Get specific mail details.

**Response:** HubMail object

#### `PUT /api/hub/mails/:id`
Update mail (status, notes, client association).

**Body:**
```json
{
  "traitementStatus": "en_cours",
  "processingNotes": "...",
  "clientId": "client-123",
  "clientName": "John Doe",
  "clientEmail": "john@example.com"
}
```

**Response:** Updated HubMail object

#### `POST /api/hub/mails/:id/notes`
Add note to mail.

**Body:**
```json
{
  "content": "Note content...",
  "createdBy": "user@example.com",
  "createdByName": "User Name"
}
```

**Response (201):** MailNote object

#### `DELETE /api/hub/mails/:id/notes/:noteId`
Remove note from mail.

**Response:** `{ success: true }`

#### `POST /api/hub/mails/:id/reply`
Send reply to mail sender.

**Body:**
```json
{
  "to": ["recipient@example.com"],
  "subject": "Re: Original Subject",
  "body": "Reply message...",
  "cc": ["cc@example.com"]
}
```

**Response (201):** Updated HubMail (status changed to 'en_cours')

#### `POST /api/hub/mails/search`
Search mails across multiple fields.

**Body:**
```json
{
  "query": "search term",
  "tab": "conversation_client",
  "limit": 50
}
```

**Response:** Array of HubMail

#### `GET /api/hub/stats`
Get mail statistics.

**Response:** HubStats object with counts

### Calls Endpoints

#### `GET /api/hub/calls?status=...&limit=50&skip=0`
Fetch calls to handle.

**Query Params:**
- `status`: 'pending' | 'in_progress' | 'completed' (optional)
- `limit`: number (default 50)
- `skip`: number (default 0)

**Response:**
```json
{
  "calls": [CallToHandle],
  "total": 25
}
```

#### `GET /api/hub/calls/:id`
Get specific call.

**Response:** CallToHandle object

#### `POST /api/hub/calls`
Create new call.

**Body:**
```json
{
  "clientName": "John Doe",
  "clientPhone": "+33612345678",
  "clientEmail": "john@example.com",
  "subject": "Follow-up call",
  "reason": "Validation of recommendations",
  "dueDate": "2026-07-30T15:00:00Z",
  "priority": "normal",
  "status": "pending",
  "linkedMailId": "mail-123",
  "notes": "Call notes..."
}
```

**Response (201):** CallToHandle object

#### `PUT /api/hub/calls/:id`
Update call fields.

**Body:** Partial<CallToHandle>

**Response:** Updated CallToHandle

#### `POST /api/hub/calls/:id/complete`
Mark call as completed.

**Response:** Updated CallToHandle (status='completed', completedAt set)

---

## Frontend Components

### HubCommunicationView.tsx
**Main Component** - Coordinates tab navigation, mail loading, searching.

**Key Functions:**
- `loadData()` - Initial load with API
- `loadMailsByTab(tab)` - Load mails for active tab
- `loadCalls()` - Load pending calls
- `searchMails(query)` - Full-text search
- `handleMailUpdate(mail)` - Refresh after mail edit

**State:**
- `mails` - Current tab's mails
- `calls` - Pending calls
- `selectedMail` - Currently viewed mail
- `activeTab` - Current tab
- `stats` - Mail statistics
- `loading` - Loading state
- `searchTerm` - Search query

### MailDetailPanel.tsx
**Mail Details Sidebar** - Shows complete mail info, handles edits.

**Key Features:**
- Full mail display (subject, from, to, body, attachments)
- Status change buttons
- Notes display and creation
- Client association UI
- Reply modal trigger
- Real-time API updates

**API Calls:**
- `updateMailStatus(mailId, status)`
- `addMailNote(mailId, content, createdBy, createdByName)`
- `deleteMailNote(mailId, noteId)`
- `associateClient(mailId, clientId, clientName, clientEmail)`
- `sendMailReply(mailId, to, subject, body, cc)`

### ReplyModal.tsx
**Reply Composition Dialog** - Structured reply UI.

**Features:**
- Auto-fill recipient (from original sender)
- Auto-prefix subject with "Re:"
- CC field with add/remove
- Character counter
- 3 send options (Send via Outlook, Copy text, Cancel)
- Validation (non-empty subject, body, recipients)

### Supporting Components
- **NotesSystem.tsx** - Manage mail notes with timestamps
- **ClientAssociation.tsx** - Search and link client to mail
- **AttachmentsDisplay.tsx** - Show file previews with download
- **InterlocutorsFilter.tsx** - Multi-select email sender filtering

---

## Frontend API Client (hubCommunicationAPI)

**Location:** `src/app/services/hubCommunicationAPI.ts`

**Methods:**
```typescript
// Mails
getMailsByTab(tab, limit, skip) → Promise<{mails, total, stats}>
getMailById(mailId) → Promise<HubMail>
updateMail(mailId, updates) → Promise<HubMail>
updateMailStatus(mailId, status) → Promise<HubMail>
associateClient(mailId, clientId, clientName, clientEmail) → Promise<HubMail>
addMailNote(mailId, content, createdBy, createdByName) → Promise<MailNote>
deleteMailNote(mailId, noteId) → Promise<{success}>
sendMailReply(mailId, to, subject, body, cc) → Promise<HubMail>
searchMails(query, tab, limit) → Promise<HubMail[]>
getStats() → Promise<HubStats>

// Calls
getCalls(status, limit, skip) → Promise<{calls, total}>
getCallById(callId) → Promise<CallToHandle>
createCall(call) → Promise<CallToHandle>
updateCall(callId, updates) → Promise<CallToHandle>
completeCall(callId) → Promise<CallToHandle>
```

**Authentication:**
- Reads JWT from localStorage
- Adds `Authorization: Bearer <token>` to all requests
- Throws on non-ok responses with error message

---

## Backend Services

### hubMailService.ts
Core business logic for mail operations.

**Key Functions:**
- `getMailsByTab(tab, limit, skip)` - Query mails with stats
- `getMailById(mailId)` - Get single mail
- `updateMail(mailId, updates)` - Update mail fields
- `addNote(mailId, content, createdBy, createdByName)` - Add note
- `deleteNote(mailId, noteId)` - Remove note
- `searchMails(query, tab, limit)` - Full-text search
- `getStats()` - Aggregate counts
- `sendReply(mailId, to, subject, body, cc)` - Create reply
- `classifyMail(mailId, clientId)` - Auto-classify tab

### hubCallsService.ts
Call management business logic.

**Key Functions:**
- `getCallsToHandle(status, limit, skip)` - Get pending/in-progress calls
- `getCallById(callId)` - Get single call
- `createCall(call)` - Create new call
- `updateCall(callId, updates)` - Update fields
- `completeCall(callId)` - Mark as done
- `startCall(callId)` - Mark as in-progress
- `addNoteToCall(callId, note)` - Append note
- `searchCalls(query, limit)` - Search calls
- `getCallsByPriority()` - Group by urgent/normal/low
- `createCallFromMail(clientName, clientEmail, linkedMailId, subject)` - Auto-create from mail

---

## Setup Instructions

### 1. Database Migration
Run the SQL migration in Supabase:
```sql
-- Copy contents of src/app/backend/migrations/001_create_hub_tables.sql
-- Execute in Supabase SQL Editor
```

### 2. Environment Variables
Add to `.env` (Deno):
```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
```

Add to `.env` (Browser):
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 3. Start Backend
The Hub Communication routes are automatically included in `communications_routes.tsx`.

### 4. Test Endpoints
```bash
# Get mails for conversation_client tab
curl -H "Authorization: Bearer <token>" \
  http://localhost:3000/api/hub/mails?tab=conversation_client

# Get statistics
curl -H "Authorization: Bearer <token>" \
  http://localhost:3000/api/hub/stats
```

---

## Type Definitions

All types are in `src/app/types/mail.ts`:

```typescript
interface HubMail {
  id: string;
  messageId?: string;
  threadId?: string;
  from: string;
  fromName?: string;
  to: string[];
  subject: string;
  body: string;
  isHtml?: boolean;
  bodyPreview?: string;
  sentAt: string;
  direction: 'received' | 'sent';
  read: boolean;
  clientId?: string;
  clientName?: string;
  clientEmail?: string;
  hubTab: HubTab;
  traitementStatus: MailTraitementStatus;
  attachments: Attachment[];
  notes: MailNote[];
  createdAt: string;
  updatedAt: string;
  importedFrom?: string;
}

type HubTab = 'conversation_client' | 'interne_externe' | 'archive' | 'appels';
type MailTraitementStatus = 'a_traiter' | 'en_cours' | 'a_valider_gl' | 'valide_gl' | 'termine';

interface MailNote {
  id: string;
  content: string;
  createdBy: string;
  createdByName: string;
  createdAt: string;
  updatedAt?: string;
}

interface CallToHandle {
  id: string;
  clientId?: string;
  clientName: string;
  clientPhone?: string;
  clientEmail?: string;
  subject: string;
  reason?: string;
  dueDate: string;
  priority: 'urgent' | 'normal' | 'low';
  status: 'pending' | 'in_progress' | 'completed';
  linkedMailId?: string;
  notes?: string;
  createdAt: string;
  completedAt?: string;
}
```

---

## Features Implemented

### ✅ Frontend
- [x] 4-tab navigation (Conversation Client, Interne/Externe, Archive, Appels)
- [x] Mail list with status badges
- [x] Search across mails
- [x] Mail detail panel with complete info
- [x] Notes system with history and timestamps
- [x] Client association with dropdown
- [x] Attachment display with download
- [x] Reply modal with CC support
- [x] Status change buttons (5 states)
- [x] Statistics dashboard (counts per tab/state)
- [x] Loading states and error handling
- [x] API integration for all operations

### ✅ Backend
- [x] Supabase database schema
- [x] All mail CRUD operations
- [x] Mail notes management
- [x] Full-text search
- [x] Mail status workflow
- [x] Client association
- [x] Reply creation
- [x] Calls management
- [x] Call creation and completion
- [x] Hono routes with CORS
- [x] Authentication via Bearer tokens

### ⏳ Future Enhancements
- [ ] Real Outlook integration (currently mocked)
- [ ] Call recordings/audio notes
- [ ] Email template management
- [ ] Automated workflow triggers
- [ ] Mail forwarding
- [ ] Signature management
- [ ] Scheduled sends
- [ ] Analytics dashboard
- [ ] Bulk actions (archive, status change, etc.)
- [ ] Email templates
- [ ] Spam/phishing detection
- [ ] Email encryption

---

## Testing Checklist

### Frontend UI
- [ ] Navigate between 4 tabs
- [ ] Click on mail opens detail panel
- [ ] Search filters mails correctly
- [ ] Status buttons change mail state
- [ ] Add/delete notes work
- [ ] Client association works
- [ ] Reply modal opens and sends
- [ ] Download attachments

### Backend APIs
- [ ] GET /api/hub/mails returns mails with stats
- [ ] PUT /api/hub/mails/:id updates status
- [ ] POST /api/hub/mails/:id/notes adds note
- [ ] DELETE removes note
- [ ] POST /api/hub/mails/:id/reply creates reply
- [ ] POST /api/hub/mails/search returns results
- [ ] GET /api/hub/calls returns pending calls
- [ ] POST /api/hub/calls creates new call

### Database
- [ ] hub_mails table populated with test data
- [ ] hub_calls table populated with test data
- [ ] Indices working properly
- [ ] Triggers updating timestamps

---

## Known Limitations

1. **Outlook Integration** - Currently mocked. Real integration requires:
   - Outlook Graph API credentials
   - OAuth 2.0 setup
   - Mail webhook configuration

2. **Email Sending** - Reply sending is tracked but not actually sent to Outlook

3. **Attachments** - Downloaded but not uploaded to emails

4. **Media Storage** - Files stored in database as references, not actual blobs

---

## Migration from Old System

Old communications system used KV store and is still available at:
- `GET /make-server-cac859af/communications/hub`
- `PATCH /make-server-cac859af/communications/:commId/assign`
- `PATCH /make-server-cac859af/communications/:commId/archive`

New Hub Communication uses Supabase:
- `GET /api/hub/mails`
- `PUT /api/hub/mails/:id`
- `POST /api/hub/mails/:id/notes`

Both systems can coexist during transition.

---

## Troubleshooting

### "Database not configured" error
- Verify Supabase URL and key in environment variables
- Check database tables were created with migration SQL

### Authentication errors
- Ensure Bearer token is valid and not expired
- Check Authorization header format: `Authorization: Bearer <token>`

### Search not working
- Database indices may not be built
- Verify full-text search syntax in Supabase

### Routes not found (404)
- Verify `communications_routes.tsx` is imported in `server/index.tsx`
- Check route paths match exactly (/api/hub/... vs /make-server-cac859af/...)

---

## Performance Notes

- Mail list pagination: 50 items default (configurable)
- Search limited to 50 results (configurable)
- Indices on common query fields (tab, status, clientId, sentAt)
- Full-text search uses `ilike` operator with wildcards
- Stats computed on each request (can be cached if needed)

---

## Security

- All routes require Bearer token authentication
- Database access via Supabase client with RLS policies (recommended)
- CORS configured for allowed origins
- SQL injection prevented via parameterized queries
- No sensitive data in client-side storage except JWT

---

## Files Created/Modified

### New Files
- `src/app/backend/supabase.ts`
- `src/app/backend/migrations/001_create_hub_tables.sql`
- `HUB_COMMUNICATION_IMPLEMENTATION.md` (this file)

### Modified Files
- `src/app/supabase/functions/server/communications_routes.tsx` (added 300+ lines)
- `src/app/components/communications/HubCommunicationView.tsx` (updated to use APIs)
- `src/app/components/communications/MailDetailPanel.tsx` (updated to use APIs)

### Existing Files (No changes needed)
- `src/app/services/hubCommunicationAPI.ts` (already complete)
- `src/app/services/hubMailService.ts` (already complete)
- `src/app/services/hubCallsService.ts` (already complete)
- `src/app/backend/hubRoutes.ts` (reference implementation)
- `src/app/types/mail.ts` (already complete)

---

## Support & Questions

For issues or questions about the Hub Communication system:
1. Check this documentation
2. Review the API response error messages
3. Check browser console for frontend errors
4. Check server logs for backend errors
5. Verify database schema matches migration SQL

---

**Implementation Complete** ✅  
Ready for testing and integration.
