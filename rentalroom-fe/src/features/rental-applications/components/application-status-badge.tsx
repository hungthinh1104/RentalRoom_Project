import { Badge } from "@/components/ui/badge";
import { ApplicationStatus } from "@/types";

type Props = {
    status: ApplicationStatus;
};

export function ApplicationStatusBadge({ status }: Props) {
    switch (status) {
        case ApplicationStatus.APPROVED:
            return <Badge className="bg-success-light text-success border-success/20">Đã duyệt</Badge>;
        case ApplicationStatus.REJECTED:
            return <Badge className="bg-destructive-light text-destructive border-destructive/20">Bị từ chối</Badge>;
        case ApplicationStatus.WITHDRAWN:
            return <Badge className="bg-muted text-muted-foreground border-border">Đã rút</Badge>;
        case ApplicationStatus.COMPLETED:
            return <Badge className="bg-info/10 text-info border-info/20">Hoàn tất</Badge>;
        default:
            return <Badge className="bg-warning-light text-warning border-warning/20">Chờ duyệt</Badge>;
    }
}
