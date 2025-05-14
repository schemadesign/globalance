import * as d3 from "d3";

export function getPositions(data, width, height) {
  const forceData = data.map((d, index, elements) => {
    return {
      ...d,

      x: width / 2,
      y: height / 2,
    };
  });

  const x = d3.forceX((d) => d.x);
  const y = d3.forceY((d) => d.y);
  const collide = d3.forceCollide((d) => d.r + 1);

  const simulation = d3
    .forceSimulation(forceData)
    .force("x", x)
    .force("y", y)
    .force("collide", collide)
    .stop();

  // Run simulation for 200 ticks and stop
  for (let i = 0; i < 200; i++) {
    simulation.tick();
  }

  return forceData.reduce((acc, d) => {
    acc[d.key] = d;

    return acc;
  }, {});
}
