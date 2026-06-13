CREATE TABLE IF NOT EXISTS assets (
  id uuid PRIMARY KEY,
  tag text NOT NULL UNIQUE,
  name text NOT NULL,
  owner text NOT NULL,
  status text NOT NULL CHECK (status IN ('online', 'maintenance', 'retired')),
  site text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS tickets (
  id uuid PRIMARY KEY,
  number text NOT NULL UNIQUE,
  title text NOT NULL,
  requester text NOT NULL,
  priority text NOT NULL CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  status text NOT NULL CHECK (status IN ('open', 'assigned', 'resolved')),
  asset_id uuid REFERENCES assets(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_assets_status ON assets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_status_priority ON tickets(status, priority);
CREATE INDEX IF NOT EXISTS idx_tickets_created_at ON tickets(created_at DESC);
