import * as d3 from "d3";
import * as THREE from "three";
import * as topojson from "topojson-client";

import { getGeoData } from "../../data/getData.js";

export async function createBaseMap() {
  let data = await getGeoData();

  const colorScale = d3
    .scaleSequential(d3.interpolateBlues)
    .domain([0, 1])
    .range(["#fff", "#000"]);

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
        let code = codes[feature.id];

        if (code) {
          feature.properties = {
            ...feature.properties,
            ...code,
          };
        }

        return feature;
      });
    });

  const canvasWidth = 1024 * 16;
  const canvasHeight = canvasWidth / 2;

  console.log("canvas size", canvasWidth, canvasHeight);

  const projection = d3
    .geoEquirectangular()
    .translate([canvasWidth / 2, canvasHeight / 2])
    .scale(canvasWidth / 2 / Math.PI);

  // Create canvas
  const canvas = document.createElement("canvas");

  canvas.width = canvasWidth;
  canvas.height = canvasHeight;
  const context = canvas.getContext("2d");

  // Draw map
  context.clearRect(0, 0, canvasWidth, canvasHeight);
  // context.fillStyle = "#fff";
  // context.fillRect(0, 0, canvasWidth, canvasHeight);
  context.beginPath();

  const path = d3.geoPath(null, context).projection(projection);

  features.forEach((feature) => {
    let id = feature.properties.two;

    context.beginPath();

    path(feature);

    let dataPoint = data[id];

    if (dataPoint) {
      context.fillStyle = colorScale(dataPoint["footprint"]);
    } else {
      context.fillStyle = "white";
    }

    // context.fillStyle = "black";
    context.fill();

    context.lineWidth = 4;
    context.strokeStyle = "#fff";
    context.stroke();
    context.closePath();
  });

  // Create texture from canvas
  const texture = new THREE.CanvasTexture(canvas);

  // https://stackoverflow.com/questions/45376919/texture-on-sphere-fuzzy-after-version-upgrade
  texture.minFilter = THREE.NearestFilter;

  const geometry = new THREE.SphereGeometry(1, 64, 64);
  // const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });

  const material = new THREE.MeshBasicMaterial({
    map: texture,
	transparent: true,
  });

  const sphere = new THREE.Mesh(geometry, material);
  sphere.rotation.x = Math.PI / 4;

  return sphere;
}
