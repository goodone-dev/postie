CREATE TABLE IF NOT EXISTS collection_folders (
    id UUID PRIMARY KEY,
    collection_id UUID NOT NULL,
    parent_id UUID NULL,
    name VARCHAR NOT NULL,
    slug VARCHAR NOT NULL,
    idx INT NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL,
    FOREIGN KEY (collection_id) REFERENCES collections(id) ON DELETE CASCADE
    FOREIGN KEY (parent_id) REFERENCES collection_folders(id) ON DELETE CASCADE
);

CREATE INDEX idx_collection_folders_collection_id ON collection_folders(collection_id);
CREATE INDEX idx_collection_folders_parent_id ON collection_folders(parent_id);
