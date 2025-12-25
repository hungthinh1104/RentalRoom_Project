import Link from "next/link";
import { Calendar, DollarSign, User, MapPin } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Contract } from "@/types";
import { ContractStatus } from "@/types/enums";

interface ContractCardProps {
  contract: Contract;
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function getStatusVariant(status: ContractStatus): "default" | "secondary" {
  switch (status) {
    case ContractStatus.ACTIVE:
      return "default";
    case ContractStatus.EXPIRED:
    case ContractStatus.TERMINATED:
      return "secondary";
    default:
      return "secondary";
  }
}

export function ContractCard({ contract }: ContractCardProps) {
  return (
    <Card className="flex flex-col h-full group hover:shadow-[0_20px_50px_rgba(0,0,0,0.15)] transition-all duration-300">
      <CardContent className="px-5 flex flex-col h-full">
        <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <h3 className="font-semibold text-lg">
            Room {contract.room?.roomNumber}
          </h3>
          <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
            <MapPin className="size-3" />
            {contract.room?.property?.name || "Unknown Property"}
          </p>
        </div>
        <Badge variant={getStatusVariant(contract.status)}>
          {contract.status}
        </Badge>
      </div>

      <div className="space-y-3 text-sm">
        <div className="flex items-center gap-2">
          <User className="size-4 text-muted-foreground" />
          <span className="text-muted-foreground">Tenant:</span>
          <span className="font-medium">{contract.tenant?.user?.fullName || "N/A"}</span>
        </div>

        <div className="flex items-center gap-2">
          <Calendar className="size-4 text-muted-foreground" />
          <span className="text-muted-foreground">Duration:</span>
          <span className="font-medium">
            {formatDate(contract.startDate)} - {formatDate(contract.endDate)}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <DollarSign className="size-4 text-muted-foreground" />
          <span className="text-muted-foreground">Rent:</span>
          <span className="font-medium text-primary">
            ${contract.monthlyRent.toLocaleString()}/month
          </span>
        </div>
      </div>

        <div className="mt-auto pt-4">
          <Button asChild className="w-full" variant="outline">
            <Link href={`/contracts/${contract.id}`}>View Details</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
