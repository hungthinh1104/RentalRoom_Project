import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';

/**
 * Contract Hash Snapshot Utility
 * 
 * UC_COT_02: Prevent bait-and-switch attacks on contracts
 * Creates SHA256 hash of contract before signing
 * Verifies hash match on signature submission
 */
@Injectable()
export class ContractHashService {
  /**
   * Generate hash snapshot of contract PDF content
   * Includes: contract_version + content + signatory info + terms
   */
  generateContractHash(contractData: {
    id: string;
    version: number;
    tenantId: string;
    landlordId: string;
    pdfContent: Buffer; // PDF binary
    startDate: Date;
    endDate: Date;
    monthlyRent: number;
    deposit: number;
    terms: string; // JSON stringified terms
  }): string {
    const hashInput = [
      contractData.id,
      contractData.version,
      contractData.tenantId,
      contractData.landlordId,
      contractData.pdfContent.toString('base64'), // PDF as base64
      contractData.startDate.toISOString(),
      contractData.endDate.toISOString(),
      contractData.monthlyRent.toString(),
      contractData.deposit.toString(),
      contractData.terms,
    ].join('|');

    return crypto
      .createHash('sha256')
      .update(hashInput)
      .digest('hex');
  }

  /**
   * Verify contract hash matches stored value
   * Throws if hash mismatch detected (bait-and-switch attempt)
   */
  verifyContractHash(
    contractHash: string,
    storedHash: string,
  ): boolean {
    if (contractHash !== storedHash) {
      throw new Error(
        'Contract hash mismatch: Document may have been altered after signing',
      );
    }
    return true;
  }

  /**
   * Create signature block with hash
   * Includes: signatory name + timestamp + hash
   * Prevents tampering with contract after signature
   */
  createSignatureBlock(data: {
    signatoryName: string;
    signatoryId: string;
    contractHash: string;
    timestamp: Date;
    eSignatureProviderId: string;
  }): string {
    return JSON.stringify({
      signer_name: data.signatoryName,
      signer_id: data.signatoryId,
      contract_hash: data.contractHash,
      signed_at: data.timestamp.toISOString(),
      e_signature_provider: data.eSignatureProviderId,
      verification_token: crypto
        .randomBytes(32)
        .toString('hex'),
    });
  }

  /**
   * Generate addendum (renewal) contract hash
   * Links to original contract version + new terms
   */
  generateAddendumHash(data: {
    originalContractId: string;
    originalContractHash: string;
    addendumVersion: number;
    newTerms: string;
    modificationDate: Date;
  }): string {
    const hashInput = [
      data.originalContractId,
      data.originalContractHash,
      data.addendumVersion,
      data.newTerms,
      data.modificationDate.toISOString(),
    ].join('|');

    return crypto
      .createHash('sha256')
      .update(hashInput)
      .digest('hex');
  }

  /**
   * Audit: Create immutable hash chain for contract lifecycle
   * Each modification creates new hash linked to previous
   */
  createHashChain(
    previousHash: string,
    modification: {
      type: string; // 'TERMINATION' | 'RENEWAL' | 'AMENDMENT'
      reason: string;
      timestamp: Date;
    },
  ): string {
    const chainInput = [
      previousHash,
      modification.type,
      modification.reason,
      modification.timestamp.toISOString(),
    ].join('|');

    return crypto
      .createHash('sha256')
      .update(chainInput)
      .digest('hex');
  }
}
