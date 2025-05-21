import * as d3 from "d3";
import * as THREE from "three";

import { getFibonacciDotsWithCountry } from "./getUniformDotsFromTexture.js";

import { getGeoData } from "../../../data/getData.js";

export class Rods {
  constructor() {
    return this;
  }

  async setup() {
    console.log("setup rods");

    let data = await getGeoData();

    let distributedPoints = await getFibonacciDotsWithCountry();

    // Add instanced cube geometry for each point

    let particleGeometry = new THREE.BoxGeometry(0.005, 0.005, 0.005);
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

    const heightScale = d3.scaleLinear().domain([0, 0.5]).range([1, 10]);

    for (let i = 0; i < distributedPoints.length; i++) {
      let country = distributedPoints[i].country;
      let coordinates = distributedPoints[i].coordinates;
      let value = data[country]?.footprint;

      const lat = THREE.MathUtils.degToRad(coordinates[1]);
      const lon = THREE.MathUtils.degToRad(coordinates[0]);
      const baseRadius = 1.0; // Sphere radius
      const height = heightScale(value);

      // The rod should start at the sphere surface and extend outward by half its height
      // Since the box is centered, move it out by (baseRadius + (height * 0.005) / 2)
      const rodLength = height * 0.005;
      const radius = baseRadius + rodLength / 2;

      const x = radius * Math.cos(lat) * Math.sin(lon);
      const y = radius * Math.sin(lat);
      const z = radius * Math.cos(lat) * Math.cos(lon);

      const pos = new THREE.Vector3(x, y, z);

      // Scale the height based on the value
      const scale = new THREE.Vector3(1, height, 1); // Scale the rod in the Y direction

      // Compute the direction from the center to the point (the normal)
      const normal = pos.clone().normalize();

      // Create a quaternion that rotates the rod to align with the normal
      const up = new THREE.Vector3(0, 1, 0); // Default up direction of the box
      const quaternion = new THREE.Quaternion().setFromUnitVectors(up, normal);

      // Create transformation matrix with rotation, scale, and position
      const matrix = new THREE.Matrix4().compose(pos, quaternion, scale);

      this.instancedParticles.setMatrixAt(i, matrix);

      this.particleTargets.push(pos);
      this.particlePositions.push(pos);
    }
  }
}
