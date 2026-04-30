-- CreateEnum
CREATE TYPE "AuditType" AS ENUM ('STANDARD', 'INITIAL');

-- AlterTable
ALTER TABLE "audits" ADD COLUMN     "auditType" "AuditType" NOT NULL DEFAULT 'STANDARD',
ADD COLUMN     "filterBranchId" TEXT,
ADD COLUMN     "filterDateFrom" TIMESTAMP(3),
ADD COLUMN     "filterDateTo" TIMESTAMP(3);
