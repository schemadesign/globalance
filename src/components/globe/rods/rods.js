import * as THREE from "three";

import { getFibonacciDotsWithCountry } from "./getUniformDotsFromTexture.js";

export class Rods {
  constructor() {
    this.setup();

    let group = new THREE.Group();

    return this;
  }

  async setup() {
    let distributedPoints = await getFibonacciDotsWithCountry();

    // Add instanced cube geometry for each point

    let particleGeometry = new THREE.BoxGeometry(0.005, 0.05, 0.005);
    let particleMaterial = new THREE.MeshStandardMaterial({
      color: 0x45909b,
    });

    this.instancedParticles = new THREE.InstancedMesh(
      particleGeometry,
      particleMaterial,
      distributedPoints.length
    );

    this.particlePositions = [];
    this.particleTargets = [];

    for (let i = 0; i < distributedPoints.length; i++) {
      let coordinates = distributedPoints[i].coordinates;

      const lat = THREE.MathUtils.degToRad(coordinates[1]);
      const lon = THREE.MathUtils.degToRad(coordinates[0]);
      const radius = 1.025; // Adjusted radius for the globe

      const x = radius * Math.cos(lat) * Math.sin(lon);
      const y = radius * Math.sin(lat);
      const z = radius * Math.cos(lat) * Math.cos(lon);

      const pos = new THREE.Vector3(x, y, z);

      // Compute the direction from the center to the point (the normal)
      const normal = pos.clone().normalize();

      // Create a quaternion that rotates the rod to align with the normal
      const up = new THREE.Vector3(0, 1, 0); // Default up direction of the box
      const quaternion = new THREE.Quaternion().setFromUnitVectors(up, normal);

      // Create transformation matrix with rotation and position
      const matrix = new THREE.Matrix4()
      .makeRotationFromQuaternion(quaternion)
      .setPosition(pos);

      this.instancedParticles.setMatrixAt(i, matrix);

      this.particleTargets.push(pos);
      this.particlePositions.push(pos);
    }
  }
}
