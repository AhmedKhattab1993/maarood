import { Module } from '@nestjs/common';
import { DbModule } from '../db/db.module';
import { ProductsController } from './products/products.controller';
import { BrandsController } from './brands.controller';
import { CategoriesController } from './categories.controller';
import { SearchController } from './search/search.controller';
import { SearchService } from './search/search.service';
import { SavedController } from './saved/saved.controller';

@Module({
  imports: [DbModule],
  controllers: [ProductsController, BrandsController, CategoriesController, SearchController, SavedController],
  providers: [SearchService],
})
export class V1Module {}
