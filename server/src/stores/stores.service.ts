import {
    Injectable,
    BadRequestException,
    ForbiddenException,
    NotFoundException,
    UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Store, ConnectionStatus } from './store.entity';
import { Seller } from '../sellers/seller.entity';
import { encryptToken, decryptStoreToken } from '../common/token-encryption.util';
import { fetchWithRetry, maskToken } from '../common/fetch-retry.util';
import { Logger } from '@nestjs/common';

export interface ValidateResult {
    success: boolean;
    marketplace_store_name?: string;
    error?: string;
}

const MARKETPLACE_ID_MAP: Record<string, number> = {
    wb: 1,
    ozon: 2,
    yandex: 3,
    aliexpress: 4,
    uzum: 5,
    alif: 6,
};

@Injectable()
export class StoresService {
    private readonly logger = new Logger(StoresService.name);

    constructor(
        @InjectRepository(Store)
        private storesRepo: Repository<Store>,
        @InjectRepository(Seller)
        private sellersRepo: Repository<Seller>,
    ) { }

    // ─────────────────────────────────────────────────────────────────────
    // HELPERS
    // ─────────────────────────────────────────────────────────────────────

    private async resolveSellerId(user: any, bodyOwnerId?: string): Promise<string> {
        // Admin/Staff may supply ownerId in body to act on behalf of another user
        if ((user.role === 'admin' || user.role === 'staff') && bodyOwnerId) {
            return bodyOwnerId;
        }
        // Seller/Public → always their own seller
        const seller = await this.sellersRepo.findOne({ where: { user_id: user.userId } });
        if (!seller) throw new BadRequestException('No seller account found for this user');
        return seller.id;
    }

    private async assertOwner(storeId: string, sellerId: string) {
        const store = await this.storesRepo.findOne({ where: { id: storeId } });
        if (!store) throw new NotFoundException('Store not found');
        if (store.seller_id !== sellerId) throw new ForbiddenException('Access denied to this store');
        return store;
    }

    private mapMarketplaceError(err: any): never {
        const status = err?.response?.status || err?.status;
        if (status === 401) throw new UnauthorizedException('Invalid token');
        if (status === 403) throw new ForbiddenException('Access denied to this store');
        if (status === 404) throw new NotFoundException('Store ID not found on marketplace');
        if (status === 409) throw new BadRequestException('This store is already connected');
        throw new BadRequestException('Temporary error, please try again later');
    }

    /**
     * Yandex validation
     */
    private async validateYandex(external_shop_id: string, token: string): Promise<{ marketplace_store_name: string }> {
        const url = `https://api.partner.market.yandex.ru/v2/campaigns/${external_shop_id}`;
        try {
            const response = await fetchWithRetry(url, {
                headers: { 'Api-Key': token, 'Accept': 'application/json' },
                marketplace: 'Yandex',
                storeId: external_shop_id,
            });

            if (!response.ok) {
                this.logger.warn(`Yandex validate failed: storeId=${external_shop_id} status=${response.status} token=${maskToken(token)}`);
                throw { status: response.status };
            }

            const data = await response.json();
            const campaign = data.campaign || {};
            const storeName = campaign.domain || (campaign.business || {}).name || 'Yandex Market Store';
            return { marketplace_store_name: storeName };
        } catch (error: any) {
            if (error.status) throw error;
            this.logger.error(`Yandex validate error: storeId=${external_shop_id} error=${error.message}`);
            throw { status: 500 };
        }
    }

