import * as THREE from "three";

const sphereGeometry = new THREE.SphereGeometry(1, 64, 64);

const vs_glow = `
  uniform float c;
  uniform float p;
  varying float intensity;
  void main()
  {
    vec3 viewVector = normalize(vec3(cameraPosition - position));
    vec3 vNormal = normalize(normalMatrix * normal);
    vec3 vNormel = normalize(normalMatrix * viewVector);
    intensity = pow(c - dot(vNormal, vNormel), p);

    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fs_glow = `
  uniform vec3 glowColor;
  varying float intensity;
  void main()
  {
    // Only show color, no darkening where transparent
    float alpha = intensity;
    vec3 color = glowColor;
    gl_FragColor = vec4(color, alpha);
  }
`;

export const glowMaterial = new THREE.ShaderMaterial({
  uniforms: {
    c: { value: 1 },
    p: { value: 2 },
    glowColor: { value: new THREE.Color(1.0, 0.8, 0.0) },
  },

  vertexShader: vs_glow,
  fragmentShader: fs_glow,

  transparent: true,
  depthWrite: false,
});

const sphere = new THREE.Mesh(sphereGeometry, glowMaterial);
sphere.position.set(0, 0, 0);
