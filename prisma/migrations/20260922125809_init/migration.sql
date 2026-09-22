/*
  Warnings:

  - Added the required column `duration` to the `Gap` table without a default value. This is not possible if the table is not empty.
  - Added the required column `monthlyAmount` to the `Gap` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "GapStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "RoundStatus" AS ENUM ('PENDING', 'ACTIVE', 'COMPLETED');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PAID');

-- AlterTable
ALTER TABLE "Gap" ADD COLUMN     "duration" INTEGER NOT NULL,
ADD COLUMN     "monthlyAmount" INTEGER NOT NULL,
ADD COLUMN     "status" "GapStatus" NOT NULL DEFAULT 'ACTIVE';

-- CreateTable
CREATE TABLE "GapMember" (
    "id" SERIAL NOT NULL,
    "gapId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "joinAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GapMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Round" (
    "id" SERIAL NOT NULL,
    "gapId" INTEGER NOT NULL,
    "roundNumber" INTEGER NOT NULL,
    "receiverId" INTEGER NOT NULL,
    "status" "RoundStatus" NOT NULL DEFAULT 'PENDING',
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Round_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" SERIAL NOT NULL,
    "roundId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "amount" INTEGER NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "GapMember_gapId_userId_key" ON "GapMember"("gapId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "Round_gapId_roundNumber_key" ON "Round"("gapId", "roundNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_roundId_userId_key" ON "Payment"("roundId", "userId");

-- AddForeignKey
ALTER TABLE "GapMember" ADD CONSTRAINT "GapMember_gapId_fkey" FOREIGN KEY ("gapId") REFERENCES "Gap"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GapMember" ADD CONSTRAINT "GapMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Round" ADD CONSTRAINT "Round_gapId_fkey" FOREIGN KEY ("gapId") REFERENCES "Gap"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Round" ADD CONSTRAINT "Round_receiverId_fkey" FOREIGN KEY ("receiverId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_roundId_fkey" FOREIGN KEY ("roundId") REFERENCES "Round"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
