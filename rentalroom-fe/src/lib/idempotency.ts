/**
 * Utility for generating idempotency keys
 * Uses UUID v4 to ensure uniqueness and prevent duplicate request processing
 */

import { v4 as uuidv4 } from 'uuid';

export function generateIdempotencyKey(): string {
  return uuidv4();
}

export function generateContractIdempotencyKey(applicationId: string, action: string): string {
  return `${action.toUpperCase()}-${applicationId}-${uuidv4()}`;
}

export function generateInvoiceIdempotencyKey(invoiceId: string, action: string): string {
  return `${action.toUpperCase()}-${invoiceId}-${uuidv4()}`;
}

export function generateMeterReadingIdempotencyKey(contractId: string, month: string): string {
  return `METER-${contractId}-${month}-${uuidv4()}`;
}
