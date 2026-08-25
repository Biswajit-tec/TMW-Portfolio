/**
 * shaders.js — WebGL shaders for the Reveal Loader.
 *
 * Vertex shader: passes UVs through to fragment.
 * Fragment shader: Perlin-noise radial dissolve driven by uTransition (0→1).
 * At 0: solid black fullscreen plane. At 1: fully transparent.
 * A glowing edge pulses outward as the transition progresses.
 */

export const vertexShader = /* glsl */`
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position, 1.0);
  }
`;

export const fragmentShader = /* glsl */`
  uniform float uTransition;
  uniform vec2  uResolution;
  uniform float uTime;
  uniform vec3  uBorderColor;

  varying vec2 vUv;

  // ─── Classic 3D Perlin Noise ───────────────────────────────────────────────
  vec4 permute(vec4 x) { return mod(((x * 34.0) + 1.0) * x, 289.0); }
  vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
  vec3 fade(vec3 t) { return t * t * t * (t * (t * 6.0 - 15.0) + 10.0); }

  float cnoise(vec3 P) {
    vec3 Pi0 = floor(P);
    vec3 Pi1 = Pi0 + vec3(1.0);
    Pi0 = mod(Pi0, 289.0);
    Pi1 = mod(Pi1, 289.0);
    vec3 Pf0 = fract(P);
    vec3 Pf1 = Pf0 - vec3(1.0);
    vec4 ix = vec4(Pi0.x, Pi1.x, Pi0.x, Pi1.x);
    vec4 iy = vec4(Pi0.yy, Pi1.yy);
    vec4 iz0 = Pi0.zzzz;
    vec4 iz1 = Pi1.zzzz;

    vec4 ixy  = permute(permute(ix) + iy);
    vec4 ixy0 = permute(ixy + iz0);
    vec4 ixy1 = permute(ixy + iz1);

    vec4 gx0 = ixy0 / 7.0;
    vec4 gy0 = fract(floor(gx0) / 7.0) - 0.5;
    gx0 = fract(gx0);
    vec4 gz0 = vec4(0.5) - abs(gx0) - abs(gy0);
    vec4 sz0 = step(gz0, vec4(0.0));
    gx0 -= sz0 * (step(0.0, gx0) - 0.5);
    gy0 -= sz0 * (step(0.0, gy0) - 0.5);

    vec4 gx1 = ixy1 / 7.0;
    vec4 gy1 = fract(floor(gx1) / 7.0) - 0.5;
    gx1 = fract(gx1);
    vec4 gz1 = vec4(0.5) - abs(gx1) - abs(gy1);
    vec4 sz1 = step(gz1, vec4(0.0));
    gx1 -= sz1 * (step(0.0, gx1) - 0.5);
    gy1 -= sz1 * (step(0.0, gy1) - 0.5);

    vec3 g000 = vec3(gx0.x, gy0.x, gz0.x);
    vec3 g100 = vec3(gx0.y, gy0.y, gz0.y);
    vec3 g010 = vec3(gx0.z, gy0.z, gz0.z);
    vec3 g110 = vec3(gx0.w, gy0.w, gz0.w);
    vec3 g001 = vec3(gx1.x, gy1.x, gz1.x);
    vec3 g101 = vec3(gx1.y, gy1.y, gz1.y);
    vec3 g011 = vec3(gx1.z, gy1.z, gz1.z);
    vec3 g111 = vec3(gx1.w, gy1.w, gz1.w);

    vec4 norm0 = taylorInvSqrt(vec4(dot(g000,g000), dot(g100,g100), dot(g010,g010), dot(g110,g110)));
    g000 *= norm0.x; g100 *= norm0.y; g010 *= norm0.z; g110 *= norm0.w;
    vec4 norm1 = taylorInvSqrt(vec4(dot(g001,g001), dot(g101,g101), dot(g011,g011), dot(g111,g111)));
    g001 *= norm1.x; g101 *= norm1.y; g011 *= norm1.z; g111 *= norm1.w;

    float n000 = dot(g000, Pf0);
    float n100 = dot(g100, vec3(Pf1.x, Pf0.yz));
    float n010 = dot(g010, vec3(Pf0.x, Pf1.y, Pf0.z));
    float n110 = dot(g110, vec3(Pf1.xy, Pf0.z));
    float n001 = dot(g001, vec3(Pf0.xy, Pf1.z));
    float n101 = dot(g101, vec3(Pf1.x, Pf0.y, Pf1.z));
    float n011 = dot(g011, vec3(Pf0.x, Pf1.yz));
    float n111 = dot(g111, Pf1);

    vec3  fade_xyz = fade(Pf0);
    float n_z  = mix(mix(n000, n100, fade_xyz.x), mix(n010, n110, fade_xyz.x), fade_xyz.y);
    float n_dz = mix(mix(n001, n101, fade_xyz.x), mix(n011, n111, fade_xyz.x), fade_xyz.y);
    return 2.2 * mix(n_z, n_dz, fade_xyz.z);
  }
  // ──────────────────────────────────────────────────────────────────────────

  void main() {
    // Pixelate UVs onto discrete blocks (10px grid → retro digital texture)
    float pixelSize   = 10.0;
    vec2  grid        = uResolution / pixelSize;
    vec2  pixelatedUv = floor(vUv * grid) / grid;

    // Correct aspect ratio so noise is not distorted on wide screens
    float aspect      = uResolution.x / uResolution.y;
    vec2  correctedUv = (pixelatedUv - 0.5) * vec2(aspect, 1.0) + 0.5;

    // Max distance from center to corner in corrected space
    float maxDistance = length(vec2(aspect, 1.0)) * 0.5;

    // Perlin noise displacement + strength
    vec2  displacedUv = correctedUv + cnoise(vec3(correctedUv * 5.0, uTime * 0.1));
    float strength    = cnoise(vec3(displacedUv * 5.0, uTime * 0.2));

    // Radial gradient (center=0, corner=1, drives the dissolve wave)
    float d                = length(correctedUv - 0.5);
    float normalizedDist   = d / maxDistance;
    float radialGradient   = normalizedDist * 12.5 + (1.0 - uTransition) * 2.0 - 15.0 * uTransition;
    float rawStrength      = strength + radialGradient;
    strength               = clamp(rawStrength, 0.0, 1.0);

    // Volumetric glow edge (20% screen-radius wide band)
    float edge = smoothstep(0.0, 0.7, rawStrength) * smoothstep(2.5, 0.7, rawStrength);
    edge      *= min(uTransition * 5.0, 1.0);

    // Derive dark + bright tones from the configurable border colour
    vec3 deepTone    = uBorderColor * 0.015;
    vec3 glowTone    = uBorderColor * 1.5;
    vec3 edgeColor   = mix(deepTone, glowTone, sin(uTime * 1.5) * 0.5 + 0.5);
    vec3 planeColor  = mix(vec3(0.0), edgeColor * 6.5, edge);

    float finalAlpha = max(strength, edge);
    gl_FragColor     = vec4(planeColor, finalAlpha);
  }
`;
