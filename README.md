# Bloom Bike

A low-fidelity interactive prototype for **Bloom Bike** — a gamified cycling app
that turns rides into in-game rewards and renewable-energy impact.

Built with plain HTML, CSS, and JavaScript so it runs in any modern browser
with no build step.

## Live demo

Once GitHub Pages is enabled, the prototype lives at:

`https://<your-username>.github.io/bloombike/`

## Run it locally

Clone the repo and open `index.html` in your browser, or use the
[Live Server](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer)
extension in VS Code:

1. Open the folder in VS Code
2. Right-click `index.html` → **Open with Live Server**

## What's in the prototype

- **Home screen** — greeting, weekly stats, progress bar, Start Ride CTA,
  impact teaser.
- **Ride map** — fake map with a live route, collectibles scattered around,
  and a live-updating stats panel (timer, distance, energy, coins).
- **Tab bar** — Home, Ride, Rewards (stub), Impact (stub).

No GPS, no backend, no storage — all ride data is simulated client-side
for concept validation.

## File structure

```
bloombike/
├── index.html   # structure + inline SVG icon sprite
├── styles.css   # design tokens + all screen styles
└── app.js       # navigation + fake ride simulation + collectibles
```

## Design brief

See the project brief for goals, target audience, and success metrics.
