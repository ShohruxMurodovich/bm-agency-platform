import { SetMetadata } from '@nestjs/common';

export const TENANT_SCOPED_KEY = 'tenant_scoped';

/**
 * Decorator to mark entities as tenant-scoped.
 * Only entities with this decorator will have tenant filtering applied.
 * 
 * Usage:
 * @Entity()
 * @TenantScoped()
 * export class Seller { ... }
 */
export const TenantScoped = () => SetMetadata(TENANT_SCOPED_KEY, true);
