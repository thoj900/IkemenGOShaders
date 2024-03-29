//Softer Image
uniform sampler2D Texture; // Input texture

uniform vec2 TextureSize; // Set your screen resolution here

const float Brightness = 0.5; // Adjust brightness (range: -1.0 to 1.0) default 0.5
const float Contrast = 0.08;   // Adjust contrast (range: 0.0 to 1.0) also tied to Saturation
const float Saturation = 8.5; // Adjust saturation (range: 0.0 to 10.0) adjust accordingly with Contrast
const float RedAdjustment = 1.0; // Adjust red channel (range: 0.0 to 2.0)
const float GreenAdjustment = 1.0; // Adjust green channel (range: 0.0 to 2.0)
const float BlueAdjustment = 1.0; // Adjust blue channel (range: 0.0 to 2.0)

void main() {
    vec4 color = texture2D(Texture, gl_TexCoord[0].xy);

    // contrast
    color.rgb = ((color.rgb - 0.5) * max(Contrast, 0.0)) + 0.5;

    // brightness
    color.rgb += Brightness;

    // intensity (luminance)
    float intensity = dot(color.rgb, vec3(0.2125, 0.7154, 0.0721));

    // saturation using linear interpolation
    color.rgb = mix(vec3(intensity), color.rgb, Saturation);

    // separate channel adjustments
    color.r *= RedAdjustment;
    color.g *= GreenAdjustment;
    color.b *= BlueAdjustment;

    // calculate texel size using predefined resolution
    vec2 texelSize = 1.0 / TextureSize;

    // second shader
    vec2 uv = gl_FragCoord.xy * texelSize;
    vec3 center = texture2D(Texture, uv).xyz;
    vec3 top = texture2D(Texture, uv + vec2(0.0, texelSize.y)).xyz;
    vec3 bottom = texture2D(Texture, uv - vec2(0.0, texelSize.y)).xyz;
    vec3 left = texture2D(Texture, uv - vec2(texelSize.x, 0.0)).xyz;
    vec3 right = texture2D(Texture, uv + vec2(texelSize.x, 0.0)).xyz;
    vec3 color1 = mix(left, right, 0.5);
    vec3 color2 = mix(top, bottom, 0.5);
    vec3 result = mix(color1, color2, 0.5);

    // Combine the results
    gl_FragColor = vec4(result * color.rgb, 1.0);
}
