import fetchTomTomJSON from "./fetch.mjs";

export default async function findOptimalPath(request) {
  async function getDistanceAndTime(point1, point2) {
    try {
      const json = await fetchTomTomJSON([point1, point2]);
      if (!json.hasOwnProperty("routes")) {
        throw {
          name: "InvalidResponseError",
          message:
            "The response does not contain the expected 'routes' property.",
        };
      }
      const distance = json.routes[0].summary.lengthInMeters;
      const distanceInKilometers = Math.round((distance / 1000) * 1000) / 1000;
      const time = json.routes[0].summary.travelTimeInSeconds;
      const timeinHours = Math.round((time / 3600) * 100) / 100;
      return { distance: distanceInKilometers, time: timeinHours };
    } catch (error) {
      throw error;
    }
  }

  const {
    waypoints,
    initialBatteryCharge,
    fullBatteryChargeCapacity,
    dischargingRate,
    chargingRate,
    chargingStations,
  } = request;
  const priorityQueue = [];

  priorityQueue.push({
    currentLocation: waypoints[0],
    indexOfNextTargetLocation: 1,
    totalTime: 0,
    currentBatteryCharge: initialBatteryCharge,
    path: [waypoints[0]],
    stations: [],
  });

  while (priorityQueue.length > 0) {
    priorityQueue.sort((a, b) => a.totalTime - b.totalTime);
    const {
      currentLocation,
      indexOfNextTargetLocation,
      totalTime,
      currentBatteryCharge,
      path,
      stations,
    } = priorityQueue.shift();

    if (indexOfNextTargetLocation == waypoints.length) {
      return { path: path, stations: stations };
    }

    for (const chargingStation of chargingStations) {
      const { location, reservedFrom, reservedTill } = chargingStation;
      if (location === currentLocation || reservedFrom != null) continue;
      try {
        const json = await getDistanceAndTime(currentLocation, location);
        const distance = json.distance;
        let newTotalTime = json.time + totalTime;

        if (distance * dischargingRate < currentBatteryCharge) {
          let newCurrentBatteryCharge =
            currentBatteryCharge - distance * dischargingRate;
          const chargingTime =
            (fullBatteryChargeCapacity - newCurrentBatteryCharge) /
            chargingRate;

          newTotalTime += chargingTime;
          newCurrentBatteryCharge = fullBatteryChargeCapacity;
          const newCurrentLocation = location;
          const newPath = path.concat(newCurrentLocation);
          const newIndexOfNextTargetLocation = indexOfNextTargetLocation;

          const newStations = stations.concat(location);

          priorityQueue.push({
            currentLocation: newCurrentLocation,
            indexOfNextTargetLocation: newIndexOfNextTargetLocation,
            totalTime: newTotalTime,
            currentBatteryCharge: newCurrentBatteryCharge,
            path: newPath,
            stations: newStations,
          });
        }
      } catch (error) {
        console.log({
          error: {
            name: error.name,
            message: error.message,
          },
        });
      }
    }

    try {
      const json = await getDistanceAndTime(
        currentLocation,
        waypoints[indexOfNextTargetLocation]
      );

      const distance = json.distance;
      let newTotalTime = json.time + totalTime;

      if (distance * dischargingRate < currentBatteryCharge) {
        const newCurrentBatteryCharge =
          currentBatteryCharge - distance * dischargingRate;
        const newCurrentLocation = waypoints[indexOfNextTargetLocation];
        const newPath = path.concat(newCurrentLocation);
        const newIndexOfNextTargetLocation = indexOfNextTargetLocation + 1;
        const newStations = stations;

        priorityQueue.push({
          currentLocation: newCurrentLocation,
          indexOfNextTargetLocation: newIndexOfNextTargetLocation,
          totalTime: newTotalTime,
          currentBatteryCharge: newCurrentBatteryCharge,
          path: newPath,
          stations: newStations,
        });
      }
    } catch (error) {
      console.log({
        error: {
          name: error.name,
          message: error.message,
        },
      });
    }
  }

  return { path: [], stations: [] };
}
