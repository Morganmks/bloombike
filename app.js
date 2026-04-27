/* =========================================================
   BLOOM BIKE — prototype interactions (redesigned)
   - 5-tab bar with elevated center "Live Ride" button
   - Coins are AUTO-collected as the rider reaches them
     along the route path (no tapping during ride).
   - Friends are companions — riding near them gives 1.5× coin bonus.
   - Map is an SVG with layered detail.
   ========================================================= */

// ---- Screen navigation --------------------------------------------------
const screens = {
  map:       document.getElementById("screen-map"),
  ride:      document.getElementById("screen-ride"),
  avatar:    document.getElementById("screen-avatar"),
  friends:   document.getElementById("screen-friends"),
  community: document.getElementById("screen-community"),
};
const tabs = document.querySelectorAll(".tab");

function showScreen(name) {
  Object.entries(screens).forEach(([key, el]) => {
    if (!el) return;
    el.classList.toggle("is-active", key === name);
    el.scrollTop = 0;
  });
  tabs.forEach(t => {
    t.classList.toggle("is-active", t.dataset.tab === name);
  });
}

// Tab bar: center button starts a fresh ride; others just navigate.
tabs.forEach(tab => {
  tab.addEventListener("click", () => {
    const t = tab.dataset.tab;
    if (!t) return;
    if (t === "ride") {
      resetRide();
      showScreen("ride");
      startRideSimulation();
      return;
    }
    if (screens[t]) showScreen(t);
  });
});

// Start / End ride buttons (home CTA + in-ride back / end)
document.getElementById("btn-start-ride")
  .addEventListener("click", () => {
    resetRide();
    showScreen("ride");
    startRideSimulation();
  });

document.getElementById("btn-back")
  .addEventListener("click", () => {
    stopRideSimulation();
    showScreen("map");
  });

document.getElementById("btn-end-ride")
  .addEventListener("click", () => {
    stopRideSimulation();
    alert(
      `Nice ride!\n\n` +
      `Distance: ${ride.distance.toFixed(2)} mi\n` +
      `Energy:   ${ride.energy} Wh\n` +
      `Coins:    ${ride.coins}`
    );
    showScreen("map");
  });

// ---- Fake ride simulation -----------------------------------------------
const ride = { seconds: 0, distance: 0, energy: 0, coins: 0, progress: 0, groupBonus: false };
let rideTimer = null;
let toastTimer = null;

const elTimer       = document.getElementById("ride-timer-text");
const elDistance    = document.getElementById("ride-distance");
const elEnergy      = document.getElementById("ride-energy");
const elCoins       = document.getElementById("ride-coins");
const riderDot      = document.getElementById("rider-dot");
const riderHalo     = document.getElementById("rider-halo");
const routePath     = document.getElementById("route-path");
const toastEl       = document.getElementById("ride-toast");
const toastIcon     = document.getElementById("toast-icon");
const toastText     = document.getElementById("toast-text");
const groupBannerEl = document.getElementById("group-banner");

// Duration (seconds) to traverse the whole path in the simulation.
const RIDE_DURATION_SEC = 90;

// ---- Collectibles --------------------------------------------------------
// Each .collectible has data-t = its position along the route (0..1).
// We lay them out once using the path geometry, then auto-collect them
// during the ride when progress >= t.
const collectibles = Array.from(document.querySelectorAll(".collectible"))
  .map(el => ({
    el,
    t:       parseFloat(el.dataset.t || "0"),
    coins:   parseInt(el.dataset.coins, 10) || 10,
    label:   el.dataset.label || "Item collected",
    iconId:  el.dataset.icon  || "i-sparkle",
    collected: false,
  }));

function layoutCollectibles() {
  if (!routePath) return;
  const len = routePath.getTotalLength();
  const VB_W = 390, VB_H = 536;
  collectibles.forEach(c => {
    const p = routePath.getPointAtLength(len * c.t);
    c.el.style.left = (p.x / VB_W * 100) + "%";
    c.el.style.top  = (p.y / VB_H * 100) + "%";
  });
}

function showToast(iconId, label, gained) {
  if (!toastEl) return;
  const useEl = toastIcon.querySelector("use");
  if (useEl) useEl.setAttribute("href", `#${iconId}`);
  toastText.textContent = `+${gained} coins · ${label}`;
  toastEl.hidden = false;
  toastEl.style.animation = "none";
  void toastEl.offsetWidth;
  toastEl.style.animation = "";
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { toastEl.hidden = true; }, 2400);
}

