export default {
  async fetch(request, env) {
    // Only allow POST requests
    if (request.method !== "POST") {
      return new Response("Method not allowed", { status: 405 });
    }

    const body = await request.json();

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${env.OPENROUTER_API_KEY}`,
    "HTTP-Referer": request.headers.get("HTTP-Referer") || "https://chekameh.xyz",
    "X-Title": request.headers.get("X-Title") || "Ferdows AI"
  },
  body: JSON.stringify(body)
});

    const data = await response.json();

    return new Response(JSON.stringify(data), {
      headers: { 
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*" // Allows your website to talk to this worker
      }
    });
  }
};