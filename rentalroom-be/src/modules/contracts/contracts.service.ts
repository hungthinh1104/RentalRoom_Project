import { Injectable, Logger } from '@nestjs/common';
import {
  CreateContractDto,
  CreateRentalApplicationDto,
  FilterContractsDto,
  FilterRentalApplicationsDto,
  TerminateContractDto,
  UpdateContractDto,
  UpdateHandoverChecklistDto,
  RenewContractDto,
} from './dto';
import { User } from '../users/entities';
import { ContractApplicationService } from './applications/contract-application.service';
import { ContractLifecycleService } from './lifecycle/contract-lifecycle.service';
import { CreateContractResidentDto } from './dto/create-contract-resident.dto';
import { UpdateContractResidentDto } from './dto/update-contract-resident.dto';

@Injectable()
export class ContractsService {
  private readonly logger = new Logger(ContractsService.name);

  constructor(
    private readonly applicationService: ContractApplicationService,
    private readonly lifecycleService: ContractLifecycleService,
  ) {}

  // --- Applications ---

  async createApplication(createDto: CreateRentalApplicationDto, user: User) {
    return this.applicationService.createApplication(createDto, user);
  }

  async findAllApplications(filterDto: FilterRentalApplicationsDto) {
    return this.applicationService.findAllApplications(filterDto);
  }

  async findOneApplication(id: string) {
    return this.applicationService.findOneApplication(id);
  }

  async approveApplication(id: string, user: User, idempotencyKey: string) {
    return this.applicationService.approveApplication(id, user, idempotencyKey);
  }

  async rejectApplication(id: string, user: User, idempotencyKey: string) {
    return this.applicationService.rejectApplication(id, user, idempotencyKey);
  }

  async withdrawApplication(id: string, userId: string) {
    return this.applicationService.withdrawApplication(id, userId);
  }

  // --- Contracts ---

  async create(createContractDto: CreateContractDto, user: User) {
    return this.lifecycleService.create(createContractDto, user);
  }

  async findAll(filterDto: FilterContractsDto, user: User) {
    return this.lifecycleService.findAllContracts(filterDto, user);
  }

  async findOne(id: string, user?: User) {
    return this.lifecycleService.findOne(id, user);
  }

  async getContractDetails(id: string, user?: User) {
    return this.lifecycleService.getContractDetails(id, user);
  }

  async update(id: string, updateContractDto: UpdateContractDto, user: User) {
    return this.lifecycleService.update(id, updateContractDto, user);
  }

  async remove(id: string) {
    return this.lifecycleService.remove(id);
  }

  async sendContract(contractId: string, landlordUserId: string) {
    return this.lifecycleService.sendContract(contractId, landlordUserId);
  }

  async revokeContract(contractId: string, userId: string) {
    return this.lifecycleService.revokeContract(contractId, userId);
  }

  async requestChanges(contractId: string, tenantId: string, reason: string) {
    return this.lifecycleService.requestChanges(contractId, tenantId, reason);
  }

  async tenantApproveContract(contractId: string, tenantId: string) {
    return this.lifecycleService.tenantApproveContract(contractId, tenantId);
  }

  async verifyPaymentStatus(id: string) {
    return this.lifecycleService.verifyPaymentStatus(id);
  }

  async terminate(
    id: string,
    userId: string,
    terminateDto: TerminateContractDto,
  ) {
    return this.lifecycleService.terminate(id, userId, terminateDto);
  }

  async renew(id: string, userId: string, renewDto: RenewContractDto) {
    return this.lifecycleService.renew(id, userId, renewDto);
  }

  async addResident(
    contractId: string,
    dto: CreateContractResidentDto,
    userId: string,
  ) {
    return this.lifecycleService.addResident(contractId, dto, userId);
  }

  async removeResident(contractId: string, residentId: string, userId: string) {
    return this.lifecycleService.removeResident(contractId, residentId, userId);
  }

  async updateResident(
    contractId: string,
    residentId: string,
    dto: UpdateContractResidentDto,
    userId: string,
  ) {
    return this.lifecycleService.updateResident(
      contractId,
      residentId,
      dto,
      userId,
    );
  }

  async updateHandoverChecklist(
    id: string,
    userId: string,
    dto: UpdateHandoverChecklistDto,
  ) {
    return this.lifecycleService.updateHandoverChecklist(id, userId, dto);
  }
}
