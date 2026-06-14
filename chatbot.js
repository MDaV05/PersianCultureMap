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

//______________________________________________________________________________________________________________________________________________________

function buildChatbot() {
  const wrapper = document.createElement("div");
  wrapper.id = "ferdows-wrapper";
  wrapper.innerHTML = `
