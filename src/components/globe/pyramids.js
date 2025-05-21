import * as d3 from "d3";
import * as THREE from "three";
import * as topojson from "topojson-client";

import { getGeoData } from "../../data/getData.js";

export class Pyramids {
  constructor(portfolioData, options) {
    this.pyramids = null;
    return this;
  }

  async setup() {
    let data = await getGeoData();

    let codes = await fetch("/geo/codes.csv")
      .then((response) => response.text())
      .then((data) => {
        return d3.csvParse(data, d3.autoType);
      })
      .then((data) => {
        return data.reduce((acc, d) => {
          acc[d.numeric] = d;

          return acc;
        }, {});
      });

    let features = await fetch("./geo/countries-50m.json")
      .then((response) => response.json())
      .then((data) => {
        return topojson.feature(data, data.objects.countries).features;
      })
      .then((features) => {
        return features.map((feature) => {
          let code = codes[Number(feature.id)];

          if (code) {
            feature.properties = {
              ...feature.properties,
              ...code,
            };
          }

          return feature;
        });
      });

    let centroids = features.map((feature) => {
      let centroid = d3.geoCentroid(feature);
      return {
        ...feature.properties,

        coordinates: centroid,
      };
    });

    this.pyramids = new THREE.Group();

    // Add pyramids geometry for each point

    let pyramidGeometry = new THREE.ConeGeometry(0.025, 0.25, 4);
    let pyramidMaterial = new THREE.MeshStandardMaterial({
      color: 0x45909b,
    });

    centroids.forEach((element) => {
      let country = element.country;
      let coordinates = element.coordinates;
      let value = data[country]?.footprint;

      const lat = THREE.MathUtils.degToRad(coordinates[1]);
      const lon = THREE.MathUtils.degToRad(coordinates[0]);
      const baseRadius = 1.0; // Sphere radius
      const height = 0.25; // Pyramid height (matches geometry)

      // Calculate position on sphere surface
      const x = baseRadius * Math.cos(lat) * Math.sin(lon);
      const y = baseRadius * Math.sin(lat);
      const z = baseRadius * Math.cos(lat) * Math.cos(lon);

      const pos = new THREE.Vector3(x, y, z);

      // Calculate the normal vector (from center to surface point)
      const normal = pos.clone().normalize();

      // Move pyramid so its base sits on the sphere surface
      // By default, ConeGeometry is centered at the base at y=0 and points up +Y
      // So we need to move it outwards by half its height along the normal
      const offset = normal.clone().multiplyScalar(height / 2);
      const pyramidPosition = pos.clone().add(offset);

      let pyramidMesh = new THREE.Mesh(pyramidGeometry, pyramidMaterial);
      pyramidMesh.position.copy(pyramidPosition);

      // Orient the pyramid so its "up" (+Y) aligns with the normal
      pyramidMesh.quaternion.setFromUnitVectors(
        new THREE.Vector3(0, 1, 0), // default up
        normal
      );

      this.pyramids.add(pyramidMesh);
    });
  }

  animate(options = {}) {}
}
