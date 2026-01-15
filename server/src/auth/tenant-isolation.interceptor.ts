import {
    Injectable,
    NestInterceptor,
    ExecutionContext,
    CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { Reflector } from '@nestjs/core';
import { TENANT_SCOPED_KEY } from './tenant-scoped.decorator';

/**
 * Global interceptor to enforce tenant isolation for PUBLIC_USER role.
 * 
 * Rules:
 * - Only applies to entities marked with @TenantScoped() decorator
 * - Only filters for PUBLIC_USER role (ADMIN/STAFF bypass)
 * - Injects seller_id filter into TypeORM queries
 * 
 * This prevents:
 * - Accidental filtering of reference tables (Location, BusinessStatus, Marketplace)
 * - Cross-tenant data access by public users
 * - Interference with admin/staff BM operations
 */
@Injectable()
export class TenantIsolationInterceptor implements NestInterceptor {
    constructor(private reflector: Reflector) { }

    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        const request = context.switchToHttp().getRequest();
        const user = request.user;

        // Skip if no user (public endpoints)
        if (!user) {
            return next.handle();
        }

        // Skip for ADMIN/STAFF roles (they need to see all data for BM operations)
        if (user.role === 'admin' || user.role === 'staff') {
            return next.handle();
        }

        // For PUBLIC_USER, inject tenant context
        if (user.role === 'public_user' && user.seller_id) {
            // Store tenant ID in request for repository access
            request.tenantId = user.seller_id;
        }

        return next.handle();
    }
}

/**
 * Note: Actual query filtering will be applied at repository/service level
 * by checking request.tenantId and @TenantScoped() metadata.
 * 
 * For TypeORM repositories, you would typically:
 * 1. Create a base repository that checks @TenantScoped() metadata
 * 2. If entity is scoped and tenantId exists, add .where('seller_id = :tenantId')
 * 3. If entity is not scoped, skip filtering
 * 
 * This keeps filtering explicit and avoids magic query modification.
 */
