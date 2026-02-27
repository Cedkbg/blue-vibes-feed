import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface ImageCarouselProps {
  images: string[];
  alt?: string;
  className?: string;
}

export const ImageCarousel = ({ images, alt = "Post", className }: ImageCarouselProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (images.length === 0) return null;
  if (images.length === 1) {
    return (
      <img
        src={images[0]}
        alt={alt}
        className={cn("w-full h-auto max-h-[70vh] object-contain", className)}
        loading="lazy"
      />
    );
  }

  const goNext = () => setCurrentIndex((prev) => Math.min(prev + 1, images.length - 1));
  const goPrev = () => setCurrentIndex((prev) => Math.max(prev - 1, 0));

  return (
    <div className="relative w-full overflow-hidden group">
      {/* Images */}
      <div
        className="flex transition-transform duration-300 ease-out"
        style={{ transform: `translateX(-${currentIndex * 100}%)` }}
      >
        {images.map((src, i) => (
          <img
            key={i}
            src={src}
            alt={`${alt} ${i + 1}`}
            className={cn("w-full shrink-0 h-auto max-h-[70vh] object-contain", className)}
            loading="lazy"
          />
        ))}
      </div>

      {/* Navigation arrows */}
      {currentIndex > 0 && (
        <button
          onClick={goPrev}
          className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
      )}
      {currentIndex < images.length - 1 && (
        <button
          onClick={goNext}
          className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      )}

      {/* Dots indicator */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
        {images.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrentIndex(i)}
            className={cn(
              "w-2 h-2 rounded-full transition-all",
              i === currentIndex
                ? "bg-primary w-4"
                : "bg-white/60"
            )}
          />
        ))}
      </div>
    </div>
  );
};
