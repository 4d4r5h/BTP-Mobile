import fetchTomTomJSON from "./fetch.mjs";
import findOptimalPath from "./find_optimal_path.mjs";

export default function routing(request) {
  return new Promise(async (resolve, reject) => {
    async function getPath(waypoints) {
      try {
        const json = await fetchTomTomJSON(waypoints);
        if (!json.hasOwnProperty("routes")) {
          return [];
        }
        const legs = json.routes[0].legs;
        let path = [];
        for (const leg of legs) {
          path = path.concat(leg.points);
        }
        return path;
      } catch (error) {
        reject(error);
      }
    }
    let response = { path: [], stations: [] };
    try {
      const json = await findOptimalPath(request);
      const waypoints = json.path;
      const stations = json.stations;
      if (waypoints.length >= 2) {
        const path = await getPath(waypoints);
        response.path = path;
        if (response.path.length > 0) {
          response.stations = stations;
        }
      }
      resolve(response);
    } catch (error) {
      reject(error);
    }
  });
}
