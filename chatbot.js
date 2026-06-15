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
    id: "qwen/qwen3-coder:free",
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
      <div id="ferdows-avatar">✦</div>
      <div id="ferdows-card-text">
        <div id="ferdows-card-name">فردوس <span id="ferdows-card-badge">AI</span></div>
        <div id="ferdows-card-sub">از شعر پارسی بپرس</div>
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
  // Check if trying to access Plus tier
  if (tier === "plus") {
    const hasPlusAccess = localStorage.getItem("ferdows_plus_token");
    
    if (!hasPlusAccess) {
      // Show activation modal
      showActivationModal();
      // Don't switch tier
      return;
    }
    
    // Validate token format (basic check)
    if (!hasPlusAccess.startsWith("FP-")) {
      localStorage.removeItem("ferdows_plus_token");
      showActivationModal("کد فعال‌سازی نامعتبر است");
      return;
    }
  }
  
  // If we get here, proceed with tier switch
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

// Add this new function to show the activation modal
function showActivationModal(message = "") {
  const modalHTML = `
    <div id="ferdows-activation-modal" style="
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.7);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
      backdrop-filter: blur(4px);
    ">
      <div style="
        background: linear-gradient(135deg, #1a1a1a, #2d2d2d);
        border: 2px solid #C9A84C;
        border-radius: 20px;
        padding: 32px;
        max-width: 400px;
        width: 90%;
        box-shadow: 0 20px 60px rgba(201,168,76,0.3);
        text-align: center;
      ">
        <div style="
          width: 64px;
          height: 64px;
          background: linear-gradient(135deg, #C9A84C, #8B6914);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 20px;
          font-size: 32px;
          box-shadow: 0 0 20px rgba(201,168,76,0.5);
        ">🔒</div>
        
        <h3 style="
          color: #C9A84C;
          font-size: 22px;
          margin-bottom: 12px;
          font-weight: 700;
        ">فردوس پلاس</h3>
        
        <p style="
          color: #b0b0b0;
          font-size: 14px;
          line-height: 1.8;
          margin-bottom: 20px;
        ">
          برای دسترسی به مدل پیشرفته‌تر، لطفاً کد فعال‌سازی را از ربات بله دریافت کنید
        </p>
        
        ${message ? `<p style="color: #ff6b6b; font-size: 13px; margin-bottom: 16px;">${message}</p>` : ''}
        
        <div style="
          background: rgba(201,168,76,0.1);
          border: 1px solid rgba(201,168,76,0.3);
          border-radius: 12px;
          padding: 16px;
          margin-bottom: 20px;
        ">
          <p style="color: #C9A84C; font-size: 12px; margin-bottom: 8px;">📱 ربات بله:</p>
          <a href="https://web.bale.ai/@FerdowsBaleBot" target="_blank" style="
            color: #fff;
            text-decoration: none;
            font-size: 16px;
            font-weight: 600;
            display: block;
            padding: 8px;
            background: rgba(255,255,255,0.1);
            border-radius: 8px;
            transition: all 0.2s;
          ">@FerdowsBaleBot</a>
        </div>
        
        <div style="
          display: flex;
          flex-direction: column;
          gap: 10px;
        ">
          <input type="text" id="plus-activation-code" placeholder="کد فعال‌سازی را وارد کنید" dir="ltr" style="
            width: 100%;
            padding: 12px;
            border: 1px solid rgba(201,168,76,0.3);
            border-radius: 8px;
            background: rgba(255,255,255,0.05);
            color: #fff;
            font-family: 'Vazirmatn', sans-serif;
            font-size: 14px;
            text-align: center;
            outline: none;
          " />
          
          <button onclick="activatePlus()" style="
            padding: 12px;
            background: linear-gradient(135deg, #C9A84C, #8B6914);
            border: none;
            border-radius: 8px;
            color: #0f0d08;
            font-family: 'Vazirmatn', sans-serif;
            font-size: 14px;
            font-weight: 700;
            cursor: pointer;
            transition: all 0.2s;
          ">فعال‌سازی فردوس پلاس</button>
          
          <button onclick="document.getElementById('ferdows-activation-modal').remove()" style="
            padding: 10px;
            background: transparent;
            border: 1px solid rgba(255,255,255,0.2);
            border-radius: 8px;
            color: #888;
            font-family: 'Vazirmatn', sans-serif;
            font-size: 13px;
            cursor: pointer;
          ">بعداً</button>
        </div>
      </div>
    </div>
  `;
  
  document.body.insertAdjacentHTML('beforeend', modalHTML);
}

// Add this function to handle activation
window.activatePlus = function() {
  const code = document.getElementById('plus-activation-code').value.trim();
  
  if (!code) {
    showActivationModal("لطفاً کد فعال‌سازی را وارد کنید");
    return;
  }
  
  // For now, we'll just store it - validation will happen in the Worker
  if (code.startsWith("FP-")) {
    localStorage.setItem("ferdows_plus_token", code);
    document.getElementById('ferdows-activation-modal').remove();
    
    // Switch to plus tier
    switchTier('plus');
    
    addSystemMsg("✅ کد فعال‌سازی ذخیره شد. در حال بررسی...");
    
    // Here you would normally validate with the server
    // We'll implement this in the next step
  } else {
    showActivationModal("کد فعال‌سازی باید با FP- شروع شود");
  }
};

// ── send message  ──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
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

    if (!res.ok) {
      removeTyping(typingId);
      const err = await res.json();
      throw new Error(err.error?.message || `HTTP ${res.status}`);
    }

    // --- STREAMING HANDLER ---
    const msgDiv = addMsg("", "bot"); // Create empty message
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
      buffer = lines.pop() || ""; // Keep incomplete line in buffer

      for (const line of lines) {
        if (line.startsWith("data: ")) {
          const data = line.slice(6).trim();
          if (data === "[DONE]") continue;
          try {
            const parsed = JSON.parse(data);
            const content = parsed.choices?.[0]?.delta?.content || "";
            fullAnswer += content;
            bubble.textContent = fullAnswer;
            document.getElementById("ferdows-messages").scrollTop = document.getElementById("ferdows-messages").scrollHeight;
          } catch (e) { /* Ignore parse errors */ }
        }
      }
    }

  } catch (err) {
    removeTyping(typingId);
    addMsg(`خطا: ${err.message}`, "bot");
    console.error(err);
  } finally {
    input.disabled = false;
    document.getElementById("ferdows-send").disabled = false;
    input.focus();
  }
}

// ── helpers ─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
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
  return div; // CRITICAL: Must return the div for streaming
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