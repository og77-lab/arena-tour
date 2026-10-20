/* ═══ FX ═══ Shared visual-effect helpers for match screens */

import * as React from "react";
import { motion } from "framer-motion";
import { playTick } from "../sounds";

const { useState, useEffect, useRef } = React;

export var REDUCED_MOTION = typeof window !== "undefined" && window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
/* A weak phone (4 cores or fewer, or 2 GB or less): the crowd stops its idle bobbing (it still cheers and groans) */
export var LOW_END = typeof navigator !== "undefined" && ((navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4) || (navigator.deviceMemory && navigator.deviceMemory <= 2));

export function vibrate(pattern) {
  try { if (navigator.vibrate) navigator.vibrate(pattern); } catch (e) {}
}

/* Burst of particles flying out from the parent's centre, with a little gravity */
export function Sparks(props) {
  var count = props.count || 16, colors = props.colors || ["#facc15", "#fde68a", "#ffffff"];
  var spread = props.spread || 160, delay = props.delay || 0;
  var parts = useRef(null);
  if (!parts.current) {
    parts.current = [];
    for (var i = 0; i < count; i++) {
      var a = Math.random() * Math.PI * 2, dist = spread * (0.45 + Math.random() * 0.55);
      parts.current.push({ x: Math.cos(a) * dist, y: Math.sin(a) * dist + 40, size: 3 + Math.random() * 5, c: colors[i % colors.length], d: 0.7 + Math.random() * 0.6 });
    }
  }
  if (REDUCED_MOTION) return null;
  return (
    <div aria-hidden style={{ position: "absolute", left: "50%", top: props.top || "50%", width: 0, height: 0, pointerEvents: "none", zIndex: props.zIndex || 5 }}>
      {parts.current.map(function (p, i) {
        return (
          <motion.div key={i}
            initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
            animate={{ x: p.x, y: p.y, opacity: 0, scale: 0.3 }}
            transition={{ duration: p.d, delay: delay, ease: [0.15, 0.7, 0.4, 1] }}
            style={{ position: "absolute", width: p.size, height: p.size, marginLeft: -p.size / 2, marginTop: -p.size / 2, borderRadius: "50%", background: p.c, boxShadow: "0 0 8px " + p.c }} />
        );
      })}
    </div>
  );
}

/* Number that rolls up from 0 (only this span re-renders while counting) */
export function CountUp(props) {
  var _v = useState(0), v = _v[0], setV = _v[1];
  useEffect(function () {
    var start = null, raf = null, lastTick = 0, to = props.to, dur = props.duration || 500;
    var timer = setTimeout(function () {
      function step(now) {
        if (start == null) start = now;
        var k = Math.min(1, (now - start) / dur);
        setV(Math.round(to * (1 - Math.pow(1 - k, 3))));
        if (props.tick && now - lastTick > 45 && k < 1) { lastTick = now; playTick(); }
        if (k < 1) raf = requestAnimationFrame(step);
      }
      raf = requestAnimationFrame(step);
    }, props.delay || 0);
    return function () { clearTimeout(timer); if (raf) cancelAnimationFrame(raf); };
  }, [props.to]);
  return (<span>{(props.prefix || "") + v.toLocaleString()}</span>);
}
