import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';

// --- shared GLSL ----------------------------------------------------------
const noise = /* glsl */ `
  vec3 mod289(vec3 x){return x-floor(x*(1./289.))*289.;}
  vec4 mod289(vec4 x){return x-floor(x*(1./289.))*289.;}
  vec4 permute(vec4 x){return mod289(((x*34.)+1.)*x);}
  vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-.85373472095314*r;}
  float snoise(vec3 v){
    const vec2 C=vec2(1./6.,1./3.);const vec4 D=vec4(0.,.5,1.,2.);
    vec3 i=floor(v+dot(v,C.yyy));vec3 x0=v-i+dot(i,C.xxx);
    vec3 g=step(x0.yzx,x0.xyz);vec3 l=1.-g;vec3 i1=min(g.xyz,l.zxy);vec3 i2=max(g.xyz,l.zxy);
    vec3 x1=x0-i1+C.xxx;vec3 x2=x0-i2+C.yyy;vec3 x3=x0-D.yyy;i=mod289(i);
    vec4 p=permute(permute(permute(i.z+vec4(0.,i1.z,i2.z,1.))+i.y+vec4(0.,i1.y,i2.y,1.))+i.x+vec4(0.,i1.x,i2.x,1.));
    float n_=.142857142857;vec3 ns=n_*D.wyz-D.xzx;vec4 j=p-49.*floor(p*ns.z*ns.z);
    vec4 x_=floor(j*ns.z);vec4 y_=floor(j-7.*x_);vec4 x=x_*ns.x+ns.yyyy;vec4 y=y_*ns.x+ns.yyyy;vec4 h=1.-abs(x)-abs(y);
    vec4 b0=vec4(x.xy,y.xy);vec4 b1=vec4(x.zw,y.zw);vec4 s0=floor(b0)*2.+1.;vec4 s1=floor(b1)*2.+1.;vec4 sh=-step(h,vec4(0.));
    vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy;vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
    vec3 p0=vec3(a0.xy,h.x);vec3 p1=vec3(a0.zw,h.y);vec3 p2=vec3(a1.xy,h.z);vec3 p3=vec3(a1.zw,h.w);
    vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));p0*=norm.x;p1*=norm.y;p2*=norm.z;p3*=norm.w;
    vec4 m=max(.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.);m=m*m;
    return 42.*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));}
`;

// --- Sun ------------------------------------------------------------------
function Sun({ intro, rtl }: { intro: React.MutableRefObject<number>; rtl: boolean }) {
  const group = useRef<THREE.Group>(null!);
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: { uTime: { value: 0 } },
        vertexShader: /* glsl */ `
          varying vec3 vN; varying vec3 vP; varying vec3 vView;
          void main(){ vN=normalize(normalMatrix*normal); vP=position;
            vec4 mv=modelViewMatrix*vec4(position,1.); vView=normalize(-mv.xyz); gl_Position=projectionMatrix*mv; }`,
        fragmentShader: /* glsl */ `
          uniform float uTime; varying vec3 vN; varying vec3 vP; varying vec3 vView;
          ${noise}
          void main(){
            float n = snoise(vP*1.3 + vec3(0., uTime*.1, uTime*.05))*.32
                    + snoise(vP*3.5 - vec3(uTime*.15))*.12;
            vec3 deep=vec3(.88,.40,.08), mid=vec3(.965,.553,.18), hot=vec3(1.,.82,.55);
            vec3 col = mix(deep, mid, smoothstep(-.4,.5,n + vP.y*.35));
            col = mix(col, hot, smoothstep(.25,.9,n + vP.y*.5)*.65);
            float fres = pow(1.-max(dot(vN,vView),0.), 2.2);
            col += vec3(1.,.72,.42)*fres*.9;
            gl_FragColor = vec4(col,1.);
          }`,
      }),
    [],
  );
  const glow = useMemo(() => {
    const c = document.createElement('canvas');
    c.width = c.height = 256;
    const g = c.getContext('2d')!;
    const grd = g.createRadialGradient(128, 128, 0, 128, 128, 128);
    grd.addColorStop(0, 'rgba(255,190,125,0.85)');
    grd.addColorStop(0.35, 'rgba(246,141,46,0.35)');
    grd.addColorStop(1, 'rgba(246,141,46,0)');
    g.fillStyle = grd;
    g.fillRect(0, 0, 256, 256);
    return new THREE.CanvasTexture(c);
  }, []);

  useFrame((s) => {
    mat.uniforms.uTime.value = s.clock.elapsedTime;
    const k = intro.current;
    group.current.position.y = THREE.MathUtils.lerp(-3.2, 0.35, k);
    group.current.rotation.y = s.clock.elapsedTime * 0.05;
  });

  return (
    <group ref={group} position={[rtl ? -2.1 : 2.1, -3, -1.6]}>
      <mesh material={mat}>
        <sphereGeometry args={[1.15, 96, 96]} />
      </mesh>
      <sprite scale={[6, 6, 1]}>
        <spriteMaterial map={glow} transparent depthWrite={false} blending={THREE.AdditiveBlending} />
      </sprite>
    </group>
  );
}

