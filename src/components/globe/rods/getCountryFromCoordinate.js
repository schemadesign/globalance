// Get the country name from a coordinate with a canvas-based lookup

import * as d3 from "d3";
import * as topojson from "topojson-client";

let canvas = null;
let features = null;

let dictionary = {};

const width = 1200;
const height = width / 2;

const projection = d3
  .geoEquirectangular()
  .translate([width / 2, height / 2])
  .scale(width / 2 / Math.PI);

export async function getCountryFromCoordinate(coordinate) {
  if (!coordinate) return null;

  if (!canvas) {
    canvas = document.createElement("canvas");

    canvas.width = width;
    canvas.height = height;
  }

  if (!features) {
    const codes = await fetch("./data/geo/codes.csv")
      .then((response) => response.text())
      .then((data) => {
        return d3.csvParse(data);
      });

    features = await fetch("./data/geo/countries-110m.json")
      .then((response) => response.json())
      .then((data) => {
        return topojson.feature(data, data.objects.countries).features;
      })
      .then((features) => {
        return features.map((feature) => {
          const code = codes.find(
            (d) => Number(d.numeric) === Number(feature.id)
          );

          if (code) {
            feature.properties = {
              ...feature.properties,
              code: code.two,
            };
          } else {
            console.log("No code for:", feature.properties.name);
          }

          //

          return feature;
        });
      });

    const path = d3.geoPath().projection(projection);

    const context = canvas.getContext("2d");
    context.imageSmoothingEnabled = false;

    context.fillStyle = "white";
    context.fillRect(0, 0, width, height);

    features.forEach((feature, index) => {
      const color = `rgb(${index}, ${index}, ${index})`;

      dictionary[index] = feature.properties?.code || feature.properties?.name;

      context.beginPath();
      path.context(context)(feature);

      context.lineWidth = 1;
      context.strokeStyle = color;
      context.stroke();

      context.fillStyle = color;
      context.fill();
    });
  }

  const context = canvas.getContext("2d");

  const x = projection([coordinate[0], coordinate[1]])[0];
  const y = projection([coordinate[0], coordinate[1]])[1];

  const color = context.getImageData(x, y, 1, 1).data;

  const key = color[0];

  if (dictionary[key]) return dictionary[key];

  return null;
}
