export default `
// MyFirstShader.glsl

// Vertex Shader
#ifdef GL_ES
precision mediump float;
#endif

attribute vec3 position;

void main() {
    gl_Position = vec4(position, 1.0);
}

// Fragment Shader
// #ifdef GL_ES
// precision mediump float;
// #endif

// uniform vec3 uColor;

// void main() {
//     gl_FragColor = vec4(uColor, 1.0);
// } `;
