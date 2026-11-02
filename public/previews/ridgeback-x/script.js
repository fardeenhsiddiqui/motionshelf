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
  tl.to(".mtn-far", { backgroundPositionX: "-500px" }, 0)
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

  // Dust kicked up behind the rear wheel.
  for (var i = 0; i < 10; i++) {
    var puff = document.createElement("span");
    puff.className = "dust";
    puff.setAttribute("aria-hidden", "true");
    slot.appendChild(puff);
    gsap.fromTo(puff,
      { x: "6%", y: "86%", opacity: 0.7, scale: 0.4 },
      { x: "-" + (20 + Math.random() * 40) + "%", y: (60 + Math.random() * 20) + "%", opacity: 0, scale: 2.8 + Math.random() * 2, duration: 1.4, repeat: -1, delay: i * 0.14, ease: "power1.out" });
  }
})();
