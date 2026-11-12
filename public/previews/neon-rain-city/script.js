// Neon Rain: scroll progress for the pinned scene, caption steps, pointer parallax, and pausing loops off screen.
(function () {
  var scene = document.getElementById("scene");
  if (!scene) return;
  var stage = scene.querySelector(".stage");
  var caps = [].slice.call(scene.querySelectorAll(".cap"));
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if ("IntersectionObserver" in window) {
    new IntersectionObserver(function (entries) {
      scene.classList.toggle("is-paused", !entries[0].isIntersecting);
    }).observe(scene);
  }
  if (reduce) return;

  // Scroll: one number from 0 to 1 drives every layer through CSS custom properties.
  var step = -1;
  var queued = false;
  function update() {
    queued = false;
    var max = scene.offsetHeight - window.innerHeight;
    var p = max > 0 ? Math.min(1, Math.max(0, -scene.getBoundingClientRect().top / max)) : 0;
    scene.style.setProperty("--p", p.toFixed(4));
    var next = p < 0.16 ? 0 : p < 0.42 ? 1 : p < 0.72 ? 2 : 3;
    if (next !== step) {
      step = next;
      caps.forEach(function (cap, i) {
        cap.classList.toggle("is-on", i === next);
        if (i === next) cap.removeAttribute("aria-hidden"); else cap.setAttribute("aria-hidden", "true");
      });
    }
  }
  function queue() { if (!queued) { queued = true; requestAnimationFrame(update); } }
  window.addEventListener("scroll", queue, { passive: true });
  window.addEventListener("resize", queue);
  update();

  // Pointer parallax, on devices with a real pointer only.
  if (window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
    var px = 0, py = 0, moving = false;
    stage.addEventListener("pointermove", function (e) {
      var r = stage.getBoundingClientRect();
      px = ((e.clientX - r.left) / r.width - 0.5) * 2;
      py = ((e.clientY - r.top) / r.height - 0.5) * 2;
      if (!moving) {
        moving = true;
        requestAnimationFrame(function () {
          moving = false;
          stage.style.setProperty("--mx", px.toFixed(3));
          stage.style.setProperty("--my", py.toFixed(3));
        });
      }
    });
  }
})();
