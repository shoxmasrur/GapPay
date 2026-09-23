-- CreateEnum
CREATE TYPE "ObligationStatus" AS ENUM ('PENDING', 'PARTIAL', 'PAID', 'OVERDUE');

-- AlterTable
ALTER TABLE "Payment" ADD COLUMN     "obligationId" TEXT;

-- CreateTable
CREATE TABLE "PaymentObligation" (
    "id" TEXT NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "dueDate" TIMESTAMP(3),
    "status" "ObligationStatus" NOT NULL DEFAULT 'PENDING',
    "memberId" INTEGER NOT NULL,
    "roundId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaymentObligation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PaymentObligation_roundId_idx" ON "PaymentObligation"("roundId");

-- CreateIndex
CREATE INDEX "PaymentObligation_memberId_idx" ON "PaymentObligation"("memberId");

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_obligationId_fkey" FOREIGN KEY ("obligationId") REFERENCES "PaymentObligation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentObligation" ADD CONSTRAINT "PaymentObligation_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "GapMember"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentObligation" ADD CONSTRAINT "PaymentObligation_roundId_fkey" FOREIGN KEY ("roundId") REFERENCES "Round"("id") ON DELETE CASCADE ON UPDATE CASCADE;
