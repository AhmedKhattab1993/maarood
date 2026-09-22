'use client';

import { useEffect } from 'react';
import { recordProductInterest, type InterestProduct } from '@/lib/discovery-profile';

/** Viewing a product teaches discovery; impressions alone never imply interest. */
export function ProductInterest({ product }: { product: InterestProduct }) {
  const { id, merchantId, category } = product;
  useEffect(() => {
    recordProductInterest({ id, merchantId, category });
  }, [id, merchantId, category]);
  return null;
}
