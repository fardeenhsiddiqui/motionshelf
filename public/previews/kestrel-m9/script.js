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
    .to(".sun", { y: 70, scale: 0.9 }, 0)
    .to(".gulls", { backgroundPositionX: "-1700px" }, 0)
    .to(".glitter", { opacity: 0.95, duration: 0.8 }, 0.1)
    .to(".beam", { opacity: 0.8, duration: 0.5 }, 0.45);

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

  var idle = gsap.to(bike, { x: 2, duration: 0.1, repeat: -1, yoyo: true, ease: "sine.inOut", paused: true });
  ScrollTrigger.create({ trigger: stage, start: "top bottom", end: "bottom top", onToggle: function (self) { idle.paused(!self.isActive); } });
})();
