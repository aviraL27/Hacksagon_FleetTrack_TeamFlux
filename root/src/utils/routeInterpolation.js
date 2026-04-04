/**
 * Route interpolation helpers for smooth fleet animation.
 * Uses Haversine distance and linear interpolation along waypoint arrays.
 */

export function haversineDistance([lat1, lng1], [lat2, lng2]) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function getSegmentLengths(waypoints) {
  const lengths = [];
  for (let i = 0; i < waypoints.length - 1; i++) {
    lengths.push(haversineDistance(waypoints[i], waypoints[i + 1]));
  }
  return lengths;
}

/**
 * Given an array of waypoints and a progress value (0–1),
 * return the interpolated [lat, lng] position along the route.
 */
export function interpolateRoute(waypoints, progress) {
  if (progress <= 0) return waypoints[0];
  if (progress >= 1) return waypoints[waypoints.length - 1];

  const segLengths = getSegmentLengths(waypoints);
  const totalLength = segLengths.reduce((sum, l) => sum + l, 0);
  const targetDist = progress * totalLength;

  let accum = 0;
  for (let i = 0; i < segLengths.length; i++) {
    if (accum + segLengths[i] >= targetDist) {
      const t = (targetDist - accum) / segLengths[i];
      const lat = waypoints[i][0] + t * (waypoints[i + 1][0] - waypoints[i][0]);
      const lng = waypoints[i][1] + t * (waypoints[i + 1][1] - waypoints[i][1]);
      return [lat, lng];
    }
    accum += segLengths[i];
  }

  return waypoints[waypoints.length - 1];
}

/**
 * Build an array of positions from start to the current progress
 * for drawing a "traveled" trail polyline.
 */
export function buildTrail(waypoints, progress) {
  if (progress <= 0) return [waypoints[0]];

  const segLengths = getSegmentLengths(waypoints);
  const totalLength = segLengths.reduce((sum, l) => sum + l, 0);
  const targetDist = progress * totalLength;

  const trail = [waypoints[0]];
  let accum = 0;

  for (let i = 0; i < segLengths.length; i++) {
    if (accum + segLengths[i] >= targetDist) {
      const t = (targetDist - accum) / segLengths[i];
      const lat = waypoints[i][0] + t * (waypoints[i + 1][0] - waypoints[i][0]);
      const lng = waypoints[i][1] + t * (waypoints[i + 1][1] - waypoints[i][1]);
      trail.push([lat, lng]);
      break;
    }
    trail.push(waypoints[i + 1]);
    accum += segLengths[i];
  }

  return trail;
}
