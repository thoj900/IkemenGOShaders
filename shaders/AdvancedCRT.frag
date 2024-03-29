uniform sampler2D Texture; // Input texture
uniform vec2 TextureSize;  // Size of the input texture

//CRT controls
const float ScanlineIntensity = 0.36;    // Intensity of scanlines
const float PhosphorGlow = 0.04;        // Intensity of phosphor glow
const float chromaticAberrationIntensity = 0.001; // Self-explanatory
const float GlowIntensity = 0.1;       // Intensity of the glow effect (reduced for less brightness)
const float VignetteIntensity = 0.51;    // Intensity of the vignette effect

// Color correction parameters
const float Brightness = 0.0; // Adjust brightness (range: -1.0 to 1.0)
const float Contrast = 1.0;   // Adjust contrast (range: 0.0 to 2.0)
const float Saturation = 1.3; // Adjust saturation (range: 0.0 to 2.0)
const float RedAdjustment = 1.0; // Adjust red channel (range: 0.0 to 2.0)
const float GreenAdjustment = 1.04; // Adjust green channel (range: 0.0 to 2.0)
const float BlueAdjustment = 1.0; // Adjust blue channel (range: 0.0 to 2.0)

// Box blur + chromatic aberration
vec3 blurWithCA(vec2 uv, vec2 texelSize, sampler2D texture, vec2 fisheyeUV) {
    vec3 blur = vec3(0.0);
    // Increase blur by adjusting i and j floats
    for (float i = -0.7; i <= 0.7; i += 0.7) {
        for (float j = -0.7; j <= 0.7; j += 0.7) {
            vec2 offset = vec2(i, j) * texelSize;
            vec3 chromaticAberration = vec3(
                texture2D(texture, fisheyeUV + offset + vec2(chromaticAberrationIntensity, 0.0)).r,
                texture2D(texture, fisheyeUV + offset).g,
                texture2D(texture, fisheyeUV + offset - vec2(chromaticAberrationIntensity, 0.0)).b
            );
            blur += chromaticAberration;
        }
    }
    return blur / 9.0;
}

void main() {
    // Resolution
    vec2 uv = gl_FragCoord.xy / TextureSize;

    // TV bulge
    float fisheyeFactor = 0.58;  // Adjust this factor for the strength of the fisheye effect
    vec2 fisheye = (uv - vec2(0.5)) * fisheyeFactor;
    float fisheyeRadius = length(fisheye);
    float fisheyeIntensity = 0.95 - exp(-fisheyeRadius * fisheyeRadius / 1.8);  // Adjust the constant for the fisheye intensity
    vec2 fisheyeUV = uv + fisheye * fisheyeIntensity;

    // Box blur
    vec3 blurredColor = blurWithCA(uv, 1.0 / TextureSize, Texture, fisheyeUV);

    // Scanlines (horizontal)
    if (mod(gl_FragCoord.y, 2.0) < 1.0) {
        blurredColor *= 1.0 - ScanlineIntensity;
    }

    // Scanlines (vertical)
    if (mod(gl_FragCoord.x, 2.0) < 1.0) {
        blurredColor *= 1.0 - ScanlineIntensity;
    }

    // Phosphor glow
    blurredColor += PhosphorGlow * (blurredColor - 1.0);

    // Glow effect
    vec3 glow = texture2D(Texture, fisheyeUV).xyz;
    blurredColor += GlowIntensity * glow;

    // Vignette
    float vignette = smoothstep(1.0, 1.0 - VignetteIntensity, length(uv - 0.5));
    blurredColor *= vignette;

    // contrast
    blurredColor.rgb = ((blurredColor.rgb - 0.5) * max(Contrast, 0.0)) + 0.5;

    // brightness
    blurredColor.rgb += Brightness;

    // luma intensity
    float intensity = dot(blurredColor.rgb, vec3(0.2125, 0.7154, 0.0721));

    // saturation
    blurredColor.rgb = mix(vec3(intensity), blurredColor.rgb, Saturation);

    // separate channel adjustments
    blurredColor.r *= RedAdjustment;
    blurredColor.g *= GreenAdjustment;
    blurredColor.b *= BlueAdjustment;

    // output
    gl_FragColor = vec4(blurredColor, 1.0);
}
