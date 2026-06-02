import { useCallback, useEffect, useRef, useState } from "react";
import { MdChevronLeft, MdChevronRight } from "react-icons/md";

const Carousel = ({
  items = [],
  renderItem,
  ariaLabel = "carousel",
  itemClassName = "",
}) => {
  const trackRef = useRef(null);
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);

  const updateScrollState = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;

    const { scrollLeft, scrollWidth, clientWidth } = track;
    setCanScrollPrev(scrollLeft > 0);
    setCanScrollNext(scrollLeft + clientWidth < scrollWidth - 2);
  }, []);

  const handleScroll = useCallback(
    (direction) => {
      const track = trackRef.current;
      if (!track) return;

      const scrollAmount = Math.max(240, track.clientWidth * 0.85);
      track.scrollBy({
        left: direction * scrollAmount,
        behavior: "smooth",
      });
    },
    [],
  );

  useEffect(() => {
    updateScrollState();

    const track = trackRef.current;
    if (!track) return;

    const onScroll = () => updateScrollState();
    const onResize = () => updateScrollState();

    track.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);

    return () => {
      track.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
    };
  }, [updateScrollState]);

  if (!items.length) {
    return null;
  }

  return (
    <div className="relative">
      <div
        ref={trackRef}
        className="flex gap-4 overflow-x-auto scroll-smooth pb-4 pt-1 snap-x snap-mandatory"
        aria-label={ariaLabel}
      >
        {items.map((item, index) => (
          <div
            key={item?._id || item?.id || `carousel-item-${index}`}
            className={`snap-start ${itemClassName}`}
          >
            {renderItem(item, index)}
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={() => handleScroll(-1)}
        disabled={!canScrollPrev}
        aria-label="Scroll left"
        className="absolute left-0 top-1/2 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-gray-200 bg-white/90 text-gray-700 shadow-sm transition hover:scale-105 disabled:cursor-not-allowed disabled:opacity-50 md:flex"
      >
        <MdChevronLeft className="h-6 w-6" />
      </button>

      <button
        type="button"
        onClick={() => handleScroll(1)}
        disabled={!canScrollNext}
        aria-label="Scroll right"
        className="absolute right-0 top-1/2 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-gray-200 bg-white/90 text-gray-700 shadow-sm transition hover:scale-105 disabled:cursor-not-allowed disabled:opacity-50 md:flex"
      >
        <MdChevronRight className="h-6 w-6" />
      </button>
    </div>
  );
};

export default Carousel;
