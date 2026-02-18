import { useEffect, useRef, useCallback } from "react";

export const useInfiniteScroll = (
  onLoadMore: () => void,
  hasMore: boolean,
  isLoading: boolean
) => {
  const observerRef = useRef<IntersectionObserver | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const setSentinelRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (observerRef.current) observerRef.current.disconnect();
      if (!node || !hasMore || isLoading) return;

      observerRef.current = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting && hasMore && !isLoading) {
            onLoadMore();
          }
        },
        { threshold: 0.1 }
      );
      observerRef.current.observe(node);
      sentinelRef.current = node;
    },
    [onLoadMore, hasMore, isLoading]
  );

  useEffect(() => {
    return () => {
      if (observerRef.current) observerRef.current.disconnect();
    };
  }, []);

  return { setSentinelRef };
};
