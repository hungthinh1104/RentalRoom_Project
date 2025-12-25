"use client";
import type { Contract } from '@/types';

export function ContractTerms({ contract }: { contract: Contract }) {
  return (
    <div className="space-y-2">
      <h4 className="text-sm font-medium">Điều khoản hợp đồng</h4>
      <div className="prose max-w-none text-sm text-muted-foreground whitespace-pre-wrap border rounded-lg p-3 bg-card/60">
        {contract.terms ?? 'Không có điều khoản.'}
      </div>
    </div>
  );
}
