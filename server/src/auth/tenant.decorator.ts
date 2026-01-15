import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Decorator to extract seller_id (tenant ID) from the authenticated user.
 * 
 * Usage in controller:
 * @Get()
 * findMyItems(@TenantId() sellerId: string) { ... }
 */
export const TenantId = createParamDecorator(
    (data: unknown, ctx: ExecutionContext): string | null => {
        const request = ctx.switchToHttp().getRequest();
        const user = request.user;

        if (!user) {
            return null;
        }

        // For PUBLIC_USER role, seller_id is required
        // For ADMIN/STAFF, seller_id may be null (they see all data)
        return user.seller_id || null;
    },
);