    /**
     * Uzum validation
     */
    private async validateUzum(external_shop_id: string, token: string): Promise<{ marketplace_store_name: string }> {
        const url = `https://api-seller.uzum.uz/api/seller/shop/`;
        try {
            const response = await fetchWithRetry(url, {
                headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' },
                marketplace: 'Uzum',
                storeId: external_shop_id,
            });

            if (!response.ok) {
                this.logger.warn(`Uzum validate failed: storeId=${external_shop_id} status=${response.status} token=${maskToken(token)}`);
                throw { status: response.status };
            }

            const data = await response.json();
            if (!Array.isArray(data)) {
                this.logger.error(`Uzum validate: Invalid JSON format, expected array. storeId=${external_shop_id}`);
                throw { status: 500 };
            }

            const shop = data.find((x: any) => String(x.id) === String(external_shop_id));
            if (!shop) {
                this.logger.warn(`Uzum validate failed: storeId=${external_shop_id} not found in array. token=${maskToken(token)}`);
                throw { status: 404 };
            }

            return { marketplace_store_name: shop.shopTitle || 'Uzum Official Store' };
        } catch (error: any) {
            if (error.status) throw error;
            this.logger.error(`Uzum validate error: storeId=${external_shop_id} error=${error.message}`);
            throw { status: 500 };
        }
    }

    /**
     * Wildberries validation (using better /api/v3/suppliers endpoint)
     */
    private async validateWB(external_shop_id: string, token: string): Promise<{ marketplace_store_name: string }> {
        // As per recommendation, we use /api/v3/suppliers for better validation if available
        const url = `https://marketplace-api.wildberries.ru/api/v3/suppliers`;
        try {
            const response = await fetchWithRetry(url, {
                headers: { 'Authorization': token, 'Accept': 'application/json' },
                marketplace: 'Wildberries',
                storeId: external_shop_id,
            });

            if (!response.ok) {
                this.logger.warn(`WB validate failed: storeId=${external_shop_id} status=${response.status} token=${maskToken(token)}`);
                throw { status: response.status };
            }

            return { marketplace_store_name: 'Wildberries Store' }; // WB doesn't return nice store name usually
        } catch (error: any) {
            if (error.status) throw error;
            this.logger.error(`WB validate error: storeId=${external_shop_id} error=${error.message}`);
            throw { status: 500 };
        }
    }

    /**
     * Routes validation to the correct marketplace implementation.
     */
    private async callMarketplaceValidate(data: {
        marketplace: string;
        external_shop_id: string;
        token: string;
    }): Promise<{ marketplace_store_name: string }> {
        if (!data.token || data.token.length < 5) throw { status: 401 };
        if (!data.external_shop_id) throw { status: 404 };

        switch (data.marketplace.toLowerCase()) {
            case 'yandex':
                return this.validateYandex(data.external_shop_id, data.token);
            case 'uzum':
                return this.validateUzum(data.external_shop_id, data.token);
            case 'wb':
                return this.validateWB(data.external_shop_id, data.token);
            default:
                // Mock for unsupported marketplaces
                return { marketplace_store_name: `${data.marketplace} Store` };
        }
    }

    /**
     * Mock Uzum authentication — returns a token from email+password.
     * Email and password are NEVER stored.
     */
    private async callUzumAuth(email: string, password: string): Promise<string> {
        // TODO: Replace with real Uzum auth API call
        if (!email || !password) throw new UnauthorizedException('Invalid email or password');
        if (!email.includes('@')) throw new UnauthorizedException('Invalid email or password');
        // Mock token generation
        return `uzum_mock_token_${Buffer.from(email).toString('base64').slice(0, 12)}`;
    }

    private async markExpired(storeId: string) {
        await this.storesRepo.update(storeId, {
            connection_status: ConnectionStatus.EXPIRED,
        });
    }

    // ─────────────────────────────────────────────────────────────────────
    // PUBLIC METHODS
    // ─────────────────────────────────────────────────────────────────────

    async findAll(user: any): Promise<Store[]> {
        const qb = this.storesRepo
            .createQueryBuilder('store')
            .leftJoinAndSelect('store.seller', 'seller')
            .leftJoinAndSelect('store.marketplace', 'marketplace')
            .where('store.deleted_at IS NULL');

        if (user.role === 'seller' || user.role === 'public_user') {
            const sellerId = await this.resolveSellerId(user);
            qb.andWhere('store.seller_id = :sellerId', { sellerId });
        }

        return qb.orderBy('store.created_at', 'DESC').getMany();
    }

    async findBySellerId(sellerId: string): Promise<Store[]> {
        return this.storesRepo.find({
            where: { seller_id: sellerId },
            relations: ['seller', 'marketplace'],
            order: { created_at: 'DESC' },
        });
    }

