<script>
  import { onMount } from "svelte";

  import * as d3 from "d3";
  import * as THREE from "three";

  import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

  import { createBaseMap } from "./baseMap.js";

  import { initialize } from "./initialize.js";
  import { Satellites } from "./satellites.js";
  import { Flow } from "./flow.js";

  let container = null;

  export let data = [];

  let portfolioData = data;

  onMount(async () => {
    let { scene, camera, renderer, controls } = initialize(container);

    const group = new THREE.Group();
    scene.add(group);

    const map = await createBaseMap(); // Convert map to a class...

    const satellites = new Satellites(portfolioData, {
      showObits: true,
    });

    const flow = new Flow(10000);

    group.add(map);
    group.add(satellites.orbitsGroup);
    // group.add(flow.instancedParticles);

    flow.randomPointSpheres.forEach((sphere) => {
      group.add(sphere);
    });

    // Add a sphere with a shader material that is has a graident from magenta to transparent

    function animate() {
      controls.update();
      renderer.render(scene, camera);

      group.rotation.y += 0.001;

      flow.animate();
      satellites.animate();

      requestAnimationFrame(animate);
    }

    animate();
  });
</script>

<div bind:this={container} class="container"></div>

<style>
</style>
