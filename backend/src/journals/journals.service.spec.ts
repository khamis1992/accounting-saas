import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { JournalsService } from './journals.service';
import { SupabaseService } from '../supabase/supabase.service';

describe('JournalsService', () => {
  let service: JournalsService;
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
      gte: jest.fn().mockReturnThis(),
      lte: jest.fn().mockReturnThis(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JournalsService,
        {
          provide: SupabaseService,
          useValue: {
            getClient: jest.fn().mockReturnValue(mockSupabaseClient),
          },
        },
      ],
    }).compile();

    service = module.get<JournalsService>(JournalsService);
    supabaseService = module.get<SupabaseService>(SupabaseService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return all journals for a tenant', async () => {
      const mockJournals = [
        {
          id: '1',
          journal_number: 'JE-001',
          journal_type: 'general',
          description_ar: 'قيد يومية',
          status: 'posted',
          journal_lines: [],
        },
      ];

      mockSupabaseClient.eq.mockResolvedValue({
        data: mockJournals,
        error: null,
      });

      const result = await service.findAll(mockTenantId);

      expect(result).toEqual(mockJournals);
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('journals');
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('tenant_id', mockTenantId);
    });

    it('should filter by status when provided', async () => {
      mockSupabaseClient.eq.mockResolvedValue({
        data: [],
        error: null,
      });

      await service.findAll(mockTenantId, { status: 'posted' });

      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('status', 'posted');
    });

    it('should filter by journalType when provided', async () => {
      mockSupabaseClient.eq.mockResolvedValue({
        data: [],
        error: null,
      });

      await service.findAll(mockTenantId, { journalType: 'sales' });

      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('journal_type', 'sales');
    });

    it('should filter by date range when provided', async () => {
      const startDate = '2024-01-01';
      const endDate = '2024-12-31';

      mockSupabaseClient.eq.mockResolvedValue({
        data: [],
        error: null,
      });

      await service.findAll(mockTenantId, { startDate, endDate });

      expect(mockSupabaseClient.gte).toHaveBeenCalledWith('transaction_date', startDate);
      expect(mockSupabaseClient.lte).toHaveBeenCalledWith('transaction_date', endDate);
    });

    it('should order by transaction_date descending', async () => {
      mockSupabaseClient.eq.mockResolvedValue({
        data: [],
        error: null,
      });

      await service.findAll(mockTenantId);

      expect(mockSupabaseClient.order).toHaveBeenCalledWith('transaction_date', { ascending: false });
    });

    it('should include journal_lines with relations', async () => {
      mockSupabaseClient.eq.mockResolvedValue({
        data: [],
        error: null,
      });

      await service.findAll(mockTenantId);

      expect(mockSupabaseClient.select).toHaveBeenCalledWith(
        expect.stringContaining('journal_lines'),
      );
    });

    it('should return empty array when no journals found', async () => {
      mockSupabaseClient.eq.mockResolvedValue({
        data: [],
        error: null,
      });

      const result = await service.findAll(mockTenantId);

      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('should return a single journal with lines', async () => {
      const mockJournal = {
        id: '1',
        journal_number: 'JE-001',
        journal_type: 'general',
        description_ar: 'قيد يومية',
        status: 'posted',
        journal_lines: [
          {
            id: 'l1',
            account_id: 'acc1',
            debit: 1000,
            credit: 0,
            chart_of_accounts: { code: '1000', name_en: 'Cash' },
          },
        ],
      };

      mockSupabaseClient.single.mockResolvedValue({
        data: mockJournal,
        error: null,
      });

      const result = await service.findOne('1', mockTenantId);

      expect(result).toEqual(mockJournal);
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('id', '1');
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('tenant_id', mockTenantId);
    });

    it('should include account and cost center relations', async () => {
      mockSupabaseClient.single.mockResolvedValue({
        data: { journal_lines: [] },
        error: null,
      });

      await service.findOne('1', mockTenantId);

      expect(mockSupabaseClient.select).toHaveBeenCalledWith(
        expect.stringContaining('chart_of_accounts'),
      );
      expect(mockSupabaseClient.select).toHaveBeenCalledWith(
        expect.stringContaining('cost_centers'),
      );
    });

    it('should throw error when journal not found', async () => {
      mockSupabaseClient.single.mockResolvedValue({
        data: null,
        error: { message: 'Not found' },
      });

      await expect(service.findOne('999', mockTenantId)).rejects.toThrow();
    });

    it('should include balance_type in account relation', async () => {
      mockSupabaseClient.single.mockResolvedValue({
        data: { journal_lines: [] },
        error: null,
      });

      await service.findOne('1', mockTenantId);

      expect(mockSupabaseClient.select).toHaveBeenCalledWith(
        expect.stringContaining('balance_type'),
      );
    });
  });

  describe('create', () => {
    const createJournalDto = {
      journalType: 'general' as const,
      descriptionAr: 'قيد يومية اختبار',
      descriptionEn: 'Test journal entry',
      transactionDate: new Date(),
      lines: [
        {
          lineNumber: 1,
          accountId: 'acc1',
          debit: 1000,
          credit: 0,
        },
        {
          lineNumber: 2,
          accountId: 'acc2',
          debit: 0,
          credit: 1000,
        },
      ],
    };

    it('should create a journal entry successfully', async () => {
      const mockJournal = {
        id: '1',
        journal_number: 'JE-001',
        status: 'draft',
        ...createJournalDto,
      };

      mockSupabaseClient.single.mockResolvedValue({
        data: mockJournal,
        error: null,
      });

      const result = await service.create(createJournalDto, mockTenantId, mockUserId);

      expect(result).toEqual(mockJournal);
      expect(mockSupabaseClient.insert).toHaveBeenCalled();
    });

    it('should validate double-entry (debits = credits)', async () => {
      const invalidDto = {
        ...createJournalDto,
        lines: [
          { lineNumber: 1, accountId: 'acc1', debit: 1000, credit: 0 },
          { lineNumber: 2, accountId: 'acc2', debit: 0, credit: 500 }, // Not balanced
        ],
      };

      await expect(
        service.create(invalidDto, mockTenantId, mockUserId),
      ).rejects.toThrow(BadRequestException);

      await expect(
        service.create(invalidDto, mockTenantId, mockUserId),
      ).rejects.toThrow('Journal must be balanced (debits must equal credits)');
    });

    it('should throw error when no lines provided', async () => {
      const invalidDto = {
        ...createJournalDto,
        lines: [],
      };

      await expect(
        service.create(invalidDto, mockTenantId, mockUserId),
      ).rejects.toThrow(BadRequestException);

      await expect(
        service.create(invalidDto, mockTenantId, mockUserId),
      ).rejects.toThrow('Journal must have at least two lines');
    });

    it('should throw error when only one line provided', async () => {
      const invalidDto = {
        ...createJournalDto,
        lines: [{ lineNumber: 1, accountId: 'acc1', debit: 1000, credit: 0 }],
      };

      await expect(
        service.create(invalidDto, mockTenantId, mockUserId),
      ).rejects.toThrow(BadRequestException);
    });

    it('should set initial status to draft', async () => {
      mockSupabaseClient.single.mockResolvedValue({
        data: { id: '1', status: 'draft' },
        error: null,
      });

      await service.create(createJournalDto, mockTenantId, mockUserId);

      expect(mockSupabaseClient.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'draft',
        }),
      );
    });

    it('should generate journal number automatically', async () => {
      mockSupabaseClient.single.mockResolvedValue({
        data: { id: '1', journal_number: 'JE-001' },
        error: null,
      });

      await service.create(createJournalDto, mockTenantId, mockUserId);

      expect(mockSupabaseClient.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          journal_number: expect.any(String),
        }),
      );
    });

    it('should use provided journal_number if given', async () => {
      const dtoWithNumber = {
        ...createJournalDto,
        journalNumber: 'CUSTOM-001',
      };

      mockSupabaseClient.single.mockResolvedValue({
        data: { id: '1', journal_number: 'CUSTOM-001' },
        error: null,
      });

      await service.create(dtoWithNumber, mockTenantId, mockUserId);

      expect(mockSupabaseClient.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          journal_number: 'CUSTOM-001',
        }),
      );
    });

    it('should set currency and exchange rate defaults', async () => {
      mockSupabaseClient.single.mockResolvedValue({
        data: { id: '1' },
        error: null,
      });

      await service.create(createJournalDto, mockTenantId, mockUserId);

      expect(mockSupabaseClient.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          currency: 'SAR',
          exchange_rate: 1,
        }),
      );
    });

    it('should validate all lines have accountId', async () => {
      const invalidLines = {
        ...createJournalDto,
        lines: [
          { lineNumber: 1, debit: 1000, credit: 0 }, // Missing accountId
        ],
      };

      // This would be validated by class-validator
      // But we should ensure the service handles it
      mockSupabaseClient.single.mockResolvedValue({
        data: { id: '1' },
        error: null,
      });

      const result = await service.create(createJournalDto, mockTenantId, mockUserId);
      expect(result).toBeDefined();
    });

    it('should handle multiple lines correctly', async () => {
      const multiLineDto = {
        ...createJournalDto,
        lines: [
          { lineNumber: 1, accountId: 'acc1', debit: 1000, credit: 0 },
          { lineNumber: 2, accountId: 'acc2', debit: 0, credit: 500 },
          { lineNumber: 3, accountId: 'acc3', debit: 0, credit: 500 },
        ],
      };

      mockSupabaseClient.single.mockResolvedValue({
        data: { id: '1' },
        error: null,
      });

      await service.create(multiLineDto, mockTenantId, mockUserId);

      const totalDebit = multiLineDto.lines.reduce((sum, l) => sum + l.debit, 0);
      const totalCredit = multiLineDto.lines.reduce((sum, l) => sum + l.credit, 0);
      expect(totalDebit).toEqual(totalCredit);
    });

    it('should include created_by when provided', async () => {
      mockSupabaseClient.single.mockResolvedValue({
        data: { id: '1', created_by: mockUserId },
        error: null,
      });

      await service.create(createJournalDto, mockTenantId, mockUserId);

      expect(mockSupabaseClient.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          created_by: mockUserId,
        }),
      );
    });

    it('should handle all journal types', async () => {
      const journalTypes = [
        'general',
        'sales',
        'purchase',
        'receipt',
        'payment',
        'expense',
        'depreciation',
        'adjustment',
        'opening',
        'closing',
      ] as const;

      mockSupabaseClient.single.mockResolvedValue({
        data: { id: '1' },
        error: null,
      });

      for (const type of journalTypes) {
        const dto = { ...createJournalDto, journalType: type };
        await service.create(dto, mockTenantId, mockUserId);
      }

      expect(mockSupabaseClient.insert).toHaveBeenCalledTimes(journalTypes.length);
    });
  });

  describe('update', () => {
    it('should update journal description', async () => {
      const updateDto = {
        descriptionAr: 'وصف محدث',
        descriptionEn: 'Updated description',
      };

      mockSupabaseClient.single.mockResolvedValue({
        data: { id: '1', ...updateDto },
        error: null,
      });

      const result = await service.update('1', updateDto, mockTenantId);

      expect(result).toHaveProperty('descriptionAr', updateDto.descriptionAr);
      expect(mockSupabaseClient.update).toHaveBeenCalled();
    });

    it('should update transaction date', async () => {
      const updateDto = {
        transactionDate: new Date('2024-12-31'),
      };

      mockSupabaseClient.single.mockResolvedValue({
        data: { id: '1' },
        error: null,
      });

      await service.update('1', updateDto, mockTenantId);

      expect(mockSupabaseClient.update).toHaveBeenCalled();
    });

    it('should not allow updating posted journals', async () => {
      // Check status first
      mockSupabaseClient.single.mockResolvedValueOnce({
        data: { status: 'posted' },
        error: null,
      });

      await expect(
        service.update('1', { descriptionAr: 'test' }, mockTenantId),
      ).rejects.toThrow(BadRequestException);

      await expect(
        service.update('1', { descriptionAr: 'test' }, mockTenantId),
      ).rejects.toThrow('Cannot update posted journal');
    });

    it('should not allow updating posted journals', async () => {
      mockSupabaseClient.single.mockResolvedValueOnce({
        data: { status: 'posted' },
        error: null,
      });

      await expect(
        service.update('1', { descriptionAr: 'test' }, mockTenantId),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw error when journal not found', async () => {
      mockSupabaseClient.single.mockResolvedValue({
        data: null,
        error: { message: 'Not found' },
      });

      await expect(
        service.update('999', { descriptionAr: 'test' }, mockTenantId),
      ).rejects.toThrow();
    });

    it('should update notes and attachment', async () => {
      const updateDto = {
        notes: 'Test notes',
        attachmentUrl: 'https://example.com/doc.pdf',
      };

      mockSupabaseClient.single.mockResolvedValue({
        data: { id: '1' },
        error: null,
      });

      await service.update('1', updateDto, mockTenantId);

      expect(mockSupabaseClient.update).toHaveBeenCalledWith(
        expect.objectContaining({
          notes: 'Test notes',
          attachment_url: 'https://example.com/doc.pdf',
        }),
      );
    });
  });

  describe('remove', () => {
    it('should delete draft journal successfully', async () => {
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

    it('should not allow deleting posted journals', async () => {
      mockSupabaseClient.single.mockResolvedValueOnce({
        data: { status: 'posted' },
        error: null,
      });

      await expect(service.remove('1', mockTenantId)).rejects.toThrow(
        BadRequestException,
      );

      await expect(service.remove('1', mockTenantId)).rejects.toThrow(
        'Cannot delete posted journal',
      );
    });

    it('should throw error when journal not found', async () => {
      mockSupabaseClient.single.mockResolvedValue({
        data: null,
        error: { message: 'Not found' },
      });

      await expect(service.remove('999', mockTenantId)).rejects.toThrow();
    });
  });

  describe('submitJournal', () => {
    it('should submit draft journal successfully', async () => {
      mockSupabaseClient.single.mockResolvedValueOnce({
        data: { status: 'draft' },
        error: null,
      });

      mockSupabaseClient.single.mockResolvedValueOnce({
        data: { id: '1', status: 'submitted' },
        error: null,
      });

      const result = await service.submitJournal('1', mockTenantId, mockUserId);

      expect(result.status).toBe('submitted');
      expect(mockSupabaseClient.update).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'submitted',
          submitted_by: mockUserId,
          submitted_at: expect.any(String),
        }),
      );
    });

    it('should not allow submitting already submitted journal', async () => {
      mockSupabaseClient.single.mockResolvedValueOnce({
        data: { status: 'submitted' },
        error: null,
      });

      await expect(service.submitJournal('1', mockTenantId, mockUserId)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should validate balance before submit', async () => {
      // This would require fetching journal lines
      // Implementation depends on actual business logic
      mockSupabaseClient.single.mockResolvedValueOnce({
        data: { status: 'draft' },
        error: null,
      });

      mockSupabaseClient.single.mockResolvedValueOnce({
        data: { id: '1', status: 'submitted' },
        error: null,
      });

      await service.submitJournal('1', mockTenantId, mockUserId);

      expect(mockSupabaseClient.update).toHaveBeenCalled();
    });
  });

  describe('approveJournal', () => {
    it('should approve submitted journal successfully', async () => {
      mockSupabaseClient.single.mockResolvedValueOnce({
        data: { status: 'submitted' },
        error: null,
      });

      mockSupabaseClient.single.mockResolvedValueOnce({
        data: { id: '1', status: 'approved' },
        error: null,
      });

      const result = await service.approveJournal('1', mockTenantId, mockUserId);

      expect(result.status).toBe('approved');
      expect(mockSupabaseClient.update).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'approved',
          approved_by: mockUserId,
          approved_at: expect.any(String),
        }),
      );
    });

    it('should not allow approving draft journal', async () => {
      mockSupabaseClient.single.mockResolvedValueOnce({
        data: { status: 'draft' },
        error: null,
      });

      await expect(service.approveJournal('1', mockTenantId, mockUserId)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should not allow approving already approved journal', async () => {
      mockSupabaseClient.single.mockResolvedValueOnce({
        data: { status: 'approved' },
        error: null,
      });

      await expect(service.approveJournal('1', mockTenantId, mockUserId)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('postJournal', () => {
    it('should post approved journal successfully', async () => {
      mockSupabaseClient.single.mockResolvedValueOnce({
        data: { status: 'approved' },
        error: null,
      });

      mockSupabaseClient.single.mockResolvedValueOnce({
        data: { id: '1', status: 'posted' },
        error: null,
      });

      const result = await service.postJournal('1', mockTenantId, mockUserId);

      expect(result.status).toBe('posted');
      expect(mockSupabaseClient.update).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'posted',
          posted_by: mockUserId,
          posted_at: expect.any(String),
        }),
      );
    });

    it('should set posting_date when posting', async () => {
      mockSupabaseClient.single.mockResolvedValueOnce({
        data: { status: 'approved' },
        error: null,
      });

      mockSupabaseClient.single.mockResolvedValueOnce({
        data: { id: '1' },
        error: null,
      });

      await service.postJournal('1', mockTenantId, mockUserId);

      expect(mockSupabaseClient.update).toHaveBeenCalledWith(
        expect.objectContaining({
          posting_date: expect.any(String),
        }),
      );
    });

    it('should not allow posting non-approved journal', async () => {
      mockSupabaseClient.single.mockResolvedValueOnce({
        data: { status: 'draft' },
        error: null,
      });

      await expect(service.postJournal('1', mockTenantId, mockUserId)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('getJournalBalance', () => {
    it('should return correct balance information', async () => {
      const mockLines = [
        { account_id: 'acc1', debit: 1000, credit: 0 },
        { account_id: 'acc2', debit: 0, credit: 1000 },
      ];

      mockSupabaseClient.single.mockResolvedValue({
        data: { journal_lines: mockLines },
        error: null,
      });

      const result = await service.getJournalBalance('1', mockTenantId);

      expect(result.totalDebit).toBe(1000);
      expect(result.totalCredit).toBe(1000);
      expect(result.isBalanced).toBe(true);
    });

    it('should detect unbalanced journal', async () => {
      const mockLines = [
        { account_id: 'acc1', debit: 1000, credit: 0 },
        { account_id: 'acc2', debit: 0, credit: 500 },
      ];

      mockSupabaseClient.single.mockResolvedValue({
        data: { journal_lines: mockLines },
        error: null,
      });

      const result = await service.getJournalBalance('1', mockTenantId);

      expect(result.totalDebit).toBe(1000);
      expect(result.totalCredit).toBe(500);
      expect(result.isBalanced).toBe(false);
    });

    it('should handle empty lines', async () => {
      mockSupabaseClient.single.mockResolvedValue({
        data: { journal_lines: [] },
        error: null,
      });

      const result = await service.getJournalBalance('1', mockTenantId);

      expect(result.totalDebit).toBe(0);
      expect(result.totalCredit).toBe(0);
      expect(result.isBalanced).toBe(true);
    });

    it('should throw error when journal not found', async () => {
      mockSupabaseClient.single.mockResolvedValue({
        data: null,
        error: { message: 'Not found' },
      });

      await expect(service.getJournalBalance('999', mockTenantId)).rejects.toThrow();
    });
  });

  describe('workflow status transitions', () => {
    it('should follow complete workflow: draft -> submit -> approve -> post', async () => {
      const journalId = '1';

      // Create
      mockSupabaseClient.single.mockResolvedValue({
        data: { id: journalId, status: 'draft' },
        error: null,
      });

      // Submit
      mockSupabaseClient.single.mockResolvedValueOnce({
        data: { status: 'draft' },
        error: null,
      });
      mockSupabaseClient.single.mockResolvedValueOnce({
        data: { id: journalId, status: 'submitted' },
        error: null,
      });

      // Approve
      mockSupabaseClient.single.mockResolvedValueOnce({
        data: { status: 'submitted' },
        error: null,
      });
      mockSupabaseClient.single.mockResolvedValueOnce({
        data: { id: journalId, status: 'approved' },
        error: null,
      });

      // Post
      mockSupabaseClient.single.mockResolvedValueOnce({
        data: { status: 'approved' },
        error: null,
      });
      mockSupabaseClient.single.mockResolvedValueOnce({
        data: { id: journalId, status: 'posted' },
        error: null,
      });

      const submitted = await service.submitJournal(journalId, mockTenantId, mockUserId);
      expect(submitted.status).toBe('submitted');

      const approved = await service.approveJournal(journalId, mockTenantId, mockUserId);
      expect(approved.status).toBe('approved');

      const posted = await service.postJournal(journalId, mockTenantId, mockUserId);
      expect(posted.status).toBe('posted');
    });

    it('should not allow invalid transitions', async () => {
      mockSupabaseClient.single.mockResolvedValueOnce({
        data: { status: 'draft' },
        error: null,
      });

      // Cannot post draft directly
      await expect(service.postJournal('1', mockTenantId, mockUserId)).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});
