import * as d3 from "d3";
import * as THREE from "three";
import { ConvexGeometry } from "three/examples/jsm/geometries/ConvexGeometry.js";
import * as topojson from "topojson-client";

import { getGeoData } from "../../data/getData.js";

import { getGlowMaterial, glowMaterial } from "./glow.js";

export class Bump {
  constructor(portfolioData, options) {
    return this;
  }

  async setup() {
    let data = await getGeoData();

    let codes = await fetch("/geo/codes.csv")
      .then((response) => response.text())
      .then((data) => d3.csvParse(data, d3.autoType))
      .then((data) =>
        data.reduce((acc, d) => {
          acc[d.numeric] = d;
          return acc;
        }, {})
      );

    let features = await fetch("./geo/countries-50m.json")
      .then((response) => response.json())
      .then((data) => topojson.feature(data, data.objects.countries).features)
      .then((features) =>
        features.map((feature) => {
          let code = codes[Number(feature.id)];
          if (code) {
            feature.properties = {
              ...feature.properties,
              ...code,
            };
          }
          return feature;
        })
      );

    let centroids = features.map((feature) => {
      let centroid = d3.geoCentroid(feature);
      return {
        ...feature.properties,
        coordinates: centroid,
      };
    });

    console.log(centroids);

    // Create a sphere geometry and set the height of the points depending on how far they are from the closest centroid. The closer to a point the higher the point
    // Parameters for boxes
    const boxSize = 0.02;
    const boxGeometry = new THREE.BoxGeometry(boxSize, boxSize, boxSize);

    // Group to hold all boxes
    this.group = new THREE.Group();

    let heightScale = d3.scaleLinear().domain([0, 1]).range([0.5, 0]);

    // Create box material
    let boxMaterial = new THREE.MeshStandardMaterial({
      color: 0x45909b,
      transparent: true,
      opacity: 0.5,
    });

    // For each vertex on the sphere, place a box
    let sphereGeometry = new THREE.SphereGeometry(1, 128, 128);
    let positions = sphereGeometry.attributes.position.array;

    for (let i = 0; i < positions.length; i += 3) {
      let x = positions[i];
      let y = positions[i + 1];
      let z = positions[i + 2];

      // Convert cartesian to spherical coordinates (radians)
      // Use the same convention as for centroids
      let radius = Math.sqrt(x * x + y * y + z * z);
      let lat = Math.asin(y / radius); // radians
      let lon = Math.atan2(x, z); // radians, matches centroid conversion

      // Find closest centroid using spherical (great-circle) distance
      let closestCentroid = centroids.reduce(
        (acc, centroid) => {
          // centroid.coordinates: [lon, lat] in degrees
          let centroidLat = THREE.MathUtils.degToRad(centroid.coordinates[1]);
          let centroidLon = THREE.MathUtils.degToRad(centroid.coordinates[0]);

          // Haversine formula for spherical distance (on unit sphere)
          let dLat = lat - centroidLat;
          let dLon = lon - centroidLon;
          let a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat) *
              Math.cos(centroidLat) *
              Math.sin(dLon / 2) *
              Math.sin(dLon / 2);

          let c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

          let distance = c; // On unit sphere, so c is the distance

          if (distance < acc.distance) {
            return {
              distance: distance,
              centroid: centroid,
            };
          }
          return acc;
        },
        { distance: Infinity }
      );

      // Color and height
      let height = heightScale(closestCentroid.distance);

      // Create box mesh
      let box = new THREE.Mesh(boxGeometry, boxMaterial);

      // Position box outward from sphere surface by 'height'
      let norm = Math.sqrt(x * x + y * y + z * z);
      let nx = x / norm;
      let ny = y / norm;
      let nz = z / norm;

      box.position.set(nx * (1 + height), ny * (1 + height), nz * (1 + height));

      // Orient box so its "up" is away from sphere center
      box.lookAt(0, 0, 0);

      this.group.add(box);
    }

    // For each centroid, add a red box to the centroid position on the sphere

    let centroidMaterial = new THREE.MeshStandardMaterial({
      color: 0xff0000,
      transparent: true,
      opacity: 0.5,
    });

    let centroidGeometry = new THREE.SphereGeometry(0.02, 16, 16);

    centroids.forEach((centroid) => {
      const lat = THREE.MathUtils.degToRad(centroid.coordinates[1]);
      const lon = THREE.MathUtils.degToRad(centroid.coordinates[0]);

      let radius = 1.0; // Sphere radius

      const x = radius * Math.cos(lat) * Math.sin(lon);
      const y = radius * Math.sin(lat);
      const z = radius * Math.cos(lat) * Math.cos(lon);

      // Create box mesh
      let box = new THREE.Mesh(centroidGeometry, centroidMaterial);

      // Position box outward from sphere surface by 'height'
      box.position.set(x, y, z);

      this.group.add(box);
    });

    return this;
  }

  animate(options = {}) {}
}
