import { Client } from "npm:pg";

const databaseUrl = Deno.env.get('DATABASE_URL');

if (!databaseUrl) {
  console.log('⚠️ DATABASE_URL not configured, skipping table initialization');
} else {
  (async () => {
    const client = new Client(databaseUrl);

    try {
      await client.connect();
      console.log('🔧 Initializing Hub Communication tables...');

      // Create hub_mails table
      await client.queryObject(`
        CREATE TABLE IF NOT EXISTS hub_mails (
          id TEXT PRIMARY KEY,
          messageId TEXT,
          threadId TEXT,
          "from" TEXT NOT NULL,
          fromName TEXT,
          "to" TEXT[] NOT NULL,
          subject TEXT NOT NULL,
          body TEXT NOT NULL,
          isHtml BOOLEAN DEFAULT false,
          bodyPreview TEXT,
          sentAt TIMESTAMPTZ NOT NULL,
          direction TEXT NOT NULL,
          read BOOLEAN DEFAULT false,
          clientId TEXT,
          clientName TEXT,
          clientEmail TEXT,
          hubTab TEXT NOT NULL DEFAULT 'conversation_client',
          traitementStatus TEXT NOT NULL DEFAULT 'a_traiter',
          attachments JSONB DEFAULT '[]'::jsonb,
          notes JSONB DEFAULT '[]'::jsonb,
          createdAt TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updatedAt TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          importedFrom TEXT DEFAULT 'outlook'
        )
      `);

      // Create hub_calls table
      await client.queryObject(`
        CREATE TABLE IF NOT EXISTS hub_calls (
          id TEXT PRIMARY KEY,
          clientId TEXT,
          clientName TEXT,
          clientPhone TEXT,
          clientEmail TEXT,
          subject TEXT NOT NULL,
          reason TEXT,
          dueDate TIMESTAMPTZ NOT NULL,
          priority TEXT NOT NULL DEFAULT 'normal',
          status TEXT NOT NULL DEFAULT 'pending',
          linkedMailId TEXT,
          notes TEXT,
          createdAt TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          completedAt TIMESTAMPTZ
        )
      `);

      // Create indices
      await client.queryObject(`CREATE INDEX IF NOT EXISTS idx_hub_mails_tab ON hub_mails(hubTab)`);
      await client.queryObject(`CREATE INDEX IF NOT EXISTS idx_hub_mails_status ON hub_mails(traitementStatus)`);
      await client.queryObject(`CREATE INDEX IF NOT EXISTS idx_hub_mails_client ON hub_mails(clientId)`);
      await client.queryObject(`CREATE INDEX IF NOT EXISTS idx_hub_mails_sent_at ON hub_mails("sentAt" DESC)`);
      await client.queryObject(`CREATE INDEX IF NOT EXISTS idx_hub_calls_status ON hub_calls(status)`);
      await client.queryObject(`CREATE INDEX IF NOT EXISTS idx_hub_calls_priority ON hub_calls(priority)`);
      await client.queryObject(`CREATE INDEX IF NOT EXISTS idx_hub_calls_due_date ON hub_calls("dueDate")`);

      console.log('✅ Hub Communication tables initialized successfully');
      await client.end();
    } catch (err) {
      console.error('❌ Error initializing tables:', err.message);
      await client.end();
    }
  })();
}
