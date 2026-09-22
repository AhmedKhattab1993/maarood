import { Module } from '@nestjs/common';
import { DbModule } from '../db/db.module';
import { ProductsController } from './products/products.controller';
import { BrandsController } from './brands.controller';
import { CategoriesController } from './categories.controller';
import { FacetsController } from './facets/facets.controller';
import { SearchController } from './search/search.controller';
import { SearchService } from './search/search.service';
import { SavedController } from './saved/saved.controller';
import { AuthController } from './auth/auth.controller';
import { FollowingController } from './me/following.controller';
import { FeedController } from './feed/feed.controller';
import { FeedService } from './feed/feed.service';

@Module({
  imports: [DbModule],
  controllers: [
    ProductsController,
    BrandsController,
    CategoriesController,
    FacetsController,
    SearchController,
    SavedController,
    AuthController,
    FollowingController,
    FeedController,
  ],
  providers: [SearchService, FeedService],
})
export class V1Module {}