    async findOne(id: string): Promise<Store | null> {
        return this.storesRepo.findOne({
            where: { id },
            relations: ['seller', 'marketplace'],
        });
    }

    async checkStoreLimit(sellerId: string): Promise<{ limitReached: boolean; current: number; max: number }> {
        const seller = await this.sellersRepo.findOne({ where: { id: sellerId } });
        if (!seller) throw new BadRequestException('Seller not found');
        const count = await this.storesRepo.count({ where: { seller_id: sellerId } });
        const max = (seller as any).max_stores ?? 3;
        return { limitReached: count >= max, current: count, max };
    }

    /**
     * DRY-RUN validation — returns success + marketplace_store_name.
     * NEVER saves anything to the database.
     */
    async validate(data: {
        marketplace: string;
        external_shop_id: string;
        token: string;
    }): Promise<ValidateResult> {
        try {
            const result = await this.callMarketplaceValidate(data);
            return { success: true, marketplace_store_name: result.marketplace_store_name };
        } catch (err) {
            this.mapMarketplaceError(err);
        }
    }

    /**
     * Get Uzum token from email+password — NEVER stores email/password.
     */
    async getUzumToken(email: string, password: string): Promise<{ token: string }> {
        try {
            const token = await this.callUzumAuth(email, password);
            return { token };
        } catch (err) {
            this.mapMarketplaceError(err);
        }
    }

    /**
     * Create a new store.
     * 1. Resolve seller (tenant-safe)
     * 2. Store limit check
     * 3. Re-validate credentials (never trust frontend)
     * 4. Encrypt token
     * 5. Save
     */
    async create(data: any, user: any): Promise<Store> {
        const sellerId = await this.resolveSellerId(user, data.owner_id);

        // Limit check for PUBLIC_USER
        if (user.role === 'public_user') {
            const limit = await this.checkStoreLimit(sellerId);
            if (limit.limitReached) {
                throw new ForbiddenException(
                    `Store limit reached (${limit.current}/${limit.max}). Upgrade your plan to add more stores.`,
                );
            }
        }

        // Re-validate internally — never trust frontend validation
        const validation = await this.validate({
            marketplace: data.marketplace,
            external_shop_id: data.external_shop_id,
            token: data.token,
        });

        const { encrypted, iv, authTag } = encryptToken(data.token);

        const store = this.storesRepo.create({
            seller_id: sellerId,
            marketplace_id: MARKETPLACE_ID_MAP[data.marketplace] ?? 1,
            external_shop_id: data.external_shop_id.trim(),
            display_name: data.display_name?.trim(),
            marketplace_store_name: validation.marketplace_store_name,
            encrypted_token: encrypted,
            token_iv: iv,
            token_auth_tag: authTag,
            connection_status: ConnectionStatus.CONNECTED,
            // Legacy compat
            name: data.display_name?.trim(),
            store_name: data.display_name?.trim(),
        });

        return this.storesRepo.save(store);
    }

    /**
     * Update encrypted token for a store.
     * Owner check + re-validate + encrypt & save.
     */
    async updateToken(storeId: string, token: string, user: any): Promise<Store> {
        const sellerId = await this.resolveSellerId(user);
        const store = await this.assertOwner(storeId, sellerId);

        // Re-validate with new token
        await this.validate({
            marketplace: store.marketplace?.name?.toLowerCase() ?? 'unknown',
            external_shop_id: store.external_shop_id,
            token,
        });

        const { encrypted, iv, authTag } = encryptToken(token);
        await this.storesRepo.update(storeId, {
            encrypted_token: encrypted,
            token_iv: iv,
            token_auth_tag: authTag,
            connection_status: ConnectionStatus.CONNECTED,
        });

        return this.findOne(storeId);
    }

