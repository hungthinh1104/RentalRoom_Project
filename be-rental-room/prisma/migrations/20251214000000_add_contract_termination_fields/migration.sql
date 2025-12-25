-- Add termination tracking fields to Contract table
ALTER TABLE "contract" 
ADD COLUMN "termination_reason" TEXT,
ADD COLUMN "terminated_by_user_id" UUID,
ADD COLUMN "early_termination_penalty" DECIMAL(10,2) DEFAULT 0,
ADD COLUMN "notice_days" INTEGER DEFAULT 0,
ADD COLUMN "termination_approved" BOOLEAN DEFAULT false;

-- Add foreign key for terminated_by
ALTER TABLE "contract" 
ADD CONSTRAINT "contract_terminated_by_user_id_fkey" 
FOREIGN KEY ("terminated_by_user_id") REFERENCES "user"("id") ON DELETE SET NULL;

-- Create index for better query performance
CREATE INDEX "contract_terminated_by_user_id_idx" ON "contract"("terminated_by_user_id");
