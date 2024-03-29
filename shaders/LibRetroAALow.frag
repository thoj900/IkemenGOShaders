/*
   Copyright (C) 2007 guest(r) - guest.r@gmail.com

   This program is free software; you can redistribute it and/or
   modify it under the terms of the GNU General Public License
   as published by the Free Software Foundation; either version 2
   of the License, or (at your option) any later version.

   This program is distributed in the hope that it will be useful,
   but WITHOUT ANY WARRANTY; without even the implied warranty of
   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
   GNU General Public License for more details.

   You should have received a copy of the GNU General Public License
   along with this program; if not, write to the Free Software
   Foundation, Inc., 59 Temple Place - Suite 330, Boston, MA  02111-1307, USA.
*/
//Modified for glsl v120 and ikemen go by airforce111

uniform sampler2D Texture;
uniform vec2 TextureSize;  // Size of the input texture
const float AAOFFSET = 1.0;
const float AAOFFSET2 = 0.5;

void main() {
    vec2 tex = gl_FragCoord.xy / TextureSize;
    vec2 texsize = TextureSize;  // Use textureSize to get the texture size
    float dx = AAOFFSET / texsize.x;
    float dy = AAOFFSET / texsize.y;
    vec3 dt = vec3(1.0, 1.0, 1.0);

    vec4 yx = vec4(dx, dy, -dx, -dy);
    vec4 xh = yx * vec4(0.0, 0.75, 0.0, 0.75); // 4.0
    vec4 yv = yx * vec4(0.75, 0.0, 0.75, 0.0);

    vec3 c11 = texture2D(Texture, tex).xyz;
    vec3 s00 = texture2D(Texture, tex + yx.zw).xyz;
    vec3 s20 = texture2D(Texture, tex + yx.xw).xyz;
    vec3 s22 = texture2D(Texture, tex + yx.xy).xyz;
    vec3 s02 = texture2D(Texture, tex + yx.zy).xyz;
    vec3 h00 = texture2D(Texture, tex + xh.zw).xyz;
    vec3 h20 = texture2D(Texture, tex + xh.xw).xyz;
    vec3 h22 = texture2D(Texture, tex + xh.xy).xyz;
    vec3 h02 = texture2D(Texture, tex + xh.zy).xyz;
    vec3 v00 = texture2D(Texture, tex + yv.zw).xyz;
    vec3 v20 = texture2D(Texture, tex + yv.xw).xyz;
    vec3 v22 = texture2D(Texture, tex + yv.xy).xyz;
    vec3 v02 = texture2D(Texture, tex + yv.zy).xyz;

    float m1 = 1.0 / (dot(abs(s00 - s22), dt) + 0.00001);
    float m2 = 1.0 / (dot(abs(s02 - s20), dt) + 0.00001);
    float h1 = 1.0 / (dot(abs(s00 - h22), dt) + 0.00001);
    float h2 = 1.0 / (dot(abs(s02 - h20), dt) + 0.00001);
    float h3 = 1.0 / (dot(abs(h00 - s22), dt) + 0.00001);
    float h4 = 1.0 / (dot(abs(h02 - s20), dt) + 0.00001);
    float v1 = 1.0 / (dot(abs(s00 - v22), dt) + 0.00001);
    float v2 = 1.0 / (dot(abs(s02 - v20), dt) + 0.00001);
    float v3 = 1.0 / (dot(abs(v00 - s22), dt) + 0.00001);
    float v4 = 1.0 / (dot(abs(v02 - s20), dt) + 0.00001);

    vec3 t1 = 0.5 * (m1 * (s00 + s22) + m2 * (s02 + s20)) / (m1 + m2);
    vec3 t2 = 0.5 * (h1 * (s00 + h22) + h2 * (s02 + h20) + h3 * (h00 + s22) + h4 * (h02 + s20)) / (h1 + h2 + h3 + h4);
    vec3 t3 = 0.5 * (v1 * (s00 + v22) + v2 * (s02 + v20) + v3 * (v00 + s22) + v4 * (v02 + s20)) / (v1 + v2 + v3 + v4);

    float k1 = 1.0 / (dot(abs(t1 - c11), dt) + 0.00001);
    float k2 = 1.0 / (dot(abs(t2 - c11), dt) + 0.00001);
    float k3 = 1.0 / (dot(abs(t3 - c11), dt) + 0.00001);

    // first pass
    vec4 firstPassColor = vec4((k1 * t1 + k2 * t2 + k3 * t3) / (k1 + k2 + k3), 1.0);

    // second pass
    float dx2 = pow(texsize.x, -1.0) * AAOFFSET2;
    float dy2 = pow(texsize.y, -1.0) * AAOFFSET2;
    vec2 UL = tex + vec2(-dx2, -dy2);
    vec2 UR = tex + vec2(dx2, -dy2);
    vec2 DL = tex + vec2(-dx2, dy2);
    vec2 DR = tex + vec2(dx2, dy2);

    vec3 c00_2 = texture2D(Texture, UL).xyz;
    vec3 c20_2 = texture2D(Texture, UR).xyz;
    vec3 c02_2 = texture2D(Texture, DL).xyz;
    vec3 c22_2 = texture2D(Texture, DR).xyz;

    float m1_2 = dot(abs(c00_2 - c22_2), dt) + 0.001;
    float m2_2 = dot(abs(c02_2 - c20_2), dt) + 0.001;

    vec4 secondPassColor = vec4((m1_2 * (c02_2 + c20_2) + m2_2 * (c22_2 + c00_2)) / (2.0 * (m1_2 + m2_2)), 1.0);

    // Combine the two effects (you may need to adjust this blend)
    gl_FragColor = mix(firstPassColor, secondPassColor, 0.5);
}
