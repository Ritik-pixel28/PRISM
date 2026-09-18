"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";

interface SculptureProps {
  form: "cluster" | "fracture";
  moving: boolean;
  separation: number;
  stressed: boolean;
  resetKey: number;
}

function surfaceTexture(gold: boolean) {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 512;
  const context = canvas.getContext("2d")!;
  const pixels = context.createImageData(512, 512);
  for (let y = 0; y < 512; y++) {
    for (let x = 0; x < 512; x++) {
      const i = (y * 512 + x) * 4;
      const wave =
        Math.sin(x * 0.037 + Math.sin(y * 0.047) * 4) *
        Math.cos(y * 0.039 + Math.sin(x * 0.06) * 3);
      const grain = ((((x * 73856093) ^ (y * 19349663)) >>> 0) % 100) / 100;
      const flake = gold && wave > 0.24 && grain > 0.13;
      pixels.data[i] = flake ? 183 + grain * 55 : 52 + grain * 15;
      pixels.data[i + 1] = flake ? 146 + grain * 47 : 46 + grain * 14;
      pixels.data[i + 2] = flake ? 89 + grain * 32 : 70 + grain * 17;
      pixels.data[i + 3] = 255;
    }
  }
  context.putImageData(pixels, 0, 0);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  return texture;
}

