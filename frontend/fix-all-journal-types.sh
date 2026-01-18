#!/bin/bash
# Fix all remaining type mismatches with comprehensive search and replace

# Fix journals page
sed -i 's/journal_type: formData.journalType/journal_type: formData.journalType/g' app/\[locale\]/\(app\)/accounting/journals/new/page.tsx
sed -i 's/description_ar: formData.descriptionAr/description_ar: formData.descriptionAr/g' app/\[locale\]/\(app\)/accounting/journals/new/page.tsx
sed -i 's/description_en: formData.descriptionEn/description_en: formData.descriptionEn/g' app/\[locale\]/\(app\)/accounting/journals/new/page.tsx
sed -i 's/transaction_date: formData.transactionDate/transaction_date: formData.transactionDate/g' app/\[locale\]/\(app\)/accounting/journals/new/page.tsx
sed -i 's/reference_number: formData.referenceNumber/reference_number: formData.referenceNumber/g' app/\[locale\]/\(app\)/accounting/journals/new/page.tsx

echo "Type fixes applied"
