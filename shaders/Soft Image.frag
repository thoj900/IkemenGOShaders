//Soft Image
uniform sampler2D Texture; // Input texture

uniform vec2 TextureSize; // Size of the input texture

const float Brightness = 0.5;
const float Contrast = 0.08;
const float Saturation = 8.5;
const float RedAdjustment = 1.0;
const float GreenAdjustment = 1.0;
const float BlueAdjustment = 1.0;
const float SharpenIntensity = -0.5;

vec3 applyContrastAndBrightness(vec3 color, float contrast, float brightness) {
    return ((color - 0.5) * max(contrast, 0.0)) + 0.5 + brightness;
}

vec3 apply2xSaIShader(vec2 uv) {
    vec3 center = texture2D(Texture, uv).xyz;
    vec3 top = texture2D(Texture, uv + vec2(0.0, 1.0) / TextureSize).xyz;
    vec3 bottom = texture2D(Texture, uv - vec2(0.0, 1.0) / TextureSize).xyz;
    vec3 left = texture2D(Texture, uv - vec2(1.0, 0.0) / TextureSize).xyz;
    vec3 right = texture2D(Texture, uv + vec2(1.0, 0.0) / TextureSize).xyz;
    vec3 color1 = mix(left, right, 0.5);
    vec3 color2 = mix(top, bottom, 0.5);
    return mix(color1, color2, 0.5);
}

void main() {
    vec2 uv = gl_FragCoord.xy / TextureSize;

    vec4 color = texture2D(Texture, uv);

    color.rgb = applyContrastAndBrightness(color.rgb, Contrast, Brightness);

    float intensity = dot(color.rgb, vec3(0.2125, 0.7154, 0.0721));
    color.rgb = mix(vec3(intensity), color.rgb, Saturation);

    color.r *= RedAdjustment;
    color.g *= GreenAdjustment;
    color.b *= BlueAdjustment;

    vec3 secondShaderColor = apply2xSaIShader(uv);

    vec3 center = texture2D(Texture, gl_TexCoord[0].xy).xyz;
    vec3 top = texture2D(Texture, gl_TexCoord[0].xy + vec2(0.0, 1.0) / TextureSize).xyz;
    vec3 bottom = texture2D(Texture, gl_TexCoord[0].xy - vec2(0.0, 1.0) / TextureSize).xyz;
    vec3 left = texture2D(Texture, gl_TexCoord[0].xy - vec2(1.0, 0.0) / TextureSize).xyz;
    vec3 right = texture2D(Texture, gl_TexCoord[0].xy + vec2(1.0, 0.0) / TextureSize).xyz;
    vec3 sharpenedColor = center + SharpenIntensity * (center - 0.25 * (top + bottom + left + right));

    vec3 result = mix(sharpenedColor, secondShaderColor, 0.5);
    gl_FragColor = vec4(result * color.rgb, 1.0);
}
