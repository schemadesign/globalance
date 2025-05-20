// Fibonacci sphere algorithm

const radius = 600;
const count = 25_000;

export function getDistributedPoints(index) {
  const points = fibonacciSphere(count, radius);

  return points;
}

export function getDistributedGeoPoints(index) {
  const points = fibonacciSphere(count, radius, index);

  return points.map((point) => reverseVertex(point, radius));
}

// https://gist.github.com/stephanbogner/a5f50548a06bec723dcb0991dcbb0856

function fibonacciSphere(samples, radius, index = 0) {
  // Translated from Python from https://stackoverflow.com/a/26127012
  samples = samples || 1;
  radius = radius || 1;

  const randomize = false;

  let random = 1;

  if (randomize === true) {
    random = Math.random() * samples;
  }

  let points = [];
  let offset = 2 / samples;
  let increment = Math.PI * (3 - Math.sqrt(5));

  for (let i = 0; i < samples; i++) {
    let y = i * offset - 1 + offset / 2;

    let distance = Math.sqrt(1 - Math.pow(y, 2));

    // Spiral
    let phi = (i % samples) * increment;

    // Randomize
    // let phi = (i % samples) * increment + Math.random() * 0.05;

    // Offset option...
    // let phi = (i % samples) * increment + index / Math.PI;

    let x = Math.cos(phi) * distance;
    let z = Math.sin(phi) * distance;

    x = x * radius;
    y = y * radius;
    z = z * radius;

    let point = [x, y, z];

    points.push(point);
  }

  return points;
}

function reverseVertex([x, y, z], radius) {
  const lambda = Math.atan2(-z, x);
  const phi = Math.asin(y / radius);

  return [(lambda * 180) / Math.PI, (phi * 180) / Math.PI];
}
