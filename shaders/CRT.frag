uniform sampler2D Texture; // Input texture
uniform vec2 TextureSize;  // Size of the input texture

const float ScanlineIntensity = 0.4;    // Intensity of scanlines
const float PhosphorGlow = 0.03;        // Intensity of phosphor glow (reduced for less brightness)
const float ChromaticAberration = 0.0007;// Intensity of chromatic aberration
const float GlowIntensity = 0.15;       // Intensity of the glow effect (reduced for less brightness)
const float VignetteIntensity = 0.41;    // Intensity of the vignette effect

void main() {
    // resolution
    vec2 uv = gl_FragCoord.xy / TextureSize;

    vec3 color = vec3(0.0);

    //tv bulge
    float fisheyeFactor = 0.58;  // Adjust this factor for the strength of the fisheye effect
    vec2 fisheye = (uv - vec2(0.5)) * fisheyeFactor;
    float fisheyeRadius = length(fisheye);
    float fisheyeIntensity = 0.95 - exp(-fisheyeRadius * fisheyeRadius / 1.8);  // Adjust the constant for the fisheye intensity
    vec2 fisheyeUV = uv + fisheye * fisheyeIntensity;

    // chromatic aberration
    float caIntensity = 0.0005;
    vec3 chromaticAberration = vec3(
        texture2D(Texture, fisheyeUV + vec2(caIntensity, 0.0)).r,
        texture2D(Texture, fisheyeUV).g,
        texture2D(Texture, fisheyeUV - vec2(caIntensity, 0.0)).b
    );
    color += chromaticAberration;

    //scanlines
    if (mod(gl_FragCoord.y, 2.0) < 1.0) {
        color *= 1.0 - ScanlineIntensity;
    }

    //phosphor glow
    color += PhosphorGlow * (color - 1.0);

    //glow effect
    vec3 glow = texture2D(Texture, fisheyeUV).xyz;
    color += GlowIntensity * glow;

    //vignette
    float vignette = smoothstep(1.0, 1.0 - VignetteIntensity, length(uv - 0.5));
    color *= vignette;

    // output
    gl_FragColor = vec4(color, 1.0);
}