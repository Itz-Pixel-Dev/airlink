/*
  Warnings:

  - You are about to drop the `ApiKey` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Database` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Images` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Node` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Server` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Session` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Users` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the column `description` on the `settings` table. All the data in the column will be lost.
  - You are about to drop the column `language` on the `settings` table. All the data in the column will be lost.
  - You are about to drop the column `logo` on the `settings` table. All the data in the column will be lost.
  - You are about to drop the column `theme` on the `settings` table. All the data in the column will be lost.
  - You are about to drop the column `title` on the `settings` table. All the data in the column will be lost.
  - Added the required column `key` to the `settings` table without a default value. This is not possible if the table is not empty.
  - Added the required column `value` to the `settings` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "ApiKey_key_key";

-- DropIndex
DROP INDEX "Database_UUID_key";

-- DropIndex
DROP INDEX "Images_UUID_key";

-- DropIndex
DROP INDEX "Server_UUID_key";

-- DropIndex
DROP INDEX "Session_session_id_key";

-- DropIndex
DROP INDEX "Users_username_key";

-- DropIndex
DROP INDEX "Users_email_key";

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "ApiKey";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Database";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Images";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Node";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Server";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Session";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Users";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "users" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "email" TEXT NOT NULL,
    "username" TEXT,
    "password" TEXT NOT NULL,
    "firstName" TEXT,
    "lastName" TEXT,
    "isAdmin" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT DEFAULT 'No About Me',
    "lastLoginAt" DATETIME,
    "lastLoginIp" TEXT,
    "tokenVersion" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "session_id" TEXT NOT NULL,
    "data" TEXT NOT NULL,
    "expires" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "servers" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "UUID" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'offline',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "Ports" TEXT NOT NULL,
    "Memory" INTEGER NOT NULL,
    "Cpu" INTEGER NOT NULL,
    "Storage" INTEGER NOT NULL,
    "Variables" TEXT,
    "StartCommand" TEXT,
    "dockerImage" TEXT,
    "Installing" BOOLEAN NOT NULL DEFAULT true,
    "Suspended" BOOLEAN NOT NULL DEFAULT false,
    "ownerId" INTEGER NOT NULL,
    "nodeId" INTEGER NOT NULL,
    "imageId" INTEGER NOT NULL,
    CONSTRAINT "servers_nodeId_fkey" FOREIGN KEY ("nodeId") REFERENCES "nodes" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "servers_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "servers_imageId_fkey" FOREIGN KEY ("imageId") REFERENCES "images" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "images" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "UUID" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "author" TEXT,
    "authorName" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "meta" TEXT,
    "dockerImages" TEXT,
    "startup" TEXT,
    "info" TEXT,
    "scripts" TEXT,
    "variables" TEXT
);

-- CreateTable
CREATE TABLE "nodes" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "ram" INTEGER NOT NULL DEFAULT 0,
    "cpu" INTEGER NOT NULL DEFAULT 0,
    "disk" INTEGER NOT NULL DEFAULT 0,
    "address" TEXT NOT NULL DEFAULT '127.0.0.1',
    "port" INTEGER NOT NULL DEFAULT 3001,
    "key" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastPing" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "api_keys" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "permissions" TEXT,
    "lastUsedAt" DATETIME,
    "expiresAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "api_keys_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "databases" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "UUID" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "host" TEXT NOT NULL,
    "port" INTEGER NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "size" INTEGER NOT NULL DEFAULT 0,
    "serverId" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "databases_serverId_fkey" FOREIGN KEY ("serverId") REFERENCES "servers" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_settings" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_settings" ("createdAt", "id", "updatedAt") SELECT "createdAt", "id", "updatedAt" FROM "settings";
DROP TABLE "settings";
ALTER TABLE "new_settings" RENAME TO "settings";
CREATE UNIQUE INDEX "settings_key_key" ON "settings"("key");
CREATE INDEX "settings_key_idx" ON "settings"("key");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_session_id_key" ON "sessions"("session_id");

-- CreateIndex
CREATE INDEX "sessions_session_id_idx" ON "sessions"("session_id");

-- CreateIndex
CREATE UNIQUE INDEX "servers_UUID_key" ON "servers"("UUID");

-- CreateIndex
CREATE INDEX "servers_UUID_idx" ON "servers"("UUID");

-- CreateIndex
CREATE INDEX "servers_ownerId_idx" ON "servers"("ownerId");

-- CreateIndex
CREATE UNIQUE INDEX "images_UUID_key" ON "images"("UUID");

-- CreateIndex
CREATE INDEX "images_UUID_idx" ON "images"("UUID");

-- CreateIndex
CREATE INDEX "nodes_address_port_idx" ON "nodes"("address", "port");

-- CreateIndex
CREATE UNIQUE INDEX "api_keys_key_key" ON "api_keys"("key");

-- CreateIndex
CREATE INDEX "api_keys_key_idx" ON "api_keys"("key");

-- CreateIndex
CREATE INDEX "api_keys_userId_idx" ON "api_keys"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "databases_UUID_key" ON "databases"("UUID");

-- CreateIndex
CREATE INDEX "databases_UUID_idx" ON "databases"("UUID");

-- CreateIndex
CREATE INDEX "databases_serverId_idx" ON "databases"("serverId");
