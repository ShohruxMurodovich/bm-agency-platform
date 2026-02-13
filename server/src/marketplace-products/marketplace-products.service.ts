import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, Like } from 'typeorm';
import { MarketplaceProduct } from './marketplace-product.entity';
import { Category } from '../categories/category.entity';
import { ParentProduct } from '../parent-products/parent-product.entity';
import { ProductMapping } from '../product-mapping/product-mapping.entity';
import {
    PriceStatus,
    FulfillmentModel,
    MarketplaceProfitCalculationDto,
    MarketplaceProductVariantDto,
    MarketplaceProductGroupDto,
    ProfitFiltersDto,
    ProfitAnalysisResponseDto,
} from './dto/marketplace-profit.dto';
import * as ExcelJS from 'exceljs';

@Injectable()
export class MarketplaceProductsService {
    private readonly LOW_MARGIN_THRESHOLD: number;

    constructor(
        @InjectRepository(MarketplaceProduct)
        private marketplaceProductsRepository: Repository<MarketplaceProduct>,
        @InjectRepository(Category)
        private categoryRepository: Repository<Category>,
        @InjectRepository(ParentProduct)
        private parentProductRepository: Repository<ParentProduct>,
        @InjectRepository(ProductMapping)
        private productMappingRepository: Repository<ProductMapping>,
    ) {
        // Load threshold from environment variable, default to 10%
        this.LOW_MARGIN_THRESHOLD = parseFloat(process.env.PROFIT_LOW_MARGIN_THRESHOLD_PERCENT || '10');
    }

    async findAll(): Promise<MarketplaceProduct[]> {
        return this.marketplaceProductsRepository.find({
            relations: ['store'],
        });
    }

    async findOne(id: string): Promise<MarketplaceProduct | null> {
        return this.marketplaceProductsRepository.findOne({
            where: { id },
            relations: ['store'],
        });
    }

    async findByStore(storeId: string): Promise<MarketplaceProduct[]> {
        return this.marketplaceProductsRepository.find({
            where: { store_id: storeId },
            relations: ['store'],
        });
    }

    async create(productData: Partial<MarketplaceProduct>): Promise<MarketplaceProduct> {
        const product = this.marketplaceProductsRepository.create(productData);
        return this.marketplaceProductsRepository.save(product);
    }

    async update(id: string, productData: Partial<MarketplaceProduct>): Promise<MarketplaceProduct> {
        await this.marketplaceProductsRepository.update(id, productData);
        return this.findOne(id);
    }

    async remove(id: string): Promise<void> {
        await this.marketplaceProductsRepository.delete(id);
    }

    /**
     * Main profit analysis endpoint with pagination
     */
    async findWithProfitAnalysis(
        filters: ProfitFiltersDto,
        sellerId: string,
        page: number = 1,
        perPage: number = 20,
    ): Promise<ProfitAnalysisResponseDto> {
        // Step 1: Query all SKUs matching base filters
        const whereConditions: any = {};

        if (filters.store_ids && filters.store_ids.length > 0) {
            whereConditions.store_id = In(filters.store_ids);
        } else if (filters.store_id) {
            whereConditions.store_id = filters.store_id;
        }

        if (filters.product_status) {
            whereConditions.status = filters.product_status;
        }

        // Build query with joins
        const queryBuilder = this.marketplaceProductsRepository
            .createQueryBuilder('mp')
            .leftJoinAndSelect('mp.product_mapping', 'mapping')
            .leftJoinAndSelect('mapping.parent_product', 'parent')
            .leftJoinAndSelect('mp.store', 'store')
            .where(whereConditions);

        // Search filter
        if (filters.search) {
            queryBuilder.andWhere(
                '(mp.title ILIKE :search OR CAST(mp.product_id AS TEXT) ILIKE :search OR CAST(mp.sku_id AS TEXT) ILIKE :search OR mp.sku_name ILIKE :search OR CAST(mp.barcode AS TEXT) ILIKE :search)',
                { search: `%${filters.search}%` },
            );
        }

        // Get all SKUs
        const skus = await queryBuilder.getMany();

        // Step 2: Calculate profit for each SKU
        const model = this.parseModel(filters.model || 'auto');
        const calculatedSkus: Array<{ sku: MarketplaceProduct; calc: MarketplaceProfitCalculationDto; parentProduct: ParentProduct | null }> = [];

        for (const sku of skus) {
            const parentProduct = sku.product_mapping?.parent_product || null;
            const calc = await this.calculateProfitForSku(sku, model, parentProduct);
            calculatedSkus.push({ sku, calc, parentProduct });
        }

        // Step 3: Filter by price_status
        let filteredSkus = calculatedSkus;
        if (filters.price_status) {
            const targetStatus = this.parsePriceStatus(filters.price_status);
            filteredSkus = calculatedSkus.filter(item => item.calc.status === targetStatus);
        }

        // Step 4: Group by product_id
        const groups = this.groupByProductId(filteredSkus, model);

        // Step 5: Paginate groups
        const total = groups.length;
        const skip = (page - 1) * perPage;
        const paginatedGroups = groups.slice(skip, skip + perPage);

        return {
            groups: paginatedGroups,
            total,
            page,
            per_page: perPage,
            meta: {
                threshold_margin_percent: this.LOW_MARGIN_THRESHOLD,
            },
        };
    }

