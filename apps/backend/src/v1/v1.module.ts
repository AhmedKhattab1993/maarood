import { Module } from '@nestjs/common';
import { DbModule } from '../db/db.module';
import { ProductsController } from './products/products.controller';
import { BrandsController } from './brands.controller';
import { CategoriesController } from './categories.controller';
import { SearchController } from './search/search.controller';
import { SearchService } from './search/search.service';
import { SavedController } from './saved/saved.controller';
import { AuthController } from './auth/auth.controller';
import { FollowingController } from './me/following.controller';

@Module({
  imports: [DbModule],
  controllers: [
    ProductsController,
    BrandsController,
    CategoriesController,
    SearchController,
    SavedController,
    AuthController,
    FollowingController,
  ],
  providers: [SearchService],
})
export class V1Module {}
