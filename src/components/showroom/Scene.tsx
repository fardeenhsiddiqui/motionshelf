import { Suspense, useEffect, useLayoutEffect, useMemo, useRef, useState, type RefObject } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, Lightformer, PerformanceMonitor, useGLTF } from "@react-three/drei";
import { MathUtils, Box3, CanvasTexture, SRGBColorSpace, Vector3, type Group, type Material, type Mesh, type Object3D, type Texture, type WebGLRenderer } from "three";
import type { MotionValue } from "motion/react";

export type Input = { dragYaw: number; lastTouch: number };
export type Tier = 0 | 1 | 2;

const MODEL = "/assets/models/car-concept.glb";
const CAR_LENGTH = 4.4;
const TAU = Math.PI * 2;

// Camera and car pose per scroll chapter: [distance, elevation, look-at height, car yaw].
const KEYS = [
  { d: 7.0, e: 0.2, h: 0.55, yaw: -0.65 },
  { d: 8.6, e: 0.07, h: 0.5, yaw: -Math.PI / 2 },
  { d: 6.2, e: 0.4, h: 0.4, yaw: -Math.PI * 1.05 },
  { d: 7.6, e: 0.18, h: 0.55, yaw: -TAU + 0.5 },
];

const ease = (t: number) => t * t * (3 - 2 * t);

function sample(progress: number) {
  const scaled = MathUtils.clamp(progress, 0, 1) * (KEYS.length - 1);
  const i = Math.min(KEYS.length - 2, Math.floor(scaled));
  const t = ease(scaled - i);
  const a = KEYS[i];
  const b = KEYS[i + 1];
  return {
    d: MathUtils.lerp(a.d, b.d, t),
    e: MathUtils.lerp(a.e, b.e, t),
    h: MathUtils.lerp(a.h, b.h, t),
    yaw: MathUtils.lerp(a.yaw, b.yaw, t),
  };
}

// The loaded model is cached and shared by every mount, but react-three-fiber never disposes a <primitive>.
// Each renderer leaves listeners on the shared geometry and textures, which kept its canvas and WebGL context
// alive after the page unmounted: one canvas, context, 23 textures and 131 buffers leaked per visit. Releasing
// the GPU resources removes those listeners. The parsed model stays cached, so nothing is downloaded again.
function releaseGpuResources(root: Object3D) {
  root.traverse((object) => {
    const mesh = object as Mesh;
    mesh.geometry?.dispose();
    const materials: Material[] = Array.isArray(mesh.material) ? mesh.material : mesh.material ? [mesh.material] : [];
    for (const material of materials) {
      for (const value of Object.values(material)) if ((value as Texture | null)?.isTexture) (value as Texture).dispose();
      material.dispose();
    }
  });
}

// three.js keeps one shared "DFG_LUT" lighting texture at module level and uploads it into every renderer
// (getDFGLUT in three/src/renderers/shaders/DFGLUTData.js). Each renderer adds a dispose listener to it, and
// WebGLRenderer.dispose() never removes them, so every old renderer, its WebGL context and its canvas (and
// through the canvas, the whole detached page DOM) stayed in memory: one canvas and about 236 nodes per visit.
// Disposing the texture fires the event the listeners wait for. The next renderer uploads it again.
// It is read from the model's own materials: React has already detached the model from the R3F scene when cleanups run.
function releaseSharedLut(gl: WebGLRenderer, root: Object3D) {
  root.traverse((object) => {
    const material = (object as Mesh).material as Material | Material[] | undefined;
    for (const m of Array.isArray(material) ? material : material ? [material] : []) {
      const lut = (gl.properties.get(m) as { uniforms?: Record<string, { value?: Texture } | undefined> }).uniforms?.dfgLUT?.value;
      lut?.dispose();
    }
  });
}

function Car({ progress, input, still }: { progress: MotionValue<number>; input: RefObject<Input>; still: boolean }) {
  const { scene } = useGLTF(MODEL, false, true);
  const group = useRef<Group>(null);
  const yaw = useRef(KEYS[0].yaw);
  const gl = useThree((state) => state.gl);
  useEffect(() => () => { releaseSharedLut(gl, scene); releaseGpuResources(scene); }, [gl, scene]);

  // Fit on the body panels only: this model's wheel and brake meshes report inflated bounds.
  // The model is authored on the ground plane (y = 0) and points down +z.
  const fitted = useMemo(() => {
    const box = new Box3();
    scene.traverse((o) => {
      if (/^(Body|Interior)/.test(o.name)) box.expandByObject(o);
    });
    const size = box.getSize(new Vector3());
    const centre = box.getCenter(new Vector3());
    const scale = CAR_LENGTH / size.z;
    return { scale, offset: new Vector3(-centre.x * scale, 0, -centre.z * scale) };
  }, [scene]);

  useFrame((state, delta) => {
    const g = group.current;
    if (!g) return;
    const idle = !still && performance.now() - input.current.lastTouch > 2500;
    if (idle) input.current.dragYaw += delta * 0.12;
    const pose = sample(progress.get());
    yaw.current = MathUtils.damp(yaw.current, pose.yaw + input.current.dragYaw, 4, delta);
    g.rotation.y = yaw.current;

    // Slow dolly in on first paint, then the scroll-driven camera takes over.
    const intro = still ? 1 : ease(Math.min(1, state.clock.elapsedTime / 2.4));
    // Portrait screens are narrow: back the camera off so the whole car still fits.
    const aspect = state.size.width / state.size.height;
    const dist = (pose.d + (1 - intro) * 5) * (aspect < 1 ? 1 / aspect : 1);
    const lift = aspect < 1 ? dist * 0.08 : 0;
    const cam = state.camera;
    // On wide screens the car sits right of centre, leaving room for the copy on the left.
    const shift = state.size.width > 900 ? -1.1 : 0;
    cam.position.x = MathUtils.damp(cam.position.x, Math.sin(0.35) * dist + shift, 3, delta);
    cam.position.y = MathUtils.damp(cam.position.y, Math.sin(pose.e) * dist + pose.h - lift, 3, delta);
    cam.position.z = MathUtils.damp(cam.position.z, Math.cos(0.35) * Math.cos(pose.e) * dist, 3, delta);
    cam.lookAt(shift, pose.h - lift, 0);
  });

  return (
    <group ref={group}>
      <primitive object={scene} scale={fitted.scale} position={fitted.offset} />
    </group>
  );
}

