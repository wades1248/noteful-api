CREATE TABLE notes (
    id INTEGER PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY,
    name TEXT NOT NULL,
    content TEXT NOT NULL,
    folder_id INTEGER 
        REFERENCES folders(id) ON DELETE SET NULL,
    modified TIMESTAMP DEFAULT now() NOT NULL
);