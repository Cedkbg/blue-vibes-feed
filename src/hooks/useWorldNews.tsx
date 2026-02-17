import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

interface NewsArticle {
  id: string;
  title: string;
  description: string;
  url: string;
  image: string | null;
  publishedAt: string;
  source: {
    name: string;
    url: string;
  };
  category: string;
}

const categories = ["general", "world", "nation", "business", "technology", "entertainment", "sports", "science", "health"];

// Auto-refresh interval in milliseconds (30 seconds)
const AUTO_REFRESH_INTERVAL = 30000;

export const useWorldNews = () => {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("general");
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchNews = useCallback(async (category: string, query?: string, silent = false) => {
    if (!silent) setLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke("fetch-news", {
        body: { category, query: query?.trim() || undefined },
      });

      if (fnError) throw fnError;

      if (data?.articles) {
        const formattedArticles: NewsArticle[] = data.articles.map((article: any, index: number) => ({
          id: `${Date.now()}-${index}`,
          title: article.title,
          description: article.description,
          url: article.url,
          image: article.image,
          publishedAt: article.publishedAt,
          source: article.source,
          category: category,
        }));
        setArticles(formattedArticles);
        setLastUpdate(new Date());
      }
    } catch (err) {
      console.error("Error fetching news:", err);
      if (!silent) {
        setError("Impossible de charger les actualités. Veuillez réessayer plus tard.");
      }
      // Fallback to mock data only on initial load
      if (!silent) {
        setArticles(getMockArticles(category));
      }
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  // Initial load and category change
  useEffect(() => {
    fetchNews(activeCategory, searchQuery);
  }, [activeCategory, fetchNews]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      fetchNews(activeCategory, searchQuery, true); // Silent refresh
    }, AUTO_REFRESH_INTERVAL);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [activeCategory, searchQuery, fetchNews]);

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    if (query.trim()) {
      fetchNews(activeCategory, query);
    } else {
      fetchNews(activeCategory);
    }
  }, [activeCategory, fetchNews]);

  const handleCategoryChange = useCallback((category: string) => {
    setActiveCategory(category);
    setSearchQuery("");
  }, []);

  return {
    articles,
    loading,
    error,
    searchQuery,
    activeCategory,
    categories,
    lastUpdate,
    handleSearch,
    handleCategoryChange,
    refetch: () => fetchNews(activeCategory, searchQuery),
  };
};

// Mock data for fallback
const getMockArticles = (category: string): NewsArticle[] => {
  const mockData: Record<string, NewsArticle[]> = {
    sports: [
      {
        id: "1",
        title: "PSG remporte la Ligue 1 avec une victoire écrasante",
        description: "Le Paris Saint-Germain a célébré son titre de champion avec une victoire 4-0.",
        url: "#",
        image: "https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=800",
        publishedAt: new Date().toISOString(),
        source: { name: "L'Équipe", url: "#" },
        category: "sports",
      },
      {
        id: "2",
        title: "Roland Garros 2025 : les favoris de cette année",
        description: "Analyse des principaux prétendants au titre cette année.",
        url: "#",
        image: "https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=800",
        publishedAt: new Date().toISOString(),
        source: { name: "Tennis Magazine", url: "#" },
        category: "sports",
      },
    ],
    general: [
      {
        id: "3",
        title: "Sommet mondial sur le climat : décisions majeures attendues",
        description: "Les dirigeants mondiaux se réunissent pour discuter des mesures climatiques.",
        url: "#",
        image: "https://images.unsplash.com/photo-1569163139599-0f4517e36f51?w=800",
        publishedAt: new Date().toISOString(),
        source: { name: "Le Monde", url: "#" },
        category: "general",
      },
      {
        id: "4",
        title: "Innovations technologiques : ce qui nous attend en 2026",
        description: "Les principales tendances tech à surveiller cette année.",
        url: "#",
        image: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=800",
        publishedAt: new Date().toISOString(),
        source: { name: "Tech News", url: "#" },
        category: "general",
      },
    ],
  };

  return mockData[category] || mockData.general;
};