    /**
     * Get variants for a specific product_id (lazy loading)
     */
    async getVariantsForProductId(
        productId: number,
        filters: ProfitFiltersDto,
    ): Promise<MarketplaceProductVariantDto[]> {
        const whereConditions: any = { product_id: productId };

        if (filters.store_ids && filters.store_ids.length > 0) {
            whereConditions.store_id = In(filters.store_ids);
        } else if (filters.store_id) {
            whereConditions.store_id = filters.store_id;
        }

        if (filters.product_status) {
            whereConditions.status = filters.product_status;
        }

        const queryBuilder = this.marketplaceProductsRepository
            .createQueryBuilder('mp')
            .leftJoinAndSelect('mp.product_mapping', 'mapping')
            .leftJoinAndSelect('mapping.parent_product', 'parent')
            .leftJoinAndSelect('mp.store', 'store')
            .where(whereConditions);

        if (filters.search) {
            queryBuilder.andWhere(
                '(mp.title ILIKE :search OR CAST(mp.sku_id AS TEXT) ILIKE :search OR mp.sku_name ILIKE :search OR CAST(mp.barcode AS TEXT) ILIKE :search)',
                { search: `%${filters.search}%` },
            );
        }

        const skus = await queryBuilder.getMany();
        const model = this.parseModel(filters.model || 'auto');

        const variants: MarketplaceProductVariantDto[] = [];
        for (const sku of skus) {
            const parentProduct = sku.product_mapping?.parent_product || null;
            const calc = await this.calculateProfitForSku(sku, model, parentProduct);

            // Apply price_status filter
            if (filters.price_status) {
                const targetStatus = this.parsePriceStatus(filters.price_status);
                if (calc.status !== targetStatus) {
                    continue;
                }
            }

            variants.push({
                sku_id: sku.sku_id,
                sku_name: sku.sku_name,
                title: sku.title,
                barcode: sku.barcode,
                sell_price_uzs: calc.sell_price_uzs,
                payout_uzs: calc.payout_uzs,
                profit_uzs: calc.profit_uzs,
                margin_percent: calc.margin_percent,
                status: calc.status,
                hint: calc.hint,
                commission_percent: calc.commission_percent,
                commission_value_uzs: calc.commission_value_uzs,
                logistics_fee_uzs: calc.logistics_fee_uzs,
                cost_uzs: calc.cost_uzs,
                model_used: calc.model_used,
                store_id: sku.store_id,
                product_status: sku.status,
            });
        }

        return variants;
    }

