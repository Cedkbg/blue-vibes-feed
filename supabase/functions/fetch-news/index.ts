import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ALLOWED_CATEGORIES = ["general", "world", "nation", "business", "technology", "entertainment", "sports", "science", "health"];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // Validate JWT - only authenticated users can call this endpoint
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response(
      JSON.stringify({ error: "Unauthorized" }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? "",
    { global: { headers: { Authorization: authHeader } } }
  );

  const token = authHeader.replace("Bearer ", "");
  const { data, error: authError } = await supabase.auth.getClaims(token);
  if (authError || !data?.claims) {
    return new Response(
      JSON.stringify({ error: "Unauthorized" }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const userId = data.claims.sub;

  const GNEWS_API_KEY = Deno.env.get("GNEWS_API_KEY");
  if (!GNEWS_API_KEY) {
    console.error("GNEWS_API_KEY not configured");
    return new Response(
      JSON.stringify({ error: "Server configuration error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const { category, query } = await req.json();

    // Validate and sanitize inputs
    const safeCategory = ALLOWED_CATEGORIES.includes(category) ? category : "general";
    if (query && query.length > 100) {
      return new Response(
        JSON.stringify({ error: "Query too long" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Basic rate limiting: max 20 requests per hour per user
    const windowStart = new Date(Date.now() - 3600000).toISOString();
    const { count } = await supabase
      .from("rate_limits")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("endpoint", "fetch-news")
      .gte("window_start", windowStart);

    if (count && count >= 20) {
      return new Response(
        JSON.stringify({ error: "Rate limit exceeded" }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Record this request
    await supabase.from("rate_limits").insert({
      user_id: userId,
      endpoint: "fetch-news",
      request_count: 1,
      window_start: new Date().toISOString(),
    });

    let url = `https://gnews.io/api/v4/top-headlines?category=${safeCategory}&lang=fr&country=any&max=20&apikey=${GNEWS_API_KEY}`;

    if (query && query.trim()) {
      url = `https://gnews.io/api/v4/search?q=${encodeURIComponent(query.trim())}&lang=fr&max=20&apikey=${GNEWS_API_KEY}`;
    }

    const response = await fetch(url);
    const data_news = await response.json();

    return new Response(JSON.stringify(data_news), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error fetching news:", error);
    return new Response(
      JSON.stringify({ error: "Failed to fetch news" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
