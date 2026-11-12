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

// Ridgeback X: a scroll-scrubbed desert crossing. Needs GSAP + ScrollTrigger (loaded from the CDN in index.html).
// Without them (or with reduced motion) the scene stays a still frame and the page is fully usable.
(function () {
  var stage = document.querySelector(".journey");
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!stage || reduced || !window.gsap || !window.ScrollTrigger) return;

  gsap.registerPlugin(ScrollTrigger);
  document.documentElement.classList.add("has-scene");

  // Reuse the hero SUV so the artwork lives in one place.
  var slot = stage.querySelector(".scene-vehicle");
  var suv = document.querySelector(".hero .suv").cloneNode(true);
  suv.removeAttribute("role");
  slot.appendChild(suv);

  var alt = stage.querySelector("[data-alt]");
  var incline = stage.querySelector("[data-incline]");
  var copy = stage.querySelectorAll(".journey-copy article");

  var tl = gsap.timeline({
    defaults: { ease: "none" },
    scrollTrigger: { trigger: stage, start: "top top", end: "bottom bottom", scrub: 0.6 }
  });

  // Parallax: distant ranges barely move, dunes and rocks sweep past, the sun climbs.
  tl.to(".clouds", { backgroundPositionX: "-700px" }, 0)
    .to(".mtn-far", { backgroundPositionX: "-500px" }, 0)
    .to(".mtn-mid", { backgroundPositionX: "-1500px" }, 0)
    .to(".dune", { backgroundPositionX: "-3400px" }, 0)
    .to(".rocks", { backgroundPositionX: "-8000px" }, 0)
    .to(".ground", { backgroundPositionX: "-6000px" }, 0)
    .to(".sun", { y: -90, scale: 1.25 }, 0);

  suv.querySelectorAll(".wheel").forEach(function (wheel) {
    var origin = wheel.style.transformOrigin.replace(/px/g, "");
    tl.to(wheel, { rotation: 2400, svgOrigin: origin }, 0);
  });

  copy.forEach(function (item, i) {
    var at = i / copy.length;
    tl.fromTo(item, { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.07 }, at + 0.02);
    if (i < copy.length - 1) tl.to(item, { opacity: 0, y: -24, duration: 0.06 }, at + 0.3);
  });

  // The SUV works over the terrain: body pitches and bounces with the scroll position.
  var car = slot.querySelector("svg");
  ScrollTrigger.create({
    trigger: stage, start: "top top", end: "bottom bottom",
    onUpdate: function (self) {
      var p = self.progress;
      var phase = p * 38;
      gsap.set(car, { y: Math.sin(phase) * 5 * (0.4 + p), rotation: Math.sin(phase * 0.5 + 1) * 2.2, transformOrigin: "50% 90%" });
      alt.textContent = Math.round(1240 + p * 1940).toLocaleString("en-US");
      incline.textContent = Math.round(Math.abs(Math.sin(p * Math.PI * 2.5)) * 32);
    }
  });

  // Dust kicked up behind the rear wheel: the puffs loop in CSS and the trail fades in with scroll speed.
  var trail = document.createElement("div");
  trail.className = "dust-trail";
  trail.setAttribute("aria-hidden", "true");
  for (var i = 0; i < 6; i++) {
    var puff = document.createElement("span");
    puff.className = "dust";
    puff.style.animationDelay = i * 0.25 + "s";
    trail.appendChild(puff);
  }
  slot.appendChild(trail);
  ScrollTrigger.create({
    trigger: stage, start: "top bottom", end: "bottom top",
    onUpdate: function (self) { trail.style.setProperty("--dust", Math.min(1, Math.abs(self.getVelocity()) / 1800)); }
  });
})();
