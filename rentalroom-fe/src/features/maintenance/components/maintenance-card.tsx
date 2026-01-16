"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import type { MaintenanceRequestSummary } from "../types";
import { Wrench, Clock } from "lucide-react";

interface MaintenanceCardProps {
    request: MaintenanceRequestSummary;
}

const getStatusVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
        case "PENDING": return "outline";
        case "IN_PROGRESS": return "default";
        case "COMPLETED": return "secondary";
        case "CANCELLED": return "destructive";
        default: return "outline";
    }
};

const getPriorityVariant = (priority: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (priority) {
        case "LOW": return "secondary";
        case "MEDIUM": return "outline";
        case "HIGH": return "default";
        case "URGENT": return "destructive";
        default: return "outline";
    }
};

export function MaintenanceCard({ request }: MaintenanceCardProps) {
    return (
        <Card className="rounded-2xl border border-border/80 bg-card/80 p-4 space-y-3">
            <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 flex-1">
                    <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Wrench className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-base truncate">{request.title}</h3>
                        <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                            {request.description}
                        </p>
                    </div>
                </div>
                <Badge variant={getStatusVariant(request.status)} className="flex-shrink-0">
                    {request.status}
                </Badge>
            </div>

            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span>{request.requestDate ? format(new Date(request.requestDate), "dd/MM/yyyy") : format(new Date(request.createdAt), "dd/MM/yyyy")}</span>
                </div>
                <Badge variant={getPriorityVariant(request.priority)} className="text-xs">
                    {request.priority}
                </Badge>
                <Badge variant="outline" className="text-xs">
                    {request.category}
                </Badge>
            </div>
        </Card>
    );
}
