-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'STAFF');

-- CreateEnum
CREATE TYPE "ItemStatus" AS ENUM ('ACTIVE', 'RELEASED');

-- CreateEnum
CREATE TYPE "AuditItemStatus" AS ENUM ('FOUND', 'MISSING', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "ScanType" AS ENUM ('AUDIT', 'CREATE', 'VERIFY');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'STAFF',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customers" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nic" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "address" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "items" (
    "id" TEXT NOT NULL,
    "barcode" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "itemType" TEXT NOT NULL,
    "weight" DECIMAL(8,3) NOT NULL,
    "description" TEXT,
    "pawnDate" TIMESTAMP(3) NOT NULL,
    "status" "ItemStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "releases" (
    "id" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "releasedById" TEXT NOT NULL,
    "releaseDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "releases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audits" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdById" TEXT NOT NULL,
    "totalItemsAtTime" INTEGER NOT NULL,
    "notes" TEXT,
    "finalizedAt" TIMESTAMP(3),

    CONSTRAINT "audits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_items" (
    "id" TEXT NOT NULL,
    "auditId" TEXT NOT NULL,
    "barcode" TEXT NOT NULL,
    "status" "AuditItemStatus" NOT NULL,
    "itemId" TEXT,

    CONSTRAINT "audit_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "barcode_logs" (
    "id" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "scannedById" TEXT,
    "scannedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "scanType" "ScanType" NOT NULL,

    CONSTRAINT "barcode_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "customers_nic_key" ON "customers"("nic");

-- CreateIndex
CREATE INDEX "customers_nic_idx" ON "customers"("nic");

-- CreateIndex
CREATE UNIQUE INDEX "items_barcode_key" ON "items"("barcode");

-- CreateIndex
CREATE INDEX "items_barcode_idx" ON "items"("barcode");

-- CreateIndex
CREATE INDEX "items_customerId_idx" ON "items"("customerId");

-- CreateIndex
CREATE INDEX "items_status_idx" ON "items"("status");

-- CreateIndex
CREATE INDEX "items_customerId_status_idx" ON "items"("customerId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "releases_itemId_key" ON "releases"("itemId");

-- CreateIndex
CREATE INDEX "releases_releasedById_idx" ON "releases"("releasedById");

-- CreateIndex
CREATE INDEX "releases_releaseDate_idx" ON "releases"("releaseDate");

-- CreateIndex
CREATE INDEX "audit_items_auditId_idx" ON "audit_items"("auditId");

-- CreateIndex
CREATE INDEX "audit_items_barcode_idx" ON "audit_items"("barcode");

-- CreateIndex
CREATE INDEX "audit_items_itemId_idx" ON "audit_items"("itemId");

-- CreateIndex
CREATE INDEX "audit_items_auditId_status_idx" ON "audit_items"("auditId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "audit_items_auditId_barcode_key" ON "audit_items"("auditId", "barcode");

-- CreateIndex
CREATE INDEX "barcode_logs_itemId_idx" ON "barcode_logs"("itemId");

-- CreateIndex
CREATE INDEX "barcode_logs_scanType_idx" ON "barcode_logs"("scanType");

-- CreateIndex
CREATE INDEX "barcode_logs_scannedAt_idx" ON "barcode_logs"("scannedAt");

-- AddForeignKey
ALTER TABLE "items" ADD CONSTRAINT "items_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "releases" ADD CONSTRAINT "releases_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "releases" ADD CONSTRAINT "releases_releasedById_fkey" FOREIGN KEY ("releasedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audits" ADD CONSTRAINT "audits_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_items" ADD CONSTRAINT "audit_items_auditId_fkey" FOREIGN KEY ("auditId") REFERENCES "audits"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_items" ADD CONSTRAINT "audit_items_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "items"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "barcode_logs" ADD CONSTRAINT "barcode_logs_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "barcode_logs" ADD CONSTRAINT "barcode_logs_scannedById_fkey" FOREIGN KEY ("scannedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
