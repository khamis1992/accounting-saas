import { SetMetadata } from '@nestjs/common';

export interface RequirePermissions {
  module: string;
  action: string;
  resource?: string;
}

export const PERMISSIONS_KEY = 'permissions';

export const RequirePermissions = (...permissions: RequirePermissions[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);
