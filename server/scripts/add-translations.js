const fs = require('fs');
const path = require('path');

// Read existing locale files
const basePath = path.join(__dirname, '../..');
const enPath = path.join(basePath, 'client/src/locales/en.json');
const ruPath = path.join(basePath, 'client/src/locales/ru.json');
const uzPath = path.join(basePath, 'client/src/locales/uz.json');

const enJson = JSON.parse(fs.readFileSync(enPath, 'utf8'));
const ruJson = JSON.parse(fs.readFileSync(ruPath, 'utf8'));
const uzJson = JSON.parse(fs.readFileSync(uzPath, 'utf8'));

// English translations
const marketplaceProductsEn = {
    "marketplace_products": {
        "title": "Marketplace Products: Profit Monitoring",
        "subtitle": "Identify products sold at a loss or low margin",
        "columns": {
            "id": "Product ID",
            "title": "Title",
            "variants_count": "Variants",
            "variants": "variants",
            "sell_price": "Sell Price",
            "marketplace_payout": "Marketplace Payout",
            "profit": "Profit",
            "margin": "Margin",
            "status": "Status"
        },
        "filters": {
            "store": "Store",
            "product_status": "Product Status",
            "price_status": "Price Status",
            "model": "Model",
            "search": "Search products..."
        },
        "product_status_options": {
            "in_stock": "In Stock",
            "run_out": "Run Out",
            "archived": "Archived",
            "blocked": "Blocked"
        },
        "price_status_options": {
            "profit": "Profit",
            "low_margin": "Low Margin",
            "loss": "Loss",
            "unknown": "Unknown"
        },
        "model_options": {
            "auto": "Auto",
            "fbs": "FBS",
            "fbo": "FBO"
        },
        "status": {
            "PROFIT": "Profit",
            "LOSS": "Loss",
            "LOW_MARGIN": "Low Margin",
            "UNKNOWN": "Unknown"
        },
        "hints": {
            "not_linked": "Not linked to Parent Product (cost unknown)",
            "cost_not_set": "Cost is not set in Parent Products",
            "sell_price_zero": "Sell price is 0",
            "commission_not_found": "Commission rate not found for category/model",
            "logistics_fee_missing": "Logistics fee missing for this model",
            "auto_model_ambiguous": "Auto model cannot be decided - please select FBS or FBO manually"
        },
        "actions": {
            "export_excel": "Export to Excel",
            "open_parent_product": "Open Parent Product"
        }
    }
};

// Russian translations
const marketplaceProductsRu = {
    "marketplace_products": {
        "title": "Маркетплейс продукты: Мониторинг прибыли",
        "subtitle": "Выявление продуктов, продаваемых с убытком или низкой маржой",
        "columns": {
            "id": "ID Продукта",
            "title": "Название",
            "variants_count": "Варианты",
            "variants": "варианты",
            "sell_price": "Цена продажи",
            "marketplace_payout": "Выплата маркетплейса",
            "profit": "Прибыль",
            "margin": "Маржа",
            "status": "Статус"
        },
        "filters": {
            "store": "Магазин",
            "product_status": "Статус продукта",
            "price_status": "Статус цены",
            "model": "Модель",
            "search": "Поиск продуктов..."
        },
        "product_status_options": {
            "in_stock": "В наличии",
            "run_out": "Закончился",
            "archived": "Архивный",
            "blocked": "Заблокирован"
        },
        "price_status_options": {
            "profit": "Прибыль",
            "low_margin": "Низкая маржа",
            "loss": "Убыток",
            "unknown": "Неизвестно"
        },
        "model_options": {
            "auto": "Авто",
            "fbs": "FBS",
            "fbo": "FBO"
        },
        "status": {
            "PROFIT": "Прибыль",
            "LOSS": "Убыток",
            "LOW_MARGIN": "Низкая маржа",
            "UNKNOWN": "Неизвестно"
        },
        "hints": {
            "not_linked": "Не привязан к родительскому продукту (стоимость неизвестна)",
            "cost_not_set": "Стоимость не установлена в родительских продуктах",
            "sell_price_zero": "Цена продажи равна 0",
            "commission_not_found": "Ставка комиссии не найдена для категории/модели",
            "logistics_fee_missing": "Логистическая плата отсутствует для этой модели",
            "auto_model_ambiguous": "Авто-модель не может быть определена - выберите FBS или FBO вручную"
        },
        "actions": {
            "export_excel": "Экспорт в Excel",
            "open_parent_product": "Открыть родительский продукт"
        }
    }
};

// Uzbek translations
const marketplaceProductsUz = {
    "marketplace_products": {
        "title": "Marketplace mahsulotlar: Foyda monitoringi",
        "subtitle": "Zarar yoki past marja bilan sotilgan mahsulotlarni aniqlash",
        "columns": {
            "id": "Mahsulot ID",
            "title": "Nomi",
            "variants_count": "Variantlar",
            "variants": "variantlar",
            "sell_price": "Savdo narxi",
            "marketplace_payout": "Marketplace to'lovi",
            "profit": "Foyda",
            "margin": "Marja",
            "status": "Holat"
        },
        "filters": {
            "store": "Do'kon",
            "product_status": "Mahsulot holati",
            "price_status": "Narx holati",
            "model": "Model",
            "search": "Mahsulotlarni qidirish..."
        },
        "product_status_options": {
            "in_stock": "Mavjud",
            "run_out": "Tugagan",
            "archived": "Arxivlangan",
            "blocked": "Bloklangan"
        },
        "price_status_options": {
            "profit": "Foyda",
            "low_margin": "Past marja",
            "loss": "Zarar",
            "unknown": "Noma'lum"
        },
        "model_options": {
            "auto": "Avto",
            "fbs": "FBS",
            "fbo": "FBO"
        },
        "status": {
            "PROFIT": "Foyda",
            "LOSS": "Zarar",
            "LOW_MARGIN": "Past marja",
            "UNKNOWN": "Noma'lum"
        },
        "hints": {
            "not_linked": "Asosiy mahsulotga bog'lanmagan (xarajat noma'lum)",
            "cost_not_set": "Asosiy mahsulotlarda xarajat belgilanmagan",
            "sell_price_zero": "Savdo narxi 0",
            "commission_not_found": "Kategoriya/model uchun komissiya stavkasi topilmadi",
            "logistics_fee_missing": "Ushbu model uchun logistika to'lovi yo'q",
            "auto_model_ambiguous": "Avto-modelni aniqlab bo'lmadi - FBS yoki FBO ni qo'lda tanlang"
        },
        "actions": {
            "export_excel": "Excel ga eksport qilish",
            "open_parent_product": "Asosiy mahsulotni ochish"
        }
    }
};

// Merge translations
Object.assign(enJson, marketplaceProductsEn);
Object.assign(ruJson, marketplaceProductsRu);
Object.assign(uzJson, marketplaceProductsUz);

// Write back
fs.writeFileSync(enPath, JSON.stringify(enJson, null, 4));
fs.writeFileSync(ruPath, JSON.stringify(ruJson, null, 4));
fs.writeFileSync(uzPath, JSON.stringify(uzJson, null, 4));

console.log('✓ Added marketplace_products translations to en.json, ru.json, and uz.json');
