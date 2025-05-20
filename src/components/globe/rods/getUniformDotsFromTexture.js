// Take a regular set of points and return a subset that actually corresponds to countries on a map

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

  return pointsWithCountries;
}
