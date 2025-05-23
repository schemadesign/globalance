<script>
  import { onMount } from "svelte";

  import * as d3 from "d3";
  import * as THREE from "three";

  import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

  import { createBaseMap } from "./baseMap.js";
  // import { createBaseMap } from "./createBasemapBlur.js";

  import { initialize } from "./initialize.js";
  import { Satellites } from "./satellites.js";
  import { Flow } from "./flow.js";
  import { Rods } from "./rods/rods.js";
  import { Pyramids } from "./pyramids.js";
  import { Bump } from "./displacement.js";

  import { getGlowMaterial, glowMaterial } from "./glow.js";

  let container = null;

  export let data = [];

  let portfolioData = data;

  onMount(async () => {
    let { scene, camera, renderer, controls } = initialize(container);

    // All the elements will be added to this group
    const group = new THREE.Group();
    scene.add(group);

    const map = await createBaseMap(); // Convert map to a class...
    group.add(map);

    // Gradient sphere
    const sphereGeometry = new THREE.SphereGeometry(1, 128, 128);
    const sphereMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const sphere = new THREE.Mesh(
      sphereGeometry,
      getGlowMaterial(new THREE.Color(0x45909b))
    );
    sphere.position.set(0, 0, 0);
    // scene.add(sphere);

    // Satellites
    const satellites = new Satellites(portfolioData, {
      showObits: true,
    });
    // group.add(satellites.orbitsGroup);

    // Flow
    const flow = new Flow(10000);
    // group.add(flow.instancedParticles);

    // Rods
    // let rods = new Rods();
    // await rods.setup();
    // group.add(rods.instancedParticles);

    // Pyramids
    // let pyramids = new Pyramids();
    // await pyramids.setup();
    // group.add(pyramids.pyramids);

    let bump = new Bump();
    await bump.setup();
    group.add(bump.group);

    function animate() {
      controls.update();
      renderer.render(scene, camera);

      group.rotation.y += 0.001;

      flow.animate();
      satellites.animate({ camera });

      requestAnimationFrame(animate);
    }

    animate();
  });
</script>

<div bind:this={container} class="container"></div>

<style>
</style>
