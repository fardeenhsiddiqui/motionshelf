// Vortex GT: optional 3D hero. Replaces the SVG car with a real-time model when WebGL is available.
// three.js is loaded from esm.sh (pinned). If anything fails, or motion is reduced, the SVG car simply stays.
// ?thumb (used by gallery thumbnails) skips the model download.
// The model path comes from data-model on the canvas, so move the .glb wherever your project keeps assets.
(function () {
  var canvas = document.querySelector(".car3d");
  if (!canvas || /[?&]thumb/.test(location.search) || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  var gl = document.createElement("canvas").getContext("webgl2");
  if (!gl) return;

  var THREE_URL = "https://esm.sh/three@0.160.0";
  Promise.all([
    import(THREE_URL),
    import("https://esm.sh/three@0.160.0/examples/jsm/loaders/GLTFLoader.js"),
    import("https://esm.sh/three@0.160.0/examples/jsm/libs/meshopt_decoder.module.js"),
    import("https://esm.sh/three@0.160.0/examples/jsm/environments/RoomEnvironment.js")
  ]).then(function (mods) {
    var THREE = mods[0];
    var loader = new mods[1].GLTFLoader();
    loader.setMeshoptDecoder(mods[2].MeshoptDecoder);
    loader.load(canvas.dataset.model, function (gltf) { start(THREE, gltf.scene, mods[3].RoomEnvironment); }, undefined, function () {});
  }).catch(function () {});

  function start(THREE, car, RoomEnvironment) {
    var renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;

    var scene = new THREE.Scene();
    var pmrem = new THREE.PMREMGenerator(renderer);
    scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

    // Fit on the body panels only: this model's wheel meshes report inflated bounds.
    var box = new THREE.Box3();
    car.traverse(function (o) { if (/^(Body|Interior)/.test(o.name)) box.expandByObject(o); });
    var size = box.getSize(new THREE.Vector3());
    var centre = box.getCenter(new THREE.Vector3());
    var scale = 4.4 / size.z;
    car.scale.setScalar(scale);
    car.position.set(-centre.x * scale, 0, -centre.z * scale);
    var pivot = new THREE.Group();
    pivot.add(car);
    scene.add(pivot);

    // A soft blob under the car, drawn once to a small canvas.
    var tex = document.createElement("canvas");
    tex.width = tex.height = 128;
    var ctx = tex.getContext("2d");
    var grad = ctx.createRadialGradient(64, 64, 4, 64, 64, 64);
    grad.addColorStop(0, "rgba(0,0,0,0.85)");
    grad.addColorStop(0.6, "rgba(0,0,0,0.35)");
    grad.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 128, 128);
    var shadow = new THREE.Mesh(new THREE.PlaneGeometry(6.2, 9), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(tex), transparent: true, depthWrite: false, toneMapped: false }));
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = 0.004;
    scene.add(shadow);

    // Show the canvas before measuring it: it is display:none until the model is ready.
    document.querySelector(".hero-stage").classList.add("has-3d");
    var camera = new THREE.PerspectiveCamera(30, 1, 0.1, 50);
    var target = { yaw: -0.6 }, drag = false, lastX = 0, idleAt = 0;
    function resize() {
      var w = canvas.clientWidth, h = canvas.clientHeight;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.position.set(2.2, 1.5, 6.1 / Math.min(1, camera.aspect * 1.1));
      camera.lookAt(0, 0.5, 0);
      camera.updateProjectionMatrix();
    }
    resize();
    window.addEventListener("resize", resize);

    canvas.addEventListener("pointerdown", function (e) { drag = true; lastX = e.clientX; idleAt = performance.now(); });
    window.addEventListener("pointerup", function () { drag = false; });
    window.addEventListener("pointermove", function (e) {
      if (!drag) return;
      target.yaw += (e.clientX - lastX) * 0.008;
      lastX = e.clientX;
      idleAt = performance.now();
    });

    var visible = true;
    new IntersectionObserver(function (entries) { visible = entries[0].isIntersecting; }).observe(canvas);
    var last = performance.now();
    function frame(now) {
      requestAnimationFrame(frame);
      if (!visible) return;
      var dt = Math.min(0.05, (now - last) / 1000); last = now;
      if (!drag && now - idleAt > 2500) target.yaw += dt * 0.25;
      pivot.rotation.y += (target.yaw - pivot.rotation.y) * Math.min(1, dt * 5);
      renderer.render(scene, camera);
    }
    requestAnimationFrame(frame);

  }
})();
