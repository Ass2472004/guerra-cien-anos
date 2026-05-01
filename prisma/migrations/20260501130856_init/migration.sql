-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "emailVerified" DATETIME,
    "image" TEXT,
    "password" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,
    CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" DATETIME NOT NULL,
    CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Game" (
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
    CONSTRAINT "Game_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Tile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "gameId" TEXT NOT NULL,
    "x" INTEGER NOT NULL,
    "y" INTEGER NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'PLAIN',
    "visibility" TEXT NOT NULL DEFAULT 'HIDDEN',
    "bonus" TEXT NOT NULL DEFAULT '{}',
    CONSTRAINT "Tile_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Village" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "gameId" TEXT NOT NULL,
    "tileId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "owner" TEXT NOT NULL DEFAULT 'AI_NEUTRAL',
    "faction" TEXT,
    "loyalty" INTEGER NOT NULL DEFAULT 100,
    "population" INTEGER NOT NULL DEFAULT 50,
    "wallLevel" INTEGER NOT NULL DEFAULT 0,
    "wood" INTEGER NOT NULL DEFAULT 300,
    "stone" INTEGER NOT NULL DEFAULT 300,
    "iron" INTEGER NOT NULL DEFAULT 150,
    "grain" INTEGER NOT NULL DEFAULT 400,
    "straw" INTEGER NOT NULL DEFAULT 200,
    "adobe" INTEGER NOT NULL DEFAULT 100,
    "silver" INTEGER NOT NULL DEFAULT 0,
    "gold" INTEGER NOT NULL DEFAULT 0,
    "woodRate" INTEGER NOT NULL DEFAULT 10,
    "stoneRate" INTEGER NOT NULL DEFAULT 8,
    "ironRate" INTEGER NOT NULL DEFAULT 6,
    "grainRate" INTEGER NOT NULL DEFAULT 14,
    "silverRate" INTEGER NOT NULL DEFAULT 0,
    "goldRate" INTEGER NOT NULL DEFAULT 0,
    "warehouseCap" INTEGER NOT NULL DEFAULT 1000,
    "granaryCap" INTEGER NOT NULL DEFAULT 1000,
    CONSTRAINT "Village_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Village_tileId_fkey" FOREIGN KEY ("tileId") REFERENCES "Tile" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Building" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "villageId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "level" INTEGER NOT NULL DEFAULT 1,
    CONSTRAINT "Building_villageId_fkey" FOREIGN KEY ("villageId") REFERENCES "Village" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "BuildQueue" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "villageId" TEXT NOT NULL,
    "buildingType" TEXT NOT NULL,
    "targetLevel" INTEGER NOT NULL,
    "endsAt" DATETIME NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "BuildQueue_villageId_fkey" FOREIGN KEY ("villageId") REFERENCES "Village" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Army" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "gameId" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT 'Ejército',
    "owner" TEXT NOT NULL,
    "faction" TEXT NOT NULL,
    "tileId" TEXT,
    "isMoving" BOOLEAN NOT NULL DEFAULT false,
    "targetTileId" TEXT,
    "departsAt" DATETIME,
    "arrivesAt" DATETIME,
    "pathJson" TEXT NOT NULL DEFAULT '[]',
    "carriedGrain" INTEGER NOT NULL DEFAULT 100,
    "carriedStraw" INTEGER NOT NULL DEFAULT 50,
    "stamina" INTEGER NOT NULL DEFAULT 100,
    "isResting" BOOLEAN NOT NULL DEFAULT false,
    "isForaging" BOOLEAN NOT NULL DEFAULT false,
    "supplyLineId" TEXT,
    CONSTRAINT "Army_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Army_supplyLineId_fkey" FOREIGN KEY ("supplyLineId") REFERENCES "SupplyLine" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ArmyTroop" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "armyId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "count" INTEGER NOT NULL,
    "faction" TEXT NOT NULL,
    CONSTRAINT "ArmyTroop_armyId_fkey" FOREIGN KEY ("armyId") REFERENCES "Army" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TrainQueue" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "villageId" TEXT NOT NULL,
    "troopType" TEXT NOT NULL,
    "faction" TEXT NOT NULL,
    "count" INTEGER NOT NULL,
    "endsAt" DATETIME NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "TrainQueue_villageId_fkey" FOREIGN KEY ("villageId") REFERENCES "Village" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ArmyPosition" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "armyId" TEXT NOT NULL,
    "tileId" TEXT NOT NULL,
    CONSTRAINT "ArmyPosition_armyId_fkey" FOREIGN KEY ("armyId") REFERENCES "Army" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ArmyPosition_tileId_fkey" FOREIGN KEY ("tileId") REFERENCES "Tile" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Camp" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "gameId" TEXT NOT NULL,
    "tileId" TEXT NOT NULL,
    "owner" TEXT NOT NULL,
    "level" INTEGER NOT NULL DEFAULT 1,
    "name" TEXT NOT NULL DEFAULT 'Campamento',
    "grain" INTEGER NOT NULL DEFAULT 0,
    "straw" INTEGER NOT NULL DEFAULT 0,
    "restBonus" INTEGER NOT NULL DEFAULT 20,
    CONSTRAINT "Camp_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Camp_tileId_fkey" FOREIGN KEY ("tileId") REFERENCES "Tile" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SupplyLine" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "gameId" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "pathJson" TEXT NOT NULL DEFAULT '[]',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isCut" BOOLEAN NOT NULL DEFAULT false,
    "wagons" INTEGER NOT NULL DEFAULT 0,
    "wagonGrain" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "SupplyLine_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "Village" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Hero" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "gameId" TEXT NOT NULL,
    "armyId" TEXT,
    "name" TEXT NOT NULL,
    "faction" TEXT NOT NULL,
    "level" INTEGER NOT NULL DEFAULT 1,
    "xp" INTEGER NOT NULL DEFAULT 0,
    "xpNext" INTEGER NOT NULL DEFAULT 100,
    "hp" INTEGER NOT NULL DEFAULT 100,
    "maxHp" INTEGER NOT NULL DEFAULT 100,
    "fightingStrength" INTEGER NOT NULL DEFAULT 40,
    "attackBonus" INTEGER NOT NULL DEFAULT 0,
    "defenseBonus" INTEGER NOT NULL DEFAULT 0,
    "resourceBonus" INTEGER NOT NULL DEFAULT 0,
    "skillPoints" INTEGER NOT NULL DEFAULT 0,
    "isAlive" BOOLEAN NOT NULL DEFAULT true,
    "revivesAt" DATETIME,
    "isOnAdventure" BOOLEAN NOT NULL DEFAULT false,
    "adventureEndsAt" DATETIME,
    "adventureTileId" TEXT,
    "tileId" TEXT,
    CONSTRAINT "Hero_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Hero_armyId_fkey" FOREIGN KEY ("armyId") REFERENCES "Army" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "HeroEquipment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "heroId" TEXT NOT NULL,
    "slot" TEXT NOT NULL,
    "item" TEXT NOT NULL,
    "tier" INTEGER NOT NULL DEFAULT 1,
    "bonusJson" TEXT NOT NULL DEFAULT '{}',
    CONSTRAINT "HeroEquipment_heroId_fkey" FOREIGN KEY ("heroId") REFERENCES "Hero" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Battle" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "gameId" TEXT NOT NULL,
    "tileId" TEXT NOT NULL,
    "attackerId" TEXT NOT NULL,
    "defenderId" TEXT,
    "resultJson" TEXT NOT NULL DEFAULT '{}',
    "type" TEXT NOT NULL DEFAULT 'ATTACK',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Battle_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "BattleArmy" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "battleId" TEXT NOT NULL,
    "armyId" TEXT NOT NULL,
    "side" TEXT NOT NULL,
    CONSTRAINT "BattleArmy_battleId_fkey" FOREIGN KEY ("battleId") REFERENCES "Battle" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "BattleArmy_armyId_fkey" FOREIGN KEY ("armyId") REFERENCES "Army" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SpyReport" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "gameId" TEXT NOT NULL,
    "tileId" TEXT NOT NULL,
    "reportJson" TEXT NOT NULL DEFAULT '{}',
    "success" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SpyReport_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "Tile_gameId_x_y_key" ON "Tile"("gameId", "x", "y");

-- CreateIndex
CREATE UNIQUE INDEX "Village_tileId_key" ON "Village"("tileId");

-- CreateIndex
CREATE UNIQUE INDEX "ArmyPosition_armyId_tileId_key" ON "ArmyPosition"("armyId", "tileId");

-- CreateIndex
CREATE UNIQUE INDEX "Camp_tileId_key" ON "Camp"("tileId");

-- CreateIndex
CREATE UNIQUE INDEX "Hero_gameId_key" ON "Hero"("gameId");

-- CreateIndex
CREATE UNIQUE INDEX "Hero_armyId_key" ON "Hero"("armyId");

-- CreateIndex
CREATE UNIQUE INDEX "HeroEquipment_heroId_slot_key" ON "HeroEquipment"("heroId", "slot");
