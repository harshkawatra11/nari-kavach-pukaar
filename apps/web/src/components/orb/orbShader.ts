// The orb's material. Displacement is two octaves of simplex noise scrolling
// in time, plus a live audio amplitude term written from a ref every frame
// (never React state, see Orb.tsx).
//
// Colour is a SPATIAL gradient across the surface normal, not a temporal one
// indexed by noise or displacement magnitude. That distinction mattered: an
// earlier version indexed hue by displacement, which put most of the sphere
// in the same colour band at any given instant and read as a solid-painted
// ball. A separate attempt used MeshPhysicalMaterial's built-in iridescence,
// which is real thin-film physics but only reveals colour at grazing viewing
// angles, so a straight-on hero shot read as flat grey. Indexing by the
// (rotating) surface normal against three fixed axes puts multiple hues on
// screen simultaneously regardless of camera angle, which is what the
// reference image actually shows: pink in one region, gold in another, at
// any single instant.

export const noiseGLSL = /* glsl */ `
  vec3 mod289(vec3 x){return x-floor(x*(1.0/289.0))*289.0;}
  vec4 mod289(vec4 x){return x-floor(x*(1.0/289.0))*289.0;}
  vec4 permute(vec4 x){return mod289(((x*34.0)+1.0)*x);}
  vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-0.85373472095314*r;}

  float snoise(vec3 v){
    const vec2 C = vec2(1.0/6.0, 1.0/3.0);
    const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
    vec3 i  = floor(v + dot(v, C.yyy));
    vec3 x0 = v - i + dot(i, C.xxx);
    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min(g.xyz, l.zxy);
    vec3 i2 = max(g.xyz, l.zxy);
    vec3 x1 = x0 - i1 + C.xxx;
    vec3 x2 = x0 - i2 + C.yyy;
    vec3 x3 = x0 - D.yyy;
    i = mod289(i);
    vec4 p = permute(permute(permute(
      i.z + vec4(0.0, i1.z, i2.z, 1.0))
    + i.y + vec4(0.0, i1.y, i2.y, 1.0))
    + i.x + vec4(0.0, i1.x, i2.x, 1.0));
    float n_ = 0.142857142857;
    vec3 ns = n_ * D.wyz - D.xzx;
    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_);
    vec4 x = x_ * ns.x + ns.yyyy;
    vec4 y = y_ * ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);
    vec4 b0 = vec4(x.xy, y.xy);
    vec4 b1 = vec4(x.zw, y.zw);
    vec4 s0 = floor(b0) * 2.0 + 1.0;
    vec4 s1 = floor(b1) * 2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));
    vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
    vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;
    vec3 p0 = vec3(a0.xy, h.x);
    vec3 p1 = vec3(a0.zw, h.y);
    vec3 p2 = vec3(a1.xy, h.z);
    vec3 p3 = vec3(a1.zw, h.w);
    vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
    p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
    vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
    m = m * m;
    return 42.0 * dot(m * m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
  }
`;

export const orbVertexShader = /* glsl */ `
  uniform float uTime;
  uniform float uAmplitude;
  uniform float uShock;
  varying vec3 vNormal;
  varying vec3 vViewDir;
  varying vec3 vObjectNormal;
  varying float vDisplacement;

  ${noiseGLSL}

  void main() {
    vec3 pos = position;
    float n1 = snoise(pos * 1.6 + vec3(0.0, 0.0, uTime * 0.18));
    float n2 = snoise(pos * 3.2 + vec3(0.0, uTime * 0.1, 0.0)) * 0.5;
    float noise = (n1 + n2) * 0.5;

    float ampBoost = uAmplitude * 1.4;
    float shockRing = sin(length(pos) * 8.0 - uShock * 14.0) * uShock * 0.35;

    float displacement = noise * (0.045 + ampBoost) + shockRing;
    vDisplacement = displacement;
    vObjectNormal = normalize(normal);

    vec3 displaced = pos + normal * displacement;
    vec4 worldPos = modelMatrix * vec4(displaced, 1.0);
    vViewDir = normalize(cameraPosition - worldPos.xyz);
    vNormal = normalize(mat3(modelMatrix) * normal);

    gl_Position = projectionMatrix * viewMatrix * worldPos;
  }
`;

export const orbFragmentShader = /* glsl */ `
  uniform float uShock;
  uniform vec3 uColorRose;
  uniform vec3 uColorPlum;
  uniform vec3 uColorGold;
  uniform vec3 uColorLilac;
  varying vec3 vNormal;
  varying vec3 vViewDir;
  varying vec3 vObjectNormal;
  varying float vDisplacement;

  void main() {
    float fresnel = pow(1.0 - max(dot(normalize(vNormal), normalize(vViewDir)), 0.0), 2.2);

    // Spatial gradient: each brand hue is anchored to a fixed direction on
    // the (rotating) object-space normal, so as the orb turns, the hues
    // sweep across the surface like light on real glass, but at any single
    // instant several are visible at once, the way the reference photo shows
    // pink and teal simultaneously.
    float roseWeight = smoothstep(-0.2, 1.0, dot(vObjectNormal, normalize(vec3(0.6, 0.7, 0.3))));
    float goldWeight = smoothstep(-0.2, 1.0, dot(vObjectNormal, normalize(vec3(-0.5, -0.6, 0.4))));
    float lilacWeight = smoothstep(-0.2, 1.0, dot(vObjectNormal, normalize(vec3(0.2, -0.8, -0.5))));

    vec3 color = uColorPlum;
    color = mix(color, uColorRose, roseWeight);
    color = mix(color, uColorGold, goldWeight * 0.85);
    color = mix(color, uColorLilac, lilacWeight * 0.6);

    // Noise-driven brightness variation so the surface still looks alive
    // and displaced, without it being the sole colour driver.
    color += vDisplacement * 0.6;

    vec3 shockColor = mix(color, uColorRose * 1.4, uShock);

    float specular = pow(max(dot(reflect(-vViewDir, vNormal), normalize(vec3(0.4, 0.6, 0.7))), 0.0), 40.0);
    vec3 finalColor = shockColor + fresnel * 0.4 + specular * 0.9;

    // Genuinely translucent, not a near-opaque tint: base alpha is low, rim
    // (fresnel) pushes toward opaque the way real glass thickens optically
    // at a grazing angle. Combined with side: THREE.DoubleSide on the
    // material (see Orb.tsx), this lets the far interior surface of the
    // sphere show through the near one, which is what actually reads as
    // "looking into glass" rather than "a solid ball with soft edges".
    float alpha = clamp(0.32 + fresnel * 0.55 + uShock * 0.4, 0.0, 0.92);
    gl_FragColor = vec4(finalColor, alpha);
  }
`;
