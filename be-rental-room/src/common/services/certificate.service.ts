import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as forge from 'node-forge';
import * as fs from 'fs';
import * as path from 'path';

/**
 * CertificateService
 * - Tạo Self-Signed Certificate Authority (CA) cho hệ thống
 * - Dùng cho đồ án; trong production integrate VNPT/Viettel CA thay vì tạo tại đây
 */
@Injectable()
export class CertificateService {
  private readonly logger = new Logger(CertificateService.name);
  private readonly certDir = path.join(process.cwd(), 'certs');
  private readonly p12File = path.join(this.certDir, 'system-ca.p12');
  private readonly p12Password: string;

  constructor(private readonly configService: ConfigService) {
    this.p12Password = this.configService.getOrThrow<string>('P12_PASSWORD');
    this.ensureCertDirectory();
    this.initializeSystemCertificate();
  }

  private ensureCertDirectory() {
    if (!fs.existsSync(this.certDir)) {
      fs.mkdirSync(this.certDir, { recursive: true });
      this.logger.log(`Created certificates directory at ${this.certDir}`);
    }
  }

  /**
   * Initialize System CA Certificate
   * Nếu file .p12 không tồn tại, tạo mới
   */
  private initializeSystemCertificate() {
    if (fs.existsSync(this.p12File)) {
      this.logger.log('System CA certificate already exists');
      return;
    }

    this.logger.log('Creating new System CA certificate...');

    // 1. Tạo key pair
    const keys = forge.pki.rsa.generateKeyPair(2048);
    this.logger.log('Generated RSA 2048 key pair');

    // 2. Tạo Certificate
    const cert = forge.pki.createCertificate();
    cert.publicKey = keys.publicKey;
    cert.serialNumber = '01';
    cert.validity.notBefore = new Date();
    cert.validity.notAfter = new Date();
    cert.validity.notAfter.setFullYear(
      cert.validity.notAfter.getFullYear() + 5,
    ); // 5 năm

    // 3. Set Certificate Subject & Issuer (Self-signed)
    const attrs = [
      {
        name: 'commonName',
        value: 'Rental Room Management System CA',
      },
      {
        name: 'organizationName',
        value: 'Rental Room Management',
      },
      {
        name: 'countryName',
        value: 'VN',
      },
      {
        name: 'stateOrProvinceName',
        value: 'Ho Chi Minh',
      },
    ];
    cert.setSubject(attrs);
    cert.setIssuer(attrs); // Self-signed: Issuer = Subject

    // 4. Thêm extensions (đối với Digital Signature)
    cert.setExtensions([
      {
        name: 'basicConstraints',
        cA: true,
      },
      {
        name: 'keyUsage',
        keyCertSign: true,
        digitalSignature: true,
        nonRepudiation: true,
      },
    ]);

    // 5. Ký chứng chỉ bằng chính nó (Self-signed)
    cert.sign(keys.privateKey, forge.md.sha256.create());
    this.logger.log('Self-signed CA certificate created');

    // 6. Export ra PKCS#12 (.p12) format (binary)
    // Use supported node-forge API to build PKCS#12 ASN.1 and write as binary .p12
    const p12Asn1 = forge.pkcs12.toPkcs12Asn1(
      keys.privateKey,
      [cert],
      this.p12Password,
      { generateLocalKeyId: true, friendlyName: 'system-ca' },
    );

    const p12Der = forge.asn1.toDer(p12Asn1).getBytes();
    fs.writeFileSync(this.p12File, Buffer.from(p12Der, 'binary'));
    this.logger.log(`System CA certificate saved to ${this.p12File}`);
  }

  /**
   * Lấy buffer của file .p12 (chứa Private Key + Certificate)
   */
  getP12Buffer(): Buffer {
    if (!fs.existsSync(this.p12File)) {
      throw new Error(`Certificate file not found at ${this.p12File}`);
    }
    return fs.readFileSync(this.p12File);
  }

  /**
   * Lấy password của .p12
   */
  getP12Password(): string {
    return this.p12Password;
  }

  /**
   * Get Certificate Path (cho integration thực tế sau này)
   */
  getCertPath(): string {
    return this.p12File;
  }

  /**
   * Generate Certificate Info (cho audit log)
   */
  getCertificateInfo(): {
    issuer: string;
    validFrom: Date;
    validTo: Date;
    algorithm: string;
  } {
    // Đơn giản hóa: trong thực tế parse PEM để lấy thông tin
    return {
      issuer: 'Rental Room Management System CA',
      validFrom: new Date(),
      validTo: new Date(new Date().setFullYear(new Date().getFullYear() + 5)),
      algorithm: 'RSA-2048 with SHA-256',
    };
  }
}
