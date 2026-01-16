# Backend Endpoint Required: Create Tenant with Admin

## Overview

The frontend sign-up flow calls an endpoint that needs to be implemented in the backend:
`POST /api/tenants/create-with-admin`

This endpoint should create a new tenant and an admin user in a single transaction.

## Endpoint Specification

### Request

**URL**: `POST /api/tenants/create-with-admin`

**Headers**:
```
Content-Type: application/json
```

**Body**:
```typescript
{
  name: string;           // Company name in English
  nameAr: string;         // Company name in Arabic
  email: string;          // Admin user email
  password: string;       // Admin user password
}
```

**Validation**:
- `name`: Required, min length 2
- `nameAr`: Required, min length 2
- `email`: Required, valid email format
- `password`: Required, min length 8

### Response

**Success (201 Created)**:
```typescript
{
  user: {
    id: string;
    email: string;
    user_metadata: {
      tenant_id: string;
      full_name?: string;
    };
    created_at: string;
  };
  tenant: {
    id: string;
    name: string;
    nameAr: string;
    status: string;
    created_at: string;
  };
  session: {
    access_token: string;
    refresh_token: string;
    expires_in: number;
    expires_at: number;
    user: User;
  };
}
```

**Error (400 Bad Request)**:
```typescript
{
  statusCode: 400;
  message: string;      // Error description
  error: string;        // Error type
}
```

**Error (409 Conflict)**:
```typescript
{
  statusCode: 409;
  message: "Email already registered";
  error: "Conflict"
}
```

## Implementation Example

```typescript
// backend/src/tenants/tenants.controller.ts

import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { TenantsService } from './tenants.service';

class CreateTenantWithAdminDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  name: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  nameAr: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  password: string;
}

@ApiTags('tenants')
@Controller('tenants')
export class TenantsController {
  constructor(private tenantsService: TenantsService) {}

  @Post('create-with-admin')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new tenant with admin user' })
  @ApiResponse({ status: 201, description: 'Tenant and admin user created' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 409, description: 'Email already exists' })
  async createTenantWithAdmin(
    @Body() createTenantDto: CreateTenantWithAdminDto,
  ) {
    return this.tenantsService.createTenantWithAdmin(createTenantDto);
  }
}
```

## Service Implementation

```typescript
// backend/src/tenants/tenants.service.ts

import { Injectable, ConflictException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class TenantsService {
  constructor(private supabaseService: SupabaseService) {}

  async createTenantWithAdmin(data: {
    name: string;
    nameAr: string;
    email: string;
    password: string;
  }) {
    const supabase = this.supabaseService.getServiceRoleClient();

    // Step 1: Create tenant
    const { data: tenant, error: tenantError } = await supabase
      .from('tenants')
      .insert({
        name: data.name,
        name_ar: data.nameAr,
        status: 'active',
      })
      .select()
      .single();

    if (tenantError) {
      throw new Error('Failed to create tenant');
    }

    // Step 2: Create user with Supabase Auth
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
      user_metadata: {
        tenant_id: tenant.id,
        role: 'admin',
      },
    });

    if (authError) {
      // Rollback tenant creation
      await supabase.from('tenants').delete().eq('id', tenant.id);
      throw new ConflictException('Email already registered');
    }

    // Step 3: Create user profile in users table
    const { error: profileError } = await supabase.from('users').insert({
      id: authUser.user.id,
      tenant_id: tenant.id,
      email: data.email,
      role: 'admin',
      status: 'active',
    });

    if (profileError) {
      // Rollback
      await supabase.auth.admin.deleteUser(authUser.user.id);
      await supabase.from('tenants').delete().eq('id', tenant.id);
      throw new Error('Failed to create user profile');
    }

    // Step 4: Create session for immediate login
    const { data: session, error: sessionError } = await supabase.auth.admin.createSession({
      userId: authUser.user.id,
    });

    return {
      user: authUser.user,
      tenant,
      session,
    };
  }
}
```

