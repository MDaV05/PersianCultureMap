// ── ganjoor & helpers ─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────

let ganjoorCache = null;
let cacheTime = 0;
const CACHE_DURATION = 3600000; // 1 hour

async function getGanjoorContext(question) {
  const now = Date.now();
  if (ganjoorCache && (now - cacheTime) < CACHE_DURATION) {
    return filterPoets(ganjoorCache, question);
  }
  try {
    const res = await fetch("https://api.ganjoor.net/api/ganjoor/poets");
    if (!res.ok) return "";
    ganjoorCache = await res.json();
    cacheTime = now;
    return filterPoets(ganjoorCache, question);
  } catch {
    return "";
  }
}

function filterPoets(poets, question) {
  const mentioned = poets.filter(p =>
    question.includes(p.name) ||
    question.toLowerCase().includes((p.nickName || "").toLowerCase())
  ).slice(0, 3);

  if (mentioned.length > 0) {
    return "شاعران مرتبط:\n" + mentioned.map(p =>
      `- ${p.name}${p.birthYearInLHCalendar ? " (تولد: " + p.birthYearInLHCalendar + ")" : ""}${p.deathYearInLHCalendar ? " (وفات: " + p.deathYearInLHCalendar + ")" : ""}`
    ).join("\n");
  }
  return "شاعران گنجور: " + poets.slice(0, 12).map(p => p.name).join("، ");
}

// ── models ──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────

const MODELS = {
  free: {
    id: "openai/gpt-oss-120b:free",
    name: "فردوس",
    nameEn: "Ferdows",
    badge: "رایگان",
    color: "#C9A84C"
  },
  plus: {
    id: "deepseek/deepseek-v4-flash",
    name: "فردوس پلاس",
    nameEn: "Ferdows Plus",
    badge: "پلاس",
    color: "#9B8FFF"
  }
};

let currentTier = "free";
let chatOpen = false;

// ── UI builder ──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────

function buildChatbot() {
  const wrapper = document.createElement("div");
  wrapper.id = "ferdows-wrapper";
  wrapper.innerHTML = `
      <div id="ferdows-card" onclick="toggleChat()">
        <div class="d-none d-lg-flex align-items-center text-center" id="ferdows-avatar">✦</div>
        <div id="ferdows-card-text">
          <div  id="ferdows-card-name">فردوس <span id="ferdows-card-badge">AI</span></div>
          <div class="d-none d-lg-inline" id="ferdows-card-sub">از شعر پارسی بپرس</div>
        </div>
        <button id="ferdows-close-card" onclick="dismissCard(event)">✕</button>
    </div>
    <div id="ferdows-fab" onclick="toggleChat()" style="display:none;">✦</div>
    <div id="ferdows-chat">
      <div id="ferdows-chat-header">
        <div id="ferdows-chat-avatar-small">✦</div>
        <div id="ferdows-chat-header-text">
          <div id="ferdows-chat-name">فردوس <span id="ferdows-chat-badge-header">رایگان</span></div>
          <div id="ferdows-chat-subtitle">دستیار شعر پارسی</div>
        </div>
        <button id="ferdows-chat-close" onclick="toggleChat()">✕</button>
      </div>
      <div id="ferdows-tier-row">
        <button class="ftier-btn active" id="ftier-free" onclick="switchTier('free')"><span>✦</span> فردوس</button>
        <button class="ftier-btn" id="ftier-plus" onclick="switchTier('plus')"><span>◈</span> فردوس پلاس</button>
      </div>
      <div id="ferdows-messages">
        <div class="fm bot">
          <div class="fm-bubble">
            سلام! من <strong>فردوس</strong> هستم 🌹<br>
            دستیار هوش مصنوعی شعر پارسی.<br><br>
            <span style="opacity:0.5;font-size:11px;" dir="ltr">Ask me anything about Persian poetry!</span>
          </div>
        </div>
      </div>
      <div id="ferdows-input-row">
        <input id="ferdows-input" type="text" placeholder="سوال بپرس..." dir="rtl" autocomplete="off"/>
        <button id="ferdows-send">↑</button>
      </div>
    </div>
  `;
  document.body.appendChild(wrapper);

  document.getElementById("ferdows-send").addEventListener("click", sendMessage);
  document.getElementById("ferdows-input").addEventListener("keydown", e => {
    if (e.key === "Enter") sendMessage();
  });
}

