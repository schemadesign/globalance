<script>
  import * as d3 from "d3";

  import { createEventDispatcher } from "svelte";
  import { onMount } from "svelte";

  import { fade } from "svelte/transition";

  import { getPositions } from "./getPositions.js";

  const dispatch = createEventDispatcher();

  export let data = [];
  export let width = 200;
  export let height = 200;

  export let colorKey = "Footprint Overall Score";

  const radiusScale = d3
    .scaleSqrt()
    .domain([0, 1])
    .range([0, width / 3]);

  const colorScale = (value) => {
    const scale = d3.scaleLinear().domain([0, 1]).range(["white", "darkblue"]);

    if (value === null) {
      return "transparent";
    }

    return scale(value);
  };

  let bubbles = data
    .sort((a, b) => {
      return b["Position Weight"] - b["Position Weight"];
    })
    .map((d, index) => {
      return {
        key: index,

        x: width / 2,
        y: height / 2,

        r: radiusScale(d["Position Weight"]),

        data: d,
      };
    });

  let positions = getPositions(bubbles, width, height);
</script>

<svg {width} {height} viewBox={`0 0 ${width} ${height}`}>
  {#each bubbles as bubble}
    <circle
      class="bubble"
      cx={positions[bubble.key].x}
      cy={positions[bubble.key].y}
      r={positions[bubble.key].r}
      fill={colorScale(bubble.data[colorKey])}
    />
  {/each}
</svg>

<style>
  .bubble {
    transition: all 0.5s ease-in-out;
  }
</style>
