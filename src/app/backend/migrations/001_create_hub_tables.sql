-- Create hub_mails table
CREATE TABLE IF NOT EXISTS hub_mails (
  id TEXT PRIMARY KEY,
  messageId TEXT,
  threadId TEXT,
  "from" TEXT NOT NULL,
  fromName TEXT,
  "to" TEXT[] NOT NULL, -- Array of email addresses
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  isHtml BOOLEAN DEFAULT false,
  bodyPreview TEXT,
  sentAt TIMESTAMPTZ NOT NULL,
  direction TEXT NOT NULL, -- 'received' or 'sent'
  read BOOLEAN DEFAULT false,
  clientId TEXT,
  clientName TEXT,
  clientEmail TEXT,
  hubTab TEXT NOT NULL DEFAULT 'conversation_client', -- 'conversation_client', 'interne_externe', 'archive', 'appels'
  traitementStatus TEXT NOT NULL DEFAULT 'a_traiter', -- 'a_traiter', 'en_cours', 'a_valider_gl', 'valide_gl', 'termine'
  attachments JSONB DEFAULT '[]'::jsonb, -- Array of attachment objects
  notes JSONB DEFAULT '[]'::jsonb, -- Array of note objects
  createdAt TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updatedAt TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  importedFrom TEXT DEFAULT 'outlook',

  CONSTRAINT hub_mails_valid_tab CHECK (hubTab IN ('conversation_client', 'interne_externe', 'archive', 'appels')),
  CONSTRAINT hub_mails_valid_status CHECK (traitementStatus IN ('a_traiter', 'en_cours', 'a_valider_gl', 'valide_gl', 'termine')),
  CONSTRAINT hub_mails_valid_direction CHECK (direction IN ('received', 'sent'))
);

-- Create index on common queries
CREATE INDEX idx_hub_mails_tab ON hub_mails(hubTab);
CREATE INDEX idx_hub_mails_status ON hub_mails(traitementStatus);
CREATE INDEX idx_hub_mails_client ON hub_mails(clientId);
CREATE INDEX idx_hub_mails_sent_at ON hub_mails(sentAt DESC);
CREATE INDEX idx_hub_mails_from ON hub_mails("from");
CREATE INDEX idx_hub_mails_thread ON hub_mails(threadId);

-- Create hub_calls table
CREATE TABLE IF NOT EXISTS hub_calls (
  id TEXT PRIMARY KEY,
  clientId TEXT,
  clientName TEXT,
  clientPhone TEXT,
  clientEmail TEXT,
  subject TEXT NOT NULL,
  reason TEXT,
  dueDate TIMESTAMPTZ NOT NULL,
  priority TEXT NOT NULL DEFAULT 'normal', -- 'urgent', 'normal', 'low'
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'in_progress', 'completed'
  linkedMailId TEXT, -- Reference to the mail this call is linked to
  notes TEXT,
  createdAt TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completedAt TIMESTAMPTZ,

  CONSTRAINT hub_calls_valid_priority CHECK (priority IN ('urgent', 'normal', 'low')),
  CONSTRAINT hub_calls_valid_status CHECK (status IN ('pending', 'in_progress', 'completed'))
);

-- Create index on common queries
CREATE INDEX idx_hub_calls_status ON hub_calls(status);
CREATE INDEX idx_hub_calls_priority ON hub_calls(priority);
CREATE INDEX idx_hub_calls_due_date ON hub_calls(dueDate);
CREATE INDEX idx_hub_calls_client ON hub_calls(clientId);
CREATE INDEX idx_hub_calls_linked_mail ON hub_calls(linkedMailId);

-- Add updated_at trigger for hub_mails
CREATE OR REPLACE FUNCTION update_hub_mails_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updatedAt = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER hub_mails_updated_at_trigger
BEFORE UPDATE ON hub_mails
FOR EACH ROW
EXECUTE FUNCTION update_hub_mails_updated_at();
