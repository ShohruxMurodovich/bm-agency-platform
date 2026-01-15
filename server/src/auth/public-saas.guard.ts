import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';

/**
 * Guard to enforce route access control for PUBLIC_USER role.
 * 
 * Strategy: ALLOWLIST (safer than blocklist)
 * - PUBLIC_USER can only access explicitly allowed routes
 * - All other routes return 403 Forbidden
 * - ADMIN/STAFF bypass this guard (full access)
 * 
 * This prevents accidentally exposing new BM-specific features to public users.
 */
@Injectable()
export class PublicSaasGuard implements CanActivate {
    private readonly publicAllowedRoutes = [
        '/auth',
        '/sellers',
        '/stores',
        '/parent-products',
        '/marketplace-products',
        '/product-mapping',
        '/inventory',
        '/orders',
        '/product-states',
        '/product-movement',
        '/locations',
        '/business-statuses',
        '/movement-types',
        '/analytics',
        // Phase 3 routes
        // '/notifications',
        // '/onboarding',
    ];

    canActivate(context: ExecutionContext): boolean {
        const request = context.switchToHttp().getRequest();
        const user = request.user;

        // Allow if no user (public endpoints like /auth/login, /auth/register)
        if (!user) {
            return true;
        }

        // ADMIN and STAFF bypass this guard (full access to all routes)
        if (user.role === 'admin' || user.role === 'staff') {
            return true;
        }

        // For PUBLIC_USER, check if route is in allowlist
        if (user.role === 'public_user') {
            const path = request.route?.path || request.url;

            // Check if path starts with any allowed route pattern
            const isAllowed = this.publicAllowedRoutes.some(route =>
                path.startsWith(route)
            );

            if (!isAllowed) {
                throw new ForbiddenException(
                    'Access denied: This feature is not available in the Public SaaS version'
                );
            }

            return true;
        }

        // Default: allow (for seller, courier, etc.)
        return true;
    }
}
