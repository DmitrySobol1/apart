import { useState } from "react";
import type { RoomPhoto } from "../types";

interface PhotoGalleryProps {
  photos: RoomPhoto[];
}

export default function PhotoGallery({ photos }: PhotoGalleryProps) {
  const sorted = [...photos].sort((a, b) => a.order - b.order);
  const [index, setIndex] = useState(0);

  if (sorted.length === 0) {
    return (
      <div className="w-64 h-48 bg-gray-200 flex items-center justify-center rounded-lg shrink-0">
        <span className="text-gray-400 text-sm">No photos</span>
      </div>
    );
  }

  const prev = () => setIndex((i) => (i - 1 + sorted.length) % sorted.length);
  const next = () => setIndex((i) => (i + 1) % sorted.length);

  return (
    <div className="relative w-64 h-48 shrink-0 rounded-lg overflow-hidden group">
      <img src={sorted[index].url} alt="" className="w-full h-full object-cover" />
      {sorted.length > 1 && (
        <>
          <button
            type="button"
            onClick={prev}
            className="absolute left-1 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white rounded-full w-7 h-7 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
          >
            &#8249;
          </button>
          <button
            type="button"
            onClick={next}
            className="absolute right-1 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white rounded-full w-7 h-7 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
          >
            &#8250;
          </button>
          <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-1">
            {sorted.map((_, i) => (
              <span
                key={i}
                className={`block w-1.5 h-1.5 rounded-full ${i === index ? "bg-white" : "bg-white/50"}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
