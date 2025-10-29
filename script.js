let totalSeconds = 600; // default 10 min
let remainingSeconds = totalSeconds;
let endTime = Date.now() + totalSeconds * 1000;
let lastUpdateExtra = 0;

const routeEl = document.getElementById("route");
const etaEl = document.getElementById("eta");
const fillEl = document.getElementById("fill");
const carEl = document.getElementById("car");
const barEl = document.getElementById("bar");

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

// StreamElements chat commands
window.addEventListener("onEventReceived", function (obj) {
  if (!obj.detail || obj.detail.listener !== "message") return;
  const msg = obj.detail.event.data.text.trim();
  const parts = msg.split(" ");

  // !st <seconds> (positive = extend, negative = reduce)
  if (parts[0] === "!st" && parts[1]) {
    const changeSecs = parseInt(parts[1], 10);
    if (!isNaN(changeSecs)) {
      remainingSeconds = Math.max(0, Math.floor((endTime - Date.now()) / 1000));
      remainingSeconds += changeSecs;
      if (remainingSeconds < 0) remainingSeconds = 0;
      totalSeconds = remainingSeconds;
      endTime = Date.now() + remainingSeconds * 1000;
      lastUpdateExtra = changeSecs;
      tick();
    }
  }

  // !sd <destination>
  if (parts[0] === "!sd" && parts.length > 1) {
    const destination = parts.slice(1).join(" ");
    routeEl.textContent = "Destination: " + destination;
  }

  // !reset
  if (parts[0] === "!reset") {
    resetTimer();
  }
});
