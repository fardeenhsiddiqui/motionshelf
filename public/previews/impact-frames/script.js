// Impact Frames: the Hit button, reveal on scroll, and pausing loops while a section is off screen.
(function () {
  var hero = document.getElementById("hero");
  var hit = document.getElementById("hit");
  if (hero && hit) {
    var timer = 0;
    hit.addEventListener("click", function () {
      hero.classList.remove("is-hit");
      void hero.offsetWidth; // restart the animations if it is hit again
      hero.classList.add("is-hit");
      clearTimeout(timer);
      timer = setTimeout(function () { hero.classList.remove("is-hit"); }, 1000);
    });
  }
  if (!("IntersectionObserver" in window)) {
    [].slice.call(document.querySelectorAll(".reveal")).forEach(function (el) { el.classList.add("in"); });
    return;
  }
  var reveal = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("in");
      reveal.unobserve(entry.target);
    });
  }, { rootMargin: "0px 0px -8% 0px" });
  [].slice.call(document.querySelectorAll(".reveal")).forEach(function (el) { reveal.observe(el); });
  var pause = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) { entry.target.classList.toggle("is-paused", !entry.isIntersecting); });
  });
  [].slice.call(document.querySelectorAll(".hero, .panel, .ticker")).forEach(function (el) { pause.observe(el); });
})();
