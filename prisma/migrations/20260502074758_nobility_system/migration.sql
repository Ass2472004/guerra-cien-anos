-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Game" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "faction" TEXT NOT NULL,
    "turn" INTEGER NOT NULL DEFAULT 0,
    "tick" INTEGER NOT NULL DEFAULT 0,
    "lastTick" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "mapWidth" INTEGER NOT NULL DEFAULT 20,
    "mapHeight" INTEGER NOT NULL DEFAULT 20,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "nobilityTitle" TEXT NOT NULL DEFAULT 'LORD',
    "nobilityXp" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "Game_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Game" ("createdAt", "faction", "id", "lastTick", "mapHeight", "mapWidth", "tick", "turn", "updatedAt", "userId") SELECT "createdAt", "faction", "id", "lastTick", "mapHeight", "mapWidth", "tick", "turn", "updatedAt", "userId" FROM "Game";
DROP TABLE "Game";
ALTER TABLE "new_Game" RENAME TO "Game";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
