"use client";

import type { Contract } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Shield } from 'lucide-react';

export function ContractTerms({ contract }: { contract: Contract }) {
  return (
    <Card>
      <CardHeader className="bg-muted/30 pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Shield className="h-5 w-5 text-primary" />
          Điều khoản & Quy định
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        {contract.terms ? (
          <div className="prose prose-sm max-w-none text-muted-foreground whitespace-pre-wrap">
            {contract.terms}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground bg-muted/20 rounded-lg border-2 border-dashed">
            <FileText className="h-8 w-8 mb-2 opacity-50" />
            <p>Không có điều khoản bổ sung đặc biệt.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
