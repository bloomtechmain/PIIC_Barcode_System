-- AlterTable
ALTER TABLE "audit_items" ADD COLUMN     "remarks" TEXT;

-- CreateTable
CREATE TABLE "item_corrections" (
    "id" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "auditId" TEXT NOT NULL,
    "auditItemId" TEXT NOT NULL,
    "field" TEXT NOT NULL,
    "oldValue" TEXT NOT NULL,
    "newValue" TEXT NOT NULL,
    "correctedById" TEXT NOT NULL,
    "correctedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "item_corrections_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "item_corrections_itemId_idx" ON "item_corrections"("itemId");

-- CreateIndex
CREATE INDEX "item_corrections_auditId_idx" ON "item_corrections"("auditId");

-- CreateIndex
CREATE INDEX "item_corrections_auditItemId_idx" ON "item_corrections"("auditItemId");

-- AddForeignKey
ALTER TABLE "item_corrections" ADD CONSTRAINT "item_corrections_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "item_corrections" ADD CONSTRAINT "item_corrections_auditId_fkey" FOREIGN KEY ("auditId") REFERENCES "audits"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "item_corrections" ADD CONSTRAINT "item_corrections_auditItemId_fkey" FOREIGN KEY ("auditItemId") REFERENCES "audit_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "item_corrections" ADD CONSTRAINT "item_corrections_correctedById_fkey" FOREIGN KEY ("correctedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
