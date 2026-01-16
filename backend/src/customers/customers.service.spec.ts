import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { CustomersService } from './customers.service';
import { SupabaseService } from '../supabase/supabase.service';

describe('CustomersService', () => {
  let service: CustomersService;
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
      ilike: jest.fn().mockReturnThis(),
      or: jest.fn().mockReturnThis(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CustomersService,
        {
          provide: SupabaseService,
          useValue: {
            getClient: jest.fn().mockReturnValue(mockSupabaseClient),
          },
        },
      ],
    }).compile();

    service = module.get<CustomersService>(CustomersService);
    supabaseService = module.get<SupabaseService>(SupabaseService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return all customers for a tenant', async () => {
      const mockCustomers = [
        {
          id: '1',
          code: 'CUST001',
          name_en: 'Customer 1',
          name_ar: 'عميل 1',
          tenant_id: mockTenantId,
        },
      ];

      mockSupabaseClient.eq.mockResolvedValue({
        data: mockCustomers,
        error: null,
      });

      const result = await service.findAll(mockTenantId);

      expect(result).toEqual(mockCustomers);
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('customers');
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

    it('should return empty array when no customers found', async () => {
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
    it('should return a single customer by id', async () => {
      const mockCustomer = {
        id: '1',
        code: 'CUST001',
        name_en: 'Customer 1',
        name_ar: 'عميل 1',
      };

      mockSupabaseClient.single.mockResolvedValue({
        data: mockCustomer,
        error: null,
      });

      const result = await service.findOne('1', mockTenantId);

      expect(result).toEqual(mockCustomer);
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('id', '1');
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('tenant_id', mockTenantId);
    });

    it('should return null when customer not found', async () => {
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
    it('should return customer by code', async () => {
      const mockCustomer = {
        id: '1',
        code: 'CUST001',
        name_en: 'Customer 1',
      };

      mockSupabaseClient.single.mockResolvedValue({
        data: mockCustomer,
        error: null,
      });

      const result = await service.findByCode('CUST001', mockTenantId);

      expect(result).toEqual(mockCustomer);
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('code', 'CUST001');
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
    const createCustomerDto = {
      code: 'CUST001',
      nameEn: 'Test Customer',
      nameAr: 'عميل اختبار',
      email: 'test@example.com',
      phone: '+966501234567',
    };

    it('should create a customer successfully', async () => {
      const mockCustomer = {
        id: '1',
        ...createCustomerDto,
        name_en: createCustomerDto.nameEn,
        name_ar: createCustomerDto.nameAr,
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
        data: mockCustomer,
        error: null,
      });

      const result = await service.create(createCustomerDto, mockTenantId);

      expect(result).toEqual(mockCustomer);
      expect(mockSupabaseClient.insert).toHaveBeenCalled();
    });

    it('should throw BadRequestException if code already exists', async () => {
      // Code exists
      mockSupabaseClient.single.mockResolvedValueOnce({
        data: { id: 'existing' },
        error: null,
      });

      await expect(service.create(createCustomerDto, mockTenantId)).rejects.toThrow(
        BadRequestException,
      );

      await expect(service.create(createCustomerDto, mockTenantId)).rejects.toThrow(
        'Customer code already exists',
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

      await service.create(createCustomerDto, mockTenantId);

      expect(mockSupabaseClient.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          is_active: true,
        }),
      );
    });

    it('should respect provided is_active value', async () => {
      const inactiveCustomer = { ...createCustomerDto, isActive: false };

      mockSupabaseClient.single.mockResolvedValueOnce({
        data: null,
        error: null,
      });

      mockSupabaseClient.single.mockResolvedValueOnce({
        data: { id: '1' },
        error: null,
      });

      await service.create(inactiveCustomer, mockTenantId);

      expect(mockSupabaseClient.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          is_active: false,
        }),
      );
    });

    it('should handle all optional fields', async () => {
      const fullCustomer = {
        ...createCustomerDto,
        taxNumber: '300123456700003',
        website: 'https://example.com',
        address: '123 Main St',
        city: 'Riyadh',
        country: 'Saudi Arabia',
        creditLimit: 50000,
        paymentTerms: 'NET30',
        notes: 'Test customer',
      };

      mockSupabaseClient.single.mockResolvedValueOnce({
        data: null,
        error: null,
      });

      mockSupabaseClient.single.mockResolvedValueOnce({
        data: { id: '1' },
        error: null,
      });

      await service.create(fullCustomer, mockTenantId);

      expect(mockSupabaseClient.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          tax_number: '300123456700003',
          website: 'https://example.com',
          address: '123 Main St',
          city: 'Riyadh',
          country: 'Saudi Arabia',
          credit_limit: 50000,
          payment_terms: 'NET30',
          notes: 'Test customer',
        }),
      );
    });

    it('should handle bank details', async () => {
      const customerWithBank = {
        ...createCustomerDto,
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

      await service.create(customerWithBank, mockTenantId);

      expect(mockSupabaseClient.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          bank_name: 'Al Rajhi Bank',
          bank_account_number: '1234567890',
          bank_iban: 'SA1234567890123456789012',
        }),
      );
    });

    it('should handle contact persons', async () => {
      const customerWithContacts = {
        ...createCustomerDto,
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

      await service.create(customerWithContacts, mockTenantId);

      expect(mockSupabaseClient.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          contact_person: 'John Doe',
          contact_phone: '+966501234568',
          contact_email: 'john@example.com',
        }),
      );
    });
  });

  describe('update', () => {
    it('should update customer name', async () => {
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

    it('should throw error when customer not found', async () => {
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
  });

  describe('remove', () => {
    it('should delete customer successfully', async () => {
      // Check for invoices - none
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

    it('should throw BadRequestException when customer has invoices', async () => {
      // Has invoices
      mockSupabaseClient.limit.mockResolvedValueOnce({
        data: [{ id: 'invoice-1' }],
        error: null,
      });

      await expect(service.remove('1', mockTenantId)).rejects.toThrow(
        BadRequestException,
      );

      await expect(service.remove('1', mockTenantId)).rejects.toThrow(
        'Cannot delete customer with associated invoices',
      );
    });

    it('should check invoices table before deleting', async () => {
      mockSupabaseClient.limit.mockResolvedValueOnce({
        data: [],
        error: null,
      });

      mockSupabaseClient.eq.mockResolvedValue({
        error: null,
      });

      await service.remove('1', mockTenantId);

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('invoices');
      expect(mockSupabaseClient.limit).toHaveBeenCalledWith(1);
    });
  });

  describe('search', () => {
    it('should search customers by name', async () => {
      mockSupabaseClient.or.mockResolvedValue({
        data: [
          { id: '1', name_en: 'Test Customer' },
          { id: '2', name_ar: 'عميل اختبار' },
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
});