    /**
     * Calculate profit for a single SKU
     */
    async calculateProfitForSku(
        sku: MarketplaceProduct,
        model: FulfillmentModel,
        parentProduct: ParentProduct | null = null,
    ): Promise<MarketplaceProfitCalculationDto> {
        const sell_price_uzs = sku.price || 0;

        // Edge case: sell_price = 0
        if (sell_price_uzs === 0) {
            return {
                sell_price_uzs: 0,
                commission_percent: 0,
                commission_value_uzs: 0,
                logistics_fee_uzs: 0,
                payout_uzs: 0,
                cost_uzs: null,
                profit_uzs: null,
                margin_percent: null,
                status: PriceStatus.UNKNOWN,
                hint: 'Sell price is 0',
                model_used: model,
            };
        }

        // Determine actual model to use (Auto logic)
        let actualModel = model;
        if (model === FulfillmentModel.AUTO) {
            const fbs_stock = sku.stock_fbs || 0;
            const fbo_stock = sku.stock_fbo || 0;

            if (fbs_stock > 0 && fbo_stock === 0) {
                actualModel = FulfillmentModel.FBS;
            } else if (fbo_stock > 0 && fbs_stock === 0) {
                actualModel = FulfillmentModel.FBO;
            } else {
                // Ambiguous case: both > 0 or both = 0
                return {
                    sell_price_uzs,
                    commission_percent: 0,
                    commission_value_uzs: 0,
                    logistics_fee_uzs: 0,
                    payout_uzs: sell_price_uzs,
                    cost_uzs: null,
                    profit_uzs: null,
                    margin_percent: null,
                    status: PriceStatus.UNKNOWN,
                    hint: 'Auto model cannot be decided - please select FBS or FBO manually',
                    model_used: FulfillmentModel.AUTO,
                };
            }
        }

        // Check for product mapping
        if (!parentProduct) {
            return {
                sell_price_uzs,
                commission_percent: 0,
                commission_value_uzs: 0,
                logistics_fee_uzs: 0,
                payout_uzs: sell_price_uzs,
                cost_uzs: null,
                profit_uzs: null,
                margin_percent: null,
                status: PriceStatus.UNKNOWN,
                hint: 'Not linked to Parent Product (cost unknown)',
                model_used: actualModel,
            };
        }

        // Check for cost
        const cost_uzs = parentProduct.cost_uzs ? parseInt(parentProduct.cost_uzs.toString(), 10) : null;
        if (cost_uzs === null) {
            return {
                sell_price_uzs,
                commission_percent: 0,
                commission_value_uzs: 0,
                logistics_fee_uzs: 0,
                payout_uzs: sell_price_uzs,
                cost_uzs: null,
                profit_uzs: null,
                margin_percent: null,
                status: PriceStatus.UNKNOWN,
                hint: 'Cost is not set in Parent Products',
                model_used: actualModel,
            };
        }

        // Get commission rate
        let commission_percent = 0;
        if (sku.category_id) {
            const category = await this.categoryRepository.findOne({ where: { id: sku.category_id } });
            if (category) {
                commission_percent = actualModel === FulfillmentModel.FBS
                    ? parseFloat(category.fbs_commission?.toString() || '0')
                    : parseFloat(category.fbo_commission?.toString() || '0');
            }
        }

        if (commission_percent === 0 || commission_percent === null) {
            return {
                sell_price_uzs,
                commission_percent: 0,
                commission_value_uzs: 0,
                logistics_fee_uzs: 0,
                payout_uzs: sell_price_uzs,
                cost_uzs,
                profit_uzs: null,
                margin_percent: null,
                status: PriceStatus.UNKNOWN,
                hint: 'Commission rate not found for category/model',
                model_used: actualModel,
            };
        }

        // Get logistics fee
        const logistics_fee_uzs = actualModel === FulfillmentModel.FBS
            ? parseFloat(sku.logistics_fee_fbs_uzs?.toString() || '0')
            : parseFloat(sku.logistics_fee_fbo_uzs?.toString() || '0');

        if (!logistics_fee_uzs) {
            return {
                sell_price_uzs,
                commission_percent,
                commission_value_uzs: 0,
                logistics_fee_uzs: 0,
                payout_uzs: sell_price_uzs,
                cost_uzs,
                profit_uzs: null,
                margin_percent: null,
                status: PriceStatus.UNKNOWN,
                hint: 'Logistics fee missing for this model',
                model_used: actualModel,
            };
        }

        // Calculate profit
        const commission_value_uzs = Math.round(sell_price_uzs * (commission_percent / 100));
        const payout_uzs = sell_price_uzs - commission_value_uzs - logistics_fee_uzs;
        const profit_uzs = payout_uzs - cost_uzs;
        const margin_percent = Number(((profit_uzs / sell_price_uzs) * 100).toFixed(2));

        // Determine status
        let status: PriceStatus;
        if (profit_uzs < 0) {
            status = PriceStatus.LOSS;
        } else if (margin_percent < this.LOW_MARGIN_THRESHOLD) {
            status = PriceStatus.LOW_MARGIN;
        } else {
            status = PriceStatus.PROFIT;
        }

        return {
            sell_price_uzs,
            commission_percent,
            commission_value_uzs,
            logistics_fee_uzs,
            payout_uzs,
            cost_uzs,
            profit_uzs,
            margin_percent,
            status,
            model_used: actualModel,
        };
    }

    /**
     * Group SKUs by product_id
     */
    private groupByProductId(
        skus: Array<{ sku: MarketplaceProduct; calc: MarketplaceProfitCalculationDto; parentProduct: ParentProduct | null }>,
        model: FulfillmentModel,
    ): MarketplaceProductGroupDto[] {
        const groupMap = new Map<number, typeof skus>();

        for (const item of skus) {
            const productId = item.sku.product_id;
            if (!groupMap.has(productId)) {
                groupMap.set(productId, []);
            }
            groupMap.get(productId)!.push(item);
        }

        const groups: MarketplaceProductGroupDto[] = [];

        for (const [productId, items] of groupMap.entries()) {
            const sellPrices = items.map(i => i.calc.sell_price_uzs);
            const payouts = items.map(i => i.calc.payout_uzs);
            const profits = items.map(i => i.calc.profit_uzs).filter(p => p !== null) as number[];
            const margins = items.map(i => i.calc.margin_percent).filter(m => m !== null) as number[];

            // Worst-case status
            const statuses = items.map(i => i.calc.status);
            const worstStatus = this.getWorstStatus(statuses);

            groups.push({
                product_id: productId,
                product_title: items[0].sku.product_title || items[0].sku.title,
                variants_count: items.length,
                sell_price_min: Math.min(...sellPrices),
                sell_price_max: Math.max(...sellPrices),
                payout_min: Math.min(...payouts),
                payout_max: Math.max(...payouts),
                profit_min: profits.length > 0 ? Math.min(...profits) : null,
                profit_max: profits.length > 0 ? Math.max(...profits) : null,
                margin_min: margins.length > 0 ? Math.min(...margins) : null,
                margin_max: margins.length > 0 ? Math.max(...margins) : null,
                worst_status: worstStatus,
                min_profit: profits.length > 0 ? Math.min(...profits) : null,
            });
        }

        return groups;
    }

