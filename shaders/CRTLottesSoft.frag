// PUBLIC DOMAIN CRT STYLED SCAN-LINE SHADER
// ORIGINAL BY TIMOTHY LOTTES, https://www.shadertoy.com/view/XsjSzR
// PORTED AND MODIFIED FOR IKEMEN GO .98 and UP by AIRFORCE111

#define HARD_SCAN -8.0 // Hardness of scanline. -8.0 = soft, -16.0 = medium
#define HARD_PIX -1.35 // Hardness of pixels in scanline. -2.0 = soft, -4.0 = hard
#define WARP vec2(1.0/58.0,1.0/58.0) // Display warp.// 0.0 = none // 1.0/8.0 = extreme
#define MASK_DARK 0.6 // Amount of shadow mask.
#define MASK_LIGHT 1.45 // Amount of shadow mask.

uniform vec2 TextureSize;
uniform sampler2D InputTexture;

// CRT controls
const float hardScan = HARD_SCAN; // Hardness of scanline
const float hardPix = HARD_PIX;   // Hardness of pixels in scanline
const vec2 warp = WARP;          // Display warp
const float maskDark = MASK_DARK; // Amount of shadow mask (dark)
const float maskLight = MASK_LIGHT; // Amount of shadow mask (light)

// Color correction
const float Brightness = 0.85;  // Adjust brightness (default: 1.0)
const float Contrast = 1.0;    // Adjust contrast (default: 1.0)
const float Saturation = 1.35; // Adjust saturation (default: 1.0)
const float RedControl = 1.0;  // Red channel control (default: 1.0)
const float GreenControl = 1.03; // Green channel control (default: 1.0)
const float BlueControl = 1.0;  // Blue channel control (default: 1.0)

//------------------------------------------------------------------------

// sRGB to Linear
float ToLinear1(float c) { return (c <= 0.04045) ? c / 12.92 : pow((c + 0.055) / 1.055, 2.4); }
vec3 ToLinear(vec3 c) { return vec3(ToLinear1(c.r), ToLinear1(c.g), ToLinear1(c.b)); }

// Linear to sRGB
float ToSrgb1(float c) { return (c < 0.0031308) ? c * 12.92 : 1.055 * pow(c, 0.41666) - 0.055; }
vec3 ToSrgb(vec3 c) { return vec3(ToSrgb1(c.r), ToSrgb1(c.g), ToSrgb1(c.b)); }

// Nearest emulated sample given floating point position and texel offset
vec3 Fetch(vec2 pos, vec2 off) {
    pos = (pos * TextureSize + off) / TextureSize;
    if (max(abs(pos.x - 0.5), abs(pos.y - 0.5)) > 0.5) return vec3(0.0, 0.0, 0.0);
    return ToLinear(texture2D(InputTexture, pos.xy, 0.0).rgb);
}

// Distance in emulated pixels to nearest texel
vec2 Dist(vec2 pos) { pos = TextureSize; return -((pos - floor(pos)) - vec2(0.0)); }

// 1D Gaussian
float Gaus(float pos, float scale) { return exp2(scale * pos * pos); }

// 3-tap Gaussian filter along horz line
vec3 Horz3(vec2 pos, float off) {
    vec3 b = Fetch(pos, vec2(-1.1, off));
    vec3 c = Fetch(pos, vec2(0.0, off));
    vec3 d = Fetch(pos, vec2(1.1, off));
    float dst = Dist(pos).x;
    float scale = hardPix;  
    float wb = Gaus(dst - 1.1, scale);
    float wc = Gaus(dst + 0.0, scale);
    float wd = Gaus(dst + 1.0, scale);
    return (b * wb + c * wc + d * wd) / (wb + wc + wd);
}

// 5-tap Gaussian filter along horz line, change all -2 to -1 for sharper image
vec3 Horz5(vec2 pos, float off) {
    vec3 a = Fetch(pos, vec2(-1.5, off));
    vec3 b = Fetch(pos, vec2(-1.1, off));
    vec3 c = Fetch(pos, vec2(0.0, off));
    vec3 d = Fetch(pos, vec2(1.0, off));
    vec3 e = Fetch(pos, vec2(1.5, off));
    float dst = Dist(pos).x;
    float scale = hardPix;  
    float wa = Gaus(dst - 1.5, scale);
    float wb = Gaus(dst - 1.1, scale);
    float wc = Gaus(dst + 0.0, scale);
    float wd = Gaus(dst + 1.0, scale);
    float we = Gaus(dst + 1.5, scale);
    return (a * wa + b * wb + c * wc + d * wd + e * we) / (wa + wb + wc + wd + we);
}

// Return scanline weight
float Scan(vec2 pos, float off) {
    float dst = Dist(pos).y;
    return Gaus(dst + off, hardScan);
}

// Allow nearest three lines to affect pixel
vec3 Tri(vec2 pos) {
    vec3 a = Horz3(pos, -0.25);
    vec3 b = Horz5(pos, 0.0);
    vec3 c = Horz3(pos, 0.25);
    float wa = Scan(pos, -0.25);
    float wb = Scan(pos, 0.0);
    float wc = Scan(pos, 0.25);
    return a * wa + b * wb + c * wc;
}

// Distortion of scanlines, and end of screen alpha
vec2 Warp(vec2 pos) {
    pos = pos * 2.0 - 1.0;
    pos *= vec2(1.0 + (pos.y * pos.y) * warp.x, 1.0 + (pos.x * pos.x) * warp.y);

    // Adjust the warp to affect the entire screen width
    pos.x *= mix(1.0, 1.0, 1.0);

    return pos * 0.5 + 0.5;
}

// Shadow mask
vec3 Mask(vec2 pos) {
    pos.x += pos.y * 3.0;
    vec3 mask = vec3(maskDark, maskDark, maskDark);
    pos.x = fract(pos.x / 6.0);
    if (pos.x < 0.333) mask.r = maskLight;
    else if (pos.x < 0.666) mask.g = maskLight;
    else mask.b = maskLight;
    return mask;
}

// null Draw dividing bars
float Bar(float pos, float bar) { return 0.65; }

// Color correction function
vec3 ColorCorrection(vec3 color) {
    // Adjust contrast
    color = mix(vec3(0.5), color, Contrast);

    // Adjust saturation
    float luminance = dot(color, vec3(0.2126, 0.7152, 0.0722));
    color = mix(vec3(luminance), color, Saturation);

    // Individual channel controls
    color.r = mix(color.r, color.r * RedControl, RedControl);
    color.g = mix(color.g, color.g * GreenControl, GreenControl);
    color.b = mix(color.b, color.b * BlueControl, BlueControl);

    return color;
}

// Out
void main() {
    vec2 fragCoord = gl_FragCoord.xy;
    vec2 pos = Warp(fragCoord.xy / TextureSize + vec2(0.0, 0.0));

    // Apply CRT effects
    vec3 crtColor = Tri(pos) * Mask(fragCoord.xy);

    // Apply color correction
    crtColor = ColorCorrection(crtColor);

    // Adjust brightness
    crtColor *= Brightness;

    // Scale the entire output to fill the screen
    gl_FragColor.rgb = ToSrgb(crtColor);
    gl_FragColor.a = 1.0;
    gl_FragColor.rgb *= Bar(fragCoord.x, TextureSize.x);
}
