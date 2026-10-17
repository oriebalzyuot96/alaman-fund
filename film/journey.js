// "The Journey" — a scripted 3D film of an orphaned young person's path with Al Aman.
// Every frame is a pure function of time: window.renderAt(t) draws the frame at t seconds,
// so the film renders identically (and smoothly) no matter how slow the capture is.
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';

export const DURATION = 26;
const W = 1280, H = 720;

// ---- helpers -------------------------------------------------------------
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const ease = (x) => { x = clamp(x); return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
const easeOut = (x) => 1 - Math.pow(1 - clamp(x), 3);
const span = (t, a, b) => clamp((t - a) / (b - a));
const lerp = (a, b, k) => a + (b - a) * k;
function rng(seed) { return () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let r = Math.imul(seed ^ (seed >>> 15), 1 | seed); r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r; return ((r ^ (r >>> 14)) >>> 0) / 4294967296; }; }
const rand = rng(2006);

const C = { teal950: 0x00262b, teal900: 0x00353c, teal800: 0x004f59, teal700: 0x0b6570, teal500: 0x2f8a92, teal200: 0xb9dcdc, sun: 0xf68d2e, sun300: 0xffbe7d, sand: 0xd3bba8, sage: 0x6fa287 };

// ---- renderer / scene -----------------------------------------------------
const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(1);
renderer.setSize(W, H);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(C.teal950, 0.028);
const camera = new THREE.PerspectiveCamera(42, W / H, 0.1, 400);

const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const bloom = new UnrealBloomPass(new THREE.Vector2(W, H), 0.9, 0.6, 0.72);
composer.addPass(bloom);
composer.addPass(new OutputPass());