function toggleChat() {
  chatOpen = !chatOpen;
  const chat = document.getElementById("ferdows-chat");
  const card = document.getElementById("ferdows-card");
  const fab = document.getElementById("ferdows-fab");

  if (chatOpen) {
    chat.classList.add("open");
    card.style.display = "none";
    fab.style.display = "none";
    setTimeout(() => document.getElementById("ferdows-input").focus(), 400);
  } else {
    chat.classList.remove("open");
    const cardDismissed = fab.dataset.dismissed === "true";
    if (cardDismissed) fab.style.display = "flex";
    else card.style.display = "flex";
  }
}

function dismissCard(e) {
  e.stopPropagation();
  document.getElementById("ferdows-card").style.display = "none";
  const fab = document.getElementById("ferdows-fab");
  fab.style.display = "flex";
  fab.dataset.dismissed = "true";
}

window.toggleChat = toggleChat;
window.dismissCard = dismissCard;
window.switchTier = switchTier;

function switchTier(tier) {
  if (currentTier === tier) return;
  if (tier === "plus") {
    const hasPlusAccess = localStorage.getItem("ferdows_plus_token");

    if (!hasPlusAccess) {
      showActivationModal();
      return;
    }

    if (!hasPlusAccess.startsWith("FP-")) {
      localStorage.removeItem("ferdows_plus_token");
      showActivationModal("کد فعال‌سازی نامعتبر است");
      return;
    }
  }

  currentTier = tier;
  const model = MODELS[tier];

  document.getElementById("ftier-free").classList.toggle("active", tier === "free");
  document.getElementById("ftier-plus").classList.toggle("active", tier === "plus");

  const badge = document.getElementById("ferdows-chat-badge-header");
  badge.textContent = model.badge;
  badge.style.color = model.color;
  badge.style.borderColor = model.color + "55";
  badge.style.background = model.color + "18";

  document.getElementById("ferdows-chat-name").childNodes[0].textContent = model.name + " ";
  document.getElementById("ferdows-input").placeholder =
    tier === "plus" ? "از فردوس پلاس بپرس..." : "سوال بپرس...";

  addSystemMsg(
    tier === "plus"
      ? "◈ فردوس پلاس فعال شد"
      : "✦ فردوس فعال شد"
  );
}

