import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InvoicesService } from './invoices.service';
import { SupabaseService } from '../supabase/supabase.service';
import { JournalsService } from '../journals/journals.service';

describe('InvoicesService', () => {
  let service: InvoicesService;
  let supabaseService: SupabaseService;
  let journalsService: JournalsService;
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
    };

    const mockJournalsService = {
      create: jest.fn(),
      findOne: jest.fn(),
      postJournal: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InvoicesService,
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
      ],
    }).compile();

    service = module.get<InvoicesService>(InvoicesService);
    supabaseService = module.get<SupabaseService>(SupabaseService);
    journalsService = module.get<JournalsService>(JournalsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return all invoices for a tenant', async () => {
      const mockInvoices = [
        {
          id: '1',
          invoice_number: 'INV-001',
          invoice_type: 'sales',
          status: 'posted',
          tenant_id: mockTenantId,
        },
      ];

      mockSupabaseClient.eq.mockResolvedValue({
        data: mockInvoices,
        error: null,
      });

      const result = await service.findAll(mockTenantId);

      expect(result).toEqual(mockInvoices);
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('invoices');
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('tenant_id', mockTenantId);
    });

    it('should filter by invoice_type', async () => {
      mockSupabaseClient.eq.mockResolvedValue({
        data: [],
        error: null,
      });

      await service.findAll(mockTenantId, { invoiceType: 'sales' });

      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('invoice_type', 'sales');
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

    it('should order by invoice_date descending', async () => {
      mockSupabaseClient.eq.mockResolvedValue({
        data: [],
        error: null,
      });

      await service.findAll(mockTenantId);

      expect(mockSupabaseClient.order).toHaveBeenCalledWith('invoice_date', {
        ascending: false,
      });
    });

    it('should return empty array when no invoices found', async () => {
      mockSupabaseClient.eq.mockResolvedValue({
        data: [],
        error: null,
      });

      const result = await service.findAll(mockTenantId);

      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('should return invoice with lines and taxes', async () => {
      const mockInvoice = {
        id: '1',
        invoice_number: 'INV-001',
        invoice_lines: [
          { id: 'l1', description: 'Product 1', quantity: 2, unit_price: 100 },
        ],
        invoice_taxes: [],
      };

      mockSupabaseClient.single.mockResolvedValue({
        data: mockInvoice,
        error: null,
      });

      const result = await service.findOne('1', mockTenantId);

      expect(result).toEqual(mockInvoice);
      expect(mockSupabaseClient.select).toHaveBeenCalledWith(
        expect.stringContaining('invoice_lines'),
      );
      expect(mockSupabaseClient.select).toHaveBeenCalledWith(
        expect.stringContaining('invoice_taxes'),
      );
    });

    it('should throw NotFoundException when invoice not found', async () => {
      mockSupabaseClient.single.mockResolvedValue({
        data: null,
        error: null,
      });

      await expect(service.findOne('999', mockTenantId)).rejects.toThrow(
        NotFoundException,
      );

      await expect(service.findOne('999', mockTenantId)).rejects.toThrow(
        'Invoice not found',
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

  describe('generateInvoiceNumber', () => {
    it('should generate invoice number using RPC', async () => {
      const mockNumber = 'INV-2024-001';

      mockSupabaseClient.rpc.mockResolvedValue({
        data: mockNumber,
        error: null,
      });

      const result = await service.generateInvoiceNumber(mockTenantId, 'sales');

      expect(result).toBe(mockNumber);
      expect(mockSupabaseClient.rpc).toHaveBeenCalledWith('generate_invoice_number', {
        p_tenant_id: mockTenantId,
        p_invoice_type: 'sales',
      });
    });

    it('should throw error when RPC fails', async () => {
      mockSupabaseClient.rpc.mockResolvedValue({
        data: null,
        error: { message: 'RPC error' },
      });

      await expect(
        service.generateInvoiceNumber(mockTenantId, 'sales'),
      ).rejects.toThrow();
    });
  });

  describe('calculateInvoiceTotals', () => {
    it('should calculate simple invoice totals', async () => {
      const lines = [
        { quantity: 2, unitPrice: 100, discountAmount: 0, discountPercentage: 0 },
      ];

      const result = await service.calculateInvoiceTotals(lines);

      expect(result.subtotal).toBe(200);
      expect(result.discountAmount).toBe(0);
      expect(result.taxableAmount).toBe(200);
      expect(result.totalAmount).toBe(200);
      expect(result.balanceAmount).toBe(200);
    });

    it('should calculate line totals with discount', async () => {
      const lines = [
        { quantity: 2, unitPrice: 100, discountAmount: 20 },
      ];

      const result = await service.calculateInvoiceTotals(lines);

      expect(result.subtotal).toBe(180);
      expect(result.totalAmount).toBe(180);
    });

    it('should calculate line totals with percentage discount', async () => {
      const lines = [
        { quantity: 2, unitPrice: 100, discountPercentage: 10 },
      ];

      const result = await service.calculateInvoiceTotals(lines);

      expect(result.subtotal).toBe(180);
    });

    it('should calculate totals with line tax', async () => {
      const lines = [
        {
          quantity: 1,
          unitPrice: 1000,
          taxPercentage: 15,
        },
      ];

      const result = await service.calculateInvoiceTotals(lines);

      expect(result.subtotal).toBe(1000);
      expect(result.taxAmount).toBe(150);
      expect(result.totalAmount).toBe(1150);
    });

    it('should calculate invoice-level discount', async () => {
      const lines = [
        { quantity: 2, unitPrice: 100 },
      ];

      const result = await service.calculateInvoiceTotals(lines, [], 50);

      expect(result.subtotal).toBe(200);
      expect(result.discountAmount).toBe(50);
      expect(result.taxableAmount).toBe(150);
      expect(result.totalAmount).toBe(150);
    });

    it('should calculate invoice-level percentage discount', async () => {
      const lines = [
        { quantity: 2, unitPrice: 100 },
      ];

      const result = await service.calculateInvoiceTotals(lines, [], 0, 10);

      expect(result.subtotal).toBe(200);
      expect(result.discountPercentage).toBe(10);
      expect(result.discountAmount).toBe(20);
      expect(result.taxableAmount).toBe(180);
    });

    it('should handle multiple lines', async () => {
      const lines = [
        { quantity: 1, unitPrice: 100 },
        { quantity: 2, unitPrice: 50 },
        { quantity: 3, unitPrice: 25 },
      ];

      const result = await service.calculateInvoiceTotals(lines);

      expect(result.subtotal).toBe(225);
    });

    it('should handle empty lines array', async () => {
      const result = await service.calculateInvoiceTotals([]);

      expect(result.subtotal).toBe(0);
      expect(result.totalAmount).toBe(0);
    });

    it('should prevent negative taxable amount', async () => {
      const lines = [
        { quantity: 1, unitPrice: 100 },
      ];

      const result = await service.calculateInvoiceTotals(lines, [], 200);

      expect(result.taxableAmount).toBe(0);
    });

    it('should update line values', async () => {
      const lines = [
        { quantity: 2, unitPrice: 100, taxPercentage: 15 },
      ];

      await service.calculateInvoiceTotals(lines);

      expect(lines[0]).toHaveProperty('taxableAmount');
      expect(lines[0]).toHaveProperty('taxAmount');
      expect(lines[0]).toHaveProperty('lineTotal');
    });
  });

  describe('create', () => {
    const createInvoiceDto = {
      invoiceType: 'sales' as const,
      partyType: 'customer' as const,
      partyId: 'customer-1',
      invoiceDate: new Date(),
      lines: [
        {
          lineNumber: 1,
          description: 'Product 1',
          quantity: 2,
          unitPrice: 100,
        },
      ],
    };

    it('should create sales invoice successfully', async () => {
      mockSupabaseClient.rpc.mockResolvedValue({
        data: 'INV-001',
        error: null,
      });

      mockSupabaseClient.single.mockResolvedValue({
        data: { id: '1', invoice_number: 'INV-001' },
        error: null,
      });

      const result = await service.create(createInvoiceDto, mockTenantId, mockUserId);

      expect(result).toHaveProperty('id');
      expect(mockSupabaseClient.insert).toHaveBeenCalled();
    });

    it('should validate sales invoice has customer party type', async () => {
      const invalidDto = {
        ...createInvoiceDto,
        partyType: 'vendor' as const,
      };

      await expect(
        service.create(invalidDto, mockTenantId, mockUserId),
      ).rejects.toThrow(BadRequestException);

      await expect(
        service.create(invalidDto, mockTenantId, mockUserId),
      ).rejects.toThrow('Sales invoices must have a customer');
    });

    it('should validate purchase invoice has vendor party type', async () => {
      const purchaseDto = {
        ...createInvoiceDto,
        invoiceType: 'purchase' as const,
        partyType: 'customer' as const,
      };

      await expect(
        service.create(purchaseDto, mockTenantId, mockUserId),
      ).rejects.toThrow(BadRequestException);

      await expect(
        service.create(purchaseDto, mockTenantId, mockUserId),
      ).rejects.toThrow('Purchase invoices must have a vendor');
    });

    it('should require at least one line', async () => {
      const invalidDto = {
        ...createInvoiceDto,
        lines: [],
      };

      await expect(
        service.create(invalidDto, mockTenantId, mockUserId),
      ).rejects.toThrow(BadRequestException);

      await expect(
        service.create(invalidDto, mockTenantId, mockUserId),
      ).rejects.toThrow('Invoice must have at least one line');
    });

    it('should set initial status to draft', async () => {
      mockSupabaseClient.rpc.mockResolvedValue({
        data: 'INV-001',
        error: null,
      });

      mockSupabaseClient.single.mockResolvedValue({
        data: { id: '1', status: 'draft' },
        error: null,
      });

      await service.create(createInvoiceDto, mockTenantId, mockUserId);

      expect(mockSupabaseClient.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'draft',
        }),
      );
    });

    it('should include created_by when provided', async () => {
      mockSupabaseClient.rpc.mockResolvedValue({
        data: 'INV-001',
        error: null,
      });

      mockSupabaseClient.single.mockResolvedValue({
        data: { id: '1' },
        error: null,
      });

      await service.create(createInvoiceDto, mockTenantId, mockUserId);

      expect(mockSupabaseClient.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          created_by: mockUserId,
        }),
      );
    });

    it('should handle all invoice types', async () => {
      const invoiceTypes = ['sales', 'purchase', 'sales_return', 'purchase_return'] as const;

      mockSupabaseClient.rpc.mockResolvedValue({
        data: 'INV-001',
        error: null,
      });

      mockSupabaseClient.single.mockResolvedValue({
        data: { id: '1' },
        error: null,
      });

      for (const type of invoiceTypes) {
        const dto = { ...createInvoiceDto, invoiceType: type };
        await service.create(dto, mockTenantId, mockUserId);
      }

      expect(mockSupabaseClient.insert).toHaveBeenCalledTimes(invoiceTypes.length);
    });
  });

  describe('update', () => {
    it('should update draft invoice', async () => {
      const updateDto = {
        dueDate: new Date('2024-12-31'),
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

    it('should not allow updating posted invoice', async () => {
      mockSupabaseClient.single.mockResolvedValueOnce({
        data: { status: 'posted' },
        error: null,
      });

      await expect(
        service.update('1', { notes: 'test' }, mockTenantId),
      ).rejects.toThrow(ForbiddenException);

      await expect(
        service.update('1', { notes: 'test' }, mockTenantId),
      ).rejects.toThrow('Cannot update posted invoice');
    });

    it('should throw error when invoice not found', async () => {
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
    it('should delete draft invoice successfully', async () => {
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

    it('should not allow deleting posted invoice', async () => {
      mockSupabaseClient.single.mockResolvedValueOnce({
        data: { status: 'posted' },
        error: null,
      });

      await expect(service.remove('1', mockTenantId)).rejects.toThrow(
        ForbiddenException,
      );

      await expect(service.remove('1', mockTenantId)).rejects.toThrow(
        'Cannot delete posted invoice',
      );
    });

    it('should throw error when invoice not found', async () => {
      mockSupabaseClient.single.mockResolvedValue({
        data: null,
        error: { message: 'Not found' },
      });

      await expect(service.remove('999', mockTenantId)).rejects.toThrow();
    });
  });

  describe('postInvoice', () => {
    it('should post approved invoice and create journal', async () => {
      const mockInvoice = {
        id: '1',
        status: 'approved',
        invoice_number: 'INV-001',
        invoice_type: 'sales',
        party_type: 'customer',
        total_amount: 1150,
      };

      mockSupabaseClient.single.mockResolvedValueOnce({
        data: mockInvoice,
        error: null,
      });

      mockSupabaseClient.single.mockResolvedValueOnce({
        data: { id: '1', status: 'posted' },
        error: null,
      });

      const result = await service.postInvoice('1', mockTenantId, mockUserId);

      expect(result.status).toBe('posted');
      expect(mockSupabaseClient.update).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'posted',
          posted_by: mockUserId,
          posted_at: expect.any(String),
        }),
      );
    });

    it('should not allow posting non-approved invoice', async () => {
      mockSupabaseClient.single.mockResolvedValueOnce({
        data: { status: 'draft' },
        error: null,
      });

      await expect(
        service.postInvoice('1', mockTenantId, mockUserId),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw error when invoice not found', async () => {
      mockSupabaseClient.single.mockResolvedValue({
        data: null,
        error: { message: 'Not found' },
      });

      await expect(
        service.postInvoice('999', mockTenantId, mockUserId),
      ).rejects.toThrow();
    });
  });

  describe('workflow', () => {
    it('should follow complete workflow: draft -> approve -> post', async () => {
      const invoiceId = '1';

      // Draft status already set
      mockSupabaseClient.single.mockResolvedValueOnce({
        data: { status: 'draft' },
        error: null,
      });
      mockSupabaseClient.single.mockResolvedValueOnce({
        data: { id: invoiceId, status: 'approved' },
        error: null,
      });

      // Post
      mockSupabaseClient.single.mockResolvedValueOnce({
        data: { status: 'approved' },
        error: null,
      });
      mockSupabaseClient.single.mockResolvedValueOnce({
        data: { id: invoiceId, status: 'posted' },
        error: null,
      });

      // Approve
      const approved = await service.approveInvoice(invoiceId, mockTenantId, mockUserId);
      expect(approved.status).toBe('approved');

      // Post
      const posted = await service.postInvoice(invoiceId, mockTenantId, mockUserId);
      expect(posted.status).toBe('posted');
    });
  });
});
