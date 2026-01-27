"use client";

import { useState } from "react";
import { MessageSquare, MoreHorizontal, Filter, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAdminFeedback, useSystemFeedback } from "@/features/feedback/hooks/use-system-feedback";
import { FeedbackPriority, FeedbackStatus, FeedbackType, SystemFeedback } from "@/features/feedback/types";
import { Skeleton } from "@/components/ui/skeleton";

export default function AdminFeedbackPage() {
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [selectedFeedback, setSelectedFeedback] = useState<SystemFeedback | null>(null);
    const [isResponseOpen, setIsResponseOpen] = useState(false);
    const [isStatusOpen, setIsStatusOpen] = useState(false);
    const [responseText, setResponseText] = useState("");
    const [newStatus, setNewStatus] = useState<FeedbackStatus>(FeedbackStatus.PENDING);

    const { data, isLoading } = useAdminFeedback({
        status: statusFilter !== "all" ? statusFilter : undefined,
    });

    const { replyToFeedback, updateStatus, isReplying, isUpdating } = useSystemFeedback();

    const feedbacks = data?.data || [];

    const handleReply = () => {
        if (!selectedFeedback) return;
        replyToFeedback(
            { id: selectedFeedback.id, response: responseText },
            {
                onSuccess: () => {
                    setIsResponseOpen(false);
                    setResponseText("");
                    setSelectedFeedback(null);
                }
            }
        );
    };

    const handleUpdateStatus = () => {
        if (!selectedFeedback) return;
        updateStatus(
            { id: selectedFeedback.id, data: { status: newStatus } },
            {
                onSuccess: () => {
                    setIsStatusOpen(false);
                    setSelectedFeedback(null);
                }
            }
        );
    };

    const openReplyDialog = (feedback: SystemFeedback) => {
        setSelectedFeedback(feedback);
        setResponseText(feedback.adminResponse || "");
        setIsResponseOpen(true);
    };

    const openStatusDialog = (feedback: SystemFeedback) => {
        setSelectedFeedback(feedback);
        setNewStatus(feedback.status);
        setIsStatusOpen(true);
    };

    const getStatusBadge = (status: FeedbackStatus) => {
        switch (status) {
            case FeedbackStatus.PENDING:
                return <Badge variant="outline" className="bg-warning/10 text-warning border-warning/20">Pending</Badge>;
            case FeedbackStatus.IN_PROGRESS:
                return <Badge variant="outline" className="bg-info/10 text-info border-info/20">In Progress</Badge>;
            case FeedbackStatus.RESOLVED:
                return <Badge variant="outline" className="bg-success/10 text-success border-success/20">Resolved</Badge>;
            case FeedbackStatus.REJECTED:
                return <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20">Rejected</Badge>;
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    return (
        <div className="container py-8 max-w-[1600px] space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">System Feedback</h1>
                    <p className="text-muted-foreground mt-2">
                        Manage user feedback, bug reports, and feature requests.
                    </p>
                </div>
            </div>

            <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Filter by Status:</span>
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="All Status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value={FeedbackStatus.PENDING}>Pending</SelectItem>
                        <SelectItem value={FeedbackStatus.IN_PROGRESS}>In Progress</SelectItem>
                        <SelectItem value={FeedbackStatus.RESOLVED}>Resolved</SelectItem>
                        <SelectItem value={FeedbackStatus.REJECTED}>Rejected</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>All Feedback</CardTitle>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="space-y-4">
                            {[1, 2, 3, 4, 5].map((i) => (
                                <Skeleton key={i} className="h-12 w-full" />
                            ))}
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Type</TableHead>
                                    <TableHead>Title</TableHead>
                                    <TableHead>User</TableHead>
                                    <TableHead>Priority</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Created At</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {feedbacks.map((feedback: SystemFeedback) => (
                                    <TableRow key={feedback.id}>
                                        <TableCell>
                                            <Badge variant="secondary">{feedback.type}</Badge>
                                        </TableCell>
                                        <TableCell className="font-medium max-w-[300px] truncate" title={feedback.title}>
                                            {feedback.title}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="text-sm font-medium">User ID: {feedback.userId.substring(0, 8)}...</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={feedback.priority === FeedbackPriority.CRITICAL ? "destructive" : "outline"}>
                                                {feedback.priority}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            {getStatusBadge(feedback.status)}
                                        </TableCell>
                                        <TableCell>
                                            {new Date(feedback.createdAt).toLocaleDateString()}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" className="h-8 w-8 p-0">
                                                        <span className="sr-only">Open menu</span>
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                    <DropdownMenuItem onClick={() => openReplyDialog(feedback)}>
                                                        Reponse / View Details
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => openStatusDialog(feedback)}>
                                                        Update Status
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {feedbacks.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={7} className="h-24 text-center">
                                            No feedback found.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            {/* Response Dialog */}
            <Dialog open={isResponseOpen} onOpenChange={setIsResponseOpen}>
                <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                        <DialogTitle>Feedback Details & Response</DialogTitle>
                        <DialogDescription>
                            Review feedback and send a response to the user.
                        </DialogDescription>
                    </DialogHeader>
                    {selectedFeedback && (
                        <div className="space-y-4 py-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <h4 className="text-sm font-medium text-muted-foreground">Type</h4>
                                    <p className="text-sm">{selectedFeedback.type}</p>
                                </div>
                                <div>
                                    <h4 className="text-sm font-medium text-muted-foreground">Priority</h4>
                                    <p className="text-sm">{selectedFeedback.priority}</p>
                                </div>
                            </div>
                            <div>
                                <h4 className="text-sm font-medium text-muted-foreground">Title</h4>
                                <p className="text-sm font-semibold">{selectedFeedback.title}</p>
                            </div>
                            <div className="bg-muted/30 p-3 rounded-md">
                                <h4 className="text-sm font-medium text-muted-foreground mb-1">Description</h4>
                                <p className="text-sm whitespace-pre-wrap">{selectedFeedback.description}</p>
                            </div>
                            <div className="space-y-2">
                                <h4 className="text-sm font-medium">Your Response</h4>
                                <Textarea
                                    value={responseText}
                                    onChange={(e) => setResponseText(e.target.value)}
                                    placeholder="Type your response here..."
                                    className="min-h-[100px]"
                                />
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsResponseOpen(false)}>Cancel</Button>
                        <Button onClick={handleReply} disabled={isReplying}>
                            {isReplying ? "Sending..." : "Send Response"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Status Dialog */}
            <Dialog open={isStatusOpen} onOpenChange={setIsStatusOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Update Status</DialogTitle>
                        <DialogDescription>
                            Change the status of this feedback ticket.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <Select value={newStatus} onValueChange={(v) => setNewStatus(v as FeedbackStatus)}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value={FeedbackStatus.PENDING}>Pending</SelectItem>
                                <SelectItem value={FeedbackStatus.IN_PROGRESS}>In Progress</SelectItem>
                                <SelectItem value={FeedbackStatus.RESOLVED}>Resolved</SelectItem>
                                <SelectItem value={FeedbackStatus.REJECTED}>Rejected</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsStatusOpen(false)}>Cancel</Button>
                        <Button onClick={handleUpdateStatus} disabled={isUpdating}>
                            {isUpdating ? "Updating..." : "Update Status"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
