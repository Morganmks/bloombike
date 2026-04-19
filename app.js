/* =========================================================
   BLOOM BIKE — prototype interactions
   Low-fi only: no GPS, no backend, no storage.
   ========================================================= */

// ---- Screen navigation --------------------------------------------------
const screens = {
  home: document.getElementById("screen-home"),
  ride: document.getElementById("screen-ride"),
};
const tabs = document.querySelectorAll(".tab");

function showScreen(name) {
  Object.entries(screens).forEach(([key, el]) => {
    el.classList.toggle("is-active", key === name);
  });
  tabs.forEach(t => {
    const isMatch =
      (name === "home" && t.dataset.tab === "home") ||
      (name === "ride" && t.dataset.tab === "map");
    t.classList.toggle("is-active", isMatch);
  });
}

// Tab bar toggles between the two built screens for the prototype.
tabs.forEach(tab => {
  tab.addEventListener("click", () => {
    const t = tab.dataset.tab;
    if (t === "home") showScreen("home");
    else if (t === "map") showScreen("ride");
    // "rewards" and "impact" tabs are stubs for now.
  });
});

// ---- Start / End ride buttons -------------------------------------------
document.getElementById("btn-start-ride")
  .addEventListener("click", () => {
    resetRide();
    showScreen("ride");
    startRideSimulation();
  });

document.getElementById("btn-back")
  .addEventListener("click", () => {
    stopRideSimulation();
    showScreen("home");
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
    showScreen("home");
  });

// ---- Fake ride simulation -----------------------------------------------
const ride = { seconds: 0, distance: 0, energy: 0, coins: 0 };
let rideTimer = null;

const elTimer    = document.getElementById("ride-timer-text");
const elDistance = document.getElementById("ride-distance");
const elEnergy   = document.getElementById("ride-energy");
const elCoins    = document.getElementById("ride-coins");
const riderDot   = document.getElementById("rider-dot");
const routePath  = document.getElementById("route-path");

function resetRide() {
  ride.seconds = 0;
  ride.distance = 0;
  ride.energy = 0;
  ride.coins = 0;
  renderRide();
  moveRiderAlongRoute(0);
  document.querySelectorAll(".collectible")
    .forEach(c => c.classList.remove("is-collected"));
  document.getElementById("ride-toast").hidden = true;
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
}

function startRideSimulation() {
  if (rideTimer) return;
  rideTimer = setInterval(() => {
    ride.seconds += 1;
    ride.distance += 0.0033 * (3 + Math.random() * 0.6); // ~12–14 mph feel
    ride.energy = Math.round(ride.distance * 46);
    moveRiderAlongRoute(ride.seconds / 120);
    renderRide();
  }, 1000);
}

function stopRideSimulation() {
  clearInterval(rideTimer);
  rideTimer = null;
}

// ---- Collectibles -------------------------------------------------------
// Each button carries its value + label + icon id via data-attributes,
// which keeps this logic decoupled from the visual icon choice.
document.querySelectorAll(".collectible").forEach(btn => {
  btn.addEventListener("click", () => {
    if (btn.classList.contains("is-collected")) return;

    const gained = parseInt(btn.dataset.coins, 10) || 10;
    const label  = btn.dataset.label || "Item collected";
    const iconId = btn.dataset.icon  || "i-sparkle";

    ride.coins += gained;
    renderRide();
    btn.classList.add("is-collected");

    // Swap the toast's <use href="#..."> so the icon matches the pickup
    const toast = document.getElementById("ride-toast");
    const toastIcon = document.getElementById("toast-icon");
    const useEl = toastIcon.querySelector("use");
    if (useEl) useEl.setAttribute("href", `#${iconId}`);

    document.getElementById("toast-text").textContent =
      `+${gained} coins · ${label}`;
    toast.hidden = false;
  });
});

// ---- Initial render -----------------------------------------------------
renderRide();
