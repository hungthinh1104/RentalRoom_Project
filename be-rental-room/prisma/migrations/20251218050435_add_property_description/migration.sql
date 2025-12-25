/*
  Warnings:

  - Made the column `termination_approved` on table `contract` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "contract" DROP CONSTRAINT "contract_terminated_by_user_id_fkey";

-- AlterTable
ALTER TABLE "contract" ALTER COLUMN "termination_approved" SET NOT NULL;

-- AlterTable
ALTER TABLE "property" ADD COLUMN     "description" TEXT;

-- AlterTable
ALTER TABLE "search_cache" ALTER COLUMN "expires_at" SET DEFAULT now() + INTERVAL '7 DAYS';

-- AddForeignKey
ALTER TABLE "contract" ADD CONSTRAINT "contract_terminated_by_user_id_fkey" FOREIGN KEY ("terminated_by_user_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
