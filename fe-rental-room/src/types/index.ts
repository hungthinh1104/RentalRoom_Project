/**
 * Core types matching backend NestJS API schema
 */

import {
	UserRole,
	PropertyType,
	RoomStatus,
	AmenityType,
	ApplicationStatus,
	ContractStatus,
	InvoiceStatus,
	PaymentStatus,
	PaymentMethod,
	ServiceType,
	BillingMethod,
	MaintenancePriority,
	MaintenanceStatus,
	NotificationType,
} from './enums';

// ============= User & Auth =============
export interface User {
	id: string;
	email: string;
	fullName: string;
	phoneNumber: string | null;
	role: UserRole;
	isEmailVerified: boolean;
	createdAt: string;
	updatedAt: string;
}

export interface Landlord {
	id: string;
	userId: string;
	user?: User;
	citizenId: string | null;
	dateOfBirth: string | null;
	address: string | null;
	bankAccount: string | null;
	bankName: string | null;
	createdAt: string;
	updatedAt: string;
}

export interface Tenant {
	id: string;
	userId: string;
	user?: User;
	citizenId: string | null;
	dateOfBirth: string | null;
	address: string | null;
	emergencyContact: string | null;
	createdAt: string;
	updatedAt: string;
}

export interface AuthResponse {
	access_token: string;
	refresh_token: string;
	user: User;
}

// ============= Property & Room =============
export interface Property {
	id: string;
	landlordId: string;
	landlord?: Landlord;
	name: string;
	address: string;
	city: string;
	cityCode?: string | null;
	ward: string;
	wardCode?: string | null;
	propertyType: PropertyType;
	totalRooms: number;
	description: string | null;
	createdAt: string;
	updatedAt: string;
	rooms?: Room[];
}

export interface Room {
	id: string;
	propertyId: string;
	property?: Property;
	roomNumber: string;
	area: number;
	pricePerMonth: number;
	deposit: number;
	status: RoomStatus;
	description: string | null;
	maxOccupants: number | null;
	deletedAt: string | null;
	createdAt: string;
	updatedAt: string;
	averageRating?: number;
	reviewCount?: number;
	amenities?: AmenityType[];
	images?: string[];
	reviews?: RoomReview[];
}

export interface RoomAmenity {
	id: string;
	roomId: string;
	amenityType: AmenityType;
	description: string | null;
}

export interface RoomImage {
	id: string;
	roomId: string;
	imageUrl: string;
	isPrimary: boolean;
	uploadedAt: string;
}

export interface RoomReview {
	id: string;
	roomId: string;
	tenantId: string;
	tenant?: Tenant;
	rating: number;
	comment: string | null;
	createdAt: string;
}

// ============= Contract & Application =============
export interface RentalApplication {
	id: string;
	tenantId: string;
	tenant?: Tenant;
	roomId: string;
	room?: Room;
	status: ApplicationStatus;
	message: string | null;
	createdAt: string;
	updatedAt: string;
	contractId: string | null;
	contract?: Contract;
	landlordId: string;
	landlord?: Landlord;
	rejectionReason: string | null;
	// Denormalized fields returned by backend for UI convenience
	tenantName?: string;
	tenantEmail?: string;
	tenantPhone?: string | null;
	roomNumber?: string;
	roomAddress?: string;
}

export interface Contract {
	id: string;
	contractNumber: string;
	tenantId: string;
	tenant?: Tenant;
	landlordId: string;
	landlord?: Landlord;
	roomId: string;
	room?: Room;
	applicationId: string | null;
	application?: RentalApplication;
	startDate: string;
	endDate: string;
	monthlyRent: number;
	deposit: number;
	paymentDay?: number;
	residents?: Array<{
		id?: string;
		fullName: string;
		citizenId?: string;
		relationship: 'SPOUSE' | 'CHILD' | 'PARENT' | 'FRIEND' | 'OTHER';
		phoneNumber?: string;
	}>;
	maxOccupants?: number;
	terms: string | null;
	status: ContractStatus;
	createdAt: string;
	updatedAt: string;
}