// --- Ribbon: the flowing "path" from the logo --------------------------------
function Ribbon({ color, color2, offset, y, z, width, speed, opacity }: { color: string; color2: string; offset: number; y: number; z: number; width: number; speed: number; opacity: number }) {
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        transparent: true,
        side: THREE.DoubleSide,
        depthWrite: false,
        uniforms: { uTime: { value: 0 }, uC1: { value: new THREE.Color(color) }, uC2: { value: new THREE.Color(color2) }, uOff: { value: offset }, uOpacity: { value: opacity } },
        vertexShader: /* glsl */ `
          uniform float uTime; uniform float uOff; varying vec2 vUv; varying float vShade;
          void main(){
            vUv=uv; vec3 p=position; float t=uTime*${speed.toFixed(2)}+uOff;
            float wave = sin(p.x*.55 + t)*.55 + sin(p.x*1.3 - t*1.4)*.18;
            float twist = sin(p.x*.4 + t*.7)*.9;
            p.y += wave + p.y*cos(twist)*.0;
            p.z += sin(twist)*p.y*1.2 + cos(p.x*.35 + t)*.6;
            p.y *= 1. - .25*sin(p.x*.3+t);
            vShade = .55 + .45*cos(twist);
            gl_Position = projectionMatrix*modelViewMatrix*vec4(p,1.);
          }`,
        fragmentShader: /* glsl */ `
          uniform vec3 uC1; uniform vec3 uC2; uniform float uOpacity; varying vec2 vUv; varying float vShade;
          void main(){
            vec3 col = mix(uC1, uC2, vUv.y) * (.65 + vShade*.55);
            float sheen = pow(1.-abs(vUv.y-.5)*2., 6.)*.25;
            col += sheen;
            float edge = smoothstep(0.,.08,vUv.x)*smoothstep(1.,.92,vUv.x);
            gl_FragColor = vec4(col, uOpacity*edge);
          }`,
      }),
    [],
  );
  useFrame((s) => (mat.uniforms.uTime.value = s.clock.elapsedTime));
  return (
    <mesh material={mat} position={[0, y, z]} rotation={[0, 0, -0.12]} scale={[1, 1, 1]}>
      <planeGeometry args={[22, width, 220, 6]} />
    </mesh>
  );
}

// --- Embers: points of light rising (one for every few beneficiaries) --------
function Embers({ count = 1400 }) {
  const ref = useRef<THREE.Points>(null!);
  const { positions, seeds } = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const seeds = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 18;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 10;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 8 - 1;
      seeds[i] = Math.random();
    }
    return { positions, seeds };
  }, [count]);
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        uniforms: { uTime: { value: 0 }, uPx: { value: Math.min(window.devicePixelRatio, 2) } },
        vertexShader: /* glsl */ `
          uniform float uTime; uniform float uPx; attribute float aSeed; varying float vA; varying float vSeed;
          void main(){
            vec3 p=position; float t=uTime*(.15+aSeed*.25);
            p.y = mod(p.y + t + 5., 10.) - 5.;
            p.x += sin(t*2. + aSeed*20.)*.25;
            vec4 mv = modelViewMatrix*vec4(p,1.);
            gl_PointSize = (2. + aSeed*5.) * uPx * (6./-mv.z);
            vA = smoothstep(-5.,-2.,p.y)*smoothstep(5.,2.5,p.y)*(.35+.65*sin(uTime*2.+aSeed*40.)*.5+.5);
            vSeed = aSeed;
            gl_Position = projectionMatrix*mv;
          }`,
        fragmentShader: /* glsl */ `
          varying float vA; varying float vSeed;
          void main(){
            float d = length(gl_PointCoord-.5); float a = smoothstep(.5,0.,d);
            vec3 col = mix(vec3(1.,.75,.45), vec3(1.,.93,.82), vSeed);
            gl_FragColor = vec4(col, a*vA*.8);
          }`,
      }),
    [],
  );
  useFrame((s) => (mat.uniforms.uTime.value = s.clock.elapsedTime));
  return (
    <points ref={ref} material={mat}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-aSeed" args={[seeds, 1]} />
      </bufferGeometry>
    </points>
  );
}

