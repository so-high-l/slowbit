import {
  sqliteTable,
  text,
  integer,
  index,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";
export const boardSessions = sqliteTable(
  "board_sessions",
  {
    tokenHash: text("token_hash").primaryKey(),
    createdAt: integer("created_at").notNull(),
    expiresAt: integer("expires_at").notNull(),
  },
  (table) => [index("idx_board_sessions_created_at").on(table.createdAt)],
);
export const boardMessages = sqliteTable(
  "board_messages",
  {
    id: text("id").primaryKey(),
    body: text("body").notNull(),
    createdAt: integer("created_at").notNull(),
    submissionKey: text("submission_key").notNull(),
  },
  (table) => [
    index("idx_board_messages_created_at").on(table.createdAt),
    uniqueIndex("idx_board_messages_submission_key").on(table.submissionKey),
  ],
);
