import { IsOptional, IsString, IsArray, IsEnum } from 'class-validator';

export enum PriceStatus {
    PROFIT = 'PROFIT',
    LOSS = 'LOSS',
    LOW_MARGIN = 'LOW_MARGIN',
    UNKNOWN = 'UNKNOWN',
}

export enum FulfillmentModel {
    FBS = 'FBS',
    FBO = 'FBO',
    AUTO = 'AUTO',
}

export class MarketplaceProfitCalculationDto {
    sell_price_uzs: number; // integer
    commission_percent: number; // 2 decimals
    commission_value_uzs: number; // integer
    logistics_fee_uzs: number; // integer
    payout_uzs: number; // integer
    cost_uzs: number | null; // integer or null
    profit_uzs: number | null; // integer or null
    margin_percent: number | null; // 2 decimals or null
    status: PriceStatus;
    hint?: string; // Optional hint message for UNKNOWN status
    model_used: FulfillmentModel; // Which model was actually used for calculation
}

export class MarketplaceProductVariantDto {
    sku_id: number;
    sku_name: string | null;
    title: string;
    barcode: number | null;

    // Calculation results
    sell_price_uzs: number;
    payout_uzs: number;
    profit_uzs: number | null;
    margin_percent: number | null;
    status: PriceStatus;
    hint?: string;

    // Optional detailed breakdown
    commission_percent?: number;
    commission_value_uzs?: number;
    logistics_fee_uzs?: number;
    cost_uzs?: number | null;
    model_used?: FulfillmentModel;

    // Store and product status
    store_id: string;
    product_status: string;
}

export class MarketplaceProductGroupDto {
    product_id: number;
    product_title: string; // Any variant title
    variants_count: number; // Count after filtering

    // Ranges
    sell_price_min: number;
    sell_price_max: number;
    payout_min: number;
    payout_max: number;
    profit_min: number | null;
    profit_max: number | null;
    margin_min: number | null;
    margin_max: number | null;

    // Worst-case aggregation
    worst_status: PriceStatus;
    min_profit: number | null; // Explicitly show lowest profit

    // Variants (only populated when expanded)
    variants?: MarketplaceProductVariantDto[];
}

export class ProfitFiltersDto {
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    store_ids?: string[]; // Multi-select

    @IsOptional()
    @IsString()
    store_id?: string; // Single-select support

    @IsOptional()
    @IsString()
    product_status?: string; // Single-select: 'in_stock' | 'run_out' | 'archived' | 'blocked'

    @IsOptional()
    @IsString()
    price_status?: string; // Single-select: 'profit' | 'loss' | 'low_margin' | 'unknown'

    @IsOptional()
    @IsString()
    model?: string; // Single-select: 'fbs' | 'fbo' | 'auto', default 'auto'

    @IsOptional()
    @IsString()
    search?: string; // Search text

    @IsOptional()
    page?: number;

    @IsOptional()
    per_page?: number;
}

export class ProfitAnalysisResponseDto {
    groups: MarketplaceProductGroupDto[];
    total: number; // Total groups after filtering
    page: number;
    per_page: number;
    meta: {
        threshold_margin_percent: number;
    };
}
