import { sql } from 'drizzle-orm';
import { PgDialect } from 'drizzle-orm/pg-core';
import { describe, expect, it } from 'vitest';
import { feedOrderBy } from './feed-ranking';

const dialect = new PgDialect();

describe('feed SQL ranking', () => {
  it('binds seeds and preference keys instead of interpolating user text into SQL', () => {
    const seed = "'; drop table products; --";
    const query = dialect.sqlToQuery(sql.join(feedOrderBy(seed, {
      categories: { "apparel'); select 1; --": 3 }, merchants: {},
    }, []), sql`, `));
    expect(query.sql).not.toContain(seed);
    expect(query.sql).not.toContain('select 1');
    expect(query.params).toContain(seed);
    expect(query.params).toContain('{"apparel\'); select 1; --":1}');
  });

  it('keeps ranks stable for identical snapshots with no volatile random or clock ranking', () => {
    const build = () => dialect.sqlToQuery(sql.join(feedOrderBy('fixed-visit', {
      categories: { apparel: 4 }, merchants: {},
    }, ['11111111-1111-4111-8111-111111111111']), sql`, `));
    expect(build()).toEqual(build());
    expect(build().sql).not.toMatch(/random\(|now\(/);
    expect(build().sql).toMatch(/row_number\(\) over/);
    expect(build().sql).toMatch(/"products"\."id" asc$/);
  });
});
