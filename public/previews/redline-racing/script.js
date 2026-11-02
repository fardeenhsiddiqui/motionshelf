// Redline Racing: one scroll-scrubbed qualifying lap. Needs GSAP + ScrollTrigger (loaded from the CDN in index.html).
// Without them (or with reduced motion) the scene stays a still frame and the page is fully usable.
(function () {
  var stage = document.querySelector(".journey");
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!stage || reduced || !window.gsap || !window.ScrollTrigger) return;

  gsap.registerPlugin(ScrollTrigger);
  document.documentElement.classList.add("has-scene");

  // Reuse the hero car so the artwork lives in one place.
  var slot = stage.querySelector(".scene-vehicle");
  var racer = document.querySelector(".hero .racer").cloneNode(true);
  racer.removeAttribute("role");
  slot.appendChild(racer);

  var timeEl = stage.querySelector("[data-time]");
  var kmhEl = stage.querySelector("[data-kmh]");
  var lights = stage.querySelectorAll("[data-lights] i");
  var sectors = stage.querySelectorAll("[data-sectors] b");
  var copy = stage.querySelectorAll(".journey-copy article");

  var tl = gsap.timeline({
    defaults: { ease: "none" },
    scrollTrigger: { trigger: stage, start: "top top", end: "bottom bottom", scrub: 0.4 }
  });

  // Everything races past at a different rate.
  tl.to(".floods", { backgroundPositionX: "-600px" }, 0)
    .to(".stands", { backgroundPositionX: "-2400px" }, 0)
    .to(".gantry", { backgroundPositionX: "-6000px" }, 0)
    .to(".barrier", { backgroundPositionX: "-12000px" }, 0)
    .to(".kerb", { backgroundPositionX: "-16000px" }, 0)
    .to(".lane", { backgroundPositionX: "-14000px" }, 0)
    .to(".streaks", { opacity: 1, duration: 0.3 }, 0.15)
    .to(".scene-vehicle", { x: 40, duration: 0.6 }, 0)
    .to(".chequered", { opacity: 0.9, duration: 0.05 }, 0.93)
    .to(".chequered", { opacity: 0, duration: 0.05 }, 0.98);

  racer.querySelectorAll(".wheel").forEach(function (wheel) {
    var origin = wheel.style.transformOrigin.replace(/px/g, "");
    tl.to(wheel, { rotation: 7200, svgOrigin: origin }, 0);
  });

  copy.forEach(function (item, i) {
    var at = i / copy.length;
    tl.fromTo(item, { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.06 }, at + 0.02);
    if (i < copy.length - 1) tl.to(item, { opacity: 0, y: -24, duration: 0.05 }, at + 0.3);
  });

  function pad(n, size) { return String(n).padStart(size, "0"); }

  ScrollTrigger.create({
    trigger: stage, start: "top top", end: "bottom bottom",
    onUpdate: function (self) {
      var p = self.progress;
      // Lap clock runs to 1:18.436.
      var ms = Math.round(p * 78436);
      timeEl.textContent = Math.floor(ms / 60000) + ":" + pad(Math.floor((ms % 60000) / 1000), 2) + "." + pad(ms % 1000, 3);
      var kmh = Math.round(120 + 175 * Math.abs(Math.sin(p * Math.PI * 3)) * Math.min(1, p * 6));
      kmhEl.textContent = p < 0.02 ? 0 : kmh;
      var lit = Math.round((kmh / 295) * lights.length);
      lights.forEach(function (light, i) {
        light.className = i < lit ? "on" + (i > 4 ? " warn" : "") + (i > 6 ? " max" : "") : "";
      });
      sectors.forEach(function (bar, i) { bar.className = p > (i + 1) / 3 - 0.02 ? "on" : ""; });
    }
  });

  // Chassis vibration and a little camera shake.
  gsap.to(".scene-vehicle svg", { y: -2, duration: 0.07, repeat: -1, yoyo: true, ease: "sine.inOut" });
  gsap.to(".journey-stage > .layer, .barrier, .track", { y: 1.5, duration: 0.09, repeat: -1, yoyo: true, ease: "sine.inOut" });
})();
