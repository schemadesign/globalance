<script>
  import { onMount } from "svelte";

  import * as d3 from "d3";
  import * as THREE from "three";
  import * as topojson from "topojson-client";

  import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

  import { getGeoData } from "../../data/getData.js";

  import { createBaseMap } from "./baseMap.js";

  let container = null;

  export let data = [];

  let portfolioData = data;

  onMount(async () => {
    const width = window.innerWidth;
    const height = window.innerHeight;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);

    const renderer = new THREE.WebGLRenderer({ antialias: false });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setClearColor(0x000000, 0);
    renderer.setSize(width, height);

    container.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);

    camera.position.z = 5;

    // Add a light
    const light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(0, 0, 5).normalize();
    scene.add(light);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const sphere = await createBaseMap();
    const group = new THREE.Group();
    group.add(sphere);

    scene.add(group);

    // Add orbits and satellites
    const satelliteGeometry = new THREE.SphereGeometry(0.03, 32, 32);
    // const satelliteMaterial = new THREE.MeshBasicMaterial({ color: 0xf8dc5d });

    const satelliteMaterial = new THREE.MeshStandardMaterial({
      color: 0xf8dc5d,
      emissive: 0xf8dc5d,
      emissiveIntensity: 0.5,
      // transparent: true,
      opacity: 1,
    });

    let orbits = new Array(portfolioData.length).fill(0).map((d, i) => {
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

    const satellites = [];

    // Add satellites to each orbit
    orbits.forEach((orbit, index) => {
      const points = orbit.getPoints(100);
      const geometry = new THREE.BufferGeometry().setFromPoints(points);

      const ellipse = new THREE.Line(geometry, orbitMaterial);

      let orbitGroup = new THREE.Group();
      // orbitGroup.add(ellipse);

      let xRotation = Math.random() * Math.PI;
      let yRotation = Math.random() * Math.PI;
      let zRotation = Math.random() * Math.PI;

      orbitGroup.rotation.x = xRotation;
      orbitGroup.rotation.y = yRotation;
      orbitGroup.rotation.z = zRotation;

      group.add(orbitGroup);

      // Add one satellite to each orbit
      const satellite = new THREE.Mesh(satelliteGeometry, satelliteMaterial);

      // Set random scale
      // let scale = Math.random() * 2 + 0.5;
      let scale = portfolioData[index]["Position Weight"] * 100;

      satellite.scale.set(scale, scale, scale);

      // Add satellite along the orbit, use the orbit points
      // const orbitPoints = orbit.getPoints(100);
      // const orbitIndex = Math.floor(Math.random() * orbitPoints.length);

      const point = orbit.getPoint(0);

      satellite.position.copy(point);
      satellite.position.z = 0; // Set z to 0 to keep it on the orbit plane

      // satellite.rotation.x = Math.random() * Math.PI;
      // satellite.rotation.y = Math.random() * Math.PI;
      // satellite.rotation.z = Math.random() * Math.PI;

      satellites.push(satellite);

      // orbitGroup.add(satellite);
    });

    let randomPointOnSphere = (radius) => {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1); // Uniform distribution

      const x = radius * Math.sin(phi) * Math.cos(theta);
      const y = radius * Math.sin(phi) * Math.sin(theta);
      const z = radius * Math.cos(phi);
      return new THREE.Vector3(x, y, z);
    };

    let randomPoints = new Array(10).fill(0).map((d, i) => {
      return randomPointOnSphere(1.025);
    });

    let pointGeometry = new THREE.SphereGeometry(0.02, 32, 32);
    let pointMaterial = new THREE.MeshBasicMaterial({ color: 0x333333 });
    let pointMesh = new THREE.Mesh(pointGeometry, pointMaterial);

    // Add random points to the sphere
    randomPoints.forEach((point) => {
      let sphere = pointMesh.clone();
      sphere.position.copy(point);

      group.add(sphere);
    });

    // Add random particles that animate towards the closest point on the sphere
    let particleGeometry = new THREE.SphereGeometry(0.005, 16, 16);
    let particleMaterial = new THREE.MeshBasicMaterial({ color: 0xf8dc5d });
    let particleMesh = new THREE.Mesh(particleGeometry, particleMaterial);

    // Use InstancedMesh for particles
    const particleCount = 10_000;

    const instancedParticles = new THREE.InstancedMesh(
      particleGeometry,
      particleMaterial,
      particleCount
    );

    // Store target positions for each particle
    let particleTargets = [];

    for (let i = 0; i < particleCount; i++) {
      const pos = randomPointOnSphere(1.025);
      const matrix = new THREE.Matrix4().setPosition(pos);

      instancedParticles.setMatrixAt(i, matrix);

      particleTargets.push(pos);
    }

    group.add(instancedParticles);

    function animate() {
      requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);

      group.rotation.y += 0.001;

      // Update canvas texture
      // texture.needsUpdate = true;

      satellites.forEach((satellite, index) => {
        let orbit = orbits[index % orbits.length];

        // Get a value from 0 to 1 oscilliating with time
        let t = (Date.now() % 10_000) / 10_000;

        let point = orbit.getPoint(t);

        satellite.position.copy(point);
        satellite.position.z = 0; // Set z to 0 to keep it on the orbit plane
      });

      // Animate instanced particles towards their closest random point on the sphere
      for (let i = 0; i < particleCount; i++) {
        let pos = particleTargets[i];

        let closestPoint = randomPoints.reduce((prev, curr) => {
          return prev.distanceTo(pos) < curr.distanceTo(pos) ? prev : curr;
        });

        let direction = closestPoint.clone().sub(pos).normalize();

        // If you are closer than 0.01 to the point, stop moving and move to a new random point
        if (pos.distanceTo(closestPoint) < 0.01) {
          pos = randomPointOnSphere(1.025);
          particleTargets[i] = pos;
        } else {
          // Move the particle towards the closest point but stay on the sphere
          let newPosition = pos.clone().add(direction.multiplyScalar(0.001));
          let newDirection = newPosition.clone().normalize();
          let newPoint = newDirection.multiplyScalar(1.025);
          pos = newPoint;
          particleTargets[i] = pos;
        }

        // Update the matrix for this instance
        const matrix = new THREE.Matrix4().setPosition(pos);
        instancedParticles.setMatrixAt(i, matrix);
      }

      instancedParticles.instanceMatrix.needsUpdate = true;
    }

    animate();
  });
</script>

<div bind:this={container} class="container"></div>

<style>
</style>
