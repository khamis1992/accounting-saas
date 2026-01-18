const fs = require('fs');
const path = require('path');

// Type mapping: camelCase -> snake_case
const typeMappings = {
  'customerId': 'customer_id',
  'vendorId': 'vendor_id',
  'unitPrice': 'unit_price',
  'taxRate': 'tax_rate',
  'descriptionAr': 'description_ar',
  'descriptionEn': 'description_en',
  'expectedDeliveryDate': 'expected_delivery_date',
  'accountType': 'account_type',
  'accountCode': 'account_code',
  'accountName': 'account_name',
  'contactName': 'contact_name',
  'phoneNumber': 'phone_number',
  'emailAddress': 'email_address',
  'websiteUrl': 'website_url',
  'taxIdNumber': 'tax_id_number',
  'postalCode': 'postal_code',
  'streetAddress': 'street_address',
  'cityName': 'city_name',
  'countryCode': 'country_code',
  'currencyCode': 'currency_code',
  'paymentMethod': 'payment_method',
  'paymentTerms': 'payment_terms',
  'invoiceNumber': 'invoice_number',
  'quotationNumber': 'quotation_number',
  'purchaseOrderNumber': 'purchase_order_number',
  'orderDate': 'order_date',
  'deliveryDate': 'delivery_date',
  'dueDate': 'due_date',
  'invoiceDate': 'invoice_date',
  'receiptDate': 'receipt_date',
  'paymentDate': 'payment_date',
  'startDate': 'start_date',
  'endDate': 'end_date',
  'validUntil': 'valid_until',
  'fiscalYear': 'fiscal_year',
  'fiscalPeriod': 'fiscal_period',
  'costCenter': 'cost_center',
  'journalType': 'journal_type',
  'referenceNumber': 'reference_number',
  'transactionDate': 'transaction_date',
  'bankAccountId': 'bank_account_id',
  'reconciliationDate': 'reconciliation_date',
  'depreciationRate': 'depreciation_rate',
  'salvageValue': 'salvage_value',
  'usefulLife': 'useful_life',
  'purchaseDate': 'purchase_date',
  'disposalDate': 'disposal_date',
  'netBookValue': 'net_book_value',
  'accumulatedDepreciation': 'accumulated_depreciation',
  'vatRate': 'vat_rate',
  'vatAmount': 'vat_amount',
  'vatReturn': 'vat_return',
  'vatPeriod': 'vat_period',
  'lineItems': 'line_items',
  'itemId': 'item_id',
  'productId': 'product_id',
  'accountId': 'account_id',
  'userId': 'user_id',
  'roleId': 'role_id',
  'companyId': 'company_id',
  'profileId': 'profile_id',
  'imageUrl': 'image_url',
  'fileName': 'file_name',
  'fileSize': 'file_size',
  'fileType': 'file_type',
  'isActive': 'is_active',
  'isRequired': 'is_required',
  'isDefault': 'is_default',
  'isVerified': 'is_verified',
  'createdAt': 'created_at',
  'updatedAt': 'updated_at',
  'deletedAt': 'deleted_at',
};

// API files to update
const apiFiles = [
  'lib/api/quotations.ts',
  'lib/api/purchase-orders.ts',
  'lib/api/invoices.ts',
  'lib/api/payments.ts',
  'lib/api/customers.ts',
  'lib/api/vendors.ts',
  'lib/api/expenses.ts',
  'lib/api/assets.ts',
  'lib/api/banking.ts',
  'lib/api/journals.ts',
];

let totalUpdates = 0;

apiFiles.forEach(file => {
  const filePath = path.join(process.cwd(), file);
  
  if (!fs.existsSync(filePath)) {
    console.log(`Skipping ${file} - not found`);
    return;
  }
  
  let content = fs.readFileSync(filePath, 'utf8');
  let fileUpdates = 0;
  
  // Replace in interface definitions and type annotations
  Object.entries(typeMappings).forEach(([camelCase, snakeCase]) => {
    // Match whole words only (word boundaries)
    const regex = new RegExp(`\b${camelCase}\b`, 'g');
    const matches = content.match(regex);
    if (matches && matches.length > 0) {
      content = content.replace(regex, snakeCase);
      fileUpdates += matches.length;
    }
  });
  
  if (fileUpdates > 0) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✓ Updated ${file}: ${fileUpdates} replacements`);
    totalUpdates += fileUpdates;
  }
});

console.log(`\n✅ Total updates: ${totalUpdates}`);
console.log('Done!');
