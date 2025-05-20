import * as THREE from "three";

// Vertex shader for linear gradient
const vs_linearGradient = `
	varying vec2 vUv;
	void main() {
		vUv = uv;
		gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
	}
`;

// Fragment shader for linear gradient
const fs_linearGradient = `
	uniform vec3 color1;
	uniform vec3 color2;
	uniform float gradientStart;
	uniform float gradientEnd;
	varying vec2 vUv;
	void main() {
		float t = smoothstep(gradientStart, gradientEnd, vUv.y);
		vec3 color = mix(color1, color2, t);
		gl_FragColor = vec4(color, 1.0);
	}
`;

export const linearGradientMaterial = new THREE.ShaderMaterial({
	uniforms: {
		color1: { value: new THREE.Color(0x00aaff) },
		color2: { value: new THREE.Color(0xffffff) },
		gradientStart: { value: 0.0 },
		gradientEnd: { value: 1.0 },
	},
	vertexShader: vs_linearGradient,
	fragmentShader: fs_linearGradient,
	transparent: false,
	depthWrite: true,
});

export function getLinearGradientMaterial(color1, color2, start = 0.0, end = 1.0) {
	return new THREE.ShaderMaterial({
		uniforms: {
			color1: { value: color1 },
			color2: { value: color2 },
			gradientStart: { value: start },
			gradientEnd: { value: end },
		},
		vertexShader: vs_linearGradient,
		fragmentShader: fs_linearGradient,
		transparent: false,
		depthWrite: true,
	});
}