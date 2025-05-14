<script>
  import * as d3 from "d3";
  import * as topojson from "topojson-client";

  import { onMount } from "svelte";

  let width = window.innerWidth;
  let height = window.innerHeight;

  let dots = [];

  let features = [];
  let centroids = [];

  const projection = d3
    .geoNaturalEarth1()
    .scale(250)
    .center([0, 0])
    .translate([width / 2, height / 2]);

  const path = d3.geoPath().projection(projection);

  onMount(async () => {
    features = await fetch("./geo/countries-110m.json")
      .then((response) => response.json())
      .then((data) => data);

    features = topojson
      .feature(features, features.objects.countries)
      .features.map((feature) => {
        let name = feature.properties.name;

        if (name === "United States of America") {
          console.log("Found", name);

          feature.properties.name = "United States";
        }

        return feature;
      });

    let find = features.find(
      (feature) => feature.properties.name === "United States"
    );

    centroids = features.map((feature) => {
      const centroid = d3.geoPath().centroid(feature);
      const projected = projection(centroid);

      return {
        id: feature.id,
        name: feature.properties.name,
        x: projected[0],
        y: projected[1],
      };
    });
  });
</script>

<g>
  {#each features as feature}
    <path d={path(feature)} fill="#333" stroke="#666" stroke-width="1" />
  {/each}
</g>

<style>
  .dots {
    transition: opacity 0.5s;
  }

  .hide {
    opacity: 0;
  }

  .show {
    opacity: 1;
  }
</style>
