import { Contract } from "@/types";
import { FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ContractCard } from "./contract-card";
import { ContractTable } from "./contract-table";

interface ContractListProps {
  contracts: Contract[];
  isLoading?: boolean;
}

export function ContractList({ contracts, isLoading }: ContractListProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-[300px] rounded-2xl bg-muted animate-pulse" />
        ))}
      </div>
    );
  }

  if (contracts.length === 0) {
    return (
      <div className="text-center py-12 px-4">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
          <FileText className="w-8 h-8 text-muted-foreground" />
        </div>
        <h3 className="font-semibold text-foreground mb-1">Chưa có hợp đồng</h3>
        <p className="text-sm text-muted-foreground mb-4">Bắt đầu tạo hợp đồng đầu tiên của bạn</p>
        <Button size="sm" onClick={() => window.location.href = '/dashboard/landlord/contracts/new'}>
          Tạo hợp đồng
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="hidden md:block">
        <ContractTable data={contracts} />
      </div>
      <div className="grid grid-cols-1 gap-6 md:hidden">
        {contracts.map((contract) => (
          <ContractCard key={contract.id} contract={contract} />
        ))}
      </div>
    </>
  );
}
