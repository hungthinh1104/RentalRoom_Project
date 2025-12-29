/**
 * Enums matching backend NestJS API
 * Source: be-rental-room/prisma/schema.prisma
 */

export enum UserRole {
	TENANT = 'TENANT',
	LANDLORD = 'LANDLORD',
	ADMIN = 'ADMIN',
}

export enum PropertyType {
	APARTMENT = 'APARTMENT',
	HOUSE = 'HOUSE',
	STUDIO = 'STUDIO',
}

export enum RoomStatus {
	AVAILABLE = 'AVAILABLE',
	OCCUPIED = 'OCCUPIED',
	MAINTENANCE = 'MAINTENANCE',
	RESERVED = 'RESERVED',
}

export enum AmenityType {
	AC = 'AC',
	FRIDGE = 'FRIDGE',
	WASHER = 'WASHER',
	BED = 'BED',
	WIFI = 'WIFI',
}

export enum ApplicationStatus {
	PENDING = 'PENDING',
	APPROVED = 'APPROVED',
	REJECTED = 'REJECTED',
	WITHDRAWN = 'WITHDRAWN',
	COMPLETED = 'COMPLETED',
}

export enum ContractStatus {
	DRAFT = 'DRAFT',
	PENDING_SIGNATURE = 'PENDING_SIGNATURE',
	DEPOSIT_PENDING = 'DEPOSIT_PENDING',
	ACTIVE = 'ACTIVE',
	TERMINATED = 'TERMINATED',
	EXPIRED = 'EXPIRED',
}

export enum InvoiceStatus {
	PENDING = 'PENDING',
	PAID = 'PAID',
	OVERDUE = 'OVERDUE',
}

export enum PaymentStatus {
	PENDING = 'PENDING',
	COMPLETED = 'COMPLETED',
	FAILED = 'FAILED',
}

export enum PaymentMethod {
	CASH = 'CASH',
	BANK_TRANSFER = 'BANK_TRANSFER',
	MOMO = 'MOMO',
	ZALOPAY = 'ZALOPAY',
}

export enum ServiceType {
	ELECTRICITY = 'ELECTRICITY',
	WATER = 'WATER',
	INTERNET = 'INTERNET',
	PARKING = 'PARKING',
	CLEANING = 'CLEANING',
}

export enum BillingMethod {
	FIXED = 'FIXED',
	METERED = 'METERED',
}

export enum MaintenancePriority {
	LOW = 'LOW',
	MEDIUM = 'MEDIUM',
	HIGH = 'HIGH',
	URGENT = 'URGENT',
}

export enum MaintenanceStatus {
	PENDING = 'PENDING',
	IN_PROGRESS = 'IN_PROGRESS',
	COMPLETED = 'COMPLETED',
	CANCELLED = 'CANCELLED',
}

export enum NotificationType {
	SYSTEM = 'SYSTEM',
	PAYMENT = 'PAYMENT',
	CONTRACT = 'CONTRACT',
	MAINTENANCE = 'MAINTENANCE',
}