import { faker } from '@faker-js/faker';

export class TestDataFactory {
  // User factories
  static createUser(overrides = {}) {
    return {
      id: faker.string.uuid(),
      fullName: faker.person.fullName(),
      email: faker.internet.email(),
      passwordHash: faker.string.alphanumeric(60),
      phoneNumber: faker.phone.number(),
      role: 'TENANT' as const,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    };
  }

  static createLandlordUser(overrides = {}) {
    return this.createUser({
      role: 'LANDLORD' as const,
      ...overrides,
    });
  }

  static createTenantUser(overrides = {}) {
    return this.createUser({
      role: 'TENANT' as const,
      ...overrides,
    });
  }

  // Landlord factory
  static createLandlord(overrides = {}) {
    const userId = faker.string.uuid();
    return {
      userId,
      fullName: faker.person.fullName(),
      phoneNumber: faker.phone.number(),
      email: faker.internet.email(),
      citizenId: faker.string.numeric(12),
      bankAccount: faker.finance.accountNumber(),
      bankName: faker.company.name(),
      address: faker.location.streetAddress(true),
      propertyCount: 0,
      rating: null,
      verified: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    };
  }

  // Tenant factory
  static createTenant(overrides = {}) {
    const userId = faker.string.uuid();
    return {
      userId,
      fullName: faker.person.fullName(),
      phoneNumber: faker.phone.number(),
      email: faker.internet.email(),
      dateOfBirth: faker.date.past({ years: 30 }),
      citizenId: faker.string.numeric(12),
      emergencyContact: faker.phone.number(),
      budgetMin: null,
      budgetMax: null,
      preferredLocation: null,
      employmentStatus: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    };
  }

  // Property factory
  static createProperty(overrides = {}) {
    return {
      id: faker.string.uuid(),
      landlordId: faker.string.uuid(),
      name: faker.company.name(),
      address: faker.location.streetAddress(true),
      city: faker.location.city(),
      ward: faker.location.county(),
      propertyType: 'APARTMENT' as const,
      createdAt: new Date(),
      ...overrides,
    };
  }

  // Room factory
  static createRoom(overrides = {}) {
    return {
      id: faker.string.uuid(),
      propertyId: faker.string.uuid(),
      roomNumber: faker.string.alphanumeric(5).toUpperCase(),
      area: faker.number.float({ min: 15, max: 50, fractionDigits: 1 }),
      pricePerMonth: faker.number.int({ min: 2000000, max: 10000000 }),
      deposit: faker.number.int({ min: 4000000, max: 20000000 }),
      status: 'AVAILABLE' as const,
      description: faker.lorem.paragraph(),
      maxOccupants: faker.number.int({ min: 1, max: 4 }),
      ...overrides,
    };
  }

  // Contract factory
  static createContract(overrides = {}) {
    const startDate = faker.date.recent();
    const endDate = new Date(startDate);
    endDate.setFullYear(endDate.getFullYear() + 1);

    return {
      id: faker.string.uuid(),
      applicationId: faker.string.uuid(),
      roomId: faker.string.uuid(),
      tenantId: faker.string.uuid(),
      landlordId: faker.string.uuid(),
      contractNumber: `CT${faker.string.numeric(10)}`,
      startDate,
      endDate,
      monthlyRent: faker.number.int({ min: 2000000, max: 10000000 }),
      depositAmount: faker.number.int({ min: 4000000, max: 20000000 }),
      status: 'ACTIVE' as const,
      eSignatureUrl: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      signedAt: new Date(),
      terminatedAt: null,
      ...overrides,
    };
  }

  // Rental Application factory
  static createRentalApplication(overrides = {}) {
    return {
      id: faker.string.uuid(),
      roomId: faker.string.uuid(),
      tenantId: faker.string.uuid(),
      landlordId: faker.string.uuid(),
      applicationDate: new Date(),
      status: 'PENDING' as const,
      requestedMoveInDate: faker.date.future(),
      message: faker.lorem.paragraph(),
      createdAt: new Date(),
      updatedAt: new Date(),
      reviewedAt: null,
      ...overrides,
    };
  }

  // Invoice factory
  static createInvoice(overrides = {}) {
    return {
      id: faker.string.uuid(),
      contractId: faker.string.uuid(),
      tenantId: faker.string.uuid(),
      invoiceNumber: `INV${faker.string.numeric(10)}`,
      issueDate: new Date(),
      dueDate: faker.date.future(),
      totalAmount: faker.number.int({ min: 5000000, max: 15000000 }),
      status: 'PENDING',
      paidAt: null,
      createdAt: new Date(),
      ...overrides,
    };
  }

  // Payment factory
  static createPayment(overrides = {}) {
    return {
      id: faker.string.uuid(),
      invoiceId: faker.string.uuid(),
      tenantId: faker.string.uuid(),
      amount: faker.number.int({ min: 5000000, max: 15000000 }),
      paymentDate: new Date(),
      paymentMethod: 'BANK_TRANSFER',
      status: 'COMPLETED',
      transactionId: faker.string.alphanumeric(16).toUpperCase(),
      createdAt: new Date(),
      ...overrides,
    };
  }

  // Service factory
  static createService(overrides = {}) {
    return {
      id: faker.string.uuid(),
      propertyId: faker.string.uuid(),
      serviceName: faker.commerce.productName(),
      serviceType: 'ELECTRICITY',
      billingMethod: 'METERED',
      unitPrice: faker.number.int({ min: 1000, max: 50000 }),
      unit: 'kWh',
      description: faker.lorem.sentence(),
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    };
  }

  // Maintenance Request factory
  static createMaintenanceRequest(overrides = {}) {
    return {
      id: faker.string.uuid(),
      roomId: faker.string.uuid(),
      tenantId: faker.string.uuid(),
      title: faker.lorem.sentence(),
      description: faker.lorem.paragraph(),
      priority: 'MEDIUM',
      category: 'PLUMBING',
      status: 'PENDING',
      requestDate: new Date(),
      assignedTo: null,
      createdAt: new Date(),
      ...overrides,
    };
  }

  // Notification factory
  static createNotification(overrides = {}) {
    return {
      id: faker.string.uuid(),
      userId: faker.string.uuid(),
      title: faker.lorem.sentence(),
      content: faker.lorem.paragraph(),
      notificationType: 'SYSTEM',
      sentAt: new Date(),
      readAt: null,
      ...overrides,
    };
  }
}
