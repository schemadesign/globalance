<script>
  import { onMount } from "svelte";

  import * as d3 from "d3";

  // Small multiples
  import Bubbles from "./components/bubbles/Bubbles.svelte";
  import Multiples from "./components/bubbles/Multiples.svelte";
  // Flat map
  import Map from "./components/map/Map.svelte";

  // Three
  import Balls from "./components/balls/Balls.svelte";
  import Globe from "./components/globe/Globe.svelte";

  let components = [
    {
      name: "Globe",
      component: Globe,
    },
    {
      name: "Scatter",
      component: Balls,
    },
  ];

  let selectedComponent = components[0];

  let data = [];

  let width = window.innerWidth;
  let height = window.innerHeight;

  onMount(async () => {
    data = await fetch("./data/portfolio.csv")
      .then((response) => response.text())
      .then((text) => {
        return d3.csvParse(text, d3.autoType);
      });
  });
</script>

<svelte:window bind:innerWidth={width} bind:innerHeight={height} />

<!-- <div class="controls">
  {#each components as component}
    <div
      class="control {selectedComponent === component ? 'selected' : ''}"
      on:click={() => (selectedComponent = component)}
    >
      {component.name}
    </div>
  {/each}
</div> -->

{#if data.length && selectedComponent}
  <svelte:component this={selectedComponent.component} {data} />
{/if}

<style>
  @import url("./css/main.css");

  .controls {
    position: fixed;
    right: 0;
    bottom: 2rem;
    left: 0;

    display: flex;

    width: fit-content;
    margin: auto;

    padding: 0.25rem;

    border-radius: 2rem;
    background: #fff;
  }

  .control {
    padding: 0.75rem 2rem;

    cursor: pointer;

    border-radius: 2rem;
  }

  .control.selected {
    background: #000;
    color: #fff;
  }
</style>
