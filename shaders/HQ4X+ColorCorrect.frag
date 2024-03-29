uniform sampler2D InputTexture; // Input texture
const float Brightness = 0.0075; // Adjust brightness (range: -1.0 to 1.0) Default = 0.0
const float Contrast = 0.92;   // Adjust contrast (range: 0.0 to 1.0) Default = 1.0
const float Saturation = 1.76; // Adjust saturation (range: 0.0 to 2.0) Default = 1.0
const float RedAdjustment = 1.0095; // Adjust red channel (range: 0.0 to 2.0) Default = 1.0
const float GreenAdjustment = 1.0; // Adjust green channel (range: 0.0 to 2.0) Default = 1.0
const float BlueAdjustment = 1.0; // Adjust blue channel (range: 0.0 to 2.0) Default = 1.0
const float mx = 1.00;		// start smoothing wt.
const float k = -1.10;		// wt. decrease factor
const float max_w = 0.75;	// max filter weigth
const float min_w = 0.03;	// min filter weigth
const float lum_add = 0.33;	// effects smoothing


void main() {

    //BEGIN COLOR CORRECTION
    // Sample the color from the input texture
    vec4 color = texture2D(InputTexture, gl_TexCoord[0].xy);

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

    //END COLOR CORRECTION

    //BEGIN HQ4X SHADER
	vec3 c  = texture2D(InputTexture, gl_TexCoord[0].xy).xyz;
	vec3 i1 = texture2D(InputTexture, gl_TexCoord[1].xy).xyz;
	vec3 i2 = texture2D(InputTexture, gl_TexCoord[2].xy).xyz;
	vec3 i3 = texture2D(InputTexture, gl_TexCoord[3].xy).xyz;
	vec3 i4 = texture2D(InputTexture, gl_TexCoord[4].xy).xyz;
	vec3 o1 = texture2D(InputTexture, gl_TexCoord[5].xy).xyz;
	vec3 o3 = texture2D(InputTexture, gl_TexCoord[6].xy).xyz;
	vec3 o2 = texture2D(InputTexture, gl_TexCoord[5].zw).xyz;
	vec3 o4 = texture2D(InputTexture, gl_TexCoord[6].zw).xyz;
	vec3 s1 = texture2D(InputTexture, gl_TexCoord[1].zw).xyz;
	vec3 s2 = texture2D(InputTexture, gl_TexCoord[2].zw).xyz;
	vec3 s3 = texture2D(InputTexture, gl_TexCoord[3].zw).xyz;
	vec3 s4 = texture2D(InputTexture, gl_TexCoord[4].zw).xyz;
	vec3 dt = vec3(1.0,1.0,1.0);
	float ko1=dot(abs(o1-c),dt);
	float ko2=dot(abs(o2-c),dt);
	float ko3=dot(abs(o3-c),dt);
	float ko4=dot(abs(o4-c),dt);
	float k1=min(dot(abs(i1-i3),dt),max(ko1,ko3));
	float k2=min(dot(abs(i2-i4),dt),max(ko2,ko4));
	float w1 = k2; if(ko3<ko1) w1*=ko3/ko1;
	float w2 = k1; if(ko4<ko2) w2*=ko4/ko2;
	float w3 = k2; if(ko1<ko3) w3*=ko1/ko3;
	float w4 = k1; if(ko2<ko4) w4*=ko2/ko4;
	c=(w1*o1+w2*o2+w3*o3+w4*o4+0.001*c)/(w1+w2+w3+w4+0.001);
	w1 = k*dot(abs(i1-c)+abs(i3-c),dt)/(0.125*dot(i1+i3,dt)+lum_add);
	w2 = k*dot(abs(i2-c)+abs(i4-c),dt)/(0.125*dot(i2+i4,dt)+lum_add);
	w3 = k*dot(abs(s1-c)+abs(s3-c),dt)/(0.125*dot(s1+s3,dt)+lum_add);
	w4 = k*dot(abs(s2-c)+abs(s4-c),dt)/(0.125*dot(s2+s4,dt)+lum_add);
	w1 = clamp(w1+mx,min_w,max_w);
	w2 = clamp(w2+mx,min_w,max_w);
	w3 = clamp(w3+mx,min_w,max_w);
	w4 = clamp(w4+mx,min_w,max_w);
	gl_FragColor.xyz=(w1*(i1+i3)+w2*(i2+i4)+w3*(s1+s3)+w4*(s2+s4)+c)/(2.0*(w1+w2+w3+w4)+1.0);
	gl_FragColor.a = 1.0;
    //END HQ4X SHADER

    //COMBINE
    // output color + hq4X effect results
    vec4 colorCorrectionResult = color;
    vec4 hq4xResult;
    hq4xResult.xyz=(w1*(i1+i3)+w2*(i2+i4)+w3*(s1+s3)+w4*(s2+s4)+c)/(2.0*(w1+w2+w3+w4)+1.0);
    hq4xResult.a = 1.0;
    
    //Blend     float blendFactor = 0.6; // You can adjust this based on your preference
    gl_FragColor = mix(colorCorrectionResult, hq4xResult, blendFactor);

}
