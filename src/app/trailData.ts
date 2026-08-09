// Trail systems from Tarheel Trailblazers (tarheeltrailblazers.com/trails)
// and surrounding Carolinas regions. Coordinates are approximate park/entrance centers.

export interface TrailEntry {
  name: string;
  system: string;
  coords: [number, number];
  region: 'Charlotte Metro' | 'Pisgah / Dupont' | 'Piedmont / Other';
}

const trailSystems: TrailEntry[] = [
  // ── Charlotte Metro (Tarheel Trailblazers core systems) ──
  { name: 'Backyard Trails',                     system: 'Park Road Park',                    coords: [35.1300, -80.8500], region: 'Charlotte Metro' },
  { name: 'Park Road Park',                      system: 'Park Road Park',                    coords: [35.1402, -80.8560], region: 'Charlotte Metro' },
  { name: 'Renaissance Park',                    system: 'Renaissance Park',                  coords: [35.1900, -80.8739], region: 'Charlotte Metro' },
  { name: 'Rocky Branch Trail',                  system: 'Rocky Branch Park',                 coords: [35.1859, -80.8288], region: 'Charlotte Metro' },
  { name: 'Purser Hulsey Park',                  system: 'Purser Hulsey Park',                coords: [35.2594, -80.9460], region: 'Charlotte Metro' },
  { name: 'Colonel Francis Beatty Park',         system: 'Colonel Beatty Park',               coords: [35.1196, -80.7230], region: 'Charlotte Metro' },
  { name: 'Sherman Branch',                      system: 'Sherman Branch Nature Preserve',     coords: [35.0979, -80.7081], region: 'Charlotte Metro' },
  { name: 'McAlpine Creek Park',                 system: 'McAlpine Creek Park',               coords: [35.1497, -80.7382], region: 'Charlotte Metro' },
  { name: 'McAlpine Greenway',                   system: 'McAlpine Creek Park',               coords: [35.1469, -80.7454], region: 'Charlotte Metro' },
  { name: 'Anne Springs Close Greenway',         system: 'Anne Springs Close',                coords: [35.0218, -80.8728], region: 'Charlotte Metro' },
  { name: 'US National Whitewater Center',       system: 'USNWC',                             coords: [35.2561, -80.9819], region: 'Charlotte Metro' },
  { name: 'Airline Bike Park',                   system: 'Airline Bike Park',                 coords: [35.2350, -81.0100], region: 'Charlotte Metro' },
  { name: 'Ballantyne District Park',            system: 'Ballantyne District Park',           coords: [35.0450, -80.8500], region: 'Charlotte Metro' },
  { name: 'Southview Park',                      system: 'Southview Park',                    coords: [35.1620, -80.8900], region: 'Charlotte Metro' },
  { name: 'North Mecklenburg Park',              system: 'North Mecklenburg Park',            coords: [35.4059, -80.8426], region: 'Charlotte Metro' },
  { name: 'Mountain Island Park',                system: 'Mountain Island Park',              coords: [35.3230, -80.9892], region: 'Charlotte Metro' },
  { name: 'Signal Hill',                         system: 'Signal Hill',                       coords: [35.3400, -80.9200], region: 'Charlotte Metro' },
  { name: 'Brown Mill Trail',                    system: 'Brown Mill Trail',                  coords: [35.2080, -80.9000], region: 'Charlotte Metro' },
  { name: 'Big Leaf Slopes Park',                system: 'Big Leaf Slopes Park',              coords: [35.1700, -80.9300], region: 'Charlotte Metro' },

  // ── Lake Norman / Northern Suburbs ──
  { name: 'Fisher Farm Park',                    system: 'Fisher Farm Park',                  coords: [35.4245, -80.8322], region: 'Charlotte Metro' },
  { name: 'Cedar Valley Bike Park',              system: 'Cedar Valley Bike Park',            coords: [35.4503, -80.8135], region: 'Charlotte Metro' },
  { name: 'Lake Norman State Park',              system: 'Lake Norman State Park',            coords: [35.5063, -80.9462], region: 'Charlotte Metro' },
  { name: 'Jetton Park',                         system: 'Jetton Park',                       coords: [35.4720, -80.9015], region: 'Charlotte Metro' },
  { name: 'Mountain Creek Park',                 system: 'Mountain Creek Park',               coords: [35.4979, -80.9910], region: 'Charlotte Metro' },
  { name: 'Mazeppa Park',                        system: 'Mazeppa Park',                      coords: [35.5689, -80.7942], region: 'Charlotte Metro' },
  { name: 'George Poston Park',                  system: 'George Poston Park',                coords: [35.2801, -81.0962], region: 'Charlotte Metro' },
  { name: 'Harrisburg Half',                     system: 'Harrisburg Half',                   coords: [35.3221, -80.6529], region: 'Charlotte Metro' },

  // ── Brevard / Pisgah / Dupont ──
  { name: 'Bennett Gap Trail',                   system: 'Pisgah National Forest',            coords: [35.2803, -82.7704], region: 'Pisgah / Dupont' },
  { name: 'Farlow Gap',                          system: 'Pisgah National Forest',            coords: [35.2439, -82.7856], region: 'Pisgah / Dupont' },
  { name: 'Trace Ridge',                         system: 'Pisgah National Forest',            coords: [35.2588, -82.7401], region: 'Pisgah / Dupont' },
  { name: 'Clawhammer Trail',                    system: 'Pisgah National Forest',            coords: [35.2222, -82.6988], region: 'Pisgah / Dupont' },
  { name: 'Spencer Branch',                      system: 'Pisgah National Forest',            coords: [35.2335, -82.7142], region: 'Pisgah / Dupont' },
  { name: 'Kitsuma Trail',                       system: 'Pisgah National Forest',            coords: [35.5722, -82.3114], region: 'Pisgah / Dupont' },
  { name: 'Black Mountain Trail',                system: 'Pisgah National Forest',            coords: [35.6128, -82.3216], region: 'Pisgah / Dupont' },
  { name: 'Cedar Rock Connector',                system: 'Pisgah National Forest',            coords: [35.2598, -82.7912], region: 'Pisgah / Dupont' },
  { name: 'Cat Gap Loop',                        system: 'Pisgah National Forest',            coords: [35.1538, -82.7432], region: 'Pisgah / Dupont' },
  { name: 'John Rock Trail',                     system: 'Pisgah National Forest',            coords: [35.2785, -82.7956], region: 'Pisgah / Dupont' },
  { name: 'East Fork Trail',                     system: 'Pisgah National Forest',            coords: [35.1276, -82.8267], region: 'Pisgah / Dupont' },
  { name: 'Ridgeline Trail',                     system: 'Dupont State Forest',               coords: [35.1958, -82.6278], region: 'Pisgah / Dupont' },
  { name: 'Corn Mill Shoals',                    system: 'Dupont State Forest',               coords: [35.2103, -82.6012], region: 'Pisgah / Dupont' },
  { name: 'Little River Trail',                  system: 'Dupont State Forest',               coords: [35.1784, -82.6078], region: 'Pisgah / Dupont' },
  { name: 'Kanuga Trail',                        system: 'Dupont State Forest',               coords: [35.1698, -82.6374], region: 'Pisgah / Dupont' },
  { name: 'South Prong Trail',                   system: 'Dupont State Forest',               coords: [35.1856, -82.6023], region: 'Pisgah / Dupont' },
  { name: 'Hickory Mountain Loop',               system: 'Dupont State Forest',               coords: [35.2046, -82.6140], region: 'Pisgah / Dupont' },

  // ── Piedmont / Other NC / SC ──
  { name: 'Uwharrie Trail',                      system: 'Uwharrie National Forest',          coords: [35.3869, -79.9904], region: 'Piedmont / Other' },
  { name: 'Dutchman\'s Creek Trail',              system: 'Uwharrie National Forest',          coords: [35.4000, -80.0000], region: 'Piedmont / Other' },
  { name: 'Crowders Mountain Trail',             system: 'Crowders Mountain State Park',      coords: [35.2181, -81.2917], region: 'Piedmont / Other' },
  { name: 'Kings Mountain Trail',                system: 'Kings Mountain State Park',         coords: [35.1206, -81.3389], region: 'Piedmont / Other' },
  { name: 'Big Rock Trail',                      system: 'Table Rock State Park',             coords: [35.0398, -82.6962], region: 'Piedmont / Other' },
  { name: 'Pinnacle Trail',                      system: 'Table Rock State Park',             coords: [35.0481, -82.6902], region: 'Piedmont / Other' },
  { name: 'Foothills Trail',                     system: 'Sumter National Forest',            coords: [35.0788, -82.7265], region: 'Piedmont / Other' },
  { name: 'Green River Trail',                   system: 'Green River Gamelands',             coords: [35.2569, -82.0594], region: 'Piedmont / Other' },
  { name: 'Hickory Nut Gorge Trail',             system: 'Chimney Rock State Park',           coords: [35.4322, -82.2618], region: 'Piedmont / Other' },
  { name: 'Rocky Broad Trail',                   system: 'Lake Lure',                        coords: [35.4382, -82.1948], region: 'Piedmont / Other' },
  { name: 'Itusi Trail',                         system: 'Lake James State Park',             coords: [35.7406, -81.8937], region: 'Piedmont / Other' },
  { name: 'UMWELD Training Area',                system: 'US Forest Service',                 coords: [35.3024, -82.4512], region: 'Piedmont / Other' },
  { name: 'Stumphouse Tunnel Trail',             system: 'Stumphouse Mountain',               coords: [34.7889, -83.0281], region: 'Piedmont / Other' },
  { name: 'Church Street Park',                  system: 'Matthews Trail Network',            coords: [35.1168, -80.7237], region: 'Charlotte Metro' },
  { name: 'Four Mile Creek Greenway',            system: 'Matthews Trail Network',            coords: [35.1073, -80.7302], region: 'Charlotte Metro' },
  { name: 'Battle of Charlotte Loop',            system: 'Colonel Beatty Park',               coords: [35.1196, -80.7230], region: 'Charlotte Metro' },
  { name: 'Cane Creek Trail',                    system: 'Cane Creek Park',                   coords: [34.9334, -80.6579], region: 'Charlotte Metro' },
  { name: 'Hornets Nest Trail',                  system: 'Hornets Nest Park',                 coords: [35.4201, -80.9018], region: 'Charlotte Metro' },
  { name: 'Lake Norman Loop',                    system: 'Lake Norman State Park',            coords: [35.5063, -80.9462], region: 'Charlotte Metro' },
];

export default trailSystems;

export const findTrail = (name: string): TrailEntry | undefined =>
  trailSystems.find((t) => t.name.toLowerCase() === name.toLowerCase());

export const searchTrails = (query: string): TrailEntry[] => {
  const q = query.toLowerCase();
  return trailSystems.filter(
    (t) =>
      t.name.toLowerCase().includes(q) ||
      t.system.toLowerCase().includes(q) ||
      t.region.toLowerCase().includes(q)
  );
};

export const uniqueSystems = (): string[] =>
  [...new Set(trailSystems.map((t) => t.system))].sort();

export const uniqueRegions = (): string[] =>
  [...new Set(trailSystems.map((t) => t.region))];