import { validate } from 'class-validator';
import { plainToClass } from 'class-transformer';
import { SortDto, SortOrder } from './sort.dto';

describe('SortDto', () => {
  it('should validate with default values', async () => {
    const plain = {};
    const dto = plainToClass(SortDto, plain);

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
    expect(dto.sortOrder).toBe(SortOrder.DESC);
  });

  it('should validate with valid sortBy and sortOrder', async () => {
    const plain = { sortBy: 'createdAt', sortOrder: SortOrder.ASC };
    const dto = plainToClass(SortDto, plain);

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
    expect(dto.sortBy).toBe('createdAt');
    expect(dto.sortOrder).toBe(SortOrder.ASC);
  });

  it('should validate with DESC sort order', async () => {
    const plain = { sortBy: 'name', sortOrder: SortOrder.DESC };
    const dto = plainToClass(SortDto, plain);

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
    expect(dto.sortOrder).toBe(SortOrder.DESC);
  });

  it('should fail with invalid sort order', async () => {
    const plain = { sortBy: 'name', sortOrder: 'invalid' };
    const dto = plainToClass(SortDto, plain);

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('sortOrder');
  });

  it('should allow sortBy without sortOrder', async () => {
    const plain = { sortBy: 'updatedAt' };
    const dto = plainToClass(SortDto, plain);

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
    expect(dto.sortBy).toBe('updatedAt');
    expect(dto.sortOrder).toBe(SortOrder.DESC); // default
  });

  it('should allow sortOrder without sortBy', async () => {
    const plain = { sortOrder: SortOrder.ASC };
    const dto = plainToClass(SortDto, plain);

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
    expect(dto.sortOrder).toBe(SortOrder.ASC);
  });

  it('should work with common field names', async () => {
    const fields = ['id', 'name', 'email', 'createdAt', 'updatedAt', 'price'];

    for (const field of fields) {
      const plain = { sortBy: field, sortOrder: SortOrder.ASC };
      const dto = plainToClass(SortDto, plain);

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
      expect(dto.sortBy).toBe(field);
    }
  });

  it('should accept both ASC and DESC values', async () => {
    const ascDto = plainToClass(SortDto, { sortOrder: 'asc' });
    const descDto = plainToClass(SortDto, { sortOrder: 'desc' });

    const ascErrors = await validate(ascDto);
    const descErrors = await validate(descDto);

    expect(ascErrors.length).toBe(0);
    expect(descErrors.length).toBe(0);
    expect(ascDto.sortOrder).toBe(SortOrder.ASC);
    expect(descDto.sortOrder).toBe(SortOrder.DESC);
  });

  it('should fail with uppercase sort order', async () => {
    const plain = { sortOrder: 'ASC' };
    const dto = plainToClass(SortDto, plain);

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should fail with mixed case sort order', async () => {
    const plain = { sortOrder: 'Desc' };
    const dto = plainToClass(SortDto, plain);

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });
});

describe('SortOrder Enum', () => {
  it('should have ASC value', () => {
    expect(SortOrder.ASC).toBe('asc');
  });

  it('should have DESC value', () => {
    expect(SortOrder.DESC).toBe('desc');
  });

  it('should only have two values', () => {
    const values = Object.values(SortOrder);
    expect(values).toHaveLength(2);
    expect(values).toContain('asc');
    expect(values).toContain('desc');
  });
});
