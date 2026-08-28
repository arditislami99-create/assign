-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'STAFF');
CREATE TYPE "ShootStatus" AS ENUM ('CONFIRMED', 'TENTATIVE', 'CANCELLED');
CREATE TYPE "AssignmentStatus" AS ENUM ('CONFIRMED', 'TENTATIVE', 'DECLINED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'STAFF',
    "phone" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductionRole" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ProductionRole_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Shoot" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "client" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "callTime" TEXT NOT NULL,
    "wrapTime" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "notes" TEXT,
    "status" "ShootStatus" NOT NULL DEFAULT 'CONFIRMED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Shoot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Assignment" (
    "id" TEXT NOT NULL,
    "shootId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "status" "AssignmentStatus" NOT NULL DEFAULT 'TENTATIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Assignment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "ProductionRole_name_key" ON "ProductionRole"("name");
CREATE UNIQUE INDEX "Assignment_shootId_userId_key" ON "Assignment"("shootId", "userId");
CREATE INDEX "User_role_idx" ON "User"("role");
CREATE INDEX "Shoot_date_idx" ON "Shoot"("date");
CREATE INDEX "Shoot_status_idx" ON "Shoot"("status");
CREATE INDEX "Assignment_userId_idx" ON "Assignment"("userId");
CREATE INDEX "Assignment_role_idx" ON "Assignment"("role");

-- AddForeignKey
ALTER TABLE "Assignment" ADD CONSTRAINT "Assignment_shootId_fkey" FOREIGN KEY ("shootId") REFERENCES "Shoot"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Assignment" ADD CONSTRAINT "Assignment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;