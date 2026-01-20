"use client";

import { Contract } from "@/types";
import { InvoiceList } from "../invoice-list";
import { ContractStatus } from "@/types/enums";

interface ContractInvoicesProps {
    contract: Contract;
}

export function ContractInvoices({ contract }: ContractInvoicesProps) {
    const isVisible = [ContractStatus.ACTIVE, ContractStatus.TERMINATED, ContractStatus.EXPIRED].includes(contract.status as ContractStatus);

    if (!isVisible) {
        return (
            <div className="flex flex-col items-center justify-center p-8 text-center border-2 border-dashed rounded-xl bg-muted/20">
                <p className="text-muted-foreground">
                    Hóa đơn sẽ xuất hiện tại đây sau khi hợp đồng chính thức có hiệu lực.
                </p>
            </div>
        );
    }

    const invoices = contract.invoices || [];

    return (
        <div className="space-y-6">
            <InvoiceList loading={false} invoices={invoices} />
        </div>
    );
}
