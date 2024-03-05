import fetch from "node-fetch";

const tomtomAccessToken = "jkf8G4nkI5HAHsFkJAom3KtGONAyLeuU";

function generateTomTomURL(waypoints) {
  const baseURL = "api.tomtom.com";
  const versionNumber = 1;
  const contentType = "json";
  const API_KEY = tomtomAccessToken;
  let routePlanningLocations = "";

  for (const coordinate of waypoints) {
    if (coordinate !== null) {
      routePlanningLocations +=
        coordinate.latitude + "," + coordinate.longitude + ":";
    }
  }

  let URL =
    `https://${baseURL}/routing/${versionNumber}/calculateRoute/` +
    `${routePlanningLocations}/${contentType}?key=${API_KEY}`;

  return URL;
}

export default async function fetchTomTomJSON(waypoints) {
  const URL = generateTomTomURL(waypoints);
  console.log(URL);
  try {
    const response = await fetch(URL);
    const json = await response.json();
    return json;
  } catch (error) {
    throw error;
  }
}
