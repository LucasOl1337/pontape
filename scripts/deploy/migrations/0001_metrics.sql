CREATE TABLE hits (
  day TEXT NOT NULL,
  kind TEXT NOT NULL,
  path TEXT NOT NULL,
  target TEXT NOT NULL DEFAULT '',
  count INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (day, kind, path, target)
) STRICT;

CREATE INDEX hits_kind_day ON hits(kind, day);

CREATE TABLE uniques (
  day TEXT NOT NULL,
  hash TEXT NOT NULL,
  PRIMARY KEY (day, hash)
) STRICT;

CREATE TABLE chats (
  id TEXT PRIMARY KEY,
  started_at TEXT NOT NULL,
  model TEXT NOT NULL
) STRICT;

CREATE INDEX chats_started_at ON chats(started_at DESC);

CREATE TABLE messages (
  id INTEGER PRIMARY KEY,
  chat_id TEXT NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  at TEXT NOT NULL
) STRICT;

CREATE INDEX messages_chat_id ON messages(chat_id, id);

CREATE TABLE login_attempts (
  key TEXT PRIMARY KEY,
  count INTEGER NOT NULL,
  started_at INTEGER NOT NULL
) STRICT;
