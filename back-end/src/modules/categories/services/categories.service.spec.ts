import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, UnauthorizedException } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import CategoriesRepo from '../repos/categories.repository';
import Category from '../domain/category.entity';

describe('CategoriesService', () => {
  let service: CategoriesService;
  let categoriesRepo: jest.Mocked<CategoriesRepo>;

  beforeEach(async () => {
    categoriesRepo = {
      create: jest.fn(),
      getById: jest.fn(),
      getByIdAndUser: jest.fn(),
      getAllByUserId: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    } as unknown as jest.Mocked<CategoriesRepo>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategoriesService,
        { provide: CategoriesRepo, useValue: categoriesRepo },
      ],
    }).compile();

    service = module.get(CategoriesService);
  });

  it('creates a category for the user', async () => {
    const category = Category.reconstitute({
      id: '1',
      userId: 'user-1',
      name: 'Health',
      color: '#ff0000',
    });
    categoriesRepo.create.mockResolvedValue(category);

    const result = await service.create(
      { name: 'Health', color: '#ff0000' },
      'user-1',
    );

    expect(result.name).toBe('Health');
    expect(categoriesRepo.create).toHaveBeenCalled();
  });

  it('rejects edit when category not found', async () => {
    categoriesRepo.getById.mockResolvedValue(null);

    await expect(
      service.edit('99', { name: 'Health', color: '#ff0000' }, 'user-1'),
    ).rejects.toThrow(NotFoundException);
  });

  it('rejects edit when user does not own category', async () => {
    categoriesRepo.getById.mockResolvedValue(
      Category.reconstitute({
        id: '1',
        userId: 'other-user',
        name: 'Health',
        color: '#ff0000',
      }),
    );

    await expect(
      service.edit('1', { name: 'Health', color: '#ff0000' }, 'user-1'),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('rejects delete when user does not own category', async () => {
    categoriesRepo.getById.mockResolvedValue(
      Category.reconstitute({
        id: '1',
        userId: 'other-user',
        name: 'Health',
        color: '#ff0000',
      }),
    );

    await expect(service.delete('1', 'user-1')).rejects.toThrow(
      UnauthorizedException,
    );
  });
});
