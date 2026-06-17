export default {
  async fetch(request, env) {
    // ── 1. BALE BOT WEBHOOK: Create Subscription ──
    if (request.url.endsWith("/create-subscription")) {
      if (request.headers.get("Authorization") !== env.WORKER_SECRET) {
        return new Response("Unauthorized", { status: 403 });
      }

      const body = await request.json();
      
      // Standardized schema matching validateToken.js
      const subscriptionData = {
        user_id: body.user_id,
        active: true,
        messages_used: 0,
        message_limit: body.limit || 100,
        expires_at: Date.now() + ((body.months || 1) * 30 * 24 * 3600 * 1000),
        created_at: Date.now()
      };

      // Store as object (KV handles JSON serialization automatically)
      await env.SUBSCRIPTIONS.put(
        body.token,
        JSON.stringify(subscriptionData)
      
      );

      return new Response(JSON.stringify({ success: true, token: body.token }), {
        headers: { "Content-Type": "application/json" }
      });
    }

    // ── 2. CORS & Origin Validation ──
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

    const allowedOrigins = ["https://chekameh.xyz", "http://localhost:8081"];
    const origin = request.headers.get("HTTP-Referer") || "";
    if (!allowedOrigins.some(o => origin.startsWith(o))) {
      return new Response(JSON.stringify({ error: "Unauthorized origin" }), {
        status: 403,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
      });
    }

    if (request.method !== "POST") {
      return new Response("Method not allowed", { status: 405, headers: { "Access-Control-Allow-Origin": "*" } });
    }

    try {
      const body = await request.json();
      if (!body.model || !body.messages) {
        return new Response(JSON.stringify({ error: "Missing model or messages" }), {
          status: 400,
          headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
        });
      }

      const isPaidModel = !body.model.endsWith(":free");
      const userIP = request.headers.get("CF-Connecting-IP") || "unknown"; // Cloudflare's real IP header

      // ── 3. FREE TIER RATE LIMITING (4 requests/day) ──
      if (!isPaidModel) {
        const freeLimitKey = `free_limit:${userIP}`;
        const today = new Date();
        const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1).getTime();
        
        let limitData = await env.SUBSCRIPTIONS.get(freeLimitKey, { type: "json" });
        
        // Reset counter if it's a new day
        if (!limitData || limitData.reset_at < Date.now()) {
          limitData = { count: 0, reset_at: endOfDay };
        }
        
        // Enforce 4 requests/day limit
        if (limitData.count >= 4) {
          return new Response(JSON.stringify({ 
            error: "سقف استفاده روزانه رایگان (۴ پیام) تمام شده است. برای ادامه، فردوس پلاس را فعال کنید." 
          }), {
            status: 429, // 429 Too Many Requests
            headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
          });
        }
        
        // Increment count and set KV to auto-delete at end of day + 1 hour
        limitData.count += 1;
        const ttlSeconds = Math.ceil((endOfDay - Date.now()) / 1000) + 3600;
        await env.SUBSCRIPTIONS.put(freeLimitKey, JSON.stringify(limitData), { expirationTtl: ttlSeconds });
      }

      // ── 4. PAID TIER VALIDATION ──
      let tokenData = null;
      if (isPaidModel) {
        const userToken = request.headers.get("X-Plus-Token") || "";
        if (!userToken || !userToken.startsWith("FP-")) {
          return new Response(JSON.stringify({ error: "فردوس پلاس نیاز به کد فعال‌سازی دارد." }), {
            status: 403,
            headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
          });
        }

        tokenData = await env.SUBSCRIPTIONS.get(userToken, { type: "json" });
        if (!tokenData) {
          return new Response(JSON.stringify({ error: "کد فعال‌سازی یافت نشد." }), { status: 403, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } });
        }
        if (!tokenData.active) {
          return new Response(JSON.stringify({ error: "اشتراک غیرفعال است." }), { status: 403, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } });
        }
        if (Date.now() > tokenData.expires_at) {
          return new Response(JSON.stringify({ error: "اشتراک شما منقضی شده است." }), { status: 403, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } });
        }
        if (tokenData.message_limit !== -1 && tokenData.messages_used >= tokenData.message_limit) {
          return new Response(JSON.stringify({ error: "سهمیه پیام‌های فردوس پلاس شما تمام شده است." }), { status: 403, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } });
        }
      }

      // ── 5. CALL OPENROUTER ──
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

      if (!response.ok) {
        const errData = await response.json();
        return new Response(JSON.stringify(errData), {
          status: response.status,
          headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
        });
      }

      // ── 6. UPDATE PAID USAGE (Only if paid and successful) ──
      if (isPaidModel && tokenData) {
        tokenData.messages_used += 1;
        await env.SUBSCRIPTIONS.put(request.headers.get("X-Plus-Token"), JSON.stringify(tokenData));
      }

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