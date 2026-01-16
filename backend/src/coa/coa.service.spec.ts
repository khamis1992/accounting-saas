import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { CoaService } from './coa.service';
import { SupabaseService } from '../supabase/supabase.service';
import { createClient } from '@supabase/supabase-js';

jest.mock('@supabase/supabase-js');

describe('CoaService', () => {
  let service: CoaService;
  let supabaseService: SupabaseService;
  let mockSupabaseClient: any;

  const mockTenantId = 'test-tenant-id';
  const mockUserId = 'test-user-id';

  beforeEach(async () => {
    mockSupabaseClient = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      in: jest.fn().mockReturnThis(),
      lte: jest.fn().mockReturnThis(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CoaService,
        {
          provide: SupabaseService,
          useValue: {
            getClient: jest.fn().mockReturnValue(mockSupabaseClient),
          },
        },
      ],
    }).compile();

    service = module.get<CoaService>(CoaService);
    supabaseService = module.get<SupabaseService>(SupabaseService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return all active accounts for a tenant', async () => {
      const mockAccounts = [
        {
          id: '1',
          code: '1000',
          name_en: 'Assets',
          name_ar: 'الأصول',
          type: 'asset',
          parent_id: null,
          is_active: true,
        },
        {
          id: '2',
          code: '1100',
          name_en: 'Current Assets',
          name_ar: 'الأصول المتداولة',
          type: 'asset',
          parent_id: '1',
          is_active: true,
        },
      ];

      mockSupabaseClient.eq.mockResolvedValue({
        data: mockAccounts,
        error: null,
      });

      const result = await service.findAll(mockTenantId);

      expect(supabaseService.getClient).toHaveBeenCalled();
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('chart_of_accounts');
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('tenant_id', mockTenantId);
      expect(result).toHaveLength(1); // Should build hierarchy
      expect(result[0].children).toHaveLength(1);
    });

    it('should include inactive accounts when requested', async () => {
      const mockAccounts = [
        {
          id: '1',
          code: '1000',
          name_en: 'Assets',
          name_ar: 'الأصول',
          type: 'asset',
          parent_id: null,
          is_active: false,
        },
      ];

      mockSupabaseClient.eq.mockResolvedValue({
        data: mockAccounts,
        error: null,
      });

      const result = await service.findAll(mockTenantId, true);

      expect(mockSupabaseClient.eq).toHaveBeenCalledTimes(2); // tenant_id only, not is_active
      expect(result).toHaveLength(1);
    });

    it('should throw error when database query fails', async () => {
      const mockError = new Error('Database error');
      mockSupabaseClient.eq.mockResolvedValue({
        data: null,
        error: mockError,
      });

      await expect(service.findAll(mockTenantId)).rejects.toThrow(mockError);
    });

    it('should return empty array when no accounts exist', async () => {
      mockSupabaseClient.eq.mockResolvedValue({
        data: [],
        error: null,
      });

      const result = await service.findAll(mockTenantId);

      expect(result).toEqual([]);
    });

    it('should order accounts by code', async () => {
      const mockAccounts = [
        { id: '1', code: '2000', name_en: 'B', parent_id: null },
        { id: '2', code: '1000', name_en: 'A', parent_id: null },
      ];

      mockSupabaseClient.eq.mockResolvedValue({
        data: mockAccounts,
        error: null,
      });

      await service.findAll(mockTenantId);

      expect(mockSupabaseClient.order).toHaveBeenCalledWith('code');
    });

    it('should build nested hierarchy correctly', async () => {
      const mockAccounts = [
        { id: '1', code: '1000', name_en: 'Level 1', parent_id: null },
        { id: '2', code: '1100', name_en: 'Level 2', parent_id: '1' },
        { id: '3', code: '1110', name_en: 'Level 3', parent_id: '2' },
      ];

      mockSupabaseClient.eq.mockResolvedValue({
        data: mockAccounts,
        error: null,
      });

      const result = await service.findAll(mockTenantId);

      expect(result).toHaveLength(1);
      expect(result[0].children).toHaveLength(1);
      expect(result[0].children[0].children).toHaveLength(1);
    });
  });

  describe('findOne', () => {
    it('should return a single account with relations', async () => {
      const mockAccount = {
        id: '1',
        code: '1000',
        name_en: 'Assets',
        name_ar: 'الأصول',
        type: 'asset',
        parent: { id: '0', code: '0000', name_en: 'Root', name_ar: 'جذر', type: 'asset' },
        children: [],
      };

      mockSupabaseClient.single.mockResolvedValue({
        data: mockAccount,
        error: null,
      });

      const result = await service.findOne('1', mockTenantId);

      expect(result).toEqual(mockAccount);
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('id', '1');
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('tenant_id', mockTenantId);
    });

    it('should throw error when account not found', async () => {
      mockSupabaseClient.single.mockResolvedValue({
        data: null,
        error: { message: 'Not found' },
      });

      await expect(service.findOne('999', mockTenantId)).rejects.toThrow();
    });

    it('should include parent and children in response', async () => {
      const mockAccount = {
        id: '1',
        code: '1000',
        name_en: 'Assets',
        parent: { id: '0', code: '0000', name_en: 'Root' },
        children: [
          { id: '2', code: '1100', name_en: 'Current Assets' },
        ],
      };

      mockSupabaseClient.single.mockResolvedValue({
        data: mockAccount,
        error: null,
      });

      const result = await service.findOne('1', mockTenantId);

      expect(result).toHaveProperty('parent');
      expect(result).toHaveProperty('children');
    });
  });

  describe('findByCode', () => {
    it('should return account by code', async () => {
      const mockAccount = {
        id: '1',
        code: '1000',
        name_en: 'Assets',
        name_ar: 'الأصول',
        type: 'asset',
      };

      mockSupabaseClient.single.mockResolvedValue({
        data: mockAccount,
        error: null,
      });

      const result = await service.findByCode('1000', mockTenantId);

      expect(result).toEqual(mockAccount);
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('code', '1000');
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('tenant_id', mockTenantId);
    });

    it('should return null when code not found', async () => {
      mockSupabaseClient.single.mockResolvedValue({
        data: null,
        error: null,
      });

      const result = await service.findByCode('9999', mockTenantId);

      expect(result).toBeNull();
    });

    it('should be case sensitive for code matching', async () => {
      mockSupabaseClient.single.mockResolvedValue({
        data: null,
        error: null,
      });

      await service.findByCode('ASSET', mockTenantId);

      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('code', 'ASSET');
    });
  });

  describe('create', () => {
    const createAccountDto = {
      code: '1000',
      nameEn: 'Assets',
      nameAr: 'الأصول',
      type: 'asset' as const,
    };

    it('should create a new account successfully', async () => {
      const mockAccount = {
        id: '1',
        ...createAccountDto,
        name_en: createAccountDto.nameEn,
        name_ar: createAccountDto.nameAr,
        level: 1,
        balance_type: 'debit',
        is_active: true,
        is_posting_allowed: true,
      };

      // Check existing returns null
      mockSupabaseClient.single.mockResolvedValueOnce({
        data: null,
        error: null,
      });

      // Insert returns account
      mockSupabaseClient.single.mockResolvedValueOnce({
        data: mockAccount,
        error: null,
      });

      const result = await service.create(createAccountDto, mockTenantId, mockUserId);

      expect(result).toEqual(mockAccount);
      expect(mockSupabaseClient.insert).toHaveBeenCalled();
    });

    it('should throw BadRequestException if code already exists', async () => {
      mockSupabaseClient.single.mockResolvedValueOnce({
        data: { id: 'existing' },
        error: null,
      });

      await expect(
        service.create(createAccountDto, mockTenantId),
      ).rejects.toThrow(BadRequestException);

      await expect(
        service.create(createAccountDto, mockTenantId),
      ).rejects.toThrow('Account code already exists');
    });

    it('should set level automatically when parent_id is provided', async () => {
      const createDtoWithParent = {
        ...createAccountDto,
        code: '1100',
        parentId: 'parent-123',
      };

      // Check code - not exists
      mockSupabaseClient.single.mockResolvedValueOnce({
        data: null,
        error: null,
      });

      // Get parent - level 2
      mockSupabaseClient.single.mockResolvedValueOnce({
        data: { id: 'parent-123', level: 2, type: 'asset' },
        error: null,
      });

      // Insert result
      mockSupabaseClient.single.mockResolvedValueOnce({
        data: { id: '1', level: 3 },
        error: null,
      });

      await service.create(createDtoWithParent, mockTenantId);

      expect(mockSupabaseClient.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          level: 3, // parent level + 1
        }),
      );
    });

    it('should throw BadRequestException if parent does not exist', async () => {
      const createDtoWithParent = {
        ...createAccountDto,
        parentId: 'non-existent-parent',
      };

      // Check code - not exists
      mockSupabaseClient.single.mockResolvedValueOnce({
        data: null,
        error: null,
      });

      // Get parent - not found
      mockSupabaseClient.single.mockResolvedValueOnce({
        data: null,
        error: { message: 'Not found' },
      });

      await expect(
        service.create(createDtoWithParent, mockTenantId),
      ).rejects.toThrow(BadRequestException);

      await expect(
        service.create(createDtoWithParent, mockTenantId),
      ).rejects.toThrow('Parent account not found');
    });

    it('should set balance_type to debit for asset and expense types', async () => {
      const assetAccount = { ...createAccountDto, type: 'asset' as const };

      mockSupabaseClient.single.mockResolvedValueOnce({ data: null, error: null });
      mockSupabaseClient.single.mockResolvedValueOnce({
        data: { id: '1', balance_type: 'debit' },
        error: null,
      });

      await service.create(assetAccount, mockTenantId);

      expect(mockSupabaseClient.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          balance_type: 'debit',
        }),
      );
    });

    it('should set balance_type to credit for liability, equity, and revenue types', async () => {
      const liabilityAccount = {
        ...createAccountDto,
        code: '2000',
        type: 'liability' as const,
      };

      mockSupabaseClient.single.mockResolvedValueOnce({ data: null, error: null });
      mockSupabaseClient.single.mockResolvedValueOnce({
        data: { id: '1', balance_type: 'credit' },
        error: null,
      });

      await service.create(liabilityAccount, mockTenantId);

      expect(mockSupabaseClient.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          balance_type: 'credit',
        }),
      );
    });

    it('should use provided balance_type when explicitly set', async () => {
      const accountWithBalanceType = {
        ...createAccountDto,
        type: 'asset' as const,
        balanceType: 'credit' as const,
      };

      mockSupabaseClient.single.mockResolvedValueOnce({ data: null, error: null });
      mockSupabaseClient.single.mockResolvedValueOnce({
        data: { id: '1', balance_type: 'credit' },
        error: null,
      });

      await service.create(accountWithBalanceType, mockTenantId);

      expect(mockSupabaseClient.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          balance_type: 'credit',
        }),
      );
    });

    it('should set is_active to true by default', async () => {
      mockSupabaseClient.single.mockResolvedValueOnce({ data: null, error: null });
      mockSupabaseClient.single.mockResolvedValueOnce({
        data: { id: '1', is_active: true },
        error: null,
      });

      await service.create(createAccountDto, mockTenantId);

      expect(mockSupabaseClient.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          is_active: true,
        }),
      );
    });

    it('should set is_posting_allowed to true by default', async () => {
      mockSupabaseClient.single.mockResolvedValueOnce({ data: null, error: null });
      mockSupabaseClient.single.mockResolvedValueOnce({
        data: { id: '1', is_posting_allowed: true },
        error: null,
      });

      await service.create(createAccountDto, mockTenantId);

      expect(mockSupabaseClient.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          is_posting_allowed: true,
        }),
      );
    });

    it('should respect provided is_active value', async () => {
      const inactiveAccount = { ...createAccountDto, isActive: false };

      mockSupabaseClient.single.mockResolvedValueOnce({ data: null, error: null });
      mockSupabaseClient.single.mockResolvedValueOnce({
        data: { id: '1', is_active: false },
        error: null,
      });

      await service.create(inactiveAccount, mockTenantId);

      expect(mockSupabaseClient.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          is_active: false,
        }),
      );
    });

    it('should include created_by when provided', async () => {
      mockSupabaseClient.single.mockResolvedValueOnce({ data: null, error: null });
      mockSupabaseClient.single.mockResolvedValueOnce({
        data: { id: '1', created_by: mockUserId },
        error: null,
      });

      await service.create(createAccountDto, mockTenantId, mockUserId);

      expect(mockSupabaseClient.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          created_by: mockUserId,
        }),
      );
    });

    it('should set default level to 1 when no parent provided', async () => {
      mockSupabaseClient.single.mockResolvedValueOnce({ data: null, error: null });
      mockSupabaseClient.single.mockResolvedValueOnce({
        data: { id: '1', level: 1 },
        error: null,
      });

      await service.create(createAccountDto, mockTenantId);

      expect(mockSupabaseClient.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          level: 1,
        }),
      );
    });

    it('should handle custom level when provided', async () => {
      const accountWithLevel = { ...createAccountDto, level: 5 };

      mockSupabaseClient.single.mockResolvedValueOnce({ data: null, error: null });
      mockSupabaseClient.single.mockResolvedValueOnce({
        data: { id: '1', level: 5 },
        error: null,
      });

      await service.create(accountWithLevel, mockTenantId);

      expect(mockSupabaseClient.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          level: 5,
        }),
      );
    });

    it('should handle all optional fields correctly', async () => {
      const fullAccount = {
        ...createAccountDto,
        subtype: 'current',
        isControlAccount: true,
        isPostingAllowed: false,
        isActive: false,
        description: 'Test account',
        currency: 'USD',
        costCenterRequired: true,
      };

      mockSupabaseClient.single.mockResolvedValueOnce({ data: null, error: null });
      mockSupabaseClient.single.mockResolvedValueOnce({
        data: { id: '1' },
        error: null,
      });

      await service.create(fullAccount, mockTenantId);

      expect(mockSupabaseClient.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          subtype: 'current',
          is_control_account: true,
          is_posting_allowed: false,
          is_active: false,
          description: 'Test account',
          currency: 'USD',
          cost_center_required: true,
        }),
      );
    });
  });

  describe('update', () => {
    it('should update account name_en successfully', async () => {
      const updateDto = { nameEn: 'Updated Name' };

      mockSupabaseClient.single.mockResolvedValue({
        data: { id: '1', name_en: 'Updated Name' },
        error: null,
      });

      const result = await service.update('1', updateDto, mockTenantId);

      expect(result.name_en).toBe('Updated Name');
      expect(mockSupabaseClient.update).toHaveBeenCalledWith({
        name_en: 'Updated Name',
      });
    });

    it('should update account name_ar successfully', async () => {
      const updateDto = { nameAr: 'اسم محدث' };

      mockSupabaseClient.single.mockResolvedValue({
        data: { id: '1', name_ar: 'اسم محدث' },
        error: null,
      });

      const result = await service.update('1', updateDto, mockTenantId);

      expect(result.name_ar).toBe('اسم محدث');
    });

    it('should update multiple fields at once', async () => {
      const updateDto = {
        nameEn: 'Updated',
        nameAr: 'محدث',
        isActive: false,
        description: 'Test',
      };

      mockSupabaseClient.single.mockResolvedValue({
        data: { id: '1' },
        error: null,
      });

      await service.update('1', updateDto, mockTenantId);

      expect(mockSupabaseClient.update).toHaveBeenCalledWith({
        name_en: 'Updated',
        name_ar: 'محدث',
        is_active: false,
        description: 'Test',
      });
    });

    it('should not update code, type, or tenant_id', async () => {
      const updateDto = {
        nameEn: 'Updated',
        // code, type, tenant_id should not be in update object
      };

      mockSupabaseClient.single.mockResolvedValue({
        data: { id: '1' },
        error: null,
      });

      await service.update('1', updateDto, mockTenantId);

      const updateCall = mockSupabaseClient.update.mock.calls[0][0];
      expect(updateCall).not.toHaveProperty('code');
      expect(updateCall).not.toHaveProperty('type');
      expect(updateCall).not.toHaveProperty('tenant_id');
    });

    it('should throw error when account not found', async () => {
      mockSupabaseClient.single.mockResolvedValue({
        data: null,
        error: { message: 'Not found' },
      });

      await expect(
        service.update('999', { nameEn: 'Test' }, mockTenantId),
      ).rejects.toThrow();
    });

    it('should update balance_type', async () => {
      const updateDto = { balanceType: 'credit' as const };

      mockSupabaseClient.single.mockResolvedValue({
        data: { id: '1', balance_type: 'credit' },
        error: null,
      });

      await service.update('1', updateDto, mockTenantId);

      expect(mockSupabaseClient.update).toHaveBeenCalledWith({
        balance_type: 'credit',
      });
    });

    it('should update is_control_account', async () => {
      const updateDto = { isControlAccount: true };

      mockSupabaseClient.single.mockResolvedValue({
        data: { id: '1' },
        error: null,
      });

      await service.update('1', updateDto, mockTenantId);

      expect(mockSupabaseClient.update).toHaveBeenCalledWith({
        is_control_account: true,
      });
    });

    it('should update is_posting_allowed', async () => {
      const updateDto = { isPostingAllowed: false };

      mockSupabaseClient.single.mockResolvedValue({
        data: { id: '1' },
        error: null,
      });

      await service.update('1', updateDto, mockTenantId);

      expect(mockSupabaseClient.update).toHaveBeenCalledWith({
        is_posting_allowed: false,
      });
    });

    it('should update cost_center_required', async () => {
      const updateDto = { costCenterRequired: true };

      mockSupabaseClient.single.mockResolvedValue({
        data: { id: '1' },
        error: null,
      });

      await service.update('1', updateDto, mockTenantId);

      expect(mockSupabaseClient.update).toHaveBeenCalledWith({
        cost_center_required: true,
      });
    });

    it('should handle empty update object', async () => {
      const updateDto = {};

      mockSupabaseClient.single.mockResolvedValue({
        data: { id: '1' },
        error: null,
      });

      await service.update('1', updateDto, mockTenantId);

      expect(mockSupabaseClient.update).toHaveBeenCalledWith({});
    });
  });

  describe('remove', () => {
    it('should delete account successfully', async () => {
      // No children
      mockSupabaseClient.limit.mockResolvedValueOnce({
        data: [],
        error: null,
      });

      // No transactions
      mockSupabaseClient.limit.mockResolvedValueOnce({
        data: [],
        error: null,
      });

      mockSupabaseClient.eq.mockResolvedValue({
        error: null,
      });

      const result = await service.remove('1', mockTenantId);

      expect(result).toEqual({ success: true });
      expect(mockSupabaseClient.delete).toHaveBeenCalled();
    });

    it('should throw BadRequestException when account has children', async () => {
      mockSupabaseClient.limit.mockResolvedValueOnce({
        data: [{ id: 'child-1' }],
        error: null,
      });

      await expect(service.remove('1', mockTenantId)).rejects.toThrow(
        BadRequestException,
      );

      await expect(service.remove('1', mockTenantId)).rejects.toThrow(
        'Cannot delete account with child accounts',
      );
    });

    it('should throw BadRequestException when account has transactions', async () => {
      // No children
      mockSupabaseClient.limit.mockResolvedValueOnce({
        data: [],
        error: null,
      });

      // Has transactions
      mockSupabaseClient.limit.mockResolvedValueOnce({
        data: [{ id: 'transaction-1' }],
        error: null,
      });

      await expect(service.remove('1', mockTenantId)).rejects.toThrow(
        BadRequestException,
      );

      await expect(service.remove('1', mockTenantId)).rejects.toThrow(
        'Cannot delete account with posted transactions',
      );
    });

    it('should check for children before checking transactions', async () => {
      mockSupabaseClient.limit.mockResolvedValueOnce({
        data: [{ id: 'child-1' }],
        error: null,
      });

      try {
        await service.remove('1', mockTenantId);
      } catch (e) {
        // Expected
      }

      // Should be called only once (for children check)
      expect(mockSupabaseClient.limit).toHaveBeenCalledTimes(1);
    });

    it('should query chart_of_accounts for children', async () => {
      mockSupabaseClient.limit.mockResolvedValueOnce({
        data: [],
        error: null,
      });
      mockSupabaseClient.limit.mockResolvedValueOnce({
        data: [],
        error: null,
      });

      await service.remove('1', mockTenantId);

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('chart_of_accounts');
    });

    it('should query journal_lines for transactions', async () => {
      mockSupabaseClient.limit.mockResolvedValueOnce({
        data: [],
        error: null,
      });
      mockSupabaseClient.limit.mockResolvedValueOnce({
        data: [],
        error: null,
      });

      await service.remove('1', mockTenantId);

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('journal_lines');
    });

    it('should limit check to 1 record for efficiency', async () => {
      mockSupabaseClient.limit.mockResolvedValueOnce({
        data: [],
        error: null,
      });
      mockSupabaseClient.limit.mockResolvedValueOnce({
        data: [],
        error: null,
      });

      await service.remove('1', mockTenantId);

      expect(mockSupabaseClient.limit).toHaveBeenCalledWith(1);
      expect(mockSupabaseClient.limit).toHaveBeenCalledTimes(2);
    });
  });

  describe('getAccountBalance', () => {
    it('should return account balance with debit > credit', async () => {
      const mockJournalLines = [
        { debit: 1000, credit: 0 },
        { debit: 500, credit: 0 },
        { debit: 0, credit: 200 },
      ];

      mockSupabaseClient.select.mockResolvedValueOnce({
        data: [],
        error: null,
      });

      mockSupabaseClient.select.mockResolvedValueOnce({
        data: mockJournalLines,
        error: null,
      });

      mockSupabaseClient.single.mockResolvedValueOnce({
        data: { type: 'asset', balance_type: 'debit' },
        error: null,
      });

      const result = await service.getAccountBalance('1', mockTenantId);

      expect(result.debit).toBe(1500);
      expect(result.credit).toBe(200);
      expect(result.balance).toBe(1300);
      expect(result.netDebit).toBe(1300);
      expect(result.netCredit).toBe(0);
      expect(result.balanceType).toBe('debit');
    });

    it('should return account balance with credit > debit', async () => {
      const mockJournalLines = [
        { debit: 200, credit: 0 },
        { debit: 0, credit: 1000 },
        { debit: 0, credit: 500 },
      ];

      mockSupabaseClient.select.mockResolvedValueOnce({
        data: [],
        error: null,
      });

      mockSupabaseClient.select.mockResolvedValueOnce({
        data: mockJournalLines,
        error: null,
      });

      mockSupabaseClient.single.mockResolvedValueOnce({
        data: { type: 'liability', balance_type: 'credit' },
        error: null,
      });

      const result = await service.getAccountBalance('1', mockTenantId);

      expect(result.debit).toBe(200);
      expect(result.credit).toBe(1500);
      expect(result.balance).toBe(1300);
      expect(result.netDebit).toBe(0);
      expect(result.netCredit).toBe(1300);
      expect(result.balanceType).toBe('credit');
    });

    it('should filter by asOfDate when provided', async () => {
      const asOfDate = new Date('2024-12-31');
      const mockJournals = [
        { id: 'j1' },
        { id: 'j2' },
      ];

      mockSupabaseClient.select.mockResolvedValueOnce({
        data: mockJournals,
        error: null,
      });

      mockSupabaseClient.select.mockResolvedValueOnce({
        data: [],
        error: null,
      });

      mockSupabaseClient.single.mockResolvedValueOnce({
        data: { type: 'asset', balance_type: 'debit' },
        error: null,
      });

      await service.getAccountBalance('1', mockTenantId, asOfDate);

      expect(mockSupabaseClient.lte).toHaveBeenCalledWith('transaction_date', asOfDate.toISOString());
    });

    it('should throw BadRequestException when account not found', async () => {
      mockSupabaseClient.select.mockResolvedValueOnce({
        data: [],
        error: null,
      });

      mockSupabaseClient.select.mockResolvedValueOnce({
        data: [],
        error: null,
      });

      mockSupabaseClient.single.mockResolvedValueOnce({
        data: null,
        error: { message: 'Not found' },
      });

      await expect(service.getAccountBalance('999', mockTenantId)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should return zero balance when no journal lines', async () => {
      mockSupabaseClient.select.mockResolvedValueOnce({
        data: [],
        error: null,
      });

      mockSupabaseClient.select.mockResolvedValueOnce({
        data: [],
        error: null,
      });

      mockSupabaseClient.single.mockResolvedValueOnce({
        data: { type: 'asset', balance_type: 'debit' },
        error: null,
      });

      const result = await service.getAccountBalance('1', mockTenantId);

      expect(result.debit).toBe(0);
      expect(result.credit).toBe(0);
      expect(result.balance).toBe(0);
    });

    it('should determine balance_type from account type when not set', async () => {
      mockSupabaseClient.select.mockResolvedValueOnce({
        data: [],
        error: null,
      });

      mockSupabaseClient.select.mockResolvedValueOnce({
        data: [],
        error: null,
      });

      mockSupabaseClient.single.mockResolvedValueOnce({
        data: { type: 'expense', balance_type: null },
        error: null,
      });

      const result = await service.getAccountBalance('1', mockTenantId);

      expect(result.balanceType).toBe('debit');
    });

    it('should filter journal lines by journal_id when date provided', async () => {
      const asOfDate = new Date('2024-12-31');
      const mockJournals = [{ id: 'j1' }, { id: 'j2' }];

      mockSupabaseClient.select.mockResolvedValueOnce({
        data: mockJournals,
        error: null,
      });

      mockSupabaseClient.select.mockResolvedValueOnce({
        data: [],
        error: null,
      });

      mockSupabaseClient.single.mockResolvedValueOnce({
        data: { type: 'asset', balance_type: 'debit' },
        error: null,
      });

      await service.getAccountBalance('1', mockTenantId, asOfDate);

      expect(mockSupabaseClient.in).toHaveBeenCalledWith('journal_id', ['j1', 'j2']);
    });
  });

  describe('getAccountsByType', () => {
    it('should return active posting-allowed accounts by type', async () => {
      const mockAccounts = [
        { id: '1', code: '1110', name_en: 'Cash', type: 'asset' },
        { id: '2', code: '1120', name_en: 'Bank', type: 'asset' },
      ];

      mockSupabaseClient.eq.mockResolvedValue({
        data: mockAccounts,
        error: null,
      });

      const result = await service.getAccountsByType(mockTenantId, 'asset');

      expect(result).toEqual(mockAccounts);
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('tenant_id', mockTenantId);
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('type', 'asset');
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('is_active', true);
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('is_posting_allowed', true);
    });

    it('should order accounts by code', async () => {
      mockSupabaseClient.eq.mockResolvedValue({
        data: [],
        error: null,
      });

      await service.getAccountsByType(mockTenantId, 'asset');

      expect(mockSupabaseClient.order).toHaveBeenCalledWith('code');
    });

    it('should return empty array when no accounts found', async () => {
      mockSupabaseClient.eq.mockResolvedValue({
        data: [],
        error: null,
      });

      const result = await service.getAccountsByType(mockTenantId, 'revenue');

      expect(result).toEqual([]);
    });

    it('should throw error when query fails', async () => {
      mockSupabaseClient.eq.mockResolvedValue({
        data: null,
        error: new Error('Database error'),
      });

      await expect(
        service.getAccountsByType(mockTenantId, 'expense'),
      ).rejects.toThrow('Database error');
    });
  });

  describe('buildHierarchy (private method)', () => {
    it('should build flat structure when no parent_id exists', async () => {
      const mockAccounts = [
        { id: '1', code: '1000', name_en: 'Assets', parent_id: null },
        { id: '2', code: '2000', name_en: 'Liabilities', parent_id: null },
      ];

      mockSupabaseClient.eq.mockResolvedValue({
        data: mockAccounts,
        error: null,
      });

      const result = await service.findAll(mockTenantId);

      expect(result).toHaveLength(2);
      expect(result[0].children).toEqual([]);
      expect(result[1].children).toEqual([]);
    });

    it('should handle orphaned nodes gracefully', async () => {
      const mockAccounts = [
        { id: '1', code: '1000', name_en: 'Root', parent_id: null },
        { id: '2', code: '1100', name_en: 'Child', parent_id: '999' }, // Non-existent parent
      ];

      mockSupabaseClient.eq.mockResolvedValue({
        data: mockAccounts,
        error: null,
      });

      const result = await service.findAll(mockTenantId);

      // Orphan should be at root level
      expect(result).toHaveLength(2);
    });

    it('should build multiple levels of hierarchy', async () => {
      const mockAccounts = [
        { id: '1', code: '1000', parent_id: null },
        { id: '2', code: '1100', parent_id: '1' },
        { id: '3', code: '1110', parent_id: '2' },
        { id: '4', code: '1120', parent_id: '2' },
      ];

      mockSupabaseClient.eq.mockResolvedValue({
        data: mockAccounts,
        error: null,
      });

      const result = await service.findAll(mockTenantId);

      expect(result).toHaveLength(1);
      expect(result[0].children).toHaveLength(1);
      expect(result[0].children[0].children).toHaveLength(2);
    });
  });
});