export default function Sculpture(props: SculptureProps) {
  const host = useRef<HTMLDivElement>(null);
  const latest = useRef(props);
  const [rendererState, setRendererState] = useState("loading");
  useEffect(() => {
    latest.current = props;
  }, [props]);

  useEffect(() => {
    const container = host.current;
    if (!container) return;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: true,
        powerPreference: "high-performance",
      });
    } catch {
      queueMicrotask(() => setRendererState("unavailable"));
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.7));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    renderer.setClearColor(0x000000, 0);
    renderer.domElement.setAttribute(
      "aria-label",
      "Interactive 3D sculpture. Drag to rotate and scroll to zoom.",
    );
    renderer.domElement.setAttribute("role", "img");
    container.appendChild(renderer.domElement);
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(39, 1, 0.1, 60);
    camera.position.set(0, 0.25, 11.5);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enablePan = false;
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.enableZoom = true;
    controls.minDistance = 7.2;
    controls.maxDistance = 15;
    controls.rotateSpeed = 0.5;
    controls.zoomSpeed = 0.5;
    const environmentScene = new RoomEnvironment();
    const pmrem = new THREE.PMREMGenerator(renderer);
    const environment = pmrem.fromScene(environmentScene, 0.04);
    scene.environment = environment.texture;
    environmentScene.dispose();
    pmrem.dispose();
    scene.add(new THREE.AmbientLight(0x8785b3, 1.3));
    const key = new THREE.DirectionalLight(0xe9e2ff, 5);
    key.position.set(-3, 5, 3);
    scene.add(key);
    const fill = new THREE.DirectionalLight(0x7597d6, 2.5);
    fill.position.set(4, 0, 2);
    scene.add(fill);
    const rim = new THREE.DirectionalLight(0x9483c8, 4);
    rim.position.set(0, 3, -4);
    scene.add(rim);
    const composer = new EffectComposer(renderer);
    const renderPass = new RenderPass(scene, camera);
    const bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), 0.35, 0.4, 1.2);
    const outputPass = new OutputPass();
    composer.addPass(renderPass);
    composer.addPass(bloom);
    composer.addPass(outputPass);
    const sculpture = new THREE.Group();
    const cluster = new THREE.Group();
    const fracture = new THREE.Group();
    sculpture.add(cluster, fracture);
    scene.add(sculpture);
    const violetTexture = surfaceTexture(false);
    const goldTexture = surfaceTexture(true);
    const velvet = new THREE.MeshPhysicalMaterial({
      color: 0x6c607f,
      map: violetTexture,
      roughness: 0.67,
      metalness: 0.1,
      sheen: 0.4,
      sheenColor: new THREE.Color(0xada4d2),
      sheenRoughness: 0.6,
      envMapIntensity: 0.5,
      bumpMap: violetTexture,
      bumpScale: 0.027,
    });
    const blue = new THREE.MeshPhysicalMaterial({
      color: 0x789fb9,
      metalness: 0.96,
      roughness: 0.23,
      clearcoat: 0.8,
      envMapIntensity: 1.3,
    });
    const golden = new THREE.MeshPhysicalMaterial({
      color: 0xffe3a5,
      map: goldTexture,
      metalness: 0.72,
      roughness: 0.27,
      clearcoat: 0.7,
      bumpMap: goldTexture,
      bumpScale: 0.035,
    });
    const mercury = new THREE.MeshPhysicalMaterial({
      color: 0xa69baa,
      metalness: 0.96,
      roughness: 0.18,
      clearcoat: 1,
      envMapIntensity: 1.1,
    });
    const sphereGeometry = new THREE.SphereGeometry(1, 48, 40);
    const spheres: { mesh: THREE.Mesh; origin: THREE.Vector3; size: number }[] =
      [];
    const total = 26;
    for (let i = 0; i < total; i++) {
      const phi = Math.acos(1 - (2 * (i + 0.5)) / total);
      const theta = i * Math.PI * (3 - Math.sqrt(5));
      const origin = new THREE.Vector3(
        Math.cos(theta) * Math.sin(phi),
        Math.cos(phi),
        Math.sin(theta) * Math.sin(phi),
      ).multiplyScalar(2.05);
      const material =
        i % 9 === 0
          ? golden
          : i % 7 === 0
            ? mercury
            : i % 5 === 0
              ? blue
              : velvet;
      const mesh = new THREE.Mesh(sphereGeometry, material);
      const size = 0.66 + (i % 4) * 0.065;
      mesh.position.copy(origin);
      mesh.scale.setScalar(size);
      mesh.rotation.set(i * 0.7, i * 1.3, i * 0.4);
      cluster.add(mesh);
      spheres.push({ mesh, origin, size });
    }
    const rockGeometry = new THREE.IcosahedronGeometry(1.55, 4);
    const points = rockGeometry.getAttribute("position");
    for (let i = 0; i < points.count; i++) {
      const x = points.getX(i),
        y = points.getY(i),
        z = points.getZ(i);
      const noise =
        1 +
        Math.sin(x * 6 + z * 3) * Math.cos(y * 7) * 0.13 +
        Math.sin(z * 15 + x * 12) * 0.045;
      points.setXYZ(i, x * noise, y * noise * 1.15, z * noise);
    }
    rockGeometry.computeVertexNormals();
    const rockMaterial = new THREE.MeshStandardMaterial({
      color: 0x0b1820,
      roughness: 0.64,
      metalness: 0.75,
      flatShading: true,
    });
    const core = new THREE.Mesh(rockGeometry, rockMaterial);
    fracture.add(core);
    const shardGeometry = new THREE.IcosahedronGeometry(1, 0);
    const darkShard = new THREE.MeshStandardMaterial({
      color: 0x101921,
      metalness: 0.85,
      roughness: 0.37,
      flatShading: true,
    });
    const glowShard = new THREE.MeshStandardMaterial({
      color: 0x074450,
      emissive: 0x25c2db,
      emissiveIntensity: 4,
      roughness: 0.23,
      metalness: 0.3,
      flatShading: true,
    });
    const darkInstances = new THREE.InstancedMesh(
      shardGeometry,
      darkShard,
      180,
    );
    const glowInstances = new THREE.InstancedMesh(shardGeometry, glowShard, 48);
    const matrix = new THREE.Object3D();
    fracture.add(darkInstances, glowInstances);
    const particles = new Float32Array(180 * 3);
    for (let i = 0; i < 180; i++) {
      const phi = Math.acos(1 - (2 * (i + 0.5)) / 180);
      const theta = i * 2.39996;
      particles[i * 3] = Math.cos(theta) * Math.sin(phi);
      particles[i * 3 + 1] = Math.cos(phi);
      particles[i * 3 + 2] = Math.sin(theta) * Math.sin(phi);
    }
    const dustGeometry = new THREE.BufferGeometry();
    const dustPositions = new Float32Array(100 * 3);
    for (let i = 0; i < 100; i++) {
      dustPositions[i * 3] = Math.sin(i * 13.71) * 5;
      dustPositions[i * 3 + 1] = Math.cos(i * 9.71) * 3.8;
      dustPositions[i * 3 + 2] = Math.sin(i * 7.73) * 3;
    }
    dustGeometry.setAttribute(
      "position",
      new THREE.BufferAttribute(dustPositions, 3),
    );
    const dustMaterial = new THREE.PointsMaterial({
      color: 0x82b3ce,
      size: 0.018,
      transparent: true,
      opacity: 0.45,
      sizeAttenuation: true,
    });
    const dust = new THREE.Points(dustGeometry, dustMaterial);
    fracture.add(dust);
    let elapsed = 0,
      last = 0,
      morph = 0,
      spread = 0,
      previousReset = latest.current.resetKey;
    let frame = 0;
    let disposed = false;
    const lost = (event: Event) => {
      event.preventDefault();
      setRendererState("unavailable");
    };
    renderer.domElement.addEventListener("webglcontextlost", lost);
    function resize() {
      if (!container) return;
      const width = container.clientWidth,
        height = container.clientHeight;
      renderer.setSize(width, height);
      composer.setSize(width, height);
      camera.aspect = width / Math.max(height, 1);
      camera.updateProjectionMatrix();
    }
    const observer = new ResizeObserver(resize);
    observer.observe(container);
    resize();
    function animate(time: number) {
      if (disposed) return;
      frame = requestAnimationFrame(animate);
      if (document.hidden || time - last < 25) return;
      const delta = Math.min((time - last) / 1000, 0.05);
      last = time;
      const state = latest.current;
      if (state.moving) elapsed += delta;
      if (state.resetKey !== previousReset) {
        controls.reset();
        previousReset = state.resetKey;
      }
      const targetMorph = state.form === "fracture" ? 1 : 0;
      morph = THREE.MathUtils.damp(morph, targetMorph, 4, delta);
      spread = THREE.MathUtils.damp(spread, state.separation, 4, delta);
      cluster.visible = morph < 0.995;
      fracture.visible = morph > 0.005;
      cluster.scale.setScalar(Math.max(0.001, 1 - morph));
      fracture.scale.setScalar(Math.max(0.001, morph));
      sculpture.rotation.y = elapsed * 0.09;
      sculpture.rotation.z = Math.sin(elapsed * 0.2) * 0.07;
      sculpture.position.y = Math.sin(elapsed * 0.6) * 0.08;
      for (let i = 0; i < spheres.length; i++) {
        const { mesh, origin, size } = spheres[i];
        mesh.position.copy(origin).multiplyScalar(1 + spread * 0.9);
        mesh.position.y += Math.sin(elapsed * 0.6 + i) * 0.04;
        mesh.scale.setScalar(size * (1 - spread * 0.12));
      }
      for (let i = 0; i < 180; i++) {
        const distance =
          1.52 + (i % 11) * 0.014 + spread * (1.1 + (i % 13) * 0.19);
        matrix.position.set(
          particles[i * 3] * distance,
          particles[i * 3 + 1] * distance * 1.15,
          particles[i * 3 + 2] * distance,
        );
        matrix.rotation.set(i * 1.2 + elapsed * 0.015, i * 0.7, i * 0.9);
        const size = 0.09 + (i % 7) * 0.026;
        matrix.scale.set(size, size * 0.65, size * 0.85);
        matrix.updateMatrix();
        darkInstances.setMatrixAt(i, matrix.matrix);
        if (i < 48) {
          const angle = i * 2.39996;
          const latitude = Math.acos(1 - (2 * (i + 0.5)) / 48);
          const radius = 1.6 + spread * 0.9;
          matrix.position.set(
            Math.cos(angle) * Math.sin(latitude) * radius,
            Math.cos(latitude) * radius * 1.15,
            Math.sin(angle) * Math.sin(latitude) * radius,
          );
          matrix.scale.set(0.12 + (i % 4) * 0.04, 0.08 + (i % 3) * 0.06, 0.085);
          matrix.updateMatrix();
          glowInstances.setMatrixAt(i, matrix.matrix);
        }
      }
      darkInstances.instanceMatrix.needsUpdate = true;
      glowInstances.instanceMatrix.needsUpdate = true;
      core.scale.setScalar(1 - spread * 0.45);
      dust.rotation.y = elapsed * 0.03;
      glowShard.emissive.setHex(state.stressed ? 0x208bc9 : 0x25c2db);
      controls.update();
      key.intensity = THREE.MathUtils.lerp(3.5, 0.8, morph);
      fill.intensity = THREE.MathUtils.lerp(1.8, 0.6, morph);
      rim.intensity = THREE.MathUtils.lerp(3, 1.1, morph);
      bloom.strength = THREE.MathUtils.lerp(0.12, 0.7, morph);
      composer.render();
    }
    frame = requestAnimationFrame(animate);
    queueMicrotask(() => {
      if (!disposed) setRendererState("ready");
    });
    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      observer.disconnect();
      controls.dispose();
      renderer.domElement.removeEventListener("webglcontextlost", lost);
      [sphereGeometry, rockGeometry, shardGeometry, dustGeometry].forEach(
        (geometry) => geometry.dispose(),
      );
      [
        velvet,
        blue,
        golden,
        mercury,
        rockMaterial,
        darkShard,
        glowShard,
        dustMaterial,
      ].forEach((material) => material.dispose());
      violetTexture.dispose();
      goldTexture.dispose();
      environment.dispose();
      bloom.dispose();
      outputPass.dispose();
      composer.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);

  return (
    <div className="sculpture-host" ref={host} data-renderer={rendererState}>
      {rendererState === "loading" && (
        <span className="sculpture-loading">ASSEMBLING THE UNEXPECTED</span>
      )}
      {rendererState === "unavailable" && (
        <div className="webgl-fallback">
          <div className="fallback-sculpture">
            {Array.from({ length: 8 }, (_, index) => (
              <i key={index} />
            ))}
          </div>
          <p>
            3D rendering is unavailable in this browser.
            <br />
            All simulation and architecture tools remain available.
          </p>
        </div>
      )}
    </div>
  );
}
