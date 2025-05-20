import * as THREE from "three";

export class Flow {
  constructor(particleCount = 10000) {
    this.particleCount = particleCount;

    this.randomPointOnSphere = (radius) => {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const x = radius * Math.sin(phi) * Math.cos(theta);
      const y = radius * Math.sin(phi) * Math.sin(theta);
      const z = radius * Math.cos(phi);
      return new THREE.Vector3(x, y, z);
    };

    this.randomPoints = new Array(10)
      .fill(0)
      .map(() => this.randomPointOnSphere(1.025));

    // Attractor
    let pointGeometry = new THREE.SphereGeometry(0.02, 32, 32);
    let pointMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
    let pointMesh = new THREE.Mesh(pointGeometry, pointMaterial);

    this.randomPointSpheres = this.randomPoints.map((point) => {
      let sphere = pointMesh.clone();
      sphere.position.copy(point);

      return sphere;
    });

    // Particles
    // let particleGeometry = new THREE.SphereGeometry(0.005, 16, 16);
    // Make particle a small box
    let particleGeometry = new THREE.BoxGeometry(0.005, 0.05, 0.005);
    let particleMaterial = new THREE.ShaderMaterial({
      vertexShader: `
    varying vec3 vWorldPosition;

    void main() {
      vec4 worldPosition = modelMatrix * instanceMatrix * vec4(position, 1.0);
      vWorldPosition = worldPosition.xyz;
      gl_Position = projectionMatrix * viewMatrix * worldPosition;
    }
  `,
      fragmentShader: `
    uniform vec3 colorStart;
    uniform vec3 colorEnd;
    uniform float gradientHeight;
    varying vec3 vWorldPosition;

    void main() {
      float t = clamp((vWorldPosition.y + gradientHeight * 0.5) / gradientHeight, 0.0, 1.0);
      vec3 color = mix(colorStart, colorEnd, t);
      gl_FragColor = vec4(color, 1.0);
    }
  `,
      uniforms: {
        colorStart: { value: new THREE.Color(0xf8dc5d) }, // light yellow
        colorEnd: { value: new THREE.Color(0xff3c38) }, // reddish
        gradientHeight: { value: 2.0 }, // tweak this to cover the Y range of your scene
      },
    });

    this.instancedParticles = new THREE.InstancedMesh(
      particleGeometry,
      particleMaterial,
      this.particleCount
    );

    // Store target positions for each particle
    this.particleTargets = [];
    this.particlePositions = [];

    for (let i = 0; i < this.particleCount; i++) {
      const pos = this.randomPointOnSphere(1.025);
      const matrix = new THREE.Matrix4().setPosition(pos);

      this.instancedParticles.setMatrixAt(i, matrix);

      this.particleTargets.push(pos);
    }

    return this;
  }

  animate() {
    for (let i = 0; i < this.particleCount; i++) {
      let pos = this.particleTargets[i];

      // Find the closest attractor point
      let closestPoint = this.randomPoints.reduce((prev, curr) => {
        return prev.distanceTo(pos) < curr.distanceTo(pos) ? prev : curr;
      });

      // Compute direction of travel
      let direction = closestPoint.clone().sub(pos).normalize();

      // If close to attractor, pick a new random target
      if (pos.distanceTo(closestPoint) < 0.01) {
        pos = this.randomPointOnSphere(1.025);
        // this.particleTargets[i] = pos;
        // direction = pos.clone().normalize(); // fallback direction
      }

      // Move the particle towards the closest point but stay on the sphere
      let newPosition = pos
        .clone()
        .add(direction.clone().multiplyScalar(0.001));
      let newDirection = newPosition.clone().normalize();
      let newPoint = newDirection.multiplyScalar(1.025);

      direction = newPoint.clone().sub(pos).normalize(); // update direction of travel
      pos = newPoint;
      this.particleTargets[i] = pos;

      // Set matrix at new position and orientation
      const matrix = new THREE.Matrix4();

      // Compute quaternion to align particle's Y axis with direction of travel
      const up = new THREE.Vector3(0, 1, 0);
      const quaternion = new THREE.Quaternion().setFromUnitVectors(
        up,
        direction
      );

      matrix.makeRotationFromQuaternion(quaternion);
      matrix.setPosition(pos);

      this.instancedParticles.setMatrixAt(i, matrix);
    }

    this.instancedParticles.instanceMatrix.needsUpdate = true;
  }
}
