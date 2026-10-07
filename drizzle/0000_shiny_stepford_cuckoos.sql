CREATE TABLE `board_messages` (
	`id` text PRIMARY KEY NOT NULL,
	`body` text NOT NULL,
	`created_at` integer NOT NULL,
	`submission_key` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_board_messages_created_at` ON `board_messages` (`created_at`);--> statement-breakpoint
CREATE UNIQUE INDEX `idx_board_messages_submission_key` ON `board_messages` (`submission_key`);--> statement-breakpoint
CREATE TABLE `board_sessions` (
	`token_hash` text PRIMARY KEY NOT NULL,
	`created_at` integer NOT NULL,
	`expires_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_board_sessions_created_at` ON `board_sessions` (`created_at`);