attribute vec2 VertCoord;
varying vec4 TexCoord;

void main() {
    gl_Position = vec4(VertCoord, 0.0, 1.0);
    TexCoord.xy = TexCoord.xy * 1.00001;
}