// Vortex GT: a scroll-scrubbed night drive. Needs GSAP + ScrollTrigger (loaded from the CDN in index.html).
// Without them (or with reduced motion) the scene stays a still frame and the page is fully usable.
(function () {
  var stage = document.querySelector(".journey");
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!stage || reduced || !window.gsap || !window.ScrollTrigger) return;

  gsap.registerPlugin(ScrollTrigger);
  document.documentElement.classList.add("has-scene");

  // Reuse the hero car so the artwork lives in one place.
  var slot = stage.querySelector(".scene-vehicle");
  var car = document.querySelector(".hero .car").cloneNode(true);
  car.removeAttribute("role");
  slot.appendChild(car);

  var speed = stage.querySelector("[data-speed]");
  var gear = stage.querySelector("[data-gear]");
  var rev = stage.querySelector("[data-rev]");
  var copy = stage.querySelectorAll(".journey-copy article");
  var streaks = stage.querySelector(".streaks");

  var tl = gsap.timeline({
    defaults: { ease: "none" },
    scrollTrigger: { trigger: stage, start: "top top", end: "bottom bottom", scrub: 0.5 }
  });

  // Parallax: far layers crawl, near layers rush past, the road dashes fly by.
  tl.to(".sky-far", { backgroundPositionX: "-900px" }, 0)
    .to(".sky-near", { backgroundPositionX: "-5200px" }, 0)
    .to(".road-dashes", { backgroundPositionX: "-9000px" }, 0)
    .to(".stars", { backgroundPositionX: "-200px" }, 0)
    .to(streaks, { opacity: 1, duration: 0.5 }, 0.4)
    .to(".scene-vehicle", { y: 6, scale: 1.04 }, 0.5);

  // Wheels turn with the scroll.
  car.querySelectorAll(".wheel").forEach(function (wheel) {
    var origin = wheel.style.transformOrigin.replace(/px/g, "");
    tl.to(wheel, { rotation: 5400, svgOrigin: origin }, 0);
  });

  // Captions: one at a time.
  copy.forEach(function (item, i) {
    var at = i / copy.length;
    tl.fromTo(item, { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.07 }, at + 0.02);
    if (i < copy.length - 1) tl.to(item, { opacity: 0, y: -24, duration: 0.06 }, at + 0.3);
  });

  // Speedo, gear and rev bar follow scroll progress.
  ScrollTrigger.create({
    trigger: stage, start: "top top", end: "bottom bottom",
    onUpdate: function (self) {
      var p = self.progress;
      speed.textContent = Math.round(340 * Math.pow(p, 0.8));
      gear.textContent = Math.min(7, 1 + Math.floor(p * 7));
      rev.style.width = (35 + ((p * 7) % 1) * 65) + "%";
    }
  });

  // A little idle vibration so the car feels alive between scroll steps.
  gsap.to(".scene-vehicle svg", { y: -3, duration: 0.12, repeat: -1, yoyo: true, ease: "sine.inOut" });
})();
