CREATE TABLE IF NOT EXISTS workspaces (
    id UUID PRIMARY KEY,
    name VARCHAR NOT NULL,
    slug VARCHAR NOT NULL,
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL
)