    /**
     * Determine worst-case status: LOSS > LOW_MARGIN > UNKNOWN > PROFIT
     */
    private getWorstStatus(statuses: PriceStatus[]): PriceStatus {
        if (statuses.includes(PriceStatus.LOSS)) return PriceStatus.LOSS;
        if (statuses.includes(PriceStatus.LOW_MARGIN)) return PriceStatus.LOW_MARGIN;
        if (statuses.includes(PriceStatus.UNKNOWN)) return PriceStatus.UNKNOWN;
        return PriceStatus.PROFIT;
    }

    /**
     * Parse model string to enum
     */
    private parseModel(model: string): FulfillmentModel {
        const lowerModel = model.toLowerCase();
        if (lowerModel === 'fbs') return FulfillmentModel.FBS;
        if (lowerModel === 'fbo') return FulfillmentModel.FBO;
        return FulfillmentModel.AUTO;
    }

    /**
     * Parse price status string to enum
     */
    private parsePriceStatus(status: string): PriceStatus {
        const lowerStatus = status.toLowerCase();
        if (lowerStatus === 'profit') return PriceStatus.PROFIT;
        if (lowerStatus === 'loss') return PriceStatus.LOSS;
        if (lowerStatus === 'low_margin') return PriceStatus.LOW_MARGIN;
        return PriceStatus.UNKNOWN;
    }

    /**
     * Export to Excel
     */
    async exportToExcel(filters: ProfitFiltersDto, sellerId: string): Promise<Buffer> {
        // Get all data without pagination
        const result = await this.findWithProfitAnalysis(filters, sellerId, 1, 10000);

        // Get all variants for all groups
        const allVariants: any[] = [];
        for (const group of result.groups) {
            const variants = await this.getVariantsForProductId(group.product_id, filters);
            for (const variant of variants) {
                allVariants.push({
                    product_id: group.product_id,
                    group_worst_status: group.worst_status,
                    group_min_profit: group.min_profit,
                    variants_count: group.variants_count,
                    ...variant,
                });
            }
        }

        // Create Excel workbook
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Marketplace Products Profit Analysis');

        // Define columns
        worksheet.columns = [
            { header: 'Product ID', key: 'product_id', width: 15 },
            { header: 'SKU ID', key: 'sku_id', width: 15 },
            { header: 'SKU Name', key: 'sku_name', width: 20 },
            { header: 'Title', key: 'title', width: 30 },
            { header: 'Barcode', key: 'barcode', width: 15 },
            { header: 'Sell Price (UZS)', key: 'sell_price_uzs', width: 15 },
            { header: 'Commission %', key: 'commission_percent', width: 12 },
            { header: 'Commission Value (UZS)', key: 'commission_value_uzs', width: 18 },
            { header: 'Logistics Fee (UZS)', key: 'logistics_fee_uzs', width: 18 },
            { header: 'Payout (UZS)', key: 'payout_uzs', width: 15 },
            { header: 'Cost (UZS)', key: 'cost_uzs', width: 12 },
            { header: 'Profit (UZS)', key: 'profit_uzs', width: 12 },
            { header: 'Margin %', key: 'margin_percent', width: 10 },
            { header: 'Status', key: 'status', width: 12 },
            { header: 'Group Worst Status', key: 'group_worst_status', width: 18 },
            { header: 'Group Min Profit', key: 'group_min_profit', width: 15 },
            { header: 'Variants in Group', key: 'variants_count', width: 15 },
            { header: 'Store ID', key: 'store_id', width: 20 },
            { header: 'Product Status', key: 'product_status', width: 15 },
            { header: 'Model Used', key: 'model_used', width: 10 },
        ];

        // Add rows
        allVariants.forEach(variant => {
            worksheet.addRow(variant);
        });

        // Style header row
        worksheet.getRow(1).font = { bold: true };
        worksheet.getRow(1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFE0E0E0' },
        };

        // Generate buffer
        const buffer = await workbook.xlsx.writeBuffer();
        return Buffer.from(buffer);
    }
}