// --- Camera rig: pointer parallax + scroll dolly ----------------------------
function Rig({ intro, rtl }: { intro: React.MutableRefObject<number>; rtl: boolean }) {
  const { camera, pointer, size } = useThree();
  const scroll = useRef(0);
  useEffect(() => {
    const on = () => (scroll.current = Math.min(window.scrollY / window.innerHeight, 1.2));
    addEventListener('scroll', on, { passive: true });
    return () => removeEventListener('scroll', on);
  }, []);
  useFrame((_, dt) => {
    const narrow = size.width < 760;
    const tx = pointer.x * 0.6;
    const ty = pointer.y * 0.35 + scroll.current * 1.2;
    camera.position.x += (tx - camera.position.x) * Math.min(dt * 2, 1);
    camera.position.y += (ty - camera.position.y) * Math.min(dt * 2, 1);
    camera.position.z = (narrow ? 11 : 8) + scroll.current * 2 - (1 - intro.current) * 1.5;
    camera.lookAt((narrow ? 0.4 : -0.6) * (rtl ? -1 : 1), 0, 0);
  });
  return null;
}

function Ready() {
  const fired = useRef(false);
  useFrame(() => {
    if (!fired.current) {
      fired.current = true;
      dispatchEvent(new Event('scene:ready'));
    }
  });
  return null;
}

export default function HeroScene({ rtl = false, sun = true }: { rtl?: boolean; sun?: boolean }) {
  const intro = useRef(0);
  const wrap = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(true);
  const [still, setStill] = useState(() => document.documentElement.dataset.motion === 'off');

  useEffect(() => {
    // Sun rises once the loader has lifted.
    const reduce = document.documentElement.dataset.motion === 'off';
    const start = () => {
      const t0 = performance.now();
      const dur = reduce ? 1 : 2600;
      const step = (now: number) => {
        const k = Math.min((now - t0) / dur, 1);
        intro.current = 1 - Math.pow(1 - k, 4);
        if (k < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    };
    if ((window as any).__amanLoaded) start();
    else addEventListener('loader:done', start, { once: true });

    const onSettings = () => {
      const off = document.documentElement.dataset.motion === 'off';
      if (off) intro.current = 1;
      setStill(off);
    };
    addEventListener('aman:settings', onSettings);
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting));
    if (wrap.current) io.observe(wrap.current);
    return () => {
      io.disconnect();
      removeEventListener('aman:settings', onSettings);
    };
  }, []);

  return (
    <div ref={wrap} style={{ position: 'absolute', inset: 0 }}>
      <Canvas
        frameloop={!visible ? 'never' : still ? 'demand' : 'always'}
        dpr={[1, 1.75]}
        camera={{ position: [0, 0, 8], fov: 42 }}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      >
        <Ready />
        <Rig intro={intro} rtl={rtl} />
        {sun && <Sun intro={intro} rtl={rtl} />}
        <Ribbon color="#004f59" color2="#0b6570" offset={0} y={-1.35} z={0.4} width={1.6} speed={0.35} opacity={0.96} />
        <Ribbon color="#2f8a92" color2="#004f59" offset={2.1} y={-1.9} z={-0.6} width={1.1} speed={0.28} opacity={0.55} />
        <Ribbon color="#f68d2e" color2="#ffbe7d" offset={4.2} y={-2.35} z={1.1} width={0.12} speed={0.42} opacity={0.85} />
        <Embers />
      </Canvas>
    </div>
  );
}