// A soft blob under the car. One textured quad instead of a shadow render pass.
function GroundShadow() {
  const texture = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 256;
    const ctx = canvas.getContext("2d")!;
    const gradient = ctx.createRadialGradient(128, 128, 8, 128, 128, 128);
    gradient.addColorStop(0, "rgba(0,0,0,0.9)");
    gradient.addColorStop(0.55, "rgba(0,0,0,0.45)");
    gradient.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 256, 256);
    const map = new CanvasTexture(canvas);
    map.colorSpace = SRGBColorSpace;
    return map;
  }, []);
  return (
    <mesh rotation-x={-Math.PI / 2} position={[0, 0.004, 0]}>
      <planeGeometry args={[6.4, 9.4]} />
      <meshBasicMaterial map={texture} transparent depthWrite={false} toneMapped={false} />
    </mesh>
  );
}

function Studio() {
  return (
    <>
      {/* Procedural softboxes: a real studio look with no HDR download. */}
      <Environment resolution={256} frames={1}>
        <Lightformer form="rect" intensity={4} position={[0, 6, 0]} rotation={[Math.PI / 2, 0, 0]} scale={[10, 10, 1]} />
        <Lightformer form="rect" intensity={2.2} color="#ff7a4d" position={[6, 1.5, 1]} rotation={[0, -Math.PI / 2, 0]} scale={[8, 2.2, 1]} />
        <Lightformer form="rect" intensity={1.6} color="#7aa6ff" position={[-6, 1.5, -1]} rotation={[0, Math.PI / 2, 0]} scale={[8, 2.2, 1]} />
        <Lightformer form="ring" intensity={2} position={[0, 2, -7]} scale={6} />
        <Lightformer form="rect" intensity={0.8} position={[0, -2, 4]} rotation={[-Math.PI / 2.5, 0, 0]} scale={[8, 3, 1]} />
      </Environment>
      <directionalLight position={[4, 6, 5]} intensity={0.8} />
      <mesh rotation-x={-Math.PI / 2} position={[0, -0.002, 0]}>
        <circleGeometry args={[16, 64]} />
        <meshStandardMaterial color="#050609" roughness={0.8} metalness={0.1} envMapIntensity={0.12} />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.001, 0]}>
        <ringGeometry args={[4.6, 4.66, 128]} />
        <meshBasicMaterial color="#ff5a36" toneMapped={false} />
      </mesh>
      <GroundShadow />
      <fog attach="fog" args={["#07080b", 9, 17]} />
    </>
  );
}

type SceneProps = {
  progress: MotionValue<number>;
  input: RefObject<Input>;
  still: boolean;
  monitor: boolean;
  /** Show the fps and quality readout (development only, ?perf). */
  meter: boolean;
  active: boolean;
  onReady: () => void;
  onFail: () => void;
};

// The whole 3D scene. Loaded lazily, so three.js stays out of the main bundle.
export default function Scene({ progress, input, still, monitor, meter, active, onReady, onFail }: SceneProps) {
  const [tier, setTier] = useState<Tier>(2);
  const [fps, setFps] = useState(0);
  const ready = useRef(false);

  useLayoutEffect(() => {
    if (!ready.current) {
      ready.current = true;
      onReady();
    }
  }, [onReady]);

  const dpr: [number, number] = tier === 2 ? [1, 2] : tier === 1 ? [1, 1.5] : [1, 1];

  return (
    <>
      <Canvas
        dpr={dpr}
        frameloop={active ? "always" : "never"}
        camera={{ fov: 32, position: [3, 2, 12], near: 0.1, far: 60 }}
        gl={{ antialias: tier > 0, powerPreference: "high-performance", preserveDrawingBuffer: false }}
        onCreated={({ gl }) => {
          gl.domElement.addEventListener("webglcontextlost", (event) => { event.preventDefault(); onFail(); });
        }}
      >
        {monitor && (
          <PerformanceMonitor
            flipflops={3}
            onChange={({ fps: value }) => setFps(Math.round(value))}
            onDecline={() => { if (tier === 0) onFail(); else setTier((t) => (t - 1) as Tier); }}
            onIncline={() => setTier((t) => Math.min(2, t + 1) as Tier)}
            onFallback={onFail}
          />
        )}
        <Suspense fallback={null}>
          <Car progress={progress} input={input} still={still} />
          <Studio />
        </Suspense>
      </Canvas>
      {meter && <p className="showroom-meter" aria-hidden="true">{fps > 0 ? `${fps} fps · ` : ""}{["Low", "Medium", "High"][tier]} quality</p>}
    </>
  );
}

useGLTF.preload(MODEL, false, true);
