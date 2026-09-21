"use client";

import { useRef, useState } from "react";
import { indexAfterSwipe } from "@/lib/gallery-swipe";

/** Detail photos. Thumbnails and a horizontal swipe change the main image. */
export function ProductGallery({
  imageUrls,
  title,
}: {
  imageUrls: string[];
  title: string;
}) {
  const [index, setIndex] = useState(0);
  const startX = useRef<number | null>(null);
  const safeIndex = imageUrls.length === 0 ? 0 : Math.min(index, imageUrls.length - 1);
  const current = imageUrls[safeIndex];

  if (!current) {
    return (
      <div className="flex aspect-square w-full items-center justify-center bg-stone-grey text-nike-grey">
        <PlaceholderIcon />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div
        className="aspect-square w-full overflow-hidden bg-stone-grey"
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
              deltaX,
            ),
          );
        }}
      >
        <img
          src={current}
          alt={title}
          referrerPolicy="no-referrer"
          className="h-full w-full object-contain"
        />
      </div>
      {imageUrls.length > 1 && (
        <ul className="grid grid-cols-4 gap-2">
          {imageUrls.map((src, imageIndex) => (
            <li key={`${src}-${imageIndex}`}>
              <button
                type="button"
                aria-label={`${title} ${imageIndex + 1}`}
                aria-current={imageIndex === safeIndex ? "true" : undefined}
                onClick={() => setIndex(imageIndex)}
                className={`aspect-square w-full overflow-hidden bg-stone-grey ${
                  imageIndex === safeIndex ? "ring-2 ring-ink-black ring-offset-2" : ""
                }`}
              >
                <img
                  src={src}
                  alt=""
                  referrerPolicy="no-referrer"
                  className="h-full w-full object-contain"
                />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function PlaceholderIcon() {
  return (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" aria-hidden>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <path d="m21 15-5-5L5 21" />
    </svg>
  );
}