## Database Schema Assumptions

### tenants Table
```sql
CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  name_ar VARCHAR(255) NOT NULL,
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### users Table
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  email VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'user',
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(tenant_id, email)
);

CREATE INDEX idx_users_tenant_id ON users(tenant_id);
CREATE INDEX idx_users_email ON users(email);
```

## Transaction Management

The endpoint should use database transactions to ensure atomicity:

```typescript
// Using PostgreSQL transaction via Supabase RPC or manual transaction
async createTenantWithAdmin(data: CreateTenantDto) {
  return await this.supabaseService.rpc('create_tenant_with_admin', {
    p_name: data.name,
    p_name_ar: data.nameAr,
    p_email: data.email,
    p_password: data.password,
  });
}
```

## Database Function (Recommended)

For better transaction management, create a PostgreSQL function:

```sql
CREATE OR REPLACE FUNCTION create_tenant_with_admin(
  p_name VARCHAR,
  p_name_ar VARCHAR,
  p_email VARCHAR,
  p_password VARCHAR
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_tenant_id UUID;
  v_user_id UUID;
BEGIN
  -- Create tenant
  INSERT INTO tenants (name, name_ar, status)
  VALUES (p_name, p_name_ar, 'active')
  RETURNING id INTO v_tenant_id;

  -- Create user in auth.users (via Supabase Auth)
  -- This would need to be done via the service role key
  SELECT id INTO v_user_id
  FROM create_supabase_user(p_email, p_password, v_tenant_id);

  -- Create user profile
  INSERT INTO users (id, tenant_id, email, role, status)
  VALUES (v_user_id, v_tenant_id, p_email, 'admin', 'active');

  -- Return success
  RETURN json_build_object(
    'tenant_id', v_tenant_id,
    'user_id', v_user_id
  );
END;
$$;
```

## Testing

### Test Cases

1. **Successful Creation**:
```bash
curl -X POST http://localhost:3000/api/tenants/create-with-admin \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Company",
    "nameAr": "شركة الاختبار",
    "email": "admin@test.com",
    "password": "StrongPass123!"
  }'
```

Expected: 201 Created with user, tenant, and session

2. **Duplicate Email**:
```bash
# Run the same request twice
```

Expected: 409 Conflict with "Email already registered"

3. **Validation Errors**:
```bash
curl -X POST http://localhost:3000/api/tenants/create-with-admin \
  -H "Content-Type: application/json" \
  -d '{
    "name": "A",
    "nameAr": "",
    "email": "invalid-email",
    "password": "weak"
  }'
```

Expected: 400 Bad Request with validation errors

## Frontend Integration

The frontend expects this response structure:

```typescript
// Expected by frontend at lib/api/client.ts
interface ApiResponse {
  user?: {
    id: string;
    email: string;
    user_metadata: {
      tenant_id: string;
    };
  };
  tenant?: {
    id: string;
    name: string;
    nameAr: string;
  };
  session?: {
    access_token: string;
    refresh_token: string;
    expires_at: number;
  };
}
```

## Security Considerations

1. **Rate Limiting**: Add rate limiting to prevent abuse
2. **Email Verification**: Consider requiring email verification
3. **Password Strength**: Enforce strong password requirements
4. **Transaction Safety**: Use database transactions for atomicity
5. **Rollback**: Implement proper rollback on partial failures
6. **Logging**: Log all tenant creation attempts for audit

## Alternative Approach

If you prefer not to create this endpoint, the frontend can be modified to:
1. First create a tenant (if you have a public tenant creation endpoint)
2. Then sign up the user with the tenant ID

However, the single endpoint approach is cleaner and ensures data consistency.

## Questions?

If you need clarification on any part of this specification, please refer to:
- Frontend implementation: `frontend/AUTH_IMPLEMENTATION.md`
- API client: `frontend/lib/api/client.ts`
- Sign-up page: `frontend/app/[locale]/auth/signup/page.tsx`
