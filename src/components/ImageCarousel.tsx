import { useState, useRef, TouchEvent } from "react";
import { cn } from "@/lib/utils";
import { Image } from "lucide-react";

interface ImageCarouselProps {
  images: string[];
  alt?: string;
  className?: string;
}

export const ImageCarousel = ({ images, alt = "Post", className }: ImageCarouselProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

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

  const handleTouchStart = (e: TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    const diff = touchStartX.current - touchEndX.current;
    const threshold = 50;
    if (diff > threshold && currentIndex < images.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else if (diff < -threshold && currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  return (
    <div
      className="relative w-full overflow-hidden"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Photo count badge */}
      <div className="absolute top-3 right-3 z-10 bg-black/60 backdrop-blur-sm text-white text-xs font-medium px-2.5 py-1 rounded-full flex items-center gap-1">
        <Image className="w-3 h-3" />
        {currentIndex + 1}/{images.length}
      </div>

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

      {/* Dots indicator */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
        {images.map((_, i) => (
          <span
            key={i}
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
