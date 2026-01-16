# 🎯 Demo Admin Account Setup Guide

## Quick Answer: **No**, there are no pre-configured demo/admin accounts.

However, you can easily create one using one of the methods below:

---

## 🚀 Method 1: Create via Signup Page (Recommended - Easiest)

1. **Open your browser:** http://localhost:3001
2. **Go to:** Sign Up page
3. **Fill in the form:**
   - Email: `admin@yourcompany.com` (or any email you want)
   - Password: Choose a secure password
   - Company Name: `Demo Company`
   - Your Name: `Admin User`
4. **Click Sign Up**

**That's it!** You'll have:
- ✅ A new tenant/company created
- ✅ An admin account with full permissions
- ✅ Default Chart of Accounts
- ✅ Access to all features

---

## 🔧 Method 2: Use the Demo Admin Script (Automated)

I've created a script that sets up a complete demo environment with sample data.

### Step 1: Configure Supabase Credentials

Create a file `backend/.env.local` (if it doesn't exist):

```bash
# Add your Supabase credentials
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### Step 2: Run the Demo Script

```bash
cd backend
npm run create-demo-admin
```

### What This Creates:

**Demo Admin Account:**
- Email: `admin@demo.com`
- Password: `Demo@123456`

**Demo Company:**
- Name: `Demo Company` / `شركة تجريبية`
- Subscription: Enterprise (1 year trial)

**Sample Data:**
- ✅ 11 Chart of Accounts (Assets, Liabilities, Equity, Revenue, Expenses)
- ✅ 2 Sample Customers (ABC Trading Co., Gulf Supplies LLC)
- ✅ 2 Sample Vendors (Tech Solutions Inc., Office Supplies Ltd)
- ✅ Admin role with full permissions

---

## 📝 Method 3: Manual API Call

You can also create a demo admin using a direct API call:

```bash
curl -X POST http://localhost:3000/api/tenants/create-with-admin \
  -H "Content-Type: application/json" \
  -d '{
    "tenant": {
      "name_en": "Demo Company",
      "name_ar": "شركة تجريبية",
      "status": "active"
    },
    "admin": {
      "email": "admin@demo.com",
      "password": "Demo@123456",
      "first_name": "Demo",
      "last_name": "Admin"
    }
  }'
```

---

## 🔑 Default Demo Credentials (After Running Script)

Once you run the demo script, use these credentials to log in:

```
Email: admin@demo.com
Password: Demo@123456
```

**Access URL:** http://localhost:3001

---

## 🧪 What You Can Test with Demo Account

After logging in with the demo admin account, you can test:

### Core Features:
- ✅ **Dashboard** - View metrics and charts
- ✅ **Chart of Accounts** - View default accounts, create new ones
- ✅ **Journal Entries** - Create and post journal entries
- ✅ **Customers** - View sample customers, create new ones
- ✅ **Vendors** - View sample vendors, create new ones
- ✅ **Invoices** - Create invoices for sample customers
- ✅ **Payments** - Record payments from customers
- ✅ **User Management** - Invite users, manage roles
- ✅ **Settings** - Update profile, change password

### Production Modules (NEW):
- ✅ **PDF Generation** - Generate invoice PDFs, customer statements
- ✅ **Email System** - Send test emails (verification, password reset)
- ✅ **Audit Logging** - View full audit trail of all actions
- ✅ **Data Export** - Export customers/vendors to CSV/Excel

### Workflow Features:
- ✅ **Double-Entry Validation** - Automatic debit/credit validation
- ✅ **Approval Workflows** - Submit → Approve → Post
- ✅ **Payment Allocation** - Allocate payments to invoices
- ✅ **Balance Tracking** - Automatic invoice balance updates

---

## 🛠️ Troubleshooting

**Issue 1: Signup page shows errors**
- Make sure backend is running: http://localhost:3000
- Check Supabase credentials in `.env` file
- Verify Supabase project is active

**Issue 2: Demo script fails**
- Check `.env.local` has correct Supabase credentials
- Verify service role key has necessary permissions
- Check backend logs: `pm2 logs accounting-api`

**Issue 3: Can't log in**
- Verify email was confirmed (check Supabase Auth)
- Try password reset if needed
- Check user status in `users` table

---

## 📊 Sample Data Summary

After running the demo script, you'll have:

| Entity | Count | Details |
|--------|-------|---------|
| **Tenant** | 1 | Demo Company with 1-year trial |
| **Users** | 1 | Admin user with full permissions |
| **Chart of Accounts** | 11 | Complete account hierarchy |
| **Customers** | 2 | ABC Trading, Gulf Supplies |
| **Vendors** | 2 | Tech Solutions, Office Supplies |
| **Roles** | 1 | Administrator (all permissions) |

---

## 🎓 Recommended Testing Flow

1. **Log in** with demo admin account
2. **Explore Dashboard** - View metrics and recent activity
3. **View Chart of Accounts** - See the default account hierarchy
4. **Create Customer** - Add a new customer to test
5. **Create Invoice** - Create an invoice for the customer
6. **Generate PDF** - Download the invoice as PDF
7. **View Audit Logs** - See all actions tracked
8. **Export Data** - Export customers to CSV/Excel
9. **Update Profile** - Change user avatar and details
10. **Test All Features** - Explore all modules and features

---

## 💡 Tips

- **Use Method 1 (Signup)** for quick testing without scripts
- **Use Method 2 (Demo Script)** for a complete demo environment with sample data
- **Use Method 3 (API)** if you're testing API endpoints
- **Always** delete demo accounts before production deployment
- **Change** the demo password after first login in production

---

**Need Help?** Check the logs or refer to the documentation in the project.
