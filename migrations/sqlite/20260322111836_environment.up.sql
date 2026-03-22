CREATE TABLE IF NOT EXISTS environments (
    id UUID PRIMARY KEY,
    workspace_id UUID NOT NULL,
    name VARCHAR NOT NULL,
    slug VARCHAR NOT NULL,
    variables BLOB,
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL,
    FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE
);

CREATE INDEX idx_environments_workspace_id ON environments(workspace_id);
