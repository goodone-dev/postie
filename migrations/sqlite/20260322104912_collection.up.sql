CREATE TABLE IF NOT EXISTS collections (
    id UUID PRIMARY KEY,
    workspace_id UUID NOT NULL,
    name VARCHAR NOT NULL,
    slug VARCHAR NOT NULL,
    is_favorite BOOLEAN NOT NULL DEFAULT FALSE,
    sort_order VARCHAR NOT NULL DEFAULT 'default',
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL,
    FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE
);

CREATE INDEX idx_collections_workspace_id ON collections(workspace_id);
