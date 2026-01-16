import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { VendorsService } from './vendors.service';
import { SupabaseService } from '../supabase/supabase.service';

describe('VendorsService', () => {
  let service: VendorsService;
  let supabaseService: SupabaseService;
  let mockSupabaseClient: any;

  const mockTenantId = 'test-tenant-id';

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
      or: jest.fn().mockReturnThis(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VendorsService,
        {
          provide: SupabaseService,
          useValue: {
            getClient: jest.fn().mockReturnValue(mockSupabaseClient),
          },
        },
      ],
    }).compile();

    service = module.get<VendorsService>(VendorsService);
    supabaseService = module.get<SupabaseService>(SupabaseService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return all vendors for a tenant', async () => {
      const mockVendors = [
        {
          id: '1',
          code: 'VEND001',
          name_en: 'Vendor 1',
          name_ar: 'مورد 1',
          tenant_id: mockTenantId,
        },
      ];

      mockSupabaseClient.eq.mockResolvedValue({
        data: mockVendors,
        error: null,
      });

      const result = await service.findAll(mockTenantId);

      expect(result).toEqual(mockVendors);
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('vendors');
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('tenant_id', mockTenantId);
    });

    it('should filter by is_active when requested', async () => {
      mockSupabaseClient.eq.mockResolvedValue({
        data: [],
        error: null,
      });

      await service.findAll(mockTenantId, { isActive: true });

      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('is_active', true);
    });

    it('should order by code', async () => {
      mockSupabaseClient.eq.mockResolvedValue({
        data: [],
        error: null,
      });

      await service.findAll(mockTenantId);

      expect(mockSupabaseClient.order).toHaveBeenCalledWith('code');
    });

    it('should return empty array when no vendors found', async () => {
      mockSupabaseClient.eq.mockResolvedValue({
        data: [],
        error: null,
      });

      const result = await service.findAll(mockTenantId);

      expect(result).toEqual([]);
    });

    it('should throw error when query fails', async () => {
      mockSupabaseClient.eq.mockResolvedValue({
        data: null,
        error: new Error('Database error'),
      });

      await expect(service.findAll(mockTenantId)).rejects.toThrow('Database error');
    });
  });

  describe('findOne', () => {
    it('should return a single vendor by id', async () => {
      const mockVendor = {
        id: '1',
        code: 'VEND001',
        name_en: 'Vendor 1',
        name_ar: 'مورد 1',
      };

      mockSupabaseClient.single.mockResolvedValue({
        data: mockVendor,
        error: null,
      });

      const result = await service.findOne('1', mockTenantId);

      expect(result).toEqual(mockVendor);
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('id', '1');
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('tenant_id', mockTenantId);
    });

    it('should return null when vendor not found', async () => {
      mockSupabaseClient.single.mockResolvedValue({
        data: null,
        error: null,
      });

      const result = await service.findOne('999', mockTenantId);

      expect(result).toBeNull();
    });

    it('should throw error when database error occurs', async () => {
      mockSupabaseClient.single.mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
      });

      await expect(service.findOne('1', mockTenantId)).rejects.toThrow();
    });
  });

  describe('findByCode', () => {
    it('should return vendor by code', async () => {
      const mockVendor = {
        id: '1',
        code: 'VEND001',
        name_en: 'Vendor 1',
      };

      mockSupabaseClient.single.mockResolvedValue({
        data: mockVendor,
        error: null,
      });

      const result = await service.findByCode('VEND001', mockTenantId);

      expect(result).toEqual(mockVendor);
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('code', 'VEND001');
    });

    it('should return null when code not found', async () => {
      mockSupabaseClient.single.mockResolvedValue({
        data: null,
        error: null,
      });

      const result = await service.findByCode('NOTFOUND', mockTenantId);

      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    const createVendorDto = {
      code: 'VEND001',
      nameEn: 'Test Vendor',
      nameAr: 'مورد اختبار',
      email: 'test@example.com',
      phone: '+966501234567',
    };

    it('should create a vendor successfully', async () => {
      const mockVendor = {
        id: '1',
        ...createVendorDto,
        name_en: createVendorDto.nameEn,
        name_ar: createVendorDto.nameAr,
        tenant_id: mockTenantId,
        is_active: true,
      };

      // Check if code exists - no
      mockSupabaseClient.single.mockResolvedValueOnce({
        data: null,
        error: null,
      });

      // Insert result
      mockSupabaseClient.single.mockResolvedValueOnce({
        data: mockVendor,
        error: null,
      });

      const result = await service.create(createVendorDto, mockTenantId);

      expect(result).toEqual(mockVendor);
      expect(mockSupabaseClient.insert).toHaveBeenCalled();
    });

    it('should throw BadRequestException if code already exists', async () => {
      // Code exists
      mockSupabaseClient.single.mockResolvedValueOnce({
        data: { id: 'existing' },
        error: null,
      });

      await expect(service.create(createVendorDto, mockTenantId)).rejects.toThrow(
        BadRequestException,
      );

      await expect(service.create(createVendorDto, mockTenantId)).rejects.toThrow(
        'Vendor code already exists',
      );
    });

    it('should set is_active to true by default', async () => {
      mockSupabaseClient.single.mockResolvedValueOnce({
        data: null,
        error: null,
      });

      mockSupabaseClient.single.mockResolvedValueOnce({
        data: { id: '1' },
        error: null,
      });

      await service.create(createVendorDto, mockTenantId);

      expect(mockSupabaseClient.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          is_active: true,
        }),
      );
    });

    it('should respect provided is_active value', async () => {
      const inactiveVendor = { ...createVendorDto, isActive: false };

      mockSupabaseClient.single.mockResolvedValueOnce({
        data: null,
        error: null,
      });

      mockSupabaseClient.single.mockResolvedValueOnce({
        data: { id: '1' },
        error: null,
      });

      await service.create(inactiveVendor, mockTenantId);

      expect(mockSupabaseClient.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          is_active: false,
        }),
      );
    });

    it('should handle all optional fields', async () => {
      const fullVendor = {
        ...createVendorDto,
        taxNumber: '300123456700003',
        website: 'https://example.com',
        address: '123 Main St',
        city: 'Riyadh',
        country: 'Saudi Arabia',
        paymentTerms: 'NET30',
        notes: 'Test vendor',
      };

      mockSupabaseClient.single.mockResolvedValueOnce({
        data: null,
        error: null,
      });

      mockSupabaseClient.single.mockResolvedValueOnce({
        data: { id: '1' },
        error: null,
      });

      await service.create(fullVendor, mockTenantId);

      expect(mockSupabaseClient.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          tax_number: '300123456700003',
          website: 'https://example.com',
          address: '123 Main St',
          city: 'Riyadh',
          country: 'Saudi Arabia',
          payment_terms: 'NET30',
          notes: 'Test vendor',
        }),
      );
    });

    it('should handle bank details', async () => {
      const vendorWithBank = {
        ...createVendorDto,
        bankName: 'Al Rajhi Bank',
        bankAccountNumber: '1234567890',
        bankIban: 'SA1234567890123456789012',
      };

      mockSupabaseClient.single.mockResolvedValueOnce({
        data: null,
        error: null,
      });

      mockSupabaseClient.single.mockResolvedValueOnce({
        data: { id: '1' },
        error: null,
      });

      await service.create(vendorWithBank, mockTenantId);

      expect(mockSupabaseClient.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          bank_name: 'Al Rajhi Bank',
          bank_account_number: '1234567890',
          bank_iban: 'SA1234567890123456789012',
        }),
      );
    });

    it('should handle contact persons', async () => {
      const vendorWithContacts = {
        ...createVendorDto,
        contactPerson: 'John Doe',
        contactPhone: '+966501234568',
        contactEmail: 'john@example.com',
      };

      mockSupabaseClient.single.mockResolvedValueOnce({
        data: null,
        error: null,
      });

      mockSupabaseClient.single.mockResolvedValueOnce({
        data: { id: '1' },
        error: null,
      });

      await service.create(vendorWithContacts, mockTenantId);

      expect(mockSupabaseClient.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          contact_person: 'John Doe',
          contact_phone: '+966501234568',
          contact_email: 'john@example.com',
        }),
      );
    });

    it('should handle vendor type', async () => {
      const vendorWithType = {
        ...createVendorDto,
        vendorType: 'service',
      };

      mockSupabaseClient.single.mockResolvedValueOnce({
        data: null,
        error: null,
      });

      mockSupabaseClient.single.mockResolvedValueOnce({
        data: { id: '1' },
        error: null,
      });

      await service.create(vendorWithType, mockTenantId);

      expect(mockSupabaseClient.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          vendor_type: 'service',
        }),
      );
    });
  });

  describe('update', () => {
    it('should update vendor name', async () => {
      const updateDto = { nameEn: 'Updated Name' };

      mockSupabaseClient.single.mockResolvedValue({
        data: { id: '1', name_en: 'Updated Name' },
        error: null,
      });

      const result = await service.update('1', updateDto, mockTenantId);

      expect(result.name_en).toBe('Updated Name');
      expect(mockSupabaseClient.update).toHaveBeenCalled();
    });

    it('should update multiple fields', async () => {
      const updateDto = {
        nameEn: 'Updated',
        nameAr: 'محدث',
        email: 'newemail@example.com',
        phone: '+966509876543',
      };

      mockSupabaseClient.single.mockResolvedValue({
        data: { id: '1' },
        error: null,
      });

      await service.update('1', updateDto, mockTenantId);

      expect(mockSupabaseClient.update).toHaveBeenCalledWith(
        expect.objectContaining({
          name_en: 'Updated',
          name_ar: 'محدث',
          email: 'newemail@example.com',
          phone: '+966509876543',
        }),
      );
    });

    it('should not update code or tenant_id', async () => {
      const updateDto = { nameEn: 'Updated' };

      mockSupabaseClient.single.mockResolvedValue({
        data: { id: '1' },
        error: null,
      });

      await service.update('1', updateDto, mockTenantId);

      const updateCall = mockSupabaseClient.update.mock.calls[0][0];
      expect(updateCall).not.toHaveProperty('code');
      expect(updateCall).not.toHaveProperty('tenant_id');
    });

    it('should throw error when vendor not found', async () => {
      mockSupabaseClient.single.mockResolvedValue({
        data: null,
        error: { message: 'Not found' },
      });

      await expect(
        service.update('999', { nameEn: 'Test' }, mockTenantId),
      ).rejects.toThrow();
    });

    it('should update is_active status', async () => {
      const updateDto = { isActive: false };

      mockSupabaseClient.single.mockResolvedValue({
        data: { id: '1' },
        error: null,
      });

      await service.update('1', updateDto, mockTenantId);

      expect(mockSupabaseClient.update).toHaveBeenCalledWith({
        is_active: false,
      });
    });

    it('should update bank details', async () => {
      const updateDto = {
        bankName: 'New Bank',
        bankAccountNumber: '9876543210',
        bankIban: 'SA9876543210987654321098',
      };

      mockSupabaseClient.single.mockResolvedValue({
        data: { id: '1' },
        error: null,
      });

      await service.update('1', updateDto, mockTenantId);

      expect(mockSupabaseClient.update).toHaveBeenCalledWith(
        expect.objectContaining({
          bank_name: 'New Bank',
          bank_account_number: '9876543210',
          bank_iban: 'SA9876543210987654321098',
        }),
      );
    });
  });

  describe('remove', () => {
    it('should delete vendor successfully', async () => {
      // Check for purchase orders - none
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

    it('should throw BadRequestException when vendor has purchase orders', async () => {
      // Has purchase orders
      mockSupabaseClient.limit.mockResolvedValueOnce({
        data: [{ id: 'po-1' }],
        error: null,
      });

      await expect(service.remove('1', mockTenantId)).rejects.toThrow(
        BadRequestException,
      );

      await expect(service.remove('1', mockTenantId)).rejects.toThrow(
        'Cannot delete vendor with associated purchase orders',
      );
    });

    it('should check purchase orders table before deleting', async () => {
      mockSupabaseClient.limit.mockResolvedValueOnce({
        data: [],
        error: null,
      });

      mockSupabaseClient.eq.mockResolvedValue({
        error: null,
      });

      await service.remove('1', mockTenantId);

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('purchase_orders');
      expect(mockSupabaseClient.limit).toHaveBeenCalledWith(1);
    });
  });

  describe('search', () => {
    it('should search vendors by name', async () => {
      mockSupabaseClient.or.mockResolvedValue({
        data: [
          { id: '1', name_en: 'Test Vendor' },
          { id: '2', name_ar: 'مورد اختبار' },
        ],
        error: null,
      });

      const result = await service.search(mockTenantId, 'test');

      expect(result).toHaveLength(2);
      expect(mockSupabaseClient.or).toHaveBeenCalled();
    });

    it('should return empty array when no matches found', async () => {
      mockSupabaseClient.or.mockResolvedValue({
        data: [],
        error: null,
      });

      const result = await service.search(mockTenantId, 'notfound');

      expect(result).toEqual([]);
    });

    it('should search in both name_en and name_ar', async () => {
      mockSupabaseClient.or.mockResolvedValue({
        data: [],
        error: null,
      });

      await service.search(mockTenantId, 'searchterm');

      expect(mockSupabaseClient.or).toHaveBeenCalledWith(
        expect.stringContaining('name_en'),
      );
      expect(mockSupabaseClient.or).toHaveBeenCalledWith(
        expect.stringContaining('name_ar'),
      );
    });

    it('should also search in email and phone', async () => {
      mockSupabaseClient.or.mockResolvedValue({
        data: [],
        error: null,
      });

      await service.search(mockTenantId, 'searchterm');

      const orCall = mockSupabaseClient.or.mock.calls[0][0];
      expect(orCall).toContain('email');
      expect(orCall).toContain('phone');
    });

    it('should limit results to 50', async () => {
      mockSupabaseClient.or.mockResolvedValue({
        data: [],
        error: null,
      });

      await service.search(mockTenantId, 'test');

      expect(mockSupabaseClient.limit).toHaveBeenCalledWith(50);
    });
  });

  describe('bank details handling', () => {
    it('should store bank details with proper validation', async () => {
      const vendorWithBank = {
        ...createVendorDto,
        bankName: 'Al Rajhi Bank',
        bankAccountNumber: '1234567890',
        bankIban: 'SA1234567890123456789012',
      };

      mockSupabaseClient.single.mockResolvedValueOnce({
        data: null,
        error: null,
      });

      mockSupabaseClient.single.mockResolvedValueOnce({
        data: { id: '1' },
        error: null,
      });

      await service.create(vendorWithBank, mockTenantId);

      expect(mockSupabaseClient.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          bank_name: 'Al Rajhi Bank',
          bank_account_number: '1234567890',
          bank_iban: 'SA1234567890123456789012',
        }),
      );
    });

    it('should update bank details independently', async () => {
      const updateBankDto = {
        bankName: 'Updated Bank',
        bankAccountNumber: '9999999999',
      };

      mockSupabaseClient.single.mockResolvedValue({
        data: { id: '1' },
        error: null,
      });

      await service.update('1', updateBankDto, mockTenantId);

      expect(mockSupabaseClient.update).toHaveBeenCalledWith(
        expect.objectContaining({
          bank_name: 'Updated Bank',
          bank_account_number: '9999999999',
        }),
      );
    });

    it('should allow clearing bank details', async () => {
      const clearBankDto = {
        bankName: null,
        bankAccountNumber: null,
        bankIban: null,
      };

      mockSupabaseClient.single.mockResolvedValue({
        data: { id: '1' },
        error: null,
      });

      await service.update('1', clearBankDto, mockTenantId);

      expect(mockSupabaseClient.update).toHaveBeenCalledWith(
        expect.objectContaining({
          bank_name: null,
          bank_account_number: null,
          bank_iban: null,
        }),
      );
    });
  });
});
