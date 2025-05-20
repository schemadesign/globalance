// Take a regular set of points and return a subset that actually corresponds to countries on a map

import * as THREE from "three";

import * as d3 from "d3";
import * as topojson from "topojson-client";

import { getCountryFromCoordinate } from "./getCountryFromCoordinate.js";
import { getDistributedGeoPoints } from "./getDistributedPoints.js";

import { CanvasCountryMap } from "./canvasCountryMap.js";

export const canvasMap = new CanvasCountryMap();

export async function getFibonacciDotsWithCountry(
  data,
  universe,
  index,
  color = "#00A641"
) {
  if (!canvasMap.isSetup) await canvasMap.setup();

  canvasMap.colorizeBy(() => "#000000");

  // Immediately get rid of non-land dots
  const distributedPoints = getDistributedGeoPoints(index).filter((point) => {
    const pixel = canvasMap.getCoordinateColor(point);

    return pixel[0] !== 255 || pixel[1] !== 255 || pixel[2] !== 255;
  });

  let pointsToBeAssigned = distributedPoints;

  let pointsWithCountries = [];

  // Sort features by largest landmasses because processing the largest countries first reduces point lookups
  let sorted = canvasMap.features.sort((a, b) => {
    let largestCountries = [
      "RU",
      "AQ",
      "CA",
      "CN",
      "US",
      "BR",
      "AU",
      "IN",
    ].reverse();

    const aCode = a.properties.codes?.two;
    const bCode = b.properties.codes?.two;

    const aSortIndex = largestCountries.indexOf(aCode);
    const bSortIndex = largestCountries.indexOf(bCode);

    return bSortIndex - aSortIndex;
  });

  sorted.forEach((feature) => {
    canvasMap.drawFeature(feature);

    let pointsToLeftBeAssigned = [];

    pointsToBeAssigned.forEach((point, index) => {
      const pixel = canvasMap.getCoordinateColor(point);

      // If any pixel is not 255, it's not white
      if (pixel[0] !== 255 || pixel[1] !== 255 || pixel[2] !== 255) {
        /*
        pointsWithCountries.push({
          type: "Feature",
          geometry: {
            type: "Point",
            coordinates: point,
          },
          properties: {
            index,

            color: "#000000",
            country: feature.properties.codes?.two,
          },
        });
        */

        pointsWithCountries.push({
          country: feature.properties.codes?.two,
          coordinates: point,
        });
      } else {
        pointsToLeftBeAssigned.push(point);
      }
    });

    pointsToBeAssigned = pointsToLeftBeAssigned;
  });

  return pointsWithCountries.sort((a, b) => {
    return Math.random() - 0.5;
  });

  return pointsWithCountries;
}

export async function getFibonacciDotsFromTexture(
  data,
  universe,
  index,
  color = "#00A641"
) {
  if (!canvasMap.isSetup) await canvasMap.setup();

  const colorize = (feature) => {
    return "#000000";
  };

  canvasMap.colorizeBy(colorize);

  const distributedPoints = getDistributedGeoPoints(index);

  let points = [];

  // Initialize the canvas
  await getCountryFromCoordinate([0, 0]);

  distributedPoints.forEach(async (point) => {
    const pixel = canvasMap.getCoordinateColor(point);
    const pixelHexColor = pixelToHex(pixel);

    let country = await getCountryFromCoordinate(point);

    // If any pixel is not 255, it's not white
    if (pixel[0] !== 255 || pixel[1] !== 255 || pixel[2] !== 255) {
      points.push({
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: point,
        },
        properties: {
          color: "#000000",
          country,
        },
      });
    }
  });

  return points;
}

export async function getGridDotsFromTexture() {
  // const width = 1024 / 2;
  // const height = 512 / 2;

  const width = 400;
  const height = 200;

  const canvas = document.createElement("canvas");

  canvas.width = width;
  canvas.height = height;

  const features = await fetch("./data/geo/countries-110m.json")
    .then((response) => response.json())
    .then((data) => {
      // return topojson.feature(data, data.objects.land).features;
      return topojson.feature(data, data.objects.countries).features;
    });

  const projection = d3
    .geoEquirectangular()
    .translate([width / 2, height / 2])
    .scale(width / 2 / Math.PI);

  const path = d3.geoPath().projection(projection);

  const context = canvas.getContext("2d");
  context.imageSmoothingEnabled = false;

  // const patternCanvas = createPattern();
  // const pattern = context.createPattern(patternCanvas, "repeat");

  context.fillStyle = "white";
  context.fillRect(0, 0, width, height);

  features.forEach((feature) => {
    context.beginPath();
    path.context(context)(feature);

    const randomGray = Math.floor(Math.random() * 255);
    const randomColor = `rgb(${randomGray}, ${randomGray}, ${randomGray})`;

    context.lineWidth = 1.5;
    context.strokeStyle = randomColor;
    context.stroke();

    context.fillStyle = randomColor;
    context.fill();
  });

  let points = [];

  // iterate over each pixel if it's black, add it to the points array as an x, y point

  for (let x = 0; x < width; x++) {
    for (let y = 0; y < height; y++) {
      const pixel = context.getImageData(x, y, 1, 1).data;

      const hexColor = pixelToHex(pixel);

      // if pixel is not white
      if (pixel[0] !== 255 && pixel[1] !== 255 && pixel[2] !== 255) {
        let coordinates = projection.invert([x, y]);

        // return geojson point

        points.push({
          type: "Feature",
          geometry: {
            type: "Point",
            coordinates: coordinates,
          },
          properties: {
            color: hexColor,
          },
        });

        // points.push({ x, y });
      }
    }
  }

  return points;
}

function pixelToHex(pixel) {
  return "#" + ("000000" + rgbToHex(pixel[0], pixel[1], pixel[2])).slice(-6);
}

function rgbToHex(r, g, b) {
  if (r > 255 || g > 255 || b > 255) throw "Invalid color component";

  return ((r << 16) | (g << 8) | b).toString(16);
}
