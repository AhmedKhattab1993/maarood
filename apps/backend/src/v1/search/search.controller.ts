/**
 * Search endpoint — free-text + filters.
 *   GET /v1/search?q=shirt&category=...&minPrice=...
 */

import { BadRequestException, Controller, Get, Query } from '@nestjs/common';
import { productQuery } from '../products/products.dto';
import { SearchService } from './search.service';
import { searchTokens } from './normalize';

@Controller('v1/search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get()
  async search(@Query('q') q: string | undefined, @Query() rawQuery: Record<string, unknown>) {
    const parsed = productQuery.safeParse({ ...rawQuery, sort: rawQuery.sort ?? 'relevance' });
    if (!parsed.success) throw new BadRequestException(parsed.error.flatten());
    const text = typeof q === 'string' ? q.trim() : '';
    if (text.length > 200 || searchTokens(text).length > 20) {
      throw new BadRequestException('Search must be at most 200 characters and 20 words');
    }
    return this.searchService.search(text, parsed.data);
  }
}
