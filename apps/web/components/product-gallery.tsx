'use client';

import { useRef, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { indexAfterSwipe } from '@/lib/gallery-swipe';

/** Detail photos. Thumbnails and a horizontal swipe change the main image. */
export function ProductGallery({ imageUrls, title }: { imageUrls: string[]; title: string }) {
  const t = useTranslations('Product');
  const direction = useLocale() === 'ar' ? -1 : 1;
  const [index, setIndex] = useState(0);
  const [failedImages, setFailedImages] = useState<Set<string>>(() => new Set());
  const startX = useRef<number | null>(null);
  const safeIndex = imageUrls.length === 0 ? 0 : Math.min(index, imageUrls.length - 1);
  const current = imageUrls[safeIndex];

  if (!current) {
    return (
      <div
        role="img"
        aria-label={title}
        className="flex aspect-square w-full items-center justify-center rounded-2xl bg-surface text-nike-grey"
      >
        <PlaceholderIcon />
      </div>
    );
  }

  return (
    <section
      aria-label={t('photos')}
      className="flex min-w-0 flex-col gap-4 md:sticky md:top-[calc(var(--header-height)+1.5rem)] md:self-start"
    >
      <div
        className="relative aspect-[4/5] w-full overflow-hidden rounded-2xl border border-stone-grey/60 bg-surface outline-offset-4 lg:aspect-square"
        tabIndex={imageUrls.length > 1 ? 0 : undefined}
        role="group"
        aria-label={t('photoCount', { current: safeIndex + 1, total: imageUrls.length })}
        onKeyDown={(event) => {
          if (event.target !== event.currentTarget) return;
          if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
          event.preventDefault();
          const offset = (event.key === 'ArrowRight' ? 1 : -1) * direction;
          setIndex(Math.max(0, Math.min(imageUrls.length - 1, safeIndex + offset)));
        }}
        onTouchStart={(event) => {
          startX.current = event.changedTouches[0]?.clientX ?? null;
        }}
        onTouchEnd={(event) => {
          if (startX.current == null) return;
          const endX = event.changedTouches[0]?.clientX;
          if (endX == null) return;
          const deltaX = endX - startX.current;
          startX.current = null;
          setIndex((currentIndex) =>
            indexAfterSwipe(
              Math.min(currentIndex, imageUrls.length - 1),
              imageUrls.length,
              deltaX * direction,
            ),
          );
        }}
      >
        {failedImages.has(current) ? (
          <div className="flex h-full items-center justify-center text-nike-grey">
            <PlaceholderIcon />
          </div>
        ) : (
          <img
            src={current}
            alt={title}
            fetchPriority="high"
            decoding="async"
            referrerPolicy="no-referrer"
            onError={() => setFailedImages((previous) => new Set(previous).add(current))}
            className="h-full w-full object-contain"
          />
        )}
        {imageUrls.length > 1 && (
          <>
            <button
              type="button"
              aria-label={t('previousPhoto')}
              disabled={safeIndex === 0}
              onClick={() => setIndex(safeIndex - 1)}
              className="absolute start-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-stone-grey bg-white/95 shadow-sm transition-colors hover:bg-white disabled:opacity-30"
            >
              <ArrowIcon previous />
            </button>
            <button
              type="button"
              aria-label={t('nextPhoto')}
              disabled={safeIndex === imageUrls.length - 1}
              onClick={() => setIndex(safeIndex + 1)}
              className="absolute end-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-stone-grey bg-white/95 shadow-sm transition-colors hover:bg-white disabled:opacity-30"
            >
              <ArrowIcon />
            </button>
            <span
              aria-live="polite"
              className="absolute bottom-3 start-1/2 -translate-x-1/2 rounded-pill bg-white/95 px-3 py-1 text-xs text-nike-grey rtl:translate-x-1/2"
            >
              {t('photoCount', { current: safeIndex + 1, total: imageUrls.length })}
            </span>
          </>
        )}
      </div>
      {imageUrls.length > 1 && (
        <ul className="flex gap-3 overflow-x-auto p-1">
          {imageUrls.map((src, imageIndex) => (
            <li key={`${src}-${imageIndex}`} className="w-16 shrink-0 sm:w-20">
              <button
                type="button"
                aria-label={`${title} ${imageIndex + 1}`}
                aria-current={imageIndex === safeIndex ? 'true' : undefined}
                onClick={() => setIndex(imageIndex)}
                className={`aspect-square w-full overflow-hidden rounded-default bg-surface transition-opacity ${
                  imageIndex === safeIndex
                    ? 'ring-2 ring-maaroud-blue ring-offset-2'
                    : 'opacity-65 hover:opacity-100'
                }`}
              >
                <img
                  src={src}
                  alt=""
                  loading="lazy"
                  referrerPolicy="no-referrer"
                  className="h-full w-full object-contain"
                />
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function ArrowIcon({ previous = false }: { previous?: boolean }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      className="rtl:rotate-180"
      aria-hidden="true"
    >
      <path
        d={previous ? 'm14 6-6 6 6 6' : 'm10 6 6 6-6 6'}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PlaceholderIcon() {
  return (
    <svg
      width="48"
      height="48"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1"
      aria-hidden
    >
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <path d="m21 15-5-5L5 21" />
    </svg>
  );
}
