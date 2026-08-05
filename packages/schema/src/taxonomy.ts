/**
 * Maaroud category taxonomy — shared between ingestion normalization and any
 * admin re-categorization. Lives in the schema package so the contract is single-sourced.
 *
 * Canonical categories reflect the MVP focus on fashion and accessories
 * (per 01_PROJECT_OVERVIEW_AND_MVP.md). Each category has English + Arabic
 * keyword matchers checked (case-insensitive) against title, product_type,
 * tags, and handle. First match wins; 'other' is the fallback.
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

interface CategoryRule {
  category: CanonicalCategory;
  /** Lowercased substrings to match against the combined text. */
  keywords: string[];
}

const RULES: CategoryRule[] = [
  {
    category: 'footwear',
    keywords: [
      'shoe', 'shoes', 'sneaker', 'sneakers', 'sandal', 'sandals', 'boot', 'boots',
      'slipper', 'slippers', 'loafer', 'loafers',
      // Arabic
      'حذاء', 'جزمة', 'صندل', 'كوتشي',
    ],
  },
  {
    category: 'bags',
    keywords: [
      'bag', 'bags', 'backpack', 'handbag', 'tote', 'wallet', 'purse', 'clutch', 'crossbody',
      // Arabic
      'شنطة', 'شنطة', 'حقيبة', 'محفظة',
    ],
  },
  {
    category: 'jewelry',
    keywords: [
      'necklace', 'ring', 'rings', 'earring', 'earrings', 'bracelet', 'watch', 'watches',
      'chain', 'pendant', 'jewelry', 'jewellery',
      // Arabic
      'خاتم', 'خاتم', 'ساعة', 'سلاسل', 'قلادة',
    ],
  },
  {
    category: 'accessories',
    keywords: [
      'cap', 'caps', 'hat', 'hats', 'belt', 'belts', 'scarf', 'scarves', 'sunglasses',
      'glasses', 'glove', 'gloves', 'tie', 'ties', 'beanie', 'bucket hat', 'sock', 'socks',
      // Arabic
      'كاب', 'قبعة', 'حزام', 'شارف', 'نظارة',
    ],
  },
  {
    category: 'apparel',
    keywords: [
      // Tops
      't-shirt', 'tshirt', 'tee', 'shirt', 'shirts', 'polo', 'blouse', 'top', 'tops',
      'hoodie', 'hoodies', 'sweatshirt', 'sweatshirts', 'jacket', 'jackets', 'coat',
      'coats', 'cardigan', 'pullover', 'jumper', 'tank', 'tanktop',
      // Bottoms
      'pant', 'pants', 'trouser', 'trousers', 'jean', 'jeans', 'short', 'shorts',
      'jogger', 'joggers', 'sweatpants', 'legging', 'leggings', 'skirt', 'skirts',
      // Dresses / full body
      'dress', 'dresses', 'gown', 'kaftan', 'abaya', 'jumpsuit', 'romper', 'suit', 'suits',
      // Knitwear
      'knit', 'knitwear', 'sweater', 'sweaters',
      // Kids variants
      'kids', 'newborn', 'baby',
      // Arabic
      'تيشيرت', 'قميص', 'بلوزة', 'هودي', 'جاكت', 'بنطلون', 'جينز', 'شورت', 'فستان',
      'عباية', 'كارديجان', 'بلوفر', 'كاب', 'اطفال',
    ],
  },
];

export interface CategorizationResult {
  category: CanonicalCategory;
  /** Best-effort subcategory (e.g. the matched keyword group). Empty string if none. */
  subcategory: string;
}

/**
 * Categorize a product from its available text fields.
 * Returns 'other' when nothing matches.
 */
export function categorize(input: {
  title?: string;
  productType?: string;
  tags?: string[] | string;
  handle?: string;
}): CategorizationResult {
  const tags = Array.isArray(input.tags)
    ? input.tags.join(' ')
    : (input.tags ?? '');
  const haystack = [
    input.title ?? '',
    input.productType ?? '',
    tags,
    (input.handle ?? '').replace(/-/g, ' '),
  ]
    .join(' ')
    .toLowerCase();

  for (const rule of RULES) {
    if (rule.keywords.some((kw) => haystack.includes(kw))) {
      return { category: rule.category, subcategory: '' };
    }
  }
  return { category: 'other', subcategory: '' };
}
