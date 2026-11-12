// Navigation: mobile menu, current-section highlight, and pausing looping animation while it is off screen.
(function () {
  var header = document.querySelector(".site-header");
  var toggle = document.querySelector(".nav-toggle");
  var nav = document.getElementById("site-nav");
  if (header && toggle && nav) {
    var setOpen = function (open) {
      header.classList.toggle("is-menu-open", open);
      toggle.setAttribute("aria-expanded", String(open));
      toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    };
    toggle.addEventListener("click", function () { setOpen(toggle.getAttribute("aria-expanded") !== "true"); });
    nav.addEventListener("click", function (e) { if (e.target.closest("a")) setOpen(false); });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && toggle.getAttribute("aria-expanded") === "true") { setOpen(false); toggle.focus(); }
    });
    window.matchMedia("(min-width: 761px)").addEventListener("change", function () { setOpen(false); });
  }
  if (!("IntersectionObserver" in window)) return;
  var links = [].slice.call(document.querySelectorAll(".site-nav a[href^='#']"));
  var byId = {};
  links.forEach(function (a) { byId[a.getAttribute("href").slice(1)] = a; });
  var current = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting || !byId[entry.target.id]) return;
      links.forEach(function (a) { a.removeAttribute("aria-current"); });
      byId[entry.target.id].setAttribute("aria-current", "true");
    });
  }, { rootMargin: "-45% 0px -50% 0px" });
  Object.keys(byId).forEach(function (sectionId) { var s = document.getElementById(sectionId); if (s) current.observe(s); });
  var pause = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) { entry.target.classList.toggle("is-paused", !entry.isIntersecting); });
  });
  [].slice.call(document.querySelectorAll(".hero, .journey")).forEach(function (s) { pause.observe(s); });
})();

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
  var flame = stage.querySelector(".flame");
  var lastGear = 1;

  var tl = gsap.timeline({
    defaults: { ease: "none" },
    scrollTrigger: { trigger: stage, start: "top top", end: "bottom bottom", scrub: 0.5 }
  });

  // Parallax: far layers crawl, near layers rush past, the road dashes fly by.
  tl.to(".sky-far", { backgroundPositionX: "-900px" }, 0)
    .to(".sky-near", { backgroundPositionX: "-5200px" }, 0)
    .to(".lamps", { backgroundPositionX: "-12000px" }, 0)
    .to(".beam", { opacity: 0.85, scaleX: 1.2, duration: 0.5 }, 0.05)
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
      var g = Math.min(7, 1 + Math.floor(p * 7));
      gear.textContent = g;
      // A flame pops from the exhaust on every upshift.
      if (g > lastGear) gsap.fromTo(flame, { opacity: 1, scaleX: 0.5 }, { opacity: 0, scaleX: 2.2, duration: 0.3, overwrite: true });
      lastGear = g;
      rev.style.width = (35 + ((p * 7) % 1) * 65) + "%";
    }
  });

  // A little idle vibration so the car feels alive between scroll steps.
  var idle = gsap.to(".scene-vehicle svg", { y: -3, duration: 0.12, repeat: -1, yoyo: true, ease: "sine.inOut", paused: true });
  ScrollTrigger.create({ trigger: stage, start: "top bottom", end: "bottom top", onToggle: function (self) { idle.paused(!self.isActive); } });
})();
