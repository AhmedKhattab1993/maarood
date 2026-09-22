import { BadRequestException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { SearchController } from './search.controller';
import type { SearchService } from './search.service';

function setup() {
  const search = vi.fn().mockResolvedValue({ items: [], total: 0 });
  return { search, controller: new SearchController({ search } as unknown as SearchService) };
}

describe('search query validation', () => {
  it('defaults to relevance while honoring explicit user sorting', async () => {
    const { controller, search } = setup();
    await controller.search('red shoes', {});
    expect(search).toHaveBeenLastCalledWith('red shoes', expect.objectContaining({ sort: 'relevance' }));
    await controller.search('red shoes', { sort: 'price_asc', merchantId: '00000000-0000-4000-8000-000000000001' });
    expect(search).toHaveBeenLastCalledWith('red shoes', expect.objectContaining({
      sort: 'price_asc', merchantId: ['00000000-0000-4000-8000-000000000001'],
    }));
  });

  it('rejects invalid filters and bounds expensive free-text work', async () => {
    const { controller, search } = setup();
    await expect(controller.search('shoes', { sort: 'unknown' })).rejects.toBeInstanceOf(BadRequestException);
    await expect(controller.search('a'.repeat(201), {})).rejects.toBeInstanceOf(BadRequestException);
    await expect(controller.search('word '.repeat(21), {})).rejects.toBeInstanceOf(BadRequestException);
    expect(search).not.toHaveBeenCalled();
  });
});
