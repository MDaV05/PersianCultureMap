const OPENROUTER_API_KEY = "";

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

//_______________UI_______________________________________________________________________________________________________________________________________

function buildChatbot() {
  const wrapper = document.createElement("div");
  wrapper.id = "ferdows-wrapper";
  wrapper.innerHTML = `
    <!-- Floating trigger card -->
    <div id="ferdows-card" onclick="toggleChat()">
      <div id="ferdows-avatar">✦</div>
      <div id="ferdows-card-text">
        <div id="ferdows-card-name">فردوس <span id="ferdows-card-badge">AI</span></div>
        <div id="ferdows-card-sub">از شعر پارسی بپرس</div>
      </div>
      <button id="ferdows-close-card" onclick="dismissCard(event)">✕</button>
    </div>

    <!-- Small FAB when card is dismissed -->
    <div id="ferdows-fab" onclick="toggleChat()" style="display:none;">✦</div>

    <!-- Chat window -->
    <div id="ferdows-chat">
      <div id="ferdows-chat-header">
        <div id="ferdows-chat-avatar-small">✦</div>
        <div id="ferdows-chat-header-text">
          <div id="ferdows-chat-name">فردوس <span id="ferdows-chat-badge-header">رایگان</span></div>
          <div id="ferdows-chat-subtitle">دستیار شعر پارسی</div>
        </div>
        <button id="ferdows-chat-close" onclick="toggleChat()">✕</button>
      </div>

      <!-- Tier toggle -->
      <div id="ferdows-tier-row">
        <button class="ftier-btn active" id="ftier-free" onclick="switchTier('free')">
          <span>✦</span> فردوس
        </button>
        <button class="ftier-btn" id="ftier-plus" onclick="switchTier('plus')">
          <span>◈</span> فردوس پلاس
        </button>
      </div>

      <!-- Messages -->
      <div id="ferdows-messages">
        <div class="fm bot">
          <div class="fm-bubble">
            سلام! من <strong>فردوس</strong> هستم 🌹<br>
            دستیار هوش مصنوعی شعر پارسی.<br><br>
            <span style="opacity:0.5;font-size:11px;" dir="ltr">Ask me anything about Persian poetry!</span>
          </div>
        </div>
      </div>

      <!-- Input -->
      <div id="ferdows-input-row">
        <input id="ferdows-input" type="text" placeholder="سوال بپرس..." dir="rtl" autocomplete="off"/>
        <button id="ferdows-send">↑</button>
      </div>
    </div>

  `;
  document.body.appendChild(wrapper);

  // event listeners
  document.getElementById("ferdows-send").addEventListener("click", sendMessage);
  document.getElementById("ferdows-input").addEventListener("keydown", e => {
    if (e.key === "Enter") sendMessage();
  });
}

