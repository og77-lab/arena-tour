import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

/* The game is laid out for a 400×800 phone and scaled uniformly to whatever screen it's on,
   so it looks the same everywhere and never needs pinch/browser zoom. Applied to <body> so
   portaled overlays and the bottom nav scale too. */
var DESIGN_W = 400, DESIGN_H = 800;
function fitScale() {
  var vw = window.innerWidth, vh = window.innerHeight;
  var s = Math.min(vw / DESIGN_W, vh / DESIGN_H);
  s = Math.max(0.72, Math.min(1.2, s));
  s = Math.round(s * 1000) / 1000;
  document.body.style.zoom = String(s);
  /* Full-height screens divide by this so 100dvh still means the real screen height after zoom */
  document.documentElement.style.setProperty('--z', String(s));
}
fitScale();
window.addEventListener('resize', fitScale);
window.addEventListener('orientationchange', fitScale);

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
