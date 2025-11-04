CREATE TABLE `daily_tasks` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`study_plan_id` integer NOT NULL,
	`weekly_goal_id` integer,
	`name` text NOT NULL,
	`date` text NOT NULL,
	`completed` integer DEFAULT false NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`study_plan_id`) REFERENCES `study_plans`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`weekly_goal_id`) REFERENCES `weekly_goals`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `monthly_goals` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`study_plan_id` integer NOT NULL,
	`goal` text NOT NULL,
	`completed` integer DEFAULT false NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`study_plan_id`) REFERENCES `study_plans`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `study_plans` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text NOT NULL,
	`exam_name` text NOT NULL,
	`month` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `weekly_goals` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`study_plan_id` integer NOT NULL,
	`week_number` integer NOT NULL,
	`goal` text NOT NULL,
	`completed` integer DEFAULT false NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`study_plan_id`) REFERENCES `study_plans`(`id`) ON UPDATE no action ON DELETE cascade
);