// ── Activation Modal ──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
function showActivationModal(message = "") {
  document.getElementById('ferdows-activation-modal')?.remove(); 

  const modalHTML = `
    <div id="ferdows-activation-modal" style="
      position: fixed;
      inset: 0;
      background: rgba(26, 42, 42, 0.8);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
      backdrop-filter: blur(8px);
    ">
      <div style="
        background: linear-gradient(135deg, #F9F6F0, #EBE4D8);
        border: 3px solid #009688;
        border-radius: 24px;
        padding: 40px;
        max-width: 420px;
        width: 90%;
        box-shadow: 0 32px 80px rgba(0, 150, 136, 0.4);
        text-align: center;
      ">
        <div style="
          width: 80px;
          height: 80px;
          background: linear-gradient(135deg, #009688, #00695C);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 24px;
          font-size: 40px;
          box-shadow: 0 8px 24px rgba(0, 150, 136, 0.4);
        ">🔒</div>
        
        <h3 style="
          font-family: 'Lalezar', cursive;
          color: #00695C;
          font-size: 28px;
          margin-bottom: 16px;
          text-shadow: 2px 2px 4px rgba(0,0,0,0.1);
        ">فردوس پلاس</h3>
        
        <p style="
          color: #6B8585;
          font-size: 15px;
          line-height: 2;
          margin-bottom: 24px;
          font-family: 'Vazirmatn', sans-serif;
        ">
          برای دسترسی به مدل پیشرفته‌تر، لطفاً کد فعال‌سازی را از ربات بله دریافت کنید
        </p>
        
        ${message ? `<p style="color: #d32f2f; font-size: 14px; margin-bottom: 20px; font-weight: 600;">${message}</p>` : ''}
        
        <div style="
          background: rgba(0, 150, 136, 0.1);
          border: 2px solid #009688;
          border-radius: 16px;
          padding: 20px;
          margin-bottom: 24px;
        ">
          <p style="color: #00695C; font-size: 13px; margin-bottom: 12px; font-weight: 700;">📱 ربات بله:</p>
          <a href="https://web.bale.ai/@FerdowsBaleBot?start=pay" target="_blank" style="
            color: white;
            text-decoration: none;
            font-size: 18px;
            font-weight: 700;
            display: block;
            padding: 12px;
            background: linear-gradient(135deg, #009688, #00695C);
            border-radius: 12px;
            transition: all 0.3s;
            box-shadow: 0 4px 12px rgba(0, 150, 136, 0.3);
            font-family: 'Vazirmatn', sans-serif;
          ">@FerdowsBaleBot</a>
        </div>
        
        <div style="
          display: flex;
          flex-direction: column;
          gap: 12px;
        ">
          <input type="text" id="plus-activation-code" placeholder="کد فعال‌سازی را وارد کنید" dir="ltr" style="
            width: 100%;
            padding: 14px;
            border: 2px solid #EBE4D8;
            border-radius: 12px;
            background: white;
            color: #1A2A2A;
            font-family: 'Vazirmatn', sans-serif;
            font-size: 15px;
            text-align: center;
            outline: none;
            transition: all 0.2s;
          " />
          
          <button onclick="activatePlus()" style="
            padding: 14px;
            background: linear-gradient(135deg, #009688, #00695C);
            border: none;
            border-radius: 12px;
            color: white;
            font-family: 'Lalezar', cursive;
            font-size: 16px;
            cursor: pointer;
            transition: all 0.3s;
            box-shadow: 0 4px 16px rgba(0, 150, 136, 0.3);
          ">فعال‌سازی فردوس پلاس</button>
          
          <button onclick="document.getElementById('ferdows-activation-modal').remove()" style="
            padding: 12px;
            background: transparent;
            border: 2px solid rgba(0, 150, 136, 0.3);
            border-radius: 12px;
            color: #6B8585;
            font-family: 'Vazirmatn', sans-serif;
            font-size: 14px;
            cursor: pointer;
            transition: all 0.2s;
            font-weight: 500;
          ">بعداً</button>
        </div>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML('beforeend', modalHTML);
}

window.activatePlus = function () {
  const code = document.getElementById('plus-activation-code').value.trim();

  if (!code) {
    showActivationModal("لطفاً کد فعال‌سازی را وارد کنید");
    return;
  }

  if (code.startsWith("FP-")) {
    localStorage.setItem("ferdows_plus_token", code);
    document.getElementById('ferdows-activation-modal').remove();
    switchTier('plus');
  } else {
    showActivationModal("کد فعال‌سازی باید با FP- شروع شود");
  }
};

// ── send message ──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
async function sendMessage() {
  const input = document.getElementById("ferdows-input");
  const question = input.value.trim();
  if (!question) return;

  input.value = "";
  input.disabled = true;
  document.getElementById("ferdows-send").disabled = true;

  addMsg(question, "user");
  const typingId = addTyping();
  const model = MODELS[currentTier];

  try {
    const context = await getGanjoorContext(question);
    const body = {
      model: model.id,
      max_tokens: currentTier === "plus" ? 1200 : 800,
      messages: [
        {
          role: "system",
          content: `تو «${model.name}» هستی، دستیار هوش مصنوعی شعر پارسی.
${context ? "اطلاعات گنجور:\n" + context : ""}
دستورالعمل‌ها:
- اگر سوال فارسی است به فارسی پاسخ بده، اگر انگلیسی است به انگلیسی
- پاسخ کوتاه، دقیق، و زیبا
- برای اشعار، متن دقیق و منبع ذکر کن
${currentTier === "plus" ? "- تحلیل عمیق ادبی و تاریخی ارائه بده" : ""}`
        },
        { role: "user", content: question }
      ]
    };
    if (currentTier === "plus") body.reasoning = { effort: "none" };

    const res = await fetch("https://persianculturemap.modavari005.workers.dev/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "HTTP-Referer": window.location.href,
        "X-Title": "Ferdows - Persian Poetry Map",
        "X-Plus-Token": currentTier === "plus" ? (localStorage.getItem("ferdows_plus_token") || "") : ""
      },
      body: JSON.stringify(body)
    });

    // ── ERROR HANDLING ──
    if (!res.ok) {
      removeTyping(typingId);
      let errorMessage = `HTTP ${res.status}`;
      try {
        const err = await res.json();
        // The proxy returns { error: "string" }
        errorMessage = err.error || err.error?.message || errorMessage;
      } catch (e) {}

      // 1. Handle Free Tier Daily Limit (429)
      if (res.status === 429 && currentTier === "free") {
        addSystemMsg(`⚠️ ${errorMessage}`);
        return; // Exit gracefully, the finally block will re-enable the input
      }

      // 2. Handle Invalid/Expired Paid Token (403)
      if (res.status === 403 && currentTier === "plus") {
        localStorage.removeItem("ferdows_plus_token");
        addSystemMsg("⚠️ اشتراک شما نامعتبر یا منقضی شده است. به حالت رایگان برگشتید.");
        
        currentTier = "free";
        document.getElementById("ftier-free").classList.add("active");
        document.getElementById("ftier-plus").classList.remove("active");
        
        const freeModel = MODELS.free;
        const badge = document.getElementById("ferdows-chat-badge-header");
        badge.textContent = freeModel.badge;
        badge.style.color = freeModel.color;
        badge.style.borderColor = freeModel.color + "55";
        badge.style.background = freeModel.color + "18";
        document.getElementById("ferdows-chat-name").childNodes[0].textContent = freeModel.name + " ";
        document.getElementById("ferdows-input").placeholder = "سوال بپرس...";
        return;
      }

      // 3. Handle other generic errors
      addMsg(`خطا: ${errorMessage}`, "bot");
      return;
    }

    // --- STREAMING HANDLER ---
    const msgDiv = addMsg("", "bot");
    const bubble = msgDiv.querySelector(".fm-bubble");
    removeTyping(typingId);

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let fullAnswer = "";
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        if (line.startsWith("data: ")) {
          const data = line.slice(6).trim();
          if (data === "[DONE]") continue;
          try {
            const parsed = JSON.parse(data);
            const content = parsed.choices?.[0]?.delta?.content || "";
            fullAnswer += content;
            
            if (window.marked) {
              const rawHtml = marked.parse(fullAnswer);
              bubble.innerHTML = window.DOMPurify ? DOMPurify.sanitize(rawHtml) : rawHtml;
            } else {
              bubble.textContent = fullAnswer;
            }
            
            document.getElementById("ferdows-messages").scrollTop = document.getElementById("ferdows-messages").scrollHeight;
          } catch (e) { /* Ignore parse errors */ }
        }
      }
    }

  } catch (err) {
    removeTyping(typingId);
    // Only show error if it's a complete network failure (fetch failed before getting a response)
    addMsg(`خطا: اتصال برقرار نشد. لطفاً اینترنت خود را بررسی کنید.`, "bot");
    console.error(err);
  } finally {
    input.disabled = false;
    document.getElementById("ferdows-send").disabled = false;
    input.focus();
  }
}

// ── helpers ─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
function addMsg(text, role) {
  const msgs = document.getElementById("ferdows-messages");
  const div = document.createElement("div");
  div.className = `fm ${role}`;
  const bubble = document.createElement("div");
  bubble.className = "fm-bubble";
  bubble.textContent = text;
  div.appendChild(bubble);
  msgs.appendChild(div);
  msgs.scrollTop = msgs.scrollHeight;
  return div;
}

function addSystemMsg(text) {
  const msgs = document.getElementById("ferdows-messages");
  const div = document.createElement("div");
  div.className = "fm-system";
  div.textContent = text;
  msgs.appendChild(div);
  msgs.scrollTop = msgs.scrollHeight;
}

function addTyping() {
  const msgs = document.getElementById("ferdows-messages");
  const id = "ftyping-" + Date.now();
  const div = document.createElement("div");
  div.className = "fm bot";
  div.id = id;
  div.innerHTML = `<div class="fm-bubble fm-typing"><span></span><span></span><span></span></div>`;
  msgs.appendChild(div);
  msgs.scrollTop = msgs.scrollHeight;
  return id;
}

function removeTyping(id) {
  document.getElementById(id)?.remove();
}

document.addEventListener("DOMContentLoaded", buildChatbot);