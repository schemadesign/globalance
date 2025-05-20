import * as d3 from "d3";
import * as topojson from "topojson-client";

const blue = "#00A8E1";

export class CanvasCountryMap {
  constructor() {
    this.width = 800;
    this.height = this.width / 2;

    this.canvas = document.createElement("canvas");

    this.canvas.width = this.width;
    this.canvas.height = this.height;

    this.context = this.canvas.getContext("2d");

    this.projection = d3
      .geoEquirectangular()
      .translate([this.width / 2, this.height / 2])
      .scale(this.width / 2 / Math.PI);

    this.path = d3.geoPath(null, this.context).projection(this.projection);

    this.features = null;

    this.isSetup = false;

    this.colorize = (feature) => {
      const colorScale = d3
        .scaleLinear()
        .domain([0, 255])
        .range([blue, "white"])
        .clamp(true);

      return colorScale(Math.floor(Math.random() * 255));
    };
  }

  async setup() {
    const codes = await fetch("./geo/codes.csv")
      .then((response) => response.text())
      .then((data) => {
        return d3.csvParse(data);
      });

    this.features = await fetch("./geo/countries-110m.json")
      .then((response) => response.json())
      .then((data) => {
        return topojson.feature(data, data.objects.countries).features;
      })
      .then((features) => {
        return features.map((feature) => {
          const code = codes.find(
            (d) => Number(d.numeric) === Number(feature.id)
          );

          feature.properties = { codes: code };

          return feature;
        });
      });

    this.isSetup = true;

    this.draw();
  }

  draw() {
    if (!this.isSetup) return;

    const context = this.canvas.getContext("2d");

    context.fillStyle = "white";
    context.fillRect(0, 0, this.width, this.height);

    const projection = d3
      .geoEquirectangular()
      .translate([this.width / 2, this.height / 2])
      .scale(this.width / 2 / Math.PI);

    const path = d3.geoPath(null, context).projection(projection);

    this.features.forEach((feature) => {
      const context = this.canvas.getContext("2d");

      context.beginPath();

      path(feature);

      const color = this.colorize(feature);

      context.lineWidth = 1;
      context.strokeStyle = color;
      context.stroke();

      context.fillStyle = color;
      context.fill();

      context.closePath();
    });
  }

  drawFeature(feature) {
    const context = this.canvas.getContext("2d");

    context.fillStyle = "white";
    context.fillRect(0, 0, this.width, this.height);

    context.beginPath();

    this.path(feature);

    const color = "#000000";

    context.fillStyle = color;
    context.fill();

    context.closePath();
  }

  colorizeBy(fn) {
    this.colorize = fn;

    this.draw();
  }

  getCoordinateColor(point) {
    const [x, y] = this.projection(point);

    return this.getPixelColor(x, y);
  }

  getPixelColor(x, y) {
    // https://stackoverflow.com/questions/19499500/canvas-getimagedata-for-optimal-performance-to-pull-out-all-data-or-one-at-a

    const pixel = this.context.getImageData(x, y, 1, 1).data;

    return pixel;
  }
}
