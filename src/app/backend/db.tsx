// ============================================
// PostgreSQL DATABASE MODULE
// Replaces KV store with proper tables
// ============================================

import { Pool, PoolClient } from "npm:pg";

const pool = new Pool({
  connectionString: Deno.env.get("DATABASE_URL"),
});

// ─── Get connection ───────────────────────────────────────────────────────
export async function getConnection(): Promise<PoolClient> {
  return pool.connect();
}

export async function query(sql: string, params: any[] = []) {
  const client = await getConnection();
  try {
    return await client.query(sql, params);
  } finally {
    client.release();
  }
}

// ─── Initialize tables ─────────────────────────────────────────────────────
export async function initializeTables() {
  console.log('🗄️  Initializing PostgreSQL tables...');

  await query(`
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      nom VARCHAR(255),
      prenom VARCHAR(255),
      specialite VARCHAR(255),
      certifications TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS clients (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      nom VARCHAR(255) NOT NULL,
      prenom VARCHAR(255),
      email VARCHAR(255),
      telephone VARCHAR(20),
      statut VARCHAR(50),
      patrimoine NUMERIC DEFAULT 0,
      status_ouvert VARCHAR(50) DEFAULT 'Prospect',
      csp_signe BOOLEAN DEFAULT FALSE,
      taches JSONB DEFAULT '{}',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_clients_user ON clients(user_id);
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS tasks (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
      title VARCHAR(255) NOT NULL,
      description TEXT,
      status VARCHAR(50) DEFAULT 'pending',
      completed BOOLEAN DEFAULT FALSE,
      status_pipeline VARCHAR(50),
      prospect_origin VARCHAR(255),
      referrer_name VARCHAR(255),
      completed_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_tasks_client ON tasks(client_id);
    CREATE INDEX IF NOT EXISTS idx_tasks_user ON tasks(user_id);
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS documents (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
      filename VARCHAR(255) NOT NULL,
      content BYTEA NOT NULL,
      content_type VARCHAR(100),
      file_size INTEGER,
      document_type VARCHAR(100),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_documents_client ON documents(client_id);
    CREATE INDEX IF NOT EXISTS idx_documents_user ON documents(user_id);
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS rdv (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
      title VARCHAR(255),
      date_rdv TIMESTAMP NOT NULL,
      duration_minutes INTEGER DEFAULT 60,
      type VARCHAR(50),
      location VARCHAR(255),
      notes TEXT,
      completed BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_rdv_client ON rdv(client_id);
    CREATE INDEX IF NOT EXISTS idx_rdv_user ON rdv(user_id);
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS orders (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
      status VARCHAR(50) DEFAULT 'draft',
      admin_notes TEXT,
      audit JSONB,
      preconisations JSONB,
      presentation_client JSONB,
      validated_by_admin BOOLEAN DEFAULT FALSE,
      validated_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_orders_client ON orders(client_id);
    CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS recommendations (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
      title VARCHAR(255),
      description TEXT,
      type VARCHAR(50),
      priority VARCHAR(50),
      status VARCHAR(50) DEFAULT 'pending',
      applied_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_recommendations_client ON recommendations(client_id);
  `);

  console.log('✅ All tables initialized');
}

// ─── Helper functions ─────────────────────────────────────────────────────
export async function getUserById(id: string) {
  const result = await query('SELECT * FROM users WHERE id = \$1', [id]);
  return result.rows[0];
}

export async function getUserByEmail(email: string) {
  const result = await query('SELECT * FROM users WHERE email = \$1', [email]);
  return result.rows[0];
}

export async function getClientById(clientId: string, userId: string) {
  const result = await query(
    'SELECT * FROM clients WHERE id = \$1 AND user_id = \$2',
    [clientId, userId]
  );
  return result.rows[0];
}

export async function getClientsByUser(userId: string) {
  const result = await query('SELECT * FROM clients WHERE user_id = \$1', [userId]);
  return result.rows;
}

export async function getTasksByClient(clientId: string, userId: string) {
  const result = await query(
    'SELECT * FROM tasks WHERE client_id = \$1 AND user_id = \$2',
    [clientId, userId]
  );
  return result.rows;
}

export async function deleteExpiredSessions() {
  await query(
    'DELETE FROM sessions WHERE expires_at < CURRENT_TIMESTAMP',
    []
  );
  console.log('🧹 Expired sessions cleaned up');
}
