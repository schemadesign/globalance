import * as d3 from "d3";
import * as THREE from "three";
import { ConvexGeometry } from "three/examples/jsm/geometries/ConvexGeometry.js";
import * as topojson from "topojson-client";

import { getGeoData } from "../../data/getData.js";

export class Bump {
  constructor(portfolioData, options) {
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

    this.group = new THREE.Group();

    let particleGeometry = new THREE.BoxGeometry(0.005, 0.005, 0.005);
    let particleMaterial = new THREE.MeshStandardMaterial({
      color: 0x45909b,
    });

    let pts = [];
    let ptsCount = 100;

    pts = centroids.map((element) => {
      let coordinates = element.coordinates;
      let value = data[element.two]?.footprint;

      let height = value * 0.25 || 0;

      let lat = THREE.MathUtils.degToRad(coordinates[1]);
      let lon = THREE.MathUtils.degToRad(coordinates[0]);
      let baseRadius = 1.0 + height;

      return new THREE.Vector3(
        baseRadius * Math.cos(lat) * Math.sin(lon),
        baseRadius * Math.sin(lat),
        baseRadius * Math.cos(lat) * Math.cos(lon)
      );
    });

    /*
    for (let i = 0; i < ptsCount; i++) {
      pts.push(
        new THREE.Vector3().setFromSphericalCoords(
          THREE.MathUtils.randFloat(1, 5),
          Math.random() * Math.PI,
          Math.random() * 2 * Math.PI
        )
      );
    }
	*/

    let ptsGeom = new THREE.BufferGeometry().setFromPoints(pts);
    let ptsMat = new THREE.PointsMaterial({ size: 0.025, color: "aqua" });
    let points = new THREE.Points(ptsGeom, ptsMat);
    this.group.add(points);

    // Convex shape
    let unitPts = pts.map((p) => {
      // return new THREE.Vector3().copy(p).setLength(1);
      return new THREE.Vector3().copy(p);
    });

    let unitPtsGeom = new THREE.BufferGeometry().setFromPoints(unitPts);
    let unitPtsMat = new THREE.PointsMaterial({
      size: 0.025,
      color: "magenta",
    });
    let unitPoints = new THREE.Points(unitPtsGeom, unitPtsMat);
    this.group.add(unitPoints);

    let convexGeom = new ConvexGeometry(unitPts);
    let convexMat = new THREE.MeshNormalMaterial({
      wireframe: false,
      opacity: 0.5,
      transparent: true,
    });
    let convex = new THREE.Mesh(convexGeom, convexMat);

    this.group.add(convex);
    this.group.add(convex);

    let convexPos = convexGeom.attributes.position;

    let currV3 = new THREE.Vector3();
    let tempV3 = new THREE.Vector3();

    for (let i = 0; i < convexPos.count; i++) {
      currV3.fromBufferAttribute(convexPos, i);

      for (let j = 0; j < pts.length; j++) {
        tempV3.copy(pts[j]).setLength(10);

        let res = currV3.equals(tempV3, 0.001);

        if (res) {
          console.log(res);
          convexPos.setXYZ(i, pts[j].x, pts[j].y, pts[j].z);
        }
      }
    }
  }

  animate(options = {}) {}
}
