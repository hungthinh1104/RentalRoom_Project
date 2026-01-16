export enum FeedbackType {
    BUG_REPORT = 'BUG_REPORT',
    FEATURE_REQUEST = 'FEATURE_REQUEST',
    GENERAL = 'GENERAL',
}

export enum FeedbackPriority {
    LOW = 'LOW',
    MEDIUM = 'MEDIUM',
    HIGH = 'HIGH',
    CRITICAL = 'CRITICAL',
}

export enum FeedbackStatus {
    PENDING = 'PENDING',
    IN_PROGRESS = 'IN_PROGRESS',
    RESOLVED = 'RESOLVED',
    REJECTED = 'REJECTED',
}

export enum UserAiFeedback {
    HELPFUL = 'HELPFUL',
    NOT_HELPFUL = 'NOT_HELPFUL',
    INACCURATE = 'INACCURATE',
    OFFENSIVE = 'OFFENSIVE',
}

export interface SystemFeedback {
    id: string;
    type: FeedbackType;
    title: string;
    description: string;
    priority: FeedbackPriority;
    status: FeedbackStatus;
    userId: string;
    user?: {
        fullName: string;
        email: string;
    };
    adminNotes?: string;
    createdAt: string;
    updatedAt: string;
}

export interface CreateSystemFeedbackDto {
    type: FeedbackType;
    title: string;
    description: string;
    priority: FeedbackPriority;
}

export interface UpdateFeedbackStatusDto {
    status: FeedbackStatus;
    adminNotes?: string;
}

export interface MaintenanceFeedbackDto {
    rating: number; // 1-5
    feedback: string;
}

export interface ReviewReplyDto {
    landlordReply: string;
}

export interface AiFeedbackDto {
    interactionId: string;
    userFeedback: UserAiFeedback;
    feedbackReason?: string;
}
