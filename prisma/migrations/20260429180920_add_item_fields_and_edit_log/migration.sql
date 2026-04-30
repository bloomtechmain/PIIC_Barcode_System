-- AlterTable
ALTER TABLE "items" ADD COLUMN     "grossWeight" DECIMAL(8,3),
ADD COLUMN     "karatage" INTEGER,
ADD COLUMN     "remarks" TEXT,
ADD COLUMN     "ticketNo" TEXT;

-- CreateTable
CREATE TABLE "item_edit_logs" (
    "id" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "editedById" TEXT NOT NULL,
    "field" TEXT NOT NULL,
    "oldValue" TEXT NOT NULL,
    "newValue" TEXT NOT NULL,
    "editedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "item_edit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "item_edit_logs_itemId_idx" ON "item_edit_logs"("itemId");

-- CreateIndex
CREATE INDEX "items_ticketNo_idx" ON "items"("ticketNo");

-- AddForeignKey
ALTER TABLE "item_edit_logs" ADD CONSTRAINT "item_edit_logs_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "item_edit_logs" ADD CONSTRAINT "item_edit_logs_editedById_fkey" FOREIGN KEY ("editedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
