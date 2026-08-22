-- AlterTable
ALTER TABLE "Guardian" ADD COLUMN     "icNumber" TEXT,
ADD COLUMN     "whatsapp" TEXT;

-- AlterTable
ALTER TABLE "Student" ADD COLUMN     "emergencyContactName" TEXT,
ADD COLUMN     "emergencyContactPhone" TEXT,
ADD COLUMN     "icNumber" TEXT,
ADD COLUMN     "invoiceDueDay" INTEGER,
ADD COLUMN     "medicalNotes" TEXT,
ADD COLUMN     "referralSource" TEXT,
ADD COLUMN     "schoolType" TEXT;