    /**
     * Update display name only — owner-checked.
     */
    async updateDisplayName(storeId: string, displayName: string, user: any): Promise<{
        store: Store;
        warning?: string;
    }> {
        const trimmed = displayName?.trim();
        if (!trimmed) throw new BadRequestException('Display name cannot be empty');

        const sellerId = await this.resolveSellerId(user);
        await this.assertOwner(storeId, sellerId);

        // Check for duplicate display name within same seller
        const duplicate = await this.storesRepo.findOne({
            where: { seller_id: sellerId, display_name: trimmed },
        });
        const warning = (duplicate && duplicate.id !== storeId)
            ? 'A store with this display name already exists'
            : undefined;

        await this.storesRepo.update(storeId, {
            display_name: trimmed,
            name: trimmed,
            store_name: trimmed,
        });

        return { store: await this.findOne(storeId), warning };
    }

    /**
     * Disable a store — owner-checked.
     */
    async disable(storeId: string, user: any): Promise<Store> {
        const sellerId = await this.resolveSellerId(user,
            user.role === 'admin' || user.role === 'staff' ? user.targetSellerId : undefined);
        await this.assertOwner(storeId, sellerId);
        await this.storesRepo.update(storeId, { connection_status: ConnectionStatus.DISABLED });
        return this.findOne(storeId);
    }

    /**
     * Enable a store — owner-checked.
     */
    async enable(storeId: string, user: any): Promise<Store> {
        const sellerId = await this.resolveSellerId(user,
            user.role === 'admin' || user.role === 'staff' ? user.targetSellerId : undefined);
        await this.assertOwner(storeId, sellerId);
        await this.storesRepo.update(storeId, { connection_status: ConnectionStatus.CONNECTED });
        return this.findOne(storeId);
    }

    /**
     * Soft delete — Admin only.
     */
    async softDelete(storeId: string): Promise<void> {
        await this.storesRepo.update(storeId, { deleted_at: new Date() });
    }

    /** Get decrypted token for internal use (e.g. sync jobs). */
    getDecryptedToken(store: Store): string | null {
        return decryptStoreToken(store);
    }

    /** 
     * Tests an existing store's connection using its saved token.
     * Updates connection_status to EXPIRED if a 401/403 occurs. 
     */
    async testConnection(storeId: string): Promise<ValidateResult> {
        const store = await this.storesRepo.findOne({
            where: { id: storeId },
            relations: ['marketplace'],
        });
        if (!store) throw new NotFoundException('Store not found');

        const token = this.getDecryptedToken(store);
        if (!token) {
            await this.markExpired(storeId);
            throw new UnauthorizedException('No token available');
        }

        try {
            return await this.validate({
                marketplace: store.marketplace?.name?.toLowerCase() ?? 'unknown',
                external_shop_id: store.external_shop_id,
                token,
            });
        } catch (error: any) {
            if (error instanceof UnauthorizedException || error instanceof ForbiddenException) {
                this.logger.warn(`Store ${storeId} token expired/forbidden. Marking as expired.`);
                await this.markExpired(storeId);
            }
            throw error; // Rethrow to caller
        }
    }

    // Legacy compat
    async update(id: string, storeData: any): Promise<Store | null> {
        const updateData: any = {};
        if (storeData.store_name || storeData.display_name) {
            const name = (storeData.display_name || storeData.store_name).trim();
            updateData.display_name = name;
            updateData.name = name;
            updateData.store_name = name;
        }
        if (storeData.marketplace && MARKETPLACE_ID_MAP[storeData.marketplace]) {
            updateData.marketplace_id = MARKETPLACE_ID_MAP[storeData.marketplace];
        }
        await this.storesRepo.update(id, updateData);
        return this.findOne(id);
    }

    async getMarketplaceProducts(storeId: string, search?: string): Promise<any[]> {
        const qb = this.storesRepo
            .createQueryBuilder('store')
            .leftJoinAndSelect('store.marketplace_products', 'product')
            .where('store.id = :storeId', { storeId });

        if (search) {
            const normalized = search.trim().replace(/\s+/g, ' ');
            qb.andWhere(
                '(product.title ILIKE :search OR product.external_product_id ILIKE :search OR product.sku_name ILIKE :search)',
                { search: `%${normalized}%` },
            );
        }

        const store = await qb.getOne();
        return store?.marketplace_products || [];
    }

    async remove(id: string): Promise<void> {
        await this.storesRepo.delete(id);
    }
}
