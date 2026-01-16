import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { SupabaseService } from '../supabase/supabase.service';
import { JournalsService } from '../journals/journals.service';
import { InvoicesService } from '../invoices/invoices.service';

describe('PaymentsService', () => {
  let service: PaymentsService;
  let supabaseService: SupabaseService;
  let journalsService: JournalsService;
  let invoicesService: InvoicesService;
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
      rpc: jest.fn().mockReturnThis(),
      in: jest.fn().mockReturnThis(),
    };

    const mockJournalsService = {
      create: jest.fn(),
      findOne: jest.fn(),
    };

    const mockInvoicesService = {
      findOne: jest.fn(),
      update: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentsService,
        {
          provide: SupabaseService,
          useValue: {
            getClient: jest.fn().mockReturnValue(mockSupabaseClient),
          },
        },
        {
          provide: JournalsService,
          useValue: mockJournalsService,
        },
        {
          provide: InvoicesService,
          useValue: mockInvoicesService,
        },
      ],
    }).compile();

    service = module.get<PaymentsService>(PaymentsService);
    supabaseService = module.get<SupabaseService>(SupabaseService);
    journalsService = module.get<JournalsService>(JournalsService);
    invoicesService = module.get<InvoicesService>(InvoicesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return all payments for a tenant', async () => {
      const mockPayments = [
        {
          id: '1',
          payment_number: 'PAY-001',
          payment_type: 'receipt',
          status: 'posted',
          tenant_id: mockTenantId,
        },
      ];

      mockSupabaseClient.eq.mockResolvedValue({
        data: mockPayments,
        error: null,
      });

      const result = await service.findAll(mockTenantId);

      expect(result).toEqual(mockPayments);
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('payments');
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('tenant_id', mockTenantId);
    });

    it('should filter by payment_type', async () => {
      mockSupabaseClient.eq.mockResolvedValue({
        data: [],
        error: null,
      });

      await service.findAll(mockTenantId, { paymentType: 'receipt' });

      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('payment_type', 'receipt');
    });

    it('should filter by status', async () => {
      mockSupabaseClient.eq.mockResolvedValue({
        data: [],
        error: null,
      });

      await service.findAll(mockTenantId, { status: 'posted' });

      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('status', 'posted');
    });

    it('should filter by party_type', async () => {
      mockSupabaseClient.eq.mockResolvedValue({
        data: [],
        error: null,
      });

      await service.findAll(mockTenantId, { partyType: 'customer' });

      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('party_type', 'customer');
    });

    it('should order by payment_date descending', async () => {
      mockSupabaseClient.eq.mockResolvedValue({
        data: [],
        error: null,
      });

      await service.findAll(mockTenantId);

      expect(mockSupabaseClient.order).toHaveBeenCalledWith('payment_date', {
        ascending: false,
      });
    });

    it('should return empty array when no payments found', async () => {
      mockSupabaseClient.eq.mockResolvedValue({
        data: [],
        error: null,
      });

      const result = await service.findAll(mockTenantId);

      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('should return payment with allocations', async () => {
      const mockPayment = {
        id: '1',
        payment_number: 'PAY-001',
        payment_type: 'receipt',
        payment_allocations: [
          { id: 'a1', invoice_id: 'inv1', amount: 500 },
        ],
      };

      mockSupabaseClient.single.mockResolvedValue({
        data: mockPayment,
        error: null,
      });

      const result = await service.findOne('1', mockTenantId);

      expect(result).toEqual(mockPayment);
      expect(mockSupabaseClient.select).toHaveBeenCalledWith(
        expect.stringContaining('payment_allocations'),
      );
    });

    it('should throw NotFoundException when payment not found', async () => {
      mockSupabaseClient.single.mockResolvedValue({
        data: null,
        error: null,
      });

      await expect(service.findOne('999', mockTenantId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw error when database error occurs', async () => {
      mockSupabaseClient.single.mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
      });

      await expect(service.findOne('1', mockTenantId)).rejects.toThrow();
    });
  });

  describe('generatePaymentNumber', () => {
    it('should generate payment number using RPC', async () => {
      const mockNumber = 'PAY-2024-001';

      mockSupabaseClient.rpc.mockResolvedValue({
        data: mockNumber,
        error: null,
      });

      const result = await service.generatePaymentNumber(mockTenantId, 'receipt');

      expect(result).toBe(mockNumber);
      expect(mockSupabaseClient.rpc).toHaveBeenCalledWith('generate_payment_number', {
        p_tenant_id: mockTenantId,
        p_payment_type: 'receipt',
      });
    });

    it('should throw error when RPC fails', async () => {
      mockSupabaseClient.rpc.mockResolvedValue({
        data: null,
        error: { message: 'RPC error' },
      });

      await expect(
        service.generatePaymentNumber(mockTenantId, 'receipt'),
      ).rejects.toThrow();
    });
  });

  describe('create', () => {
    const createPaymentDto = {
      paymentType: 'receipt' as const,
      partyType: 'customer' as const,
      partyId: 'customer-1',
      paymentDate: new Date(),
      amount: 1000,
      paymentMethod: 'cash',
      allocations: [
        {
          invoiceId: 'inv-1',
          amount: 1000,
        },
      ],
    };

    it('should create receipt payment successfully', async () => {
      mockSupabaseClient.rpc.mockResolvedValue({
        data: 'PAY-001',
        error: null,
      });

      mockSupabaseClient.single.mockResolvedValueOnce({
        data: { id: 'inv-1', balance_amount: 1500, status: 'posted' },
        error: null,
      });

      mockSupabaseClient.single.mockResolvedValueOnce({
        data: { id: '1', payment_number: 'PAY-001' },
        error: null,
      });

      const result = await service.create(createPaymentDto, mockTenantId, mockUserId);

      expect(result).toHaveProperty('id');
      expect(mockSupabaseClient.insert).toHaveBeenCalled();
    });

    it('should validate receipt has customer party type', async () => {
      const invalidDto = {
        ...createPaymentDto,
        partyType: 'vendor' as const,
      };

      await expect(
        service.create(invalidDto, mockTenantId, mockUserId),
      ).rejects.toThrow(BadRequestException);

      await expect(
        service.create(invalidDto, mockTenantId, mockUserId),
      ).rejects.toThrow('Receipts must be from customers');
    });

    it('should validate payment has vendor party type', async () => {
      const paymentDto = {
        ...createPaymentDto,
        paymentType: 'payment' as const,
        partyType: 'customer' as const,
      };

      await expect(
        service.create(paymentDto, mockTenantId, mockUserId),
      ).rejects.toThrow(BadRequestException);

      await expect(
        service.create(paymentDto, mockTenantId, mockUserId),
      ).rejects.toThrow('Payments must be to vendors');
    });

    it('should require at least one allocation', async () => {
      const invalidDto = {
        ...createPaymentDto,
        allocations: [],
      };

      await expect(
        service.create(invalidDto, mockTenantId, mockUserId),
      ).rejects.toThrow(BadRequestException);

      await expect(
        service.create(invalidDto, mockTenantId, mockUserId),
      ).rejects.toThrow('Payment must have at least one allocation');
    });

    it('should validate allocation amount does not exceed invoice balance', async () => {
      mockSupabaseClient.single.mockResolvedValueOnce({
        data: { id: 'inv-1', balance_amount: 500, status: 'posted' },
        error: null,
      });

      const invalidDto = {
        ...createPaymentDto,
        allocations: [{ invoiceId: 'inv-1', amount: 1000 }],
      };

      await expect(
        service.create(invalidDto, mockTenantId, mockUserId),
      ).rejects.toThrow(BadRequestException);

      await expect(
        service.create(invalidDto, mockTenantId, mockUserId),
      ).rejects.toThrow('Allocation amount exceeds invoice balance');
    });

    it('should validate invoice is posted', async () => {
      mockSupabaseClient.single.mockResolvedValueOnce({
        data: { id: 'inv-1', balance_amount: 1500, status: 'draft' },
        error: null,
      });

      await expect(
        service.create(createPaymentDto, mockTenantId, mockUserId),
      ).rejects.toThrow(BadRequestException);

      await expect(
        service.create(createPaymentDto, mockTenantId, mockUserId),
      ).rejects.toThrow('Can only allocate to posted invoices');
    });

    it('should set initial status to draft', async () => {
      mockSupabaseClient.rpc.mockResolvedValue({
        data: 'PAY-001',
        error: null,
      });

      mockSupabaseClient.single.mockResolvedValueOnce({
        data: { id: 'inv-1', balance_amount: 1500, status: 'posted' },
        error: null,
      });

      mockSupabaseClient.single.mockResolvedValueOnce({
        data: { id: '1', status: 'draft' },
        error: null,
      });

      await service.create(createPaymentDto, mockTenantId, mockUserId);

      expect(mockSupabaseClient.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'draft',
        }),
      );
    });

    it('should include created_by when provided', async () => {
      mockSupabaseClient.rpc.mockResolvedValue({
        data: 'PAY-001',
        error: null,
      });

      mockSupabaseClient.single.mockResolvedValueOnce({
        data: { id: 'inv-1', balance_amount: 1500, status: 'posted' },
        error: null,
      });

      mockSupabaseClient.single.mockResolvedValueOnce({
        data: { id: '1' },
        error: null,
      });

      await service.create(createPaymentDto, mockTenantId, mockUserId);

      expect(mockSupabaseClient.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          created_by: mockUserId,
        }),
      );
    });

    it('should handle multiple allocations', async () => {
      const multiAllocationDto = {
        ...createPaymentDto,
        amount: 1500,
        allocations: [
          { invoiceId: 'inv-1', amount: 1000 },
          { invoiceId: 'inv-2', amount: 500 },
        ],
      };

      mockSupabaseClient.rpc.mockResolvedValue({
        data: 'PAY-001',
        error: null,
      });

      mockSupabaseClient.single.mockResolvedValueOnce({
        data: { id: 'inv-1', balance_amount: 1500, status: 'posted' },
        error: null,
      });

      mockSupabaseClient.single.mockResolvedValueOnce({
        data: { id: '1' },
        error: null,
      });

      await service.create(multiAllocationDto, mockTenantId, mockUserId);

      expect(multiAllocationDto.allocations).toHaveLength(2);
    });
  });

  describe('update', () => {
    it('should update draft payment', async () => {
      const updateDto = {
        paymentDate: new Date('2024-12-31'),
        notes: 'Updated notes',
      };

      mockSupabaseClient.single.mockResolvedValueOnce({
        data: { status: 'draft' },
        error: null,
      });

      mockSupabaseClient.single.mockResolvedValueOnce({
        data: { id: '1', ...updateDto },
        error: null,
      });

      const result = await service.update('1', updateDto, mockTenantId);

      expect(result).toHaveProperty('id');
      expect(mockSupabaseClient.update).toHaveBeenCalled();
    });

    it('should not allow updating posted payment', async () => {
      mockSupabaseClient.single.mockResolvedValueOnce({
        data: { status: 'posted' },
        error: null,
      });

      await expect(
        service.update('1', { notes: 'test' }, mockTenantId),
      ).rejects.toThrow(ForbiddenException);

      await expect(
        service.update('1', { notes: 'test' }, mockTenantId),
      ).rejects.toThrow('Cannot update posted payment');
    });

    it('should throw error when payment not found', async () => {
      mockSupabaseClient.single.mockResolvedValue({
        data: null,
        error: { message: 'Not found' },
      });

      await expect(
        service.update('999', { notes: 'test' }, mockTenantId),
      ).rejects.toThrow();
    });
  });

  describe('remove', () => {
    it('should delete draft payment successfully', async () => {
      mockSupabaseClient.single.mockResolvedValueOnce({
        data: { status: 'draft' },
        error: null,
      });

      mockSupabaseClient.eq.mockResolvedValue({
        error: null,
      });

      const result = await service.remove('1', mockTenantId);

      expect(result).toEqual({ success: true });
      expect(mockSupabaseClient.delete).toHaveBeenCalled();
    });

    it('should not allow deleting posted payment', async () => {
      mockSupabaseClient.single.mockResolvedValueOnce({
        data: { status: 'posted' },
        error: null,
      });

      await expect(service.remove('1', mockTenantId)).rejects.toThrow(
        ForbiddenException,
      );

      await expect(service.remove('1', mockTenantId)).rejects.toThrow(
        'Cannot delete posted payment',
      );
    });

    it('should throw error when payment not found', async () => {
      mockSupabaseClient.single.mockResolvedValue({
        data: null,
        error: { message: 'Not found' },
      });

      await expect(service.remove('999', mockTenantId)).rejects.toThrow();
    });
  });

  describe('postPayment', () => {
    it('should post approved payment and create journal', async () => {
      const mockPayment = {
        id: '1',
        status: 'approved',
        payment_number: 'PAY-001',
        payment_type: 'receipt',
        party_type: 'customer',
        amount: 1000,
      };

      mockSupabaseClient.single.mockResolvedValueOnce({
        data: mockPayment,
        error: null,
      });

      mockSupabaseClient.single.mockResolvedValueOnce({
        data: { id: '1', status: 'posted' },
        error: null,
      });

      const result = await service.postPayment('1', mockTenantId, mockUserId);

      expect(result.status).toBe('posted');
      expect(mockSupabaseClient.update).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'posted',
          posted_by: mockUserId,
          posted_at: expect.any(String),
        }),
      );
    });

    it('should not allow posting non-approved payment', async () => {
      mockSupabaseClient.single.mockResolvedValueOnce({
        data: { status: 'draft' },
        error: null,
      });

      await expect(
        service.postPayment('1', mockTenantId, mockUserId),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw error when payment not found', async () => {
      mockSupabaseClient.single.mockResolvedValue({
        data: null,
        error: { message: 'Not found' },
      });

      await expect(
        service.postPayment('999', mockTenantId, mockUserId),
      ).rejects.toThrow();
    });
  });

  describe('allocatePayment', () => {
    it('should allocate payment to invoices', async () => {
      const allocations = [
        { invoiceId: 'inv-1', amount: 500 },
        { invoiceId: 'inv-2', amount: 500 },
      ];

      mockSupabaseClient.single.mockResolvedValueOnce({
        data: {
          id: 'pay-1',
          amount: 1000,
          status: 'draft',
          payment_allocations: [],
        },
        error: null,
      });

      mockSupabaseClient.single.mockResolvedValueOnce({
        data: { id: 'inv-1', balance_amount: 1000, status: 'posted' },
        error: null,
      });

      mockSupabaseClient.single.mockResolvedValueOnce({
        data: { id: 'inv-2', balance_amount: 1000, status: 'posted' },
        error: null,
      });

      mockSupabaseClient.single.mockResolvedValueOnce({
        data: { id: 'pay-1' },
        error: null,
      });

      const result = await service.allocatePayment('pay-1', allocations, mockTenantId);

      expect(result).toHaveProperty('id');
      expect(mockSupabaseClient.update).toHaveBeenCalled();
    });

    it('should validate total allocation does not exceed payment amount', async () => {
      const allocations = [
        { invoiceId: 'inv-1', amount: 1500 },
      ];

      mockSupabaseClient.single.mockResolvedValueOnce({
        data: {
          id: 'pay-1',
          amount: 1000,
          status: 'draft',
          payment_allocations: [],
        },
        error: null,
      });

      await expect(
        service.allocatePayment('pay-1', allocations, mockTenantId),
      ).rejects.toThrow(BadRequestException);

      await expect(
        service.allocatePayment('pay-1', allocations, mockTenantId),
      ).rejects.toThrow('Total allocation exceeds payment amount');
    });

    it('should validate invoice balance', async () => {
      const allocations = [
        { invoiceId: 'inv-1', amount: 1000 },
      ];

      mockSupabaseClient.single.mockResolvedValueOnce({
        data: {
          id: 'pay-1',
          amount: 1000,
          status: 'draft',
          payment_allocations: [],
        },
        error: null,
      });

      mockSupabaseClient.single.mockResolvedValueOnce({
        data: { id: 'inv-1', balance_amount: 500, status: 'posted' },
        error: null,
      });

      await expect(
        service.allocatePayment('pay-1', allocations, mockTenantId),
      ).rejects.toThrow(BadRequestException);

      await expect(
        service.allocatePayment('pay-1', allocations, mockTenantId),
      ).rejects.toThrow('Allocation amount exceeds invoice balance');
    });
  });

  describe('workflow', () => {
    it('should follow complete workflow: draft -> approve -> post', async () => {
      const paymentId = '1';

      // Draft to approve
      mockSupabaseClient.single.mockResolvedValueOnce({
        data: { status: 'draft' },
        error: null,
      });
      mockSupabaseClient.single.mockResolvedValueOnce({
        data: { id: paymentId, status: 'approved' },
        error: null,
      });

      // Approve to post
      mockSupabaseClient.single.mockResolvedValueOnce({
        data: { status: 'approved' },
        error: null,
      });
      mockSupabaseClient.single.mockResolvedValueOnce({
        data: { id: paymentId, status: 'posted' },
        error: null,
      });

      const approved = await service.approvePayment(paymentId, mockTenantId, mockUserId);
      expect(approved.status).toBe('approved');

      const posted = await service.postPayment(paymentId, mockTenantId, mockUserId);
      expect(posted.status).toBe('posted');
    });
  });
});
