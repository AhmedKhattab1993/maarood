/**
 * Search endpoint — free-text + filters.
 *   GET /v1/search?q=shirt&category=...&minPrice=...
 */

import { BadRequestException, Controller, Get, Query } from '@nestjs/common';
import { productQuery } from '../products/products.dto';
import { SearchService } from './search.service';

@Controller('v1/search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get()
  async search(@Query('q') q: string | undefined, @Query() rawQuery: Record<string, unknown>) {
    // Merge the text query into the parsed product filters; force relevance ordering.
    const parsed = productQuery.safeParse({ ...rawQuery, sort: 'relevance' });
    if (!parsed.success) throw new BadRequestException(parsed.error.flatten());
    const text = typeof q === 'string' ? q.trim() : '';
    return this.searchService.search(text, parsed.data);
  }
}
