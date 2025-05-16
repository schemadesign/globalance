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
    let pointMaterial = new THREE.MeshBasicMaterial({ color: 0x333333 });
    let pointMesh = new THREE.Mesh(pointGeometry, pointMaterial);

    this.randomPointSpheres = this.randomPoints.map((point) => {
      let sphere = pointMesh.clone();
      sphere.position.copy(point);

      return sphere;
    });

    // Particles
    let particleGeometry = new THREE.SphereGeometry(0.005, 16, 16);
    let particleMaterial = new THREE.MeshBasicMaterial({ color: 0xf8dc5d });

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

      let closestPoint = this.randomPoints.reduce((prev, curr) => {
        return prev.distanceTo(pos) < curr.distanceTo(pos) ? prev : curr;
      });

      let direction = closestPoint.clone().sub(pos).normalize();

      // If you are closer than 0.01 to the point, stop moving and move to a new random point
      if (pos.distanceTo(closestPoint) < 0.01) {
        pos = this.randomPointOnSphere(1.025);

        this.particleTargets[i] = pos;
      } else {
        // Move the particle towards the closest point but stay on the sphere
        let newPosition = pos.clone().add(direction.multiplyScalar(0.001));
        let newDirection = newPosition.clone().normalize();
        let newPoint = newDirection.multiplyScalar(1.025);

        pos = newPoint;

        this.particleTargets[i] = pos;
      }

      const matrix = new THREE.Matrix4().setPosition(pos);

      this.instancedParticles.setMatrixAt(i, matrix);
    }

    this.instancedParticles.instanceMatrix.needsUpdate = true;
  }
}
