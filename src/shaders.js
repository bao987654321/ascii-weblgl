export const asciiFrag = `
precision lowp float;
uniform sampler2D u_texture;
varying vec2 v_texcoord;
varying vec3 instanceColors;

void main() {
    float a = texture2D(u_texture, v_texcoord).a;
    gl_FragColor = vec4(instanceColors, a);
}
`;

export const asciiVert = `
precision lowp float;

attribute vec2 a_pos;
attribute vec2 a_texcoord;
attribute vec2 a_center;

uniform sampler2D u_image;

uniform bool u_hasColor;
uniform vec2 u_texsize;
uniform float u_texStep;
uniform float u_asciiCount;
uniform float u_charsPerRow;

varying vec3 instanceColors;
varying vec2 v_texcoord;

float bitColor(float x, int levels) {
  float f_levels = float(levels);
  return floor(x * (f_levels - 1.0) + 1.0) / f_levels;
}

void main() {
    vec2 clipSpace = a_pos * 2.0 - 1.0;
    gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);
    vec4 pixel = texture2D(u_image, a_center);
    float luminance = 0.2126 * pixel.r + 0.7152 * pixel.g + 0.0722 * pixel.b;

    if (u_hasColor == true) {
      instanceColors = vec3(
        bitColor(pixel.r, 8),
        bitColor(pixel.g, 8),
        bitColor(pixel.b, 8)
      );
    } else {
      instanceColors = vec3(0, 0, 0);
    }


    float offset = floor(luminance * u_asciiCount);

    float xOffset = mod(offset, u_charsPerRow);
    float yOffset = (offset - xOffset) / u_charsPerRow;

    v_texcoord = (vec2(xOffset, yOffset) * u_texStep + a_texcoord) / u_texsize;
}
`;