// Sky dome: dusk teal that warms toward dawn as the film progresses.
const skyMat = new THREE.ShaderMaterial({
  side: THREE.BackSide, depthWrite: false, fog: false,
  uniforms: { uDawn: { value: 0 }, uSunDir: { value: new THREE.Vector3(0, 0.1, -1) } },
  vertexShader: `varying vec3 vDir; void main(){ vDir = normalize(position); gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
  fragmentShader: `uniform float uDawn; uniform vec3 uSunDir; varying vec3 vDir;
    void main(){
      float h = vDir.y;
      vec3 top = mix(vec3(0.0,0.035,0.05), vec3(0.05,0.18,0.24), uDawn);
      vec3 hor = mix(vec3(0.0,0.16,0.19), vec3(0.85,0.42,0.16), uDawn);
      vec3 col = mix(hor, top, smoothstep(-0.05, 0.55, h));
      float g = pow(max(dot(normalize(vDir), normalize(uSunDir)), 0.), 6.);
      col += vec3(1.,0.55,0.2) * g * (0.1 + uDawn*0.45);
      // stars fade out at dawn
      float s = fract(sin(dot(floor(vDir*400.), vec3(12.9898,78.233,37.719)))*43758.5453);
      col += vec3(step(0.9985, s)) * (1.-uDawn) * smoothstep(0.05,0.4,h) * 0.8;
      gl_FragColor = vec4(col,1.);
    }`,
});
scene.add(new THREE.Mesh(new THREE.SphereGeometry(300, 48, 24), skyMat));

const hemi = new THREE.HemisphereLight(0x6fbfc4, 0x00262b, 0.55);
scene.add(hemi);
const dawnLight = new THREE.DirectionalLight(0xffb070, 0);
dawnLight.position.set(0, 20, -120);
scene.add(dawnLight);

// Ground with soft rolling dunes.
const groundGeo = new THREE.PlaneGeometry(400, 400, 160, 160);
groundGeo.rotateX(-Math.PI / 2);
{
  const p = groundGeo.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), z = p.getZ(i);
    const d = Math.abs(x - pathX(z)); // keep the path corridor flat
    const hill = (Math.sin(x * 0.08) * Math.cos(z * 0.06) + Math.sin(x * 0.03 + z * 0.05)) * 1.6;
    p.setY(i, hill * smoothstepJS(3, 14, d) - 0.05);
  }
  groundGeo.computeVertexNormals();
}
function smoothstepJS(a, b, x) { const k = clamp((x - a) / (b - a)); return k * k * (3 - 2 * k); }
scene.add(new THREE.Mesh(groundGeo, new THREE.MeshStandardMaterial({ color: 0x062f35, roughness: 1 })));

// ---- the path (the ribbon from the logo) ---------------------------------
function pathX(z) { return Math.sin(z * 0.045) * 6 + Math.sin(z * 0.017) * 4; }
const LEN = 130;
const pts = [];
for (let i = 0; i <= 60; i++) { const z = -i * (LEN / 60); pts.push(new THREE.Vector3(pathX(z), 0.06, z)); }
const curve = new THREE.CatmullRomCurve3(pts);

function ribbonGeometry(width, segs = 600) {
  const pos = [], uv = [], idx = [];
  const up = new THREE.Vector3(0, 1, 0);
  for (let i = 0; i <= segs; i++) {
    const u = i / segs;
    const p = curve.getPointAt(u), tan = curve.getTangentAt(u);
    const side = new THREE.Vector3().crossVectors(tan, up).normalize().multiplyScalar(width / 2);
    pos.push(p.x - side.x, p.y, p.z - side.z, p.x + side.x, p.y, p.z + side.z);
    uv.push(u, 0, u, 1);
    if (i < segs) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  return g;
}
const ribbonMat = new THREE.ShaderMaterial({
  transparent: true, side: THREE.DoubleSide, depthWrite: false,
  uniforms: { uTime: { value: 0 }, uHead: { value: 0 } },
  vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
  fragmentShader: `uniform float uTime; uniform float uHead; varying vec2 vUv;
    void main(){
      float edge = smoothstep(0.0,0.06,vUv.y)*smoothstep(1.0,0.94,vUv.y);
      vec3 col = mix(vec3(0.0,0.17,0.2), vec3(0.02,0.25,0.28), vUv.y);
      // light pulses flowing forward along the path
      float flow = pow(0.5+0.5*sin((vUv.x*90.0 - uTime*3.0)), 18.0) * 0.6;
      // the path ahead is unlit until the traveler reaches it
      float lit = smoothstep(uHead+0.06, uHead-0.01, vUv.x);
      float rim = smoothstep(0.08,0.0,vUv.y) + smoothstep(0.92,1.0,vUv.y);
      col += vec3(1.0,0.55,0.2) * (rim*0.9*lit + flow*0.5*lit);
      col *= 0.45 + 0.55*lit;
      gl_FragColor = vec4(col, 0.95*edge + rim*0.5);
    }`,
});
scene.add(new THREE.Mesh(ribbonGeometry(2.4), ribbonMat));

// ---- traveler: the young person, a small warm light ----------------------
function glowSprite(color, size, opacity = 1) {
  const c = document.createElement('canvas'); c.width = c.height = 128;
  const g = c.getContext('2d'); const grd = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  grd.addColorStop(0, 'rgba(255,255,255,1)'); grd.addColorStop(0.25, 'rgba(255,255,255,0.6)'); grd.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grd; g.fillRect(0, 0, 128, 128);
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(c), color, transparent: true, opacity, depthWrite: false, blending: THREE.AdditiveBlending }));
  s.scale.setScalar(size); return s;
}
const traveler = new THREE.Group();
const core = new THREE.Mesh(new THREE.SphereGeometry(0.22, 32, 16), new THREE.MeshBasicMaterial({ color: 0xffd6a8 }));
traveler.add(core, glowSprite(C.sun, 2.4, 0.9));
const tLight = new THREE.PointLight(C.sun, 6, 12, 1.6);
traveler.add(tLight);
scene.add(traveler);

// ---- chapter monuments ----------------------------------------------------
const STD = (color, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.6, metalness: 0.05, ...extra });
function at(u, sideOffset) {
  const p = curve.getPointAt(u), tan = curve.getTangentAt(u);
  const side = new THREE.Vector3().crossVectors(tan, new THREE.Vector3(0, 1, 0)).normalize();
  return p.clone().addScaledVector(side, sideOffset);
}

// 1. Care home (cold, behind the start)
const careHome = new THREE.Group();
{
  const body = new THREE.Mesh(new THREE.BoxGeometry(3, 2, 2.4), STD(0x2a4c51));
  body.position.y = 1;
  const roof = new THREE.Mesh(new THREE.ConeGeometry(2.4, 1.4, 4), STD(0x1c383c));
  roof.position.y = 2.7; roof.rotation.y = Math.PI / 4;
  const door = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 1.2), new THREE.MeshBasicMaterial({ color: 0xffc58a }));
  door.position.set(0, 0.6, 1.21);
  careHome.add(body, roof, door);
  careHome.position.copy(at(0.0, 0)).add(new THREE.Vector3(0, 0, 3.2));
  careHome.rotation.y = Math.PI;
  scene.add(careHome);
}

// 2. Education: a stack of books and a mortarboard
const edu = new THREE.Group();
{
  const cols = [C.teal700, C.sun, C.sand, C.teal500];
  cols.forEach((c, i) => {
    const b = new THREE.Mesh(new THREE.BoxGeometry(2.2 - i * 0.15, 0.38, 1.5), STD(c));
    b.position.y = 0.2 + i * 0.4; b.rotation.y = (i % 2 ? 0.18 : -0.12);
    edu.add(b);
  });
  const cap = new THREE.Group();
  const board = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.08, 1.8), STD(0x0d2a2e));
  const crown = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.65, 0.5, 24), STD(0x0d2a2e));
  crown.position.y = -0.28;
  const tassel = new THREE.Mesh(new THREE.SphereGeometry(0.1, 12, 8), new THREE.MeshBasicMaterial({ color: C.sun }));
  tassel.position.set(0.8, -0.2, 0.8);
  cap.add(board, crown, tassel); cap.position.y = 2.6; cap.rotation.y = Math.PI / 4;
  edu.add(cap); edu.userData.cap = cap;
  edu.position.copy(at(0.2, 3.6));
  scene.add(edu);
}

// 3. Living support: a warm home inside a protective dome (aman = safety)
const home = new THREE.Group();
const domeMat = new THREE.ShaderMaterial({
  transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending,
  uniforms: { uK: { value: 0 } },
  vertexShader: `varying vec3 vN; varying vec3 vV; varying float vY; void main(){ vN=normalize(normalMatrix*normal); vec4 mv=modelViewMatrix*vec4(position,1.); vV=normalize(-mv.xyz); vY=position.y; gl_Position=projectionMatrix*mv; }`,
  fragmentShader: `uniform float uK; varying vec3 vN; varying vec3 vV; varying float vY;
    void main(){ float f = pow(1.-abs(dot(vN,vV)), 2.5); float grow = step(vY, mix(-0.1, 5.0, uK));
      float bands = 0.5+0.5*sin(vY*14.); gl_FragColor = vec4(vec3(1.,0.62,0.28)*(f*0.9+bands*0.04), (f*0.75+0.04)*grow*uK); }`,
});
const windowsMat = new THREE.MeshBasicMaterial({ color: 0x331a08 });
{
  const body = new THREE.Mesh(new THREE.BoxGeometry(2.6, 1.8, 2.2), STD(0xd9c6b4));
  body.position.y = 0.9;
  const roof = new THREE.Mesh(new THREE.ConeGeometry(2.1, 1.3, 4), STD(C.teal800));
  roof.position.y = 2.45; roof.rotation.y = Math.PI / 4;
  [-0.7, 0.7].forEach((x) => { const w = new THREE.Mesh(new THREE.PlaneGeometry(0.55, 0.55), windowsMat); w.position.set(x, 1.05, 1.11); home.add(w); });
  const dome = new THREE.Mesh(new THREE.SphereGeometry(4.2, 48, 24, 0, Math.PI * 2, 0, Math.PI / 2), domeMat);
  home.add(body, roof, dome);
  home.position.copy(at(0.4, -4.2));
  home.rotation.y = 0.5;
  scene.add(home);
}
const homeLight = new THREE.PointLight(0xffa860, 0, 14, 1.5);
homeLight.position.copy(home.position).add(new THREE.Vector3(0, 1.4, 1.6));
scene.add(homeLight);

// 4. Capacity building: a staircase that rises step by step
const stairs = new THREE.Group();
const STEPS = 7;
for (let i = 0; i < STEPS; i++) {
  const s = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.45 * (i + 1), 1.6), STD(i === STEPS - 1 ? C.sun : i % 2 ? C.teal500 : C.sand, { emissive: i === STEPS - 1 ? C.sun : C.teal700, emissiveIntensity: i === STEPS - 1 ? 0.8 : 0.25 }));
  s.position.set(i * 1.1, 0, 0);
  stairs.add(s);
}
stairs.position.copy(at(0.62, -3.2));
stairs.rotation.y = 2.4;
const stairLight = new THREE.PointLight(0xffb070, 0, 16, 1.4);
stairLight.position.copy(stairs.position).add(new THREE.Vector3(0, 5, 0));
scene.add(stairLight);
scene.add(stairs);

// 5. Community: lights that gather around the traveler (psychosocial support, inclusion)
const friends = [];
for (let i = 0; i < 42; i++) {
  const g = glowSprite(i % 3 ? 0xffd2a0 : C.teal200, 0.35 + rand() * 0.35, 0.85);
  g.userData = { a: rand() * Math.PI * 2, r: 1.4 + rand() * 2.6, h: 0.3 + rand() * 1.8, sp: 0.4 + rand() * 0.8, from: new THREE.Vector3((rand() - 0.5) * 60, 4 + rand() * 10, (rand() - 0.5) * 40) };
  scene.add(g); friends.push(g);
}

// 6. Sunrise at the end of the path (the logo's sun)
const sun = new THREE.Group();
const sunMat = new THREE.ShaderMaterial({
  uniforms: { uTime: { value: 0 } }, fog: false,
  vertexShader: `varying vec3 vN; varying vec3 vP; void main(){ vN=normalize(normalMatrix*normal); vP=position; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
  fragmentShader: `uniform float uTime; varying vec3 vN; varying vec3 vP;
    void main(){ float n = sin(vP.x*0.8+uTime*0.4)*sin(vP.y*0.9-uTime*0.3)*0.15;
      vec3 col = mix(vec3(0.88,0.40,0.08), vec3(1.0,0.78,0.48), clamp(0.55+vP.y*0.05+n,0.,1.));
      col += vec3(1.,0.6,0.3)*pow(1.-abs(vN.z),2.)*0.4; gl_FragColor=vec4(col*1.1,1.); }`,
});
sun.add(new THREE.Mesh(new THREE.SphereGeometry(9, 64, 32), sunMat), glowSprite(C.sun, 46, 0.28));
scene.add(sun);
const endPoint = curve.getPointAt(1);

// Embers drifting upward across the whole film.
const EMB = 900;
const embGeo = new THREE.BufferGeometry();
const embBase = new Float32Array(EMB * 3), embSeed = new Float32Array(EMB);
for (let i = 0; i < EMB; i++) { embBase[i * 3] = (rand() - 0.5) * 70; embBase[i * 3 + 1] = rand() * 14; embBase[i * 3 + 2] = -rand() * 150 + 10; embSeed[i] = rand(); }
embGeo.setAttribute('position', new THREE.BufferAttribute(embBase.slice(), 3));
const embers = new THREE.Points(embGeo, new THREE.PointsMaterial({ color: 0xffc489, size: 0.09, transparent: true, opacity: 0.8, depthWrite: false, blending: THREE.AdditiveBlending }));
scene.add(embers);

// ---- timeline -------------------------------------------------------------
// Traveler progress along the path: slows at each chapter so the moment can land.
const KEYS = [[0, 0.0], [3.0, 0.02], [5.0, 0.15], [8.0, 0.2], [10.0, 0.35], [12.6, 0.4], [14.4, 0.55], [17.0, 0.62], [19.0, 0.76], [21.0, 0.84], [26.0, 1.0]];
function progress(t) {
  for (let i = 1; i < KEYS.length; i++) {
    const [t0, u0] = KEYS[i - 1], [t1, u1] = KEYS[i];
    if (t <= t1) return lerp(u0, u1, ease((t - t0) / (t1 - t0)));
  }
  return 1;
}

const tmp = new THREE.Vector3();
window.renderAt = (t) => {
  const u = clamp(progress(t), 0, 0.995);
  const p = curve.getPointAt(u);
  const bob = Math.sin(t * 3) * 0.08;
  traveler.position.set(p.x, 0.55 + bob, p.z);
  ribbonMat.uniforms.uTime.value = t;
  ribbonMat.uniforms.uHead.value = u;

  // chapter 1 — leaving care at 18: cold, dim, the traveler alone
  const dawn = easeOut(span(t, 19.5, 25));
  skyMat.uniforms.uDawn.value = dawn;
  scene.fog.color.setRGB(lerp(0, 0.3, dawn), lerp(0.1, 0.17, dawn), lerp(0.12, 0.15, dawn));
  scene.fog.density = lerp(0.03, 0.012, dawn);
  tLight.intensity = lerp(2.5, 7, span(t, 2, 6));
  core.scale.setScalar(lerp(0.7, 1.15, span(t, 2, 20)));

  // chapter 2 — education rises out of the ground
  const ek = easeOut(span(t, 4.2, 6.2));
  edu.position.y = lerp(-3.2, 0, ek);
  edu.userData.cap.position.y = 2.6 + Math.sin(t * 1.5) * 0.15 + easeOut(span(t, 6.5, 8)) * 0.5;
  edu.userData.cap.rotation.y = Math.PI / 4 + t * 0.4;

  // chapter 3 — a safe home: windows warm up, the dome of safety forms
  const hk = span(t, 9.2, 12);
  windowsMat.color.setRGB(lerp(0.2, 1, hk), lerp(0.1, 0.72, hk), lerp(0.03, 0.4, hk));
  homeLight.intensity = hk * 9;
  domeMat.uniforms.uK.value = easeOut(span(t, 10, 12.8));

  // chapter 4 — skills: steps rise one by one
  stairs.children.forEach((s, i) => {
    const k = easeOut(span(t, 13.6 + i * 0.35, 14.4 + i * 0.35));
    const h = 0.45 * (i + 1);
    s.position.y = lerp(-h, h / 2, k);
  });
  stairLight.intensity = span(t, 13.4, 15) * 10;

  // chapter 5 — community gathers around the traveler, then everyone walks on together
  friends.forEach((f, i) => {
    const d = f.userData;
    const k = ease(span(t, 17 + (i % 10) * 0.12, 19.5 + (i % 10) * 0.12));
    const a = d.a + t * d.sp;
    tmp.set(traveler.position.x + Math.cos(a) * d.r, d.h + Math.sin(t * 2 + i) * 0.2, traveler.position.z + Math.sin(a) * d.r);
    f.position.lerpVectors(d.from, tmp, k);
    f.material.opacity = 0.85 * k;
  });

  // chapter 6 — sunrise over the end of the path
  sunMat.uniforms.uTime.value = t;
  const sk = easeOut(span(t, 19.8, 25.5));
  sun.position.set(endPoint.x, lerp(-14, 8, sk), endPoint.z - 60);
  dawnLight.intensity = sk * 1.4;
  hemi.intensity = lerp(0.55, 0.8, sk);
  skyMat.uniforms.uSunDir.value.copy(sun.position).normalize();
  bloom.strength = lerp(0.8, 0.6, sk);
  renderer.toneMappingExposure = lerp(1.05, 0.85, sk);

  // embers
  const ep = embGeo.attributes.position;
  for (let i = 0; i < EMB; i++) {
    const s = embSeed[i];
    ep.setXYZ(i, embBase[i * 3] + Math.sin(t * 0.8 + s * 30) * 0.6, (embBase[i * 3 + 1] + t * (0.25 + s * 0.5)) % 14, embBase[i * 3 + 2]);
  }
  ep.needsUpdate = true;

  // camera: follows behind the traveler, framing each chapter; lifts away for the sunrise
  const look = curve.getPointAt(clamp(u + 0.035, 0, 1));
  const behind = curve.getPointAt(clamp(u - 0.045, 0, 1));
  const sway = Math.sin(t * 0.35) * 1.6;
  const intro = 1 - easeOut(span(t, 0, 4)); // opens close on the care home door
  const lift = ease(span(t, 20.5, 26));
  camera.position.set(
    lerp(behind.x + sway + 2.5, p.x + 7, intro * 0.85),
    lerp(2.6 + Math.sin(t * 0.5) * 0.3, 2.2, intro * 0.85) + lift * 6,
    lerp(behind.z + 2, careHome.position.z + 3, intro * 0.85) + lift * 10,
  );
  tmp.set(lerp(look.x, sun.position.x, lift * 0.7), lerp(0.9, sun.position.y * 0.6, lift), lerp(look.z, sun.position.z, lift * 0.5));
  camera.lookAt(tmp);

  composer.render();
};

window.renderAt(0);
window.FILM = { duration: DURATION, width: W, height: H };
