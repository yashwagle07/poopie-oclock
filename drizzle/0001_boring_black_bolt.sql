CREATE TABLE `sounds` (
	`id` int AUTO_INCREMENT NOT NULL,
	`url` varchar(512) NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`type` enum('normal','punishment') NOT NULL DEFAULT 'normal',
	`rarity` enum('common','rare','legendary') NOT NULL DEFAULT 'common',
	`active` boolean NOT NULL DEFAULT true,
	`order` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `sounds_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `surprises` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`soundId` int NOT NULL,
	`soundUrl` varchar(512),
	`status` enum('armed','sent','opened') NOT NULL DEFAULT 'armed',
	`fireAt` timestamp NOT NULL,
	`sentAt` timestamp,
	`openedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `surprises_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `unlocks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`soundId` int NOT NULL,
	`unlockedAt` timestamp NOT NULL DEFAULT (now()),
	`timesHeard` int NOT NULL DEFAULT 1,
	`lastHeardAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `unlocks_id` PRIMARY KEY(`id`),
	CONSTRAINT `unlocks_userId_soundId_unique` UNIQUE(`userId`,`soundId`)
);
