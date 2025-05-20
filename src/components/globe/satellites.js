import * as THREE from "three";

export class Satellites {
  constructor(portfolioData, options) {
    this.portfolioData = portfolioData;

    this.satelliteGeometry = new THREE.SphereGeometry(0.03, 32, 32);

    this.satelliteMaterial = new THREE.MeshStandardMaterial({
      color: 0xcccccc,
      emissive: 0xcccccc,
      emissiveIntensity: 0.5,
      opacity: 1,
    });

    this.orbitMaterial = new THREE.LineBasicMaterial({ color: 0x000000 });

    //

    this.orbits = new Array(portfolioData.length).fill(0).map((d, i) => {
      let orbit = new THREE.EllipseCurve(
        0,
        0,
        1.5 + Math.random() * 0.5, // Orbit radius
        1.5 + Math.random() * 0.5, // Orbit radius
        0,
        Math.PI * 2,
        false,
        0
      );

      return orbit;
    });

    const orbitMaterial = new THREE.LineBasicMaterial({ color: 0x000000 });

    // Contains all the orbit groups
    this.orbitsGroup = new THREE.Group();

    this.satellites = [];

    // Add satellites to each orbit
    this.orbits.forEach((orbit, index) => {
      let orbitGroup = new THREE.Group();

      const points = orbit.getPoints(100);
      const geometry = new THREE.BufferGeometry().setFromPoints(points);

      const ellipse = new THREE.Line(geometry, orbitMaterial);
      // orbitGroup.add(ellipse);

      let xRotation = Math.random() * Math.PI;
      let yRotation = Math.random() * Math.PI;
      let zRotation = Math.random() * Math.PI;

      orbitGroup.rotation.x = xRotation;
      orbitGroup.rotation.y = yRotation;
      orbitGroup.rotation.z = zRotation;

      // Add one satellite to each orbit
      const satellite = new THREE.Mesh(
        this.satelliteGeometry,
        this.satelliteMaterial
      );

      let scale = portfolioData[index]["Position Weight"] * 100;

      satellite.scale.set(scale, scale, scale);

      const point = orbit.getPoint(0);

      satellite.position.copy(point);
      satellite.position.z = 0;
      this.satellites.push(satellite);

      orbitGroup.add(satellite);

      this.orbitsGroup.add(orbitGroup);
    });

    return this;
  }

  animate() {
    this.satellites.forEach((satellite, index) => {
      let orbit = this.orbits[index % this.orbits.length];

      let t = (Date.now() % 10_000) / 10_000;

      let point = orbit.getPoint(t);

      satellite.position.copy(point);
      satellite.position.z = 0;
    });
  }
}
