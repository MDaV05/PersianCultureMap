export default {
  async fetch(request, env) {
    if (request.url.endsWith("/create-subscription")) {

      if (
        request.headers.get("Authorization")
        !== env.WORKER_SECRET
      ) {

        return new Response(
          "Unauthorized",
          { status: 403 }
        );

      }

      const body = await request.json();

      await env.SUBSCRIPTIONS.put(
        body.token,
        JSON.stringify({
          user_id: body.user_id,
          used: 0,
          limit: body.limit,
          expires_at:
            Date.now()
            +
            body.months
            *
            30
            *
            24
            *
            3600
            *
            1000
        })
      );

      return new Response("OK");
    }
    // Handle CORS preflight - INCLUDE X-Plus-Token in allowed headers
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, HTTP-Referer, X-Title, X-Plus-Token",
          "Access-Control-Max-Age": "86400"
        }
      });
    }

    // Origin validation
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

      // ── PAYWALL VALIDATION ──────────────────────────────────────────────
      // Check if this is a paid model (not ending with :free)
      const isPaidModel = !body.model.endsWith(":free");

      if (isPaidModel) {
        const userToken = request.headers.get("X-Plus-Token") || "";

        // Check if token exists
        if (!userToken) {
          return new Response(JSON.stringify({
            error: "فردوس پلاس نیاز به کد فعال‌سازی دارد. لطفاً به @FerdowsBaleBot مراجعه کنید."
          }), {
            status: 403,
            headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
          });
        }

        // Basic token format validation (starts with FP-)
        if (!userToken.startsWith("FP-")) {
          return new Response(JSON.stringify({
            error: "کد فعال‌سازی نامعتبر است"
          }), {
            status: 403,
            headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
          });
        }

        const tokenData = await env.SUBSCRIPTIONS.get(
          userToken,
          { type: "json" }
        );

        if (!tokenData) {
          return new Response(JSON.stringify({
            error: "کد فعال‌سازی نامعتبر است"
          }), {
            status: 403,
            headers: {
              "Content-Type": "application/json",
              "Access-Control-Allow-Origin": "*"
            }
          });
        }

        if (Date.now() > tokenData.expires_at) {
          return new Response(JSON.stringify({
            error: "اشتراک شما منقضی شده است"
          }), {
            status: 403,
            headers: {
              "Content-Type": "application/json",
              "Access-Control-Allow-Origin": "*"
            }
          });
        }

        if (
          tokenData.limit !== -1 &&
          tokenData.used >= tokenData.limit
        ) {
          return new Response(JSON.stringify({
            error: "سهمیه فردوس پلاس شما تمام شده است"
          }), {
            status: 403,
            headers: {
              "Content-Type": "application/json",
              "Access-Control-Allow-Origin": "*"
            }
          });
        }
      }
      // ── END PAYWALL VALIDATION ──────────────────────────────────────────

      // Call OpenRouter
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

      // Handle OpenRouter errors
      if (!response.ok) {
        const errData = await response.json();
        return new Response(JSON.stringify(errData), {
          status: response.status,
          headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
        });
      }

      tokenData.used += 1;

      await env.SUBSCRIPTIONS.put(
        userToken,
        JSON.stringify(tokenData)
      );

      // Stream successful response back to client
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