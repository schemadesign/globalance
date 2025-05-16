<script>
  import { onMount } from "svelte";

  import * as d3 from "d3";
  import * as THREE from "three";
  import * as topojson from "topojson-client";

  import {
    ToonShader1,
    ToonShader2,
    ToonShaderHatching,
    ToonShaderDotted,
  } from "three/addons/shaders/ToonShader.js";

  import { ShaderMaterial } from "three";

  import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

  let container = null;

  export let data = [];

  onMount(async () => {
    console.log("data", data);

    const width = window.innerWidth;
    const height = window.innerHeight;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setClearColor(0x000000, 0);
    renderer.setSize(width, height);

    // Add a light source
    const light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(5, 5, 5).normalize();
    scene.add(light);
    const ambientLight = new THREE.AmbientLight(0x404040, 1); // Soft white light

    scene.add(ambientLight);
    // Add a grid helper
    const gridHelper = new THREE.GridHelper(10, 10);
    scene.add(gridHelper);

    container.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);

    camera.position.z = 5;

    const material = new THREE.MeshStandardMaterial({
      color: 0xf8dc5d,
      emissive: 0xf8dc5d,
      emissiveIntensity: 0.5,
    });

    const dottedMaterial = createShaderMaterial(
      ToonShaderDotted,
      light,
      ambientLight
    );

    const hatchingMaterial = createShaderMaterial(
      ToonShaderHatching,
      light,
      ambientLight
    );

    data.forEach((d) => {
      const geometry = new THREE.SphereGeometry(0.1, 32, 32);
      // const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });

      const sphere = new THREE.Mesh(geometry, hatchingMaterial);

      // Scale the sphere

      const scale = d["Position Weight"] * 100;
      sphere.scale.set(scale, scale, scale);

      // Set position based on data
      sphere.position.x = Math.random() * 5 - 2.5; // Random x position
      sphere.position.y = Math.random() * 5 - 2.5; // Random y position
      sphere.position.z = Math.random() * 5 - 2.5; // Random z position

      scene.add(sphere);
    });

    function animate() {
      requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    }

    function createShaderMaterial(shader, light, ambientLight) {
      const u = THREE.UniformsUtils.clone(shader.uniforms);

      const vs = shader.vertexShader;
      const fs = shader.fragmentShader;

      const material = new THREE.ShaderMaterial({
        uniforms: u,
        vertexShader: vs,
        fragmentShader: fs,
      });

      material.uniforms["uDirLightPos"].value = light.position;
      material.uniforms["uDirLightColor"].value = light.color;

      material.uniforms["uAmbientLightColor"].value = ambientLight.color;

      return material;
    }

    animate();
  });
</script>

<div bind:this={container} class="container"></div>

<style>
</style>
