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

        value: data[feature.properties.two]
          ? data[feature.properties.two].footprint
          : 0,
      };
    });
    console.log(centroids);

    // Create a sphere geometry and set the height of the points depending on the interpolated value from centroids.
    this.group = new THREE.Group();

    let sphereGeometry = new THREE.SphereGeometry(1, 128, 128);
    let positions = sphereGeometry.attributes.position;
    let vertex = new THREE.Vector3();

    // Find min/max value for scaling
    let values = centroids.map((c) => c.value);
    let minValue = d3.min(values);
    let maxValue = d3.max(values);

    let heightScale = d3
      .scaleLinear()
      .domain([0.5, 1])
      .range([0, 0.5])
      .clamp(true);

    // For each vertex, interpolate value from centroids using inverse distance weighting
    for (let i = 0; i < positions.count; i++) {
      vertex.fromBufferAttribute(positions, i);

      // Convert cartesian to spherical coordinates (radians)
      let radius = vertex.length();
      let lat = Math.asin(vertex.y / radius);
      let lon = Math.atan2(vertex.x, vertex.z);

      // Inverse distance weighting interpolation
      let weightsSum = 0;
      let valueSum = 0;
      for (let j = 0; j < centroids.length; j++) {
        let centroid = centroids[j];
        let centroidLat = THREE.MathUtils.degToRad(centroid.coordinates[1]);
        let centroidLon = THREE.MathUtils.degToRad(centroid.coordinates[0]);
        let dLat = lat - centroidLat;
        let dLon = lon - centroidLon;
        let a =
          Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos(lat) *
            Math.cos(centroidLat) *
            Math.sin(dLon / 2) *
            Math.sin(dLon / 2);
        let c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        let distance = c;

        // Avoid division by zero
        let weight = 1 / Math.pow(distance + 1e-6, 2);
        weightsSum += weight;
        valueSum += centroid.value * weight;
      }
      let interpolatedValue = valueSum / weightsSum;

      let height = heightScale(interpolatedValue);

      // Displace vertex outward
      vertex.multiplyScalar(1 + height);

      // Update position
      positions.setXYZ(i, vertex.x, vertex.y, vertex.z);
    }

    // Need to update the normals after modifying positions
    sphereGeometry.computeVertexNormals();

    // Create a material for the mesh
    let meshMaterial = new THREE.MeshStandardMaterial({
      color: 0x45909b,
      // transparent: true,
      wireframe: true,
    });

    // Create the mesh and add to group
    let displacedMesh = new THREE.Mesh(sphereGeometry, meshMaterial);
    this.group.add(displacedMesh);

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
