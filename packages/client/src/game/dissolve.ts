// Card dissolve, after Balatro's Hanged Man: the card is eaten away in blocky
// noise, burning from the holes outward in gold, orange and red, with a
// charred rim before the untouched card.
import { Filter, GlProgram } from 'pixi.js';

const VERT = `
in vec2 aPosition;
out vec2 vTextureCoord;
out vec2 vPixel;
uniform vec4 uInputSize;
uniform vec4 uOutputFrame;
uniform vec4 uOutputTexture;

void main(void) {
  vec2 position = aPosition * uOutputFrame.zw + uOutputFrame.xy;
  position.x = position.x * (2.0 / uOutputTexture.x) - 1.0;
  position.y = position.y * (2.0 * uOutputTexture.z / uOutputTexture.y) - uOutputTexture.z;
  gl_Position = vec4(position, 0.0, 1.0);
  vTextureCoord = aPosition * (uOutputFrame.zw * uInputSize.zw);
  vPixel = vTextureCoord * uInputSize.xy;
}
`;

const FRAG = `
in vec2 vTextureCoord;
in vec2 vPixel;
out vec4 finalColor;
uniform sampler2D uTexture;
uniform float uAmount;
uniform float uSeed;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7)) + uSeed) * 43758.5453);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}

void main(void) {
  vec4 c = texture(uTexture, vTextureCoord);
  // Chunky pixels: sample the noise per 4x4 block of the card.
  vec2 block = floor(vPixel / 4.0);
  float n = 0.7 * noise(block * 0.18) + 0.3 * hash(block);
  float cut = uAmount * 1.15;
  if (n < cut) { finalColor = vec4(0.0); return; }
  // Burning edge, hottest at the hole.
  float edge = n - cut;
  if (uAmount > 0.0 && edge < 0.15) {
    vec3 fire = edge < 0.03 ? vec3(1.0, 0.86, 0.35)   // gold
              : edge < 0.07 ? vec3(0.99, 0.55, 0.05)  // orange
              : edge < 0.11 ? vec3(0.9, 0.24, 0.2)    // red
              : mix(vec3(0.16, 0.08, 0.06), c.rgb, 0.45); // charred
    c.rgb = fire * c.a;
  }
  finalColor = c;
}
`;

export function dissolveFilter(): Filter {
  return new Filter({
    glProgram: GlProgram.from({ vertex: VERT, fragment: FRAG, name: 'card-dissolve' }),
    resources: {
      dissolveUniforms: {
        uAmount: { value: 0, type: 'f32' },
        uSeed: { value: Math.random() * 100, type: 'f32' },
      },
    },
  });
}

export function setDissolve(f: Filter, amount: number): void {
  f.resources.dissolveUniforms.uniforms.uAmount = amount;
}
