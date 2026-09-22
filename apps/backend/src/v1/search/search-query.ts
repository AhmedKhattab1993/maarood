import { and, or, sql, type SQL } from 'drizzle-orm';
import { products } from '@maarood/schema';
import { buildSearchTerms } from './synonyms';

// The generated column is declared by migration rather than Drizzle.
const searchVector = sql.raw('"products"."search_vector"');

/** Query-side folding also applies to legacy titles whose vector predates Arabic folding. */
function foldedText(column: typeof products.title | typeof products.colors): SQL {
  return sql`translate(regexp_replace(lower(coalesce(${column}, '')), ${'[\u0617-\u061A\u064B-\u0652\u0670\u0640]'}, '', 'g'), 'أإآىة', 'ااايه')`;
}

const foldedTitle = foldedText(products.title);
const titleVector = sql`to_tsvector('simple', ${foldedTitle})`;
const colorVector = sql`to_tsvector('simple', ${foldedTitle} || ' ' || ${foldedText(products.colors)})`;
const productTypeVector = sql`to_tsvector('simple', ${foldedTitle} || ' ' || ${products.category} || ' ' || ${products.subcategory})`;

/** Each requested concept must match, including when a single word has a typo. */
export function buildSearchSql(query: string): { condition: SQL; relevance: SQL<number> } {
  const terms = buildSearchTerms(query);
  if (terms.length === 0) return { condition: sql`false`, relevance: sql<number>`0` };

  const conditions: SQL[] = [];
  const scores: SQL[] = [];
  for (const term of terms) {
    const alternatives = term.alternatives.flatMap((word) => /[\u0600-\u06FF]/.test(word) ? [word, `ال${word}`] : [word]);
    const tsquery = sql`to_tsquery('simple', ${alternatives.join(' | ')})`;
    const titleMatch = sql`${tsquery} @@ ${titleVector}`;
    // A description such as "pair with red shoes" is not evidence of the product's color.
    const exactMatch = sql`${tsquery} @@ ${term.color ? colorVector : term.productType ? productTypeVector : searchVector}`;
    // Short words cause unrelated hits (bag/baggy). Use whole-word typos only
    // for longer title words, and never relax a recognized color constraint.
    const typo = !term.color && term.token.length >= 4
      ? sql`strict_word_similarity(${term.token}, ${foldedTitle}) >= 0.5`
      : sql`false`;
    conditions.push(or(exactMatch, titleMatch, typo)!);
    scores.push(sql`(case when ${titleMatch} then 4 else 0 end + case when ${exactMatch} then 1 else 0 end)`);
  }

  return {
    condition: and(...conditions)!,
    relevance: sql<number>`(${sql.join(scores, sql` + `)})`,
  };
}
