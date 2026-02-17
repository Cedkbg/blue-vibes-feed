const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

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

    let url = `https://gnews.io/api/v4/top-headlines?category=${category || "general"}&lang=fr&country=any&max=20&apikey=${GNEWS_API_KEY}`;

    if (query && query.trim()) {
      url = `https://gnews.io/api/v4/search?q=${encodeURIComponent(query)}&lang=fr&max=20&apikey=${GNEWS_API_KEY}`;
    }

    const response = await fetch(url);
    const data = await response.json();

    return new Response(JSON.stringify(data), {
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
