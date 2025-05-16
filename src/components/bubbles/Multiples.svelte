<script>
  import { onMount } from "svelte";

  import * as d3 from "d3";

  // Small multiples
  import Bubbles from "./Bubbles.svelte";

  export let data = [];

  let width = window.innerWidth;
  let height = window.innerHeight;

  let sections = [];

  onMount(async () => {
    data = await fetch("./data/portfolio.csv")
      .then((response) => response.text())
      .then((text) => {
        return d3.csvParse(text, d3.autoType);
      });

    sections = ["Footprint", "Megatrend"].map((section) => {
      return {
        name: section,
        columns: data.columns
          .filter((column) => {
            return column.includes(section);
          })
          .map((column) => {
            let label = column.replace(section, "").trim();

            if (label.match(/([a-z])([A-Z])/)) {
              label = label.replace(/([a-z])([A-Z])/g, "$1 $2");
            }

            return {
              key: column,
              label: label,
            };
          }),
      };
    });
  });
</script>

<svelte:window bind:innerWidth={width} bind:innerHeight={height} />

<!-- Small multiples -->
<div class="app">
  {#each sections as section}
    <div class="section">
      <div class="section__title">{section.name}</div>

      <div class="graphics">
        {#each section.columns as column}
          <div class="graphic">
            <div class="graphic__title">{column.label}</div>

            <Bubbles {data} width="200" height="200" colorKey={column.key} />
          </div>
        {/each}
      </div>
    </div>
  {/each}
</div>

<style>
  .app {
    letter-spacing: -0.02rem;

    font-family: system-ui, sans-serif;
  }

  .section {
    max-width: 80rem;
    margin: 0 auto 6rem auto;

    padding: 2rem 0;
  }

  .section__title {
    font-weight: 600;
    font-size: 2rem;
    margin: 0 0 1rem 0;
  }

  .graphics {
    display: flex;

    padding: 1rem 0;

    gap: 2rem;

    flex-wrap: wrap;
  }

  .graphic {
    flex-basis: 1;
  }

  .graphic__title {
    border-top: 1px solid #ccc;
    padding: 0.5rem 0 1rem 0;
  }
</style>
