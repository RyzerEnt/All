export interface RunCoord {
  latitude: number;
  longitude: number;
  timestamp: number;
}

let _coords: RunCoord[] = [];
let _distance = 0;

export const runSession = {
  setCoords: (c: RunCoord[]) => { _coords = c; },
  getCoords: () => _coords,
  setDistance: (d: number) => { _distance = d; },
  getDistance: () => _distance,
  clear: () => { _coords = []; _distance = 0; },
};