// ============= Billing & Payment =============
export interface Invoice {
	id: string;
	contractId: string;
	contract?: Contract;
	invoiceNumber: string;
	billingMonth: string;
	dueDate: string;
	totalAmount: number;
	status: InvoiceStatus;
	createdAt: string;
	updatedAt: string;
	lineItems?: InvoiceLineItem[];
}

export interface InvoiceLineItem {
	id: string;
	invoiceId: string;
	description: string;
	quantity: number;
	unitPrice: number;
	amount: number;
}

export interface Payment {
	id: string;
	invoiceId: string;
	invoice?: Invoice;
	tenantId: string;
	tenant?: Tenant;
	amount: number;
	paymentMethod: PaymentMethod;
	paymentDate: string;
	status: PaymentStatus;
	transactionId: string | null;
	createdAt: string;
	updatedAt: string;
}

export interface Service {
	id: string;
	propertyId: string;
	property?: Property;
	serviceName: string;
	serviceType: ServiceType;
	unitPrice: number;
	billingMethod: BillingMethod;
	createdAt: string;
	updatedAt: string;
}

// ============= Maintenance & Notification =============
export interface MaintenanceRequest {
	id: string;
	roomId: string;
	room?: Room;
	tenantId: string;
	tenant?: Tenant;
	title: string;
	description: string | null;
	priority: MaintenancePriority;
	status: MaintenanceStatus;
	category: string | null;
	completedAt: string | null;
	createdAt: string;
	updatedAt: string;
}

export interface Notification {
	id: string;
	userId: string;
	user?: User;
	type: NotificationType;
	title: string;
	message: string;
	isRead: boolean;
	createdAt: string;
}

// ============= AI Module =============
export interface RoomEmbedding {
	id: string;
	roomId: string;
	room?: Room;
	rawText: string;
	embedding: number[]; // 768 dimensions
	generatedAt: string;
}

export interface AIAnalysisResult {
	amenities: string[];
	sentiment: string;
	estimated_price_range: string;
	room_type: string;
	key_features: string[];
}

export interface AIChatRoom {
	id: string;
	roomNumber: string;
	price: number;
	propertyName?: string;
	area?: number;
	status?: string;
}

export interface AIChatResponse {
	response: string;
	rooms?: AIChatRoom[];
	model: string;
	timestamp: string;
}

// ============= DTOs =============
export interface PaginationParams {
	page?: number;
	limit?: number;
	sortBy?: string;
	sortOrder?: 'ASC' | 'DESC';
}

export interface PaginatedResponse<T> {
	data: T[];
	meta: {
		total: number;
		page: number;
		limit: number;
		totalPages: number;
	};
}

export interface CreatePropertyDto {
	landlordId: string;
	name: string;
	address: string;
	city: string;
	cityCode?: string;
	ward: string;
	wardCode?: string;
	propertyType: PropertyType;
	description?: string;
}

export interface CreateRoomDto {
	propertyId: string;
	roomNumber: string;
	area: number;
	pricePerMonth: number;
	deposit: number;
	maxOccupants?: number;
	status: RoomStatus;
	description?: string;
	images?: string[];
	amenities?: AmenityType[];
}

export interface CreateContractDto {
	tenantId: string;
	landlordId: string;
	roomId: string;
	applicationId?: string;
	startDate: string;
	endDate: string;
	monthlyRent: number;
	deposit: number;
	paymentDay?: number;
	maxOccupants?: number;
	residents?: Array<{
		fullName: string;
		citizenId?: string;
		relationship: string;
		phoneNumber?: string;
	}>;
	terms?: string;
}

export interface CreatePaymentDto {
	invoiceId: string;
	tenantId: string;
	amount: number;
	paymentMethod: PaymentMethod;
	paymentDate: string;
}

export interface LoginDto {
	email: string;
	password: string;
}

export interface RegisterDto {
	email: string;
	password: string;
	fullName: string;
	phone: string;
	role: UserRole;
}

export { UserRole, PropertyType, RoomStatus, PaymentMethod, ContractStatus, ApplicationStatus, PaymentStatus };