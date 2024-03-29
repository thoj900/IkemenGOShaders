uniform sampler2D Texture; // Input texture
const float Brightness = 0.0; // Adjust brightness (range: -1.0 to 1.0)
const float Contrast = 1.0;   // Adjust contrast (range: 0.0 to 2.0)
const float Saturation = 1.0; // Adjust saturation (range: 0.0 to 2.0)
const float RedAdjustment = 1.0; // Adjust red channel (range: 0.0 to 2.0)
const float GreenAdjustment = 1.0; // Adjust green channel (range: 0.0 to 2.0)
const float BlueAdjustment = 1.0; // Adjust blue channel (range: 0.0 to 2.0)

void main(void) {

    // Sample the color from the input texture
    vec4 color = texture2D(Texture, gl_TexCoord[0].xy);

    // Apply contrast
    color.rgb = ((color.rgb - 0.5) * max(Contrast, 0.0)) + 0.5;

    // Apply brightness
    color.rgb += Brightness;

    // Calculate intensity (luminance)
    float intensity = dot(color.rgb, vec3(0.2125, 0.7154, 0.0721));

    // Adjust saturation using linear interpolation
    color.rgb = mix(vec3(intensity), color.rgb, Saturation);

    // Apply separate channel adjustments
    color.r *= RedAdjustment;
    color.g *= GreenAdjustment;
    color.b *= BlueAdjustment;

    // Set the output color
    gl_FragColor = color;


}
