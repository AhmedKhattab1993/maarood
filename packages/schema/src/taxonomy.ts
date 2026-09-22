/**
 * Maaroud category taxonomy — shared between ingestion normalization and any
 * admin re-categorization. Lives in the schema package so the contract is single-sourced.
 *
 * Canonical categories reflect the MVP focus on fashion and accessories.
 * Each category has English + Arabic keyword matchers. Keywords match whole
 * words only (so "bag" does not match "baggy", "boot" does not match
 * "bootcut"). The merchant's product type is checked before the title, then
 * tags, then the handle. First match wins; 'other' is the fallback.
 *
 * Keep this list small and obvious. It's an MVP heuristic, not a full retail
 * taxonomy — refinable later when a real catalog need arrives.
 */

export const CANONICAL_CATEGORIES = [
  'apparel',
  'footwear',
  'accessories',
  'bags',
  'jewelry',
  'other',
] as const;

export type CanonicalCategory = (typeof CANONICAL_CATEGORIES)[number];

function normalizeCategoryText(value: string): string {
  return value
    .toLowerCase()
    .replace(/[\u0617-\u061A\u064B-\u0652\u0670\u0640]/g, '')
    .replace(/[أإآ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه')
    .replace(/\s+/g, ' ')
    .trim();
}

const CATEGORY_ALIASES: Record<CanonicalCategory, readonly string[]> = {
  apparel: ['clothing', 'clothes', 'fashion', 'ملابس', 'الملابس', 'أزياء'],
  footwear: ['shoe', 'shoes', 'أحذية', 'الأحذية', 'حذاء'],
  accessories: ['accessory', 'إكسسوارات', 'اكسسوارات', 'اكسسوار', 'الإكسسوارات'],
  bags: ['bag', 'handbags', 'شنط', 'شنطة', 'حقائب', 'حقيبة', 'الحقائب'],
  jewelry: ['jewellery', 'jewels', 'مجوهرات', 'المجوهرات', 'حلي'],
  other: ['others', 'miscellaneous', 'أخرى', 'اخري', 'متنوعات'],
};

const CATEGORY_INDEX = new Map<string, CanonicalCategory>();
for (const category of CANONICAL_CATEGORIES) {
  for (const alias of [category, ...CATEGORY_ALIASES[category]]) {
    CATEGORY_INDEX.set(normalizeCategoryText(alias), category);
  }
}

/** Resolve complete category labels only; "baggy" must never become "bags". */
export function normalizeCategory(value: string): CanonicalCategory | null {
  return CATEGORY_INDEX.get(normalizeCategoryText(value)) ?? null;
}

interface CategoryRule {
  category: CanonicalCategory;
  /** Lowercased whole words (or phrases) to match. */
  keywords: string[];
}

const RULES: CategoryRule[] = [
  {
    category: 'footwear',
    keywords: [
      'shoe',
      'shoes',
      'sneaker',
      'sneakers',
      'sandal',
      'sandals',
      'boot',
      'boots',
      'slipper',
      'slippers',
      'loafer',
      'loafers',
      // Arabic
      'حذاء',
      'أحذية',
      'جزمة',
      'صندل',
      'كوتشي',
    ],
  },
  {
    category: 'bags',
    keywords: [
      'bag',
      'bags',
      'backpack',
      'handbag',
      'tote',
      'wallet',
      'purse',
      'clutch',
      'clutches',
      'crossbody',
      'suitcase',
      'luggage',
      'pouch',
      'card holder',
      'cardholder',
      'passport holder',
      'laptop sleeve',
      // Arabic (شنطة / شنطه / شنط and محفظة / محافظ are spelling variants)
      'شنطة',
      'شنطه',
      'شنط',
      'حقيبة',
      'حقائب',
      'محفظة',
      'محافظ',
    ],
  },
  {
    category: 'jewelry',
    keywords: [
      'necklace',
      'ring',
      'rings',
      'earring',
      'earrings',
      'bracelet',
      'watch',
      'watches',
      'chain',
      'pendant',
      'jewelry',
      'jewellery',
      // Arabic
      'خاتم',
      'ساعة',
      'ساعات',
      'مجوهرات',
      'حلق',
      'أقراط',
      'أساور',
      'سلاسل',
      'قلادة',
    ],
  },
  {
    category: 'accessories',
    keywords: [
      'cap',
      'caps',
      'hat',
      'hats',
      'belt',
      'belts',
      'scarf',
      'scarves',
      'sunglasses',
      'glasses',
      'glove',
      'gloves',
      'tie',
      'ties',
      'beanie',
      'bucket hat',
      'sock',
      'socks',
      // Arabic
      'كاب',
      'قبعة',
      'حزام',
      'شارف',
      'نظارة',
      'نظارات',
      'وشاح',
      'حجاب',
      'طرحة',
      'قفازات',
      'جوارب',
    ],
  },
  {
    category: 'apparel',
    keywords: [
      // Tops
      't-shirt',
      'tshirt',
      'tee',
      'shirt',
      'shirts',
      'polo',
      'blouse',
      'top',
      'tops',
      'hoodie',
      'hoodies',
      'sweatshirt',
      'sweatshirts',
      'jacket',
      'jackets',
      'coat',
      'coats',
      'cardigan',
      'pullover',
      'jumper',
      'tank',
      'tanktop',
      // Bottoms
      'pant',
      'pants',
      'trouser',
      'trousers',
      'jean',
      'jeans',
      'short',
      'shorts',
      'jogger',
      'joggers',
      'sweatpants',
      'legging',
      'leggings',
      'skirt',
      'skirts',
      // Dresses / full body
      'dress',
      'dresses',
      'sundress',
      'gown',
      'kaftan',
      'abaya',
      'jumpsuit',
      'romper',
      'suit',
      'suits',
      'bodysuit',
      'rashguard',
      'rash guard',
      'swimsuit',
      'swimwear',
      'bikini',
      'trunks',
      'bandeau',
      'burkini',
      // Outer layers and one-pieces the catalog actually sells
      'vest',
      'blazer',
      'corset',
      'kimono',
      'onesie',
      'sarong',
      'tracksuit',
      'wrap',
      'pajama',
      'pyjama',
      'cover up',
      'cover-up',
      'coverup',
      'sports bra',
      'bra',
      'quarter zip',
      'crewneck',
      'crew neck',
      'crew',
      'sweatshorts',
      'pshorts',
      'ensemble',
      'co-ord',
      'coord',
      'knitted',
      'swim hood',
      // Knitwear
      'knit',
      'knitwear',
      'sweater',
      'sweaters',
      // Cuts that are not their own garment word (baggy denim, jorts).
      'denim',
      'jorts',
      'chino',
      // Arabic
      'تيشيرت',
      'قميص',
      'بلوزة',
      'هودي',
      'جاكت',
      'بنطلون',
      'جينز',
      'شورت',
      'فستان',
      'عباية',
      'كارديجان',
      'بلوفر',
      'اطفال',
      'سوت',
      'شميز',
      'شيميز',
      'معطف',
      'چاكت',
      'بوركيني',
      'تي شيرت',
      'تنورة',
      'بدلة',
      'مايوه',
    ],
  },
];

export interface CategorizationResult {
  category: CanonicalCategory;
  /** Best-effort subcategory (e.g. the matched keyword group). Empty string if none. */
  subcategory: string;
}

interface CompiledRule {
  category: CanonicalCategory;
  patterns: RegExp[];
}

/**
 * Whole-word matcher. An optional trailing "s" covers English plurals
 * (bag/bags) without treating a longer word as a hit (baggy, bootcut).
 */
function keywordPattern(keyword: string): RegExp {
  const escaped = normalizeCategoryText(keyword).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const plural = /[a-z]$/.test(keyword) && !keyword.endsWith('s') ? 's?' : '';
  const article = /[\u0600-\u06FF]/.test(keyword) ? '(?:ال)?' : '';
  // "Cap sleeve" is a neckline, not a cap.
  const notSleeve = keyword === 'cap' ? '(?!\\s+sleeve)' : '';
  return new RegExp(`(?<![\\p{L}\\p{N}])${article}${escaped}${plural}${notSleeve}(?![\\p{L}\\p{N}])`, 'iu');
}

const COMPILED_RULES: CompiledRule[] = RULES.map((rule) => ({
  category: rule.category,
  patterns: rule.keywords.map(keywordPattern),
}));

function matchText(text: string): CanonicalCategory | null {
  const haystack = normalizeCategoryText(text);
  if (!haystack.trim()) return null;
  const canonical = normalizeCategory(haystack);
  if (canonical) return canonical;
  for (const rule of COMPILED_RULES) {
    if (rule.patterns.some((pattern) => pattern.test(haystack))) return rule.category;
  }
  return null;
}

/**
 * Categorize a product from its available text fields.
 * Returns 'other' when nothing matches.
 *
 * Product type is the merchant's own category, so it wins over the title.
 * That keeps "Men / Pants" out of bags when the title only says "baggy".
 */
export function categorize(input: {
  title?: string;
  productType?: string;
  tags?: string[] | string;
  handle?: string;
}): CategorizationResult {
  const tags = Array.isArray(input.tags) ? input.tags.join(' ') : (input.tags ?? '');
  const fields = [
    input.productType ?? '',
    input.title ?? '',
    tags,
    (input.handle ?? '').replace(/-/g, ' '),
  ];
  for (const field of fields) {
    const category = matchText(field);
    if (category) return { category, subcategory: '' };
  }
  return { category: 'other', subcategory: '' };
}
