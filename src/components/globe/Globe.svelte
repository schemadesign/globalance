<script>
  import { onMount } from "svelte";

  import * as d3 from "d3";
  import * as THREE from "three";
  import * as topojson from "topojson-client";

  import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

  import { getGeoData } from "../../data/getData.js";

  let container = null;

  export let data = [];

  let portfolioData = data;

  onMount(async () => {
    let data = await getGeoData();

    const colorScale = d3
      .scaleSequential(d3.interpolateBlues)
      .domain([0, 1])
      .range(["#fff", "#000"]);
    // .range(["#fff", "#f8dc5d"]);

    let codes = await fetch("/geo/codes.csv")
      .then((response) => response.text())
      .then((data) => {
        return d3.csvParse(data, d3.autoType);
      })
      .then((data) => {
        return data.reduce((acc, d) => {
          acc[d.numeric] = d;

          return acc;
        }, {});
      });

    let features = await fetch("./geo/countries-50m.json")
      .then((response) => response.json())
      .then((data) => {
        return topojson.feature(data, data.objects.countries).features;
      })
      .then((features) => {
        return features.map((feature) => {
          let code = codes[feature.id];

          if (code) {
            feature.properties = {
              ...feature.properties,
              ...code,
            };
          }

          return feature;
        });
      });

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

    // Size of map
    const canvasWidth = 1024 * 16;
    const canvasHeight = canvasWidth / 2;

    console.log("canvas size", canvasWidth, canvasHeight);

    const projection = d3
      .geoEquirectangular()
      .translate([canvasWidth / 2, canvasHeight / 2])
      .scale(canvasWidth / 2 / Math.PI);

    // Create canvas
    const canvas = document.createElement("canvas");

    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    const context = canvas.getContext("2d");

    // Draw map
    context.clearRect(0, 0, canvasWidth, canvasHeight);
    context.fillStyle = "#fff";
    context.fillRect(0, 0, canvasWidth, canvasHeight);
    context.beginPath();

    const path = d3.geoPath(null, context).projection(projection);

    features.forEach((feature) => {
      let id = feature.properties.two;

      context.beginPath();

      path(feature);

      let dataPoint = data[id];

      if (dataPoint) {
        context.fillStyle = colorScale(dataPoint["footprint"]);
      } else {
        context.fillStyle = "white";
      }

      // context.fillStyle = "black";
      context.fill();

      context.lineWidth = 4;
      context.strokeStyle = "#fff";
      context.stroke();
      context.closePath();
    });

    // Create texture from canvas
    const texture = new THREE.CanvasTexture(canvas);
    // https://stackoverflow.com/questions/45376919/texture-on-sphere-fuzzy-after-version-upgrade
    texture.minFilter = THREE.NearestFilter;

    const geometry = new THREE.SphereGeometry(1, 64, 64);
    // const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });

    const material = new THREE.MeshBasicMaterial({
      map: texture,
    });

    const sphere = new THREE.Mesh(geometry, material);
    sphere.rotation.x = Math.PI / 4;

    // Let group
    const group = new THREE.Group();
    group.add(sphere);

    scene.add(group);

    // Add orbits and satellites
    const satelliteGeometry = new THREE.SphereGeometry(0.03, 32, 32);
    const satelliteMaterial = new THREE.MeshBasicMaterial({ color: 0xf8dc5d });

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

      orbitGroup.add(satellite);
    });

    function animate() {
      requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);

      group.rotation.y += 0.001;

      satellites.forEach((satellite, index) => {
        let orbit = orbits[index % orbits.length];

        // Get a value from 0 to 1 oscilliating with time
        let t = (Date.now() % 10_000) / 10_000;

        let point = orbit.getPoint(t);

        satellite.position.copy(point);
        satellite.position.z = 0; // Set z to 0 to keep it on the orbit plane
      });
    }

    animate();
  });
</script>

<div bind:this={container} class="container"></div>

<style>
</style>
