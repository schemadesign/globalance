import * as d3 from "d3";

export async function getGeoData() {
  let data = {};

  let files = ["climate", "footprint", "megatrend"];

  for (let i = 0; i < files.length; i++) {
    let key = files[i];

    let content = await fetch(`./data/country/${key}.csv`)
      .then((response) => {
        return response.text();
      })
      .then((text) => {
        const data = d3.csvParse(text, d3.autoType);

        return data;
      });

    content.forEach((d) => {
      if (!data[d.Country]) {
        data[d.Country] = {
          id: d.Country,
        };
      }

      data[d.Country][key] = d[key];
    });
  }

  return data;
}
