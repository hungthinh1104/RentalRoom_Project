import 'reflect-metadata';
import { validate } from 'class-validator';
import { plainToClass } from 'class-transformer';
import { PaginationDto, PaginatedResponse } from './pagination.dto';

describe('PaginationDto', () => {
  it('should validate with default values', async () => {
    const plain = {};
    const dto = plainToClass(PaginationDto, plain);

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
    expect(dto.page).toBe(1);
    expect(dto.limit).toBe(10);
  });

  it('should validate with valid page and limit', async () => {
    const plain = { page: 2, limit: 20 };
    const dto = plainToClass(PaginationDto, plain);

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
    expect(dto.page).toBe(2);
    expect(dto.limit).toBe(20);
  });

  it('should fail with page less than 1', async () => {
    const plain = { page: 0, limit: 10 };
    const dto = plainToClass(PaginationDto, plain);

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('page');
  });

  it('should fail with negative page', async () => {
    const plain = { page: -1, limit: 10 };
    const dto = plainToClass(PaginationDto, plain);

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('page');
  });

  it('should fail with limit less than 1', async () => {
    const plain = { page: 1, limit: 0 };
    const dto = plainToClass(PaginationDto, plain);

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('limit');
  });

  it('should fail with limit greater than 100', async () => {
    const plain = { page: 1, limit: 101 };
    const dto = plainToClass(PaginationDto, plain);

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('limit');
  });

  it('should accept limit of 100', async () => {
    const plain = { page: 1, limit: 100 };
    const dto = plainToClass(PaginationDto, plain);

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should transform string values to numbers', async () => {
    const plain = { page: '3', limit: '25' };
    const dto = plainToClass(PaginationDto, plain);

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
    expect(dto.page).toBe(3);
    expect(dto.limit).toBe(25);
    expect(typeof dto.page).toBe('number');
    expect(typeof dto.limit).toBe('number');
  });

  it('should fail with non-integer page', async () => {
    const plain = { page: 1.5, limit: 10 };
    const dto = plainToClass(PaginationDto, plain);

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should fail with non-integer limit', async () => {
    const plain = { page: 1, limit: 10.5 };
    const dto = plainToClass(PaginationDto, plain);

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  describe('skip getter', () => {
    it('should calculate skip with default values', () => {
      const dto = new PaginationDto();
      expect(dto.skip).toBe(0);
    });

    it('should calculate skip for page 1', () => {
      const dto = new PaginationDto();
      dto.page = 1;
      dto.limit = 10;
      expect(dto.skip).toBe(0);
    });

    it('should calculate skip for page 2', () => {
      const dto = new PaginationDto();
      dto.page = 2;
      dto.limit = 10;
      expect(dto.skip).toBe(10);
    });

    it('should calculate skip for page 3 with limit 20', () => {
      const dto = new PaginationDto();
      dto.page = 3;
      dto.limit = 20;
      expect(dto.skip).toBe(40);
    });

    it('should handle undefined page (defaults to 1)', () => {
      const dto = new PaginationDto();
      dto.page = undefined;
      dto.limit = 15;
      expect(dto.skip).toBe(0);
    });

    it('should handle undefined limit (defaults to 10)', () => {
      const dto = new PaginationDto();
      dto.page = 2;
      dto.limit = undefined;
      expect(dto.skip).toBe(10);
    });
  });
});

describe('PaginatedResponse', () => {
  it('should create a paginated response with data and meta', () => {
    const data = [{ id: 1 }, { id: 2 }, { id: 3 }];
    const response = new PaginatedResponse(data, 100, 1, 10);

    expect(response.data).toEqual(data);
    expect(response.meta.total).toBe(100);
    expect(response.meta.page).toBe(1);
    expect(response.meta.limit).toBe(10);
    expect(response.meta.totalPages).toBe(10);
  });

  it('should calculate totalPages correctly', () => {
    const data = [{ id: 1 }];
    const response = new PaginatedResponse(data, 25, 1, 10);

    expect(response.meta.totalPages).toBe(3); // ceil(25/10)
  });

  it('should handle exact division for totalPages', () => {
    const data = [];
    const response = new PaginatedResponse(data, 30, 1, 10);

    expect(response.meta.totalPages).toBe(3);
  });

  it('should handle empty data array', () => {
    const response = new PaginatedResponse([], 0, 1, 10);

    expect(response.data).toEqual([]);
    expect(response.meta.total).toBe(0);
    expect(response.meta.totalPages).toBe(0);
  });

  it('should work with different page numbers', () => {
    const data = [{ id: 1 }];
    const response = new PaginatedResponse(data, 100, 5, 20);

    expect(response.meta.page).toBe(5);
    expect(response.meta.limit).toBe(20);
    expect(response.meta.totalPages).toBe(5); // ceil(100/20)
  });

  it('should work with large datasets', () => {
    const data = Array.from({ length: 100 }, (_, i) => ({ id: i + 1 }));
    const response = new PaginatedResponse(data, 1000, 3, 100);

    expect(response.data.length).toBe(100);
    expect(response.meta.total).toBe(1000);
    expect(response.meta.totalPages).toBe(10);
  });

  it('should handle single item per page', () => {
    const data = [{ id: 1 }];
    const response = new PaginatedResponse(data, 50, 10, 1);

    expect(response.meta.limit).toBe(1);
    expect(response.meta.totalPages).toBe(50);
  });

  it('should work with typed data', () => {
    interface User {
      id: string;
      name: string;
    }
    const users: User[] = [
      { id: '1', name: 'John' },
      { id: '2', name: 'Jane' },
    ];
    const response = new PaginatedResponse<User>(users, 2, 1, 10);

    expect(response.data[0].name).toBe('John');
    expect(response.data[1].name).toBe('Jane');
  });
});
