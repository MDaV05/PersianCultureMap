export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, HTTP-Referer, X-Title",
          "Access-Control-Max-Age": "86400"
        }
      });
    }

    // origin validation
    const allowedOrigins = ["https://chekameh.xyz", "http://localhost:8081"];
    const origin = request.headers.get("HTTP-Referer") || "";
    
    if (!allowedOrigins.some(o => origin.startsWith(o))) {
        return new Response(JSON.stringify({ error: "Unauthorized origin" }), {
            status: 403,
            headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
        });
    }

    if (request.method !== "POST") {
      return new Response("Method not allowed", { 
        status: 405, 
        headers: { "Access-Control-Allow-Origin": "*" } 
      });
    }

    try {
      const body = await request.json();
      
      if (!body.model || !body.messages) {
        return new Response(JSON.stringify({ error: "Missing model or messages" }), {
          status: 400,
          headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
        });
      }

      // call openrouter
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${env.OPENROUTER_API_KEY}`,
          "HTTP-Referer": origin || "https://chekameh.xyz",
          "X-Title": request.headers.get("X-Title") || "Ferdows AI"
        },
        body: JSON.stringify({ ...body, stream: true })
      });

      // openrouter errors
      if (!response.ok) {
        const errData = await response.json();
        return new Response(JSON.stringify(errData), {
          status: response.status,
          headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
        });
      }

      // successful response back to the client
      return new Response(response.body, {
        headers: {
          "Content-Type": "text/event-stream",
          "Access-Control-Allow-Origin": "*"
        }
      });

    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), {
        status: 500,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
      });
    }
  }
};