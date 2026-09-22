/** Arabic/English shopping intents. Specific garments stay separate. */
import { searchTokens } from './normalize';

const PRODUCT_TYPE_GROUPS: readonly (readonly string[])[] = [
  ['bag', 'bags', 'handbag', 'handbags', 'شنطه', 'شنط', 'حقيبه', 'حقائب'],
  ['backpack', 'backpacks', 'rucksack'],
  ['wallet', 'wallets', 'محفظه', 'محافظ'],
  ['shoe', 'shoes', 'footwear', 'حذاء', 'احذيه'],
  ['sneaker', 'sneakers', 'trainer', 'trainers', 'كوتشي'],
  ['sandal', 'sandals', 'صندل', 'صنادل'],
  ['boot', 'boots', 'بوت'],
  ['dress', 'dresses', 'فستان', 'فساتين'],
  ['shirt', 'shirts', 'قميص', 'قمصان'],
  ['tshirt', 'tshirts', 't-shirt', 'tee', 'tees', 'تيشيرت', 'تيشرت'],
  ['blouse', 'blouses', 'بلوزه', 'بلوزات'],
  ['pants', 'pant', 'trousers', 'trouser', 'بنطلون', 'بناطيل', 'بنطال'],
  ['jean', 'jeans', 'denim', 'جينز'],
  ['jogger', 'joggers', 'sweatpants'],
  ['legging', 'leggings', 'ليقنز'],
  ['short', 'shorts', 'شورت'],
  ['jacket', 'jackets', 'جاكيت', 'جاكت'],
  ['coat', 'coats', 'معطف'],
  ['hoodie', 'hoodies', 'hooded', 'هودي'],
  ['cardigan', 'cardigans', 'كارديجان'],
  ['sweater', 'sweaters', 'pullover', 'بلوفر'],
  ['watch', 'watches', 'ساعه', 'ساعات'],
  ['necklace', 'necklaces', 'عقد', 'قلاده', 'سلسله'],
  ['ring', 'rings', 'خاتم', 'خواتم'],
  ['bracelet', 'bracelets', 'اسوره', 'اساور'],
  ['earring', 'earrings', 'حلق', 'اقراط'],
  ['jewelry', 'jewellery', 'مجوهرات', 'حلي'],
  ['accessory', 'accessories', 'اكسسوارات', 'اكسسوار'],
  ['apparel', 'clothes', 'clothing', 'ملابس'],
  ['perfume', 'fragrance', 'عطر', 'برفان'],
  ['scarf', 'scarves', 'وشاح', 'اوشحه'],
  ['hijab', 'حجاب', 'طرحه'],
] as const;

const MODIFIER_GROUPS: readonly (readonly string[])[] = [
  ['gym', 'fitness', 'sport', 'sports', 'sportswear', 'رياضه', 'رياضيه', 'رياضي', 'جيم'],
  ['swim', 'swimwear', 'swimsuit', 'سباحه', 'مايوه'],
  ['cotton', 'قطن'],
  ['leather', 'جلد'],
  ['linen', 'كتان'],
  ['women', 'womens', 'woman', 'ladies', 'نسائي', 'نسائيه', 'سيدات'],
  ['men', 'mens', 'man', 'رجالي', 'رجاليه', 'رجال'],
] as const;

const COLOR_GROUPS: readonly (readonly string[])[] = [
  ['black', 'اسود', 'سوداء'],
  ['white', 'ابيض', 'بيضاء'],
  ['red', 'احمر', 'حمراء'],
  ['blue', 'ازرق', 'زرقاء'],
  ['green', 'اخضر', 'خضراء'],
  ['yellow', 'اصفر', 'صفراء'],
  ['pink', 'وردي', 'بينك', 'بمبي'],
  ['purple', 'violet', 'بنفسجي', 'موف'],
  ['brown', 'بني'],
  ['grey', 'gray', 'رمادي'],
  ['beige', 'بيج'],
  ['navy', 'كحلي'],
  ['orange', 'برتقالي'],
  ['gold', 'golden', 'ذهبي'],
  ['silver', 'فضي'],
] as const;

const TERM_INDEX = new Map<string, readonly string[]>();
const COLOR_TERMS = new Set(COLOR_GROUPS.flat());
const PRODUCT_TYPE_TERMS = new Set(PRODUCT_TYPE_GROUPS.flat());
for (const group of [...PRODUCT_TYPE_GROUPS, ...MODIFIER_GROUPS, ...COLOR_GROUPS]) {
  for (const term of group) TERM_INDEX.set(term, group);
}

const STOP_WORDS = new Set(['a', 'an', 'the', 'and', 'for', 'with', 'of', 'in', 'و', 'من', 'في']);

function lookupTerm(token: string): string {
  // Arabic's definite article is commonly attached to the shopping noun.
  return token.startsWith('ال') && TERM_INDEX.has(token.slice(2)) ? token.slice(2) : token;
}

export interface SearchTerm {
  token: string;
  alternatives: readonly string[];
  color: boolean;
  productType: boolean;
}

/** AND these intents; OR only translations and equivalents of the same intent. */
export function buildSearchTerms(query: string): SearchTerm[] {
  const terms: SearchTerm[] = [];
  const seen = new Set<string>();
  for (const original of searchTokens(query)) {
    const token = lookupTerm(original);
    if (STOP_WORDS.has(token)) continue;
    const alternatives = TERM_INDEX.get(token) ?? [token];
    const key = alternatives[0]!;
    if (seen.has(key)) continue;
    seen.add(key);
    terms.push({ token, alternatives, color: COLOR_TERMS.has(token), productType: PRODUCT_TYPE_TERMS.has(token) });
  }
  return terms;
}
