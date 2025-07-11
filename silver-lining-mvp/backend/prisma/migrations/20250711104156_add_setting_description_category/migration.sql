-- AlterTable
ALTER TABLE "Setting" ADD COLUMN     "category" TEXT,
ADD COLUMN     "description" TEXT,
ALTER COLUMN "value" SET DATA TYPE TEXT;