function collectItem(c) {
  if (c.collected) return;
  c.collected = true;
  const gained = ride.groupBonus ? Math.round(c.coins * 1.5) : c.coins;
  ride.coins += gained;
  renderRide();
  c.el.classList.add("is-collected");
  const label = ride.groupBonus ? `${c.label} · group bonus!` : c.label;
  showToast(c.iconId, label, gained);
}

function checkAutoCollect(progress) {
  for (const c of collectibles) {
    if (!c.collected && progress >= c.t) collectItem(c);
  }
}

// ---- Friend simulation --------------------------------------------------
// Friends are companions on the route. When the player rides within
// PROXIMITY_THRESHOLD of any friend, the group banner appears and all
// coin pickups earn 1.5× — no competition, just collective reward.

const PROXIMITY_THRESHOLD = 0.15;

const FRIEND_DEFS = [
  { id: "jordan", name: "Jordan", initProgress: 0.08, speed: 0.007 },
  { id: "sam",    name: "Sam",    initProgress: 0.22, speed: 0.0065 },
];
let friends = [];

function moveFriendDot(f) {
  if (!routePath || !f.el) return;
  const len = routePath.getTotalLength();
  const VB_W = 390, VB_H = 536;
  const p = routePath.getPointAtLength(len * Math.min(1, f.progress));
  f.el.style.left = (p.x / VB_W * 100) + "%";
  f.el.style.top  = (p.y / VB_H * 100) + "%";
}

function tickFriends(playerProgress) {
  friends.forEach(f => {
    f.progress = Math.min(1, f.progress + f.speed);
    moveFriendDot(f);
  });
  const nearby = friends.some(f => Math.abs(f.progress - playerProgress) <= PROXIMITY_THRESHOLD);
  ride.groupBonus = nearby;
  if (groupBannerEl) groupBannerEl.setAttribute("aria-hidden", nearby ? "false" : "true");
}

function resetFriends() {
  friends.forEach(f => {
    f.progress = f.initProgress;
    moveFriendDot(f);
  });
}

// ---- Ride state helpers --------------------------------------------------
function resetRide() {
  ride.seconds = 0;
  ride.distance = 0;
  ride.energy = 0;
  ride.coins = 0;
  ride.progress = 0;
  ride.groupBonus = false;
  renderRide();
  moveRiderAlongRoute(0);
  collectibles.forEach(c => {
    c.collected = false;
    c.el.classList.remove("is-collected");
  });
  resetFriends();
  if (groupBannerEl) groupBannerEl.setAttribute("aria-hidden", "true");
  if (toastEl) toastEl.hidden = true;
  clearTimeout(toastTimer);
}

function renderRide() {
  const m = String(Math.floor(ride.seconds / 60)).padStart(2, "0");
  const s = String(ride.seconds % 60).padStart(2, "0");
  elTimer.textContent = `${m}:${s}`;
  elDistance.textContent = ride.distance.toFixed(2);
  elEnergy.textContent = ride.energy;
  elCoins.textContent = ride.coins;
}

function moveRiderAlongRoute(t) {
  if (!routePath || !riderDot) return;
  const clamped = Math.max(0, Math.min(1, t));
  const len = routePath.getTotalLength();
  const p = routePath.getPointAtLength(len * clamped);
  riderDot.setAttribute("cx", p.x);
  riderDot.setAttribute("cy", p.y);
  if (riderHalo) {
    riderHalo.setAttribute("cx", p.x);
    riderHalo.setAttribute("cy", p.y);
  }
}

function startRideSimulation() {
  if (rideTimer) return;
  rideTimer = setInterval(() => {
    ride.seconds += 1;
    ride.distance += 0.0033 * (3 + Math.random() * 0.6);
    ride.energy = Math.round(ride.distance * 46);
    ride.progress = Math.min(1, ride.seconds / RIDE_DURATION_SEC);
    moveRiderAlongRoute(ride.progress);
    checkAutoCollect(ride.progress);
    tickFriends(ride.progress);
    renderRide();
    if (ride.progress >= 1) stopRideSimulation();
  }, 1000);
}

function stopRideSimulation() {
  clearInterval(rideTimer);
  rideTimer = null;
}

// ---- Initial render -----------------------------------------------------
window.addEventListener("load", () => {
  friends = FRIEND_DEFS.map(def => ({
    ...def,
    progress: def.initProgress,
    el: document.getElementById(`friend-dot-${def.id}`),
  }));
  layoutCollectibles();
  friends.forEach(moveFriendDot);
  renderRide();
});
window.addEventListener("resize", layoutCollectibles);
