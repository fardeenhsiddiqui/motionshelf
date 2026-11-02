// Kestrel M9: a scroll-scrubbed coastal ride. Needs GSAP + ScrollTrigger (loaded from the CDN in index.html).
// Without them (or with reduced motion) the scene stays a still frame and the page is fully usable.
(function () {
  var stage = document.querySelector(".journey");
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!stage || reduced || !window.gsap || !window.ScrollTrigger) return;

  gsap.registerPlugin(ScrollTrigger);
  document.documentElement.classList.add("has-scene");

  // Reuse the hero bike so the artwork lives in one place.
  var slot = stage.querySelector(".scene-vehicle");
  var bike = document.querySelector(".hero .bike").cloneNode(true);
  bike.removeAttribute("role");
  slot.appendChild(bike);

  var speedEl = stage.querySelector("[data-speed]");
  var leanEl = stage.querySelector("[data-lean]");
  var copy = stage.querySelectorAll(".journey-copy article");

  var tl = gsap.timeline({
    defaults: { ease: "none" },
    scrollTrigger: { trigger: stage, start: "top top", end: "bottom bottom", scrub: 0.5 }
  });

  // Far to near: hills drift, palms flash past, the sun sinks into the sea.
  tl.to(".hills", { backgroundPositionX: "-700px" }, 0)
    .to(".palms", { backgroundPositionX: "-7200px" }, 0)
    .to(".road", { backgroundPositionX: "-9000px" }, 0)
    .to(".sun", { y: 70, scale: 0.9 }, 0);

  bike.querySelectorAll(".wheel").forEach(function (wheel) {
    var origin = wheel.style.transformOrigin.replace(/px/g, "");
    tl.to(wheel, { rotation: 4800, svgOrigin: origin }, 0);
  });

  copy.forEach(function (item, i) {
    var at = i / copy.length;
    tl.fromTo(item, { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.07 }, at + 0.02);
    if (i < copy.length - 1) tl.to(item, { opacity: 0, y: -24, duration: 0.06 }, at + 0.3);
  });

  // The bike leans into a series of bends: lean angle follows a smooth S-curve of scroll progress.
  ScrollTrigger.create({
    trigger: stage, start: "top top", end: "bottom bottom",
    onUpdate: function (self) {
      var p = self.progress;
      var lean = Math.sin(p * Math.PI * 4) * 38 * Math.min(1, p * 5);
      gsap.set(bike, { rotation: -lean * 0.45, y: Math.abs(lean) * 0.12, transformOrigin: "50% 92%" });
      leanEl.textContent = Math.round(Math.abs(lean));
      speedEl.textContent = Math.round(40 + 180 * Math.min(1, p * 2.2));
    }
  });

  gsap.to(bike, { x: 2, duration: 0.1, repeat: -1, yoyo: true, ease: "sine.inOut" });
})();
