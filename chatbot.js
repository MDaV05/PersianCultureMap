// ── ganjoor & helpers ─────────────────────────────────────────────────────
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

// ── models ──────────────────────────────────────────────────────────────
const MODELS = {
  free: {
    id: "qwen/qwen3-coder-480b-a35b:free",
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

// ── UI builder ──────────────────────────────────────────────────────────────────
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
  document.getElementById("ferdows-input").placeholder = tier === "plus" ? "از فردوس پلاس بپرس..." : "سوال بپرس...";
  addSystemMsg(tier === "plus" ? "◈ فردوس پلاس فعال شد" : "✦ فردوس فعال شد");
}

// ── send message  ──────────────────────────────────────────
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
        "X-Title": "فردوس — نقشه‌ی شعر پارسی"
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

// ── helpers ─────────────────────────────────────────────────────────────────────
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