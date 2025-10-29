let totalSeconds = 600; // default 10 min
let remainingSeconds = totalSeconds;
let endTime = Date.now() + totalSeconds * 1000;
let lastUpdateExtra = 0;

const routeEl = document.getElementById("route");
const etaEl = document.getElementById("eta");
const fillEl = document.getElementById("fill");
const carEl = document.getElementById("car");
const barEl = document.getElementById("bar");

// ---------- ETA UI ----------
function formatETA(sec) {
  if (sec <= 0) return "Arrived!";
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  if (h > 0) return `ETA ${h}h ${m}m ${s}s`;
  if (m > 0) return `ETA ${m}m ${s}s`;
  return `ETA ${s}s`;
}

function tick() {
  const now = Date.now();
  remainingSeconds = Math.max(0, Math.floor((endTime - now) / 1000));
  const elapsed = totalSeconds - remainingSeconds;
  const pct = totalSeconds > 0 ? Math.min(100, (elapsed / totalSeconds) * 100) : 0;

  fillEl.style.width = pct + "%";

  const barRect = barEl.getBoundingClientRect();
  const carW = carEl.getBoundingClientRect().width;
  const usable = Math.max(0, barRect.width - carW);
  carEl.style.left = usable * (pct / 100) + carW / 2 + "px";

  if (remainingSeconds > 0) {
    let text = formatETA(remainingSeconds);
    if (lastUpdateExtra !== 0) {
      const sign = lastUpdateExtra > 0 ? "+" : "";
      text += ` (Updated ${sign}${lastUpdateExtra}s)`;
    }
    etaEl.textContent = text;
    requestAnimationFrame(tick);
  } else {
    etaEl.textContent = "Arrived!";
  }
}
tick();

function resetTimer() {
  totalSeconds = 0;
  remainingSeconds = 0;
  lastUpdateExtra = 0;
  endTime = Date.now();
  fillEl.style.width = "0%";
  carEl.style.left = "0px";
  etaEl.textContent = "ETA 0m";
  routeEl.textContent = "Destination: Not Set";
}

// ---------- StreamElements Chat Integration ----------
const CHANNEL_NAME = "ryaah"; // your channel

function isAuthorized(data) {
  // Twitch-style tags
  const tags = data?.tags || {};
  const nick = (data?.nick || "").toLowerCase();
  const badgesStr = (tags.badges || "") + ""; // can be "broadcaster/1,subscriber/0" etc.

  const modFlag = tags.mod === true || tags.mod === "1";
  const hasModBadge = badgesStr.includes("moderator/1");
  const hasBroadcasterBadge = badgesStr.includes("broadcaster/1");

  const isBroadcasterByNick = nick === CHANNEL_NAME.toLowerCase();
  return hasBroadcasterBadge || isBroadcasterByNick || modFlag || hasModBadge;
}

// SE sends events here while the overlay is active
window.addEventListener("onEventReceived", (obj) => {
  if (!obj?.detail) return;

  // Some SE setups use "message", some use "message-received"
  const listener = obj.detail.listener;
  if (listener !== "message" && listener !== "message-received") return;

  const data = obj.detail.event?.data;
  if (!data) return;

  if (!isAuthorized(data)) return;

  const msg = (data.text || "").trim();
  if (!msg) return;

  const parts = msg.split(" ");
  const cmd = parts[0].toLowerCase();

  // !st <seconds>  (positive = extend, negative = reduce)
  if (cmd === "!st" && parts[1]) {
    const changeSecs = parseInt(parts[1], 10);
    if (!Number.isNaN(changeSecs)) {
      const now = Date.now();
      const currentRemaining = Math.max(0, Math.floor((endTime - now) / 1000));
      remainingSeconds = Math.max(0, currentRemaining + changeSecs);
      totalSeconds = remainingSeconds;
      endTime = now + remainingSeconds * 1000;
      lastUpdateExtra = changeSecs;
      tick();
    }
  }

  // !sd <destination>
  if (cmd === "!sd" && parts.length > 1) {
    const destination = parts.slice(1).join(" ");
    routeEl.textContent = "Destination: " + destination;
  }

  // !reset
  if (cmd === "!reset") {
    resetTimer();
  }
});

// ---------- Optional local test (keyboard) ----------
window.addEventListener("keydown", (e) => {
  if (e.key === "u") { // +200s
    const now = Date.now();
    const currentRemaining = Math.max(0, Math.floor((endTime - now) / 1000));
    remainingSeconds = currentRemaining + 200;
    totalSeconds = remainingSeconds;
    endTime = now + remainingSeconds * 1000;
    lastUpdateExtra = 200;
    tick();
  }
  if (e.key === "d") { // -300s
    const now = Date.now();
    const currentRemaining = Math.max(0, Math.floor((endTime - now) / 1000));
    remainingSeconds = Math.max(0, currentRemaining - 300);
    totalSeconds = remainingSeconds;
    endTime = now + remainingSeconds * 1000;
    lastUpdateExtra = -300;
    tick();
  }
  if (e.key === "r") { // reset
    resetTimer();
  }
});
