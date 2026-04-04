const INDIA_TIME_ZONE = 'Asia/Kolkata';

const dateFormatter = new Intl.DateTimeFormat('en-IN', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  timeZone: INDIA_TIME_ZONE,
});

const dateTimeFormatter = new Intl.DateTimeFormat('en-IN', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hour12: true,
  timeZone: INDIA_TIME_ZONE,
});

const shortDateTimeFormatter = new Intl.DateTimeFormat('en-IN', {
  day: '2-digit',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
  hour12: true,
  timeZone: INDIA_TIME_ZONE,
});

const cityCoordinates = {
  'Mumbai, MH': [19.076, 72.8777],
  'Pune, MH': [18.5204, 73.8567],
  'Delhi NCR': [28.6139, 77.209],
  'Jaipur, RJ': [26.9124, 75.7873],
  'Hyderabad, TS': [17.385, 78.4867],
  'Vijayawada, AP': [16.5062, 80.648],
  'Bengaluru, KA': [12.9716, 77.5946],
  'Chennai, TN': [13.0827, 80.2707],
  'Kolkata, WB': [22.5726, 88.3639],
  'Bhubaneswar, OD': [20.2961, 85.8245],
  'Ahmedabad, GJ': [23.0225, 72.5714],
  'Lucknow, UP': [26.8467, 80.9462],
};

export const ORDER_ROUTE_OPTIONS = [
  { origin: 'Mumbai, MH', destination: 'Pune, MH' },
  { origin: 'Delhi NCR', destination: 'Jaipur, RJ' },
  { origin: 'Hyderabad, TS', destination: 'Vijayawada, AP' },
  { origin: 'Bengaluru, KA', destination: 'Chennai, TN' },
  { origin: 'Kolkata, WB', destination: 'Bhubaneswar, OD' },
  { origin: 'Ahmedabad, GJ', destination: 'Mumbai, MH' },
  { origin: 'Delhi NCR', destination: 'Lucknow, UP' },
];

export function cloneMockData(value) {
  if (typeof structuredClone === 'function') {
    return structuredClone(value);
  }

  return JSON.parse(JSON.stringify(value));
}

export function createEntityId(prefix) {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}-${crypto.randomUUID().slice(0, 8)}`;
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function createOrderId() {
  return `#FT-${Math.floor(1000 + Math.random() * 9000)}`;
}

function formatPart(part) {
  return part.replace(/\b(am|pm)\b/i, (value) => value.toUpperCase());
}

export function formatDateLabel(value = new Date()) {
  return dateFormatter.format(new Date(value));
}

export function formatDateTimeLabel(value = new Date()) {
  return `${formatPart(dateTimeFormatter.format(new Date(value)))} IST`;
}

export function formatShortDateTimeLabel(value = new Date()) {
  return formatPart(shortDateTimeFormatter.format(new Date(value)));
}

export function formatLastLoginLabel(value = new Date()) {
  const now = new Date();
  const target = new Date(value);
  const diffMinutes = Math.max(1, Math.round((now.getTime() - target.getTime()) / 60000));

  if (diffMinutes < 60) {
    return `${diffMinutes} mins ago`;
  }

  return formatShortDateTimeLabel(target);
}

function cityLabel(value) {
  return value.split(',')[0];
}

export function buildRouteLabel(origin, destination) {
  return `${origin} to ${destination}`;
}

export function buildRouteDetail(origin, destination) {
  return `${cityLabel(origin)} to ${cityLabel(destination)}`;
}

export function getRoutePath(origin, destination) {
  const start = cityCoordinates[origin];
  const end = cityCoordinates[destination];

  if (!start || !end) {
    return [];
  }

  return [start, end];
}

export function getRoutePosition(origin, destination, progress = 0) {
  const [start, end] = getRoutePath(origin, destination);

  if (!start || !end) {
    return null;
  }

  const clampedProgress = Math.min(1, Math.max(0, progress));

  return [
    Number((start[0] + (end[0] - start[0]) * clampedProgress).toFixed(4)),
    Number((start[1] + (end[1] - start[1]) * clampedProgress).toFixed(4)),
  ];
}

export function getMarkerToneFromStatus(status) {
  if (status === 'Delayed') {
    return 'warning';
  }

  if (status === 'Delivered') {
    return 'success';
  }

  if (status === 'Pending') {
    return 'accent';
  }

  return 'info';
}

export function getDefaultTrackingProgress(status) {
  if (status === 'Delivered') {
    return 1;
  }

  if (status === 'Delayed') {
    return 0.36;
  }

  if (status === 'Pending') {
    return 0.08;
  }

  return 0.58;
}

export function getDefaultSpeedLabel(status) {
  if (status === 'Delivered') {
    return 'Delivered 18 min ago';
  }

  if (status === 'Pending') {
    return 'Awaiting dispatch';
  }

  if (status === 'Delayed') {
    return 'Traffic slowdown reported';
  }

  return '56 km/h';
}

export function getDefaultEta(status) {
  if (status === 'Delivered') {
    return 'Completed';
  }

  if (status === 'Pending') {
    return 'Awaiting driver';
  }

  if (status === 'Delayed') {
    return '45 min delay';
  }

  return '14:30 IST';
}

export function createOrderAuditLog(title, value = new Date()) {
  return {
    id: createEntityId('audit'),
    time: formatDateTimeLabel(value),
    title,
  };
}

export const INITIAL_VEHICLES = [
  {
    id: 'vehicle-1',
    registrationNumber: 'MH 12 RT 4098',
    model: 'Tata Prima 5530.S',
    type: 'Heavy Truck',
    assignedDriver: 'Aarav Kapoor',
    status: 'Active',
    nextService: '12 Apr 2026',
    serviceNote: 'In 4,200 km',
    fuelAverage: 12.8,
    vin: 'MAT5530SPRIMA8421',
    capacity: '28 Ton',
    hub: 'Mumbai Central Hub',
    notes: 'Primary long-haul unit on the west corridor.',
  },
  {
    id: 'vehicle-2',
    registrationNumber: 'DL 01 LV 2284',
    model: 'Ashok Leyland Dost+',
    type: 'Light Van',
    assignedDriver: 'Kavya Nair',
    status: 'Maintenance',
    nextService: 'Overdue',
    serviceNote: 'Scheduled 28 Mar 2026',
    fuelAverage: 10.9,
    vin: 'LEYDOSTPLUS2298',
    capacity: '2 Ton',
    hub: 'Delhi NCR Hub 4',
    notes: 'Brake inspection pending before reassignment.',
  },
  {
    id: 'vehicle-3',
    registrationNumber: 'KA 03 HX 7712',
    model: 'Eicher Pro 6055',
    type: 'Heavy Truck',
    assignedDriver: 'Unassigned',
    status: 'Idle',
    nextService: '30 Apr 2026',
    serviceNote: 'In 12,000 km',
    fuelAverage: 13.2,
    vin: 'EICH6055PRO7712',
    capacity: '24 Ton',
    hub: 'Bengaluru South Yard',
    notes: 'Reserved for electronics dispatch overflow.',
  },
  {
    id: 'vehicle-4',
    registrationNumber: 'TS 09 MQ 1184',
    model: 'BharatBenz 2823C',
    type: 'Box Truck',
    assignedDriver: 'Nisha Reddy',
    status: 'Active',
    nextService: '18 Apr 2026',
    serviceNote: 'In 6,800 km',
    fuelAverage: 11.7,
    vin: 'BB2823C1184TS09',
    capacity: '16 Ton',
    hub: 'Hyderabad Pharma City',
    notes: 'Cold-chain compatible retrofitted box body.',
  },
];

export const INITIAL_DRIVERS = [
  {
    id: 'driver-1',
    name: 'Aarav Kapoor',
    licenseNumber: 'MH14 20210012345',
    assignment: 'Tata Prima 5530.S',
    detail: 'Mumbai to Pune',
    status: 'On Trip',
    score: 98.4,
    grade: 'A+',
    phone: '+91 98765 11021',
    baseHub: 'Mumbai Central Hub',
    experience: '7 years',
    emergencyContact: 'Ritika Kapoor - +91 98201 44219',
  },
  {
    id: 'driver-2',
    name: 'Neha Verma',
    licenseNumber: 'DL05 20200045678',
    assignment: 'Ashok Leyland 3520',
    detail: 'Delhi NCR Hub 4',
    status: 'Available',
    score: 92.1,
    grade: 'A',
    phone: '+91 98112 80454',
    baseHub: 'Delhi NCR Hub 4',
    experience: '5 years',
    emergencyContact: 'Vivek Verma - +91 98991 77110',
  },
  {
    id: 'driver-3',
    name: 'Rohan Iyer',
    licenseNumber: 'KA03 20190091234',
    assignment: 'Eicher Pro 6055',
    detail: 'Bengaluru to Chennai',
    status: 'On Trip',
    score: 88.9,
    grade: 'B+',
    phone: '+91 98861 52148',
    baseHub: 'Bengaluru South Yard',
    experience: '6 years',
    emergencyContact: 'Lakshmi Iyer - +91 98450 88113',
  },
  {
    id: 'driver-4',
    name: 'Priya Sharma',
    licenseNumber: 'RJ14 20180044211',
    assignment: 'Medical Leave',
    detail: 'Re-entry 12 Apr',
    status: 'Inactive',
    score: 95,
    grade: 'A',
    phone: '+91 97990 11263',
    baseHub: 'Jaipur North Hub',
    experience: '8 years',
    emergencyContact: 'Rajesh Sharma - +91 98292 61084',
  },
  {
    id: 'driver-5',
    name: 'Sourav Chatterjee',
    licenseNumber: 'WB02 20210033107',
    assignment: 'BharatBenz 2823C',
    detail: 'Kolkata to Bhubaneswar',
    status: 'On Trip',
    score: 89.2,
    grade: 'B',
    phone: '+91 98310 55214',
    baseHub: 'Kolkata East Dock',
    experience: '4 years',
    emergencyContact: 'Mitali Chatterjee - +91 98746 19702',
  },
  {
    id: 'driver-6',
    name: 'Kavya Nair',
    licenseNumber: 'KL07 20220078114',
    assignment: 'Mahindra Blazo X',
    detail: 'Chennai South Hub',
    status: 'Available',
    score: 99.1,
    grade: 'A+',
    phone: '+91 98472 88314',
    baseHub: 'Chennai South Hub',
    experience: '3 years',
    emergencyContact: 'Ajay Nair - +91 98957 61003',
  },
  {
    id: 'driver-7',
    name: 'Nisha Reddy',
    licenseNumber: 'TS09 20210061234',
    assignment: 'Tata Signa 5530.S',
    detail: 'Hyderabad to Vijayawada',
    status: 'On Trip',
    score: 84.7,
    grade: 'B',
    phone: '+91 99896 34122',
    baseHub: 'Hyderabad Pharma City',
    experience: '5 years',
    emergencyContact: 'Harish Reddy - +91 99515 77190',
  },
];

export const INITIAL_ORDERS = [
  {
    id: '#FT-9021',
    customer: 'Reliance Retail Distribution',
    origin: 'Mumbai, MH',
    destination: 'Pune, MH',
    route: 'Mumbai, MH to Pune, MH',
    detail: 'Mumbai to Pune',
    weight: '8,340 kg',
    status: 'In Transit',
    driver: 'Aarav Kapoor',
    driverId: 'driver-1',
    priority: 'High',
    eta: '14:30 IST',
    speed: '64 km/h',
    progress: 0.58,
    markerTone: 'accent',
    position: [18.7591, 73.4137],
    routePath: getRoutePath('Mumbai, MH', 'Pune, MH'),
    auditLogs: [
      createOrderAuditLog('In Transit: Left Bhiwandi hub', '2026-04-01T08:30:00+05:30'),
      createOrderAuditLog('Order dispatched', '2026-03-31T23:45:00+05:30'),
      createOrderAuditLog('Invoice finalized', '2026-03-31T18:12:00+05:30'),
    ],
  },
  {
    id: '#FT-9022',
    customer: 'BigBasket Fulfilment',
    origin: 'Delhi NCR',
    destination: 'Jaipur, RJ',
    route: 'Delhi NCR to Jaipur, RJ',
    detail: 'Delhi NCR to Jaipur',
    weight: '5,480 kg',
    status: 'Pending',
    driver: 'Unassigned',
    driverId: null,
    priority: 'Medium',
    eta: 'Awaiting driver',
    speed: 'Awaiting dispatch',
    progress: 0.08,
    markerTone: 'accent',
    position: getRoutePosition('Delhi NCR', 'Jaipur, RJ', 0.08),
    routePath: getRoutePath('Delhi NCR', 'Jaipur, RJ'),
    auditLogs: [
      createOrderAuditLog('Driver assignment pending', '2026-04-01T09:12:00+05:30'),
      createOrderAuditLog('Dispatch board approved', '2026-04-01T07:41:00+05:30'),
      createOrderAuditLog('Order created', '2026-03-31T17:03:00+05:30'),
    ],
  },
  {
    id: '#FT-8998',
    customer: 'Apollo MedSupply',
    origin: 'Hyderabad, TS',
    destination: 'Vijayawada, AP',
    route: 'Hyderabad, TS to Vijayawada, AP',
    detail: 'Hyderabad to Vijayawada',
    weight: '12,900 kg',
    status: 'Delivered',
    driver: 'Nisha Reddy',
    driverId: 'driver-7',
    priority: 'Critical',
    eta: 'Completed',
    speed: 'Delivered 18 min ago',
    progress: 1,
    markerTone: 'success',
    position: getRoutePosition('Hyderabad, TS', 'Vijayawada, AP', 1),
    routePath: getRoutePath('Hyderabad, TS', 'Vijayawada, AP'),
    auditLogs: [
      createOrderAuditLog('Delivery confirmed', '2026-04-01T07:05:00+05:30'),
      createOrderAuditLog('Proof of delivery uploaded', '2026-04-01T06:48:00+05:30'),
      createOrderAuditLog('Customer notified', '2026-04-01T06:44:00+05:30'),
    ],
  },
  {
    id: '#FT-8995',
    customer: 'Tata Electronics',
    origin: 'Bengaluru, KA',
    destination: 'Chennai, TN',
    route: 'Bengaluru, KA to Chennai, TN',
    detail: 'Bengaluru to Chennai',
    weight: '2,300 kg',
    status: 'Delayed',
    driver: 'Rohan Iyer',
    driverId: 'driver-3',
    priority: 'High',
    eta: '45 min delay',
    speed: 'Traffic at Vellore bypass',
    progress: 0.4,
    markerTone: 'warning',
    position: [12.9698, 79.1559],
    routePath: getRoutePath('Bengaluru, KA', 'Chennai, TN'),
    auditLogs: [
      createOrderAuditLog('Delay exception raised', '2026-04-01T10:04:00+05:30'),
      createOrderAuditLog('Traffic advisory attached', '2026-04-01T09:26:00+05:30'),
      createOrderAuditLog('Order dispatched', '2026-04-01T06:11:00+05:30'),
    ],
  },
  {
    id: '#FT-7718',
    customer: 'ITC Foods East',
    origin: 'Kolkata, WB',
    destination: 'Bhubaneswar, OD',
    route: 'Kolkata, WB to Bhubaneswar, OD',
    detail: 'Kolkata to Bhubaneswar',
    weight: '6,780 kg',
    status: 'In Transit',
    driver: 'Sourav Chatterjee',
    driverId: 'driver-5',
    priority: 'Medium',
    eta: '19:10 IST',
    speed: '58 km/h',
    progress: 0.52,
    markerTone: 'accent',
    position: [21.4768, 87.8791],
    routePath: getRoutePath('Kolkata, WB', 'Bhubaneswar, OD'),
    auditLogs: [
      createOrderAuditLog('Shipment left Kolkata East Dock', '2026-04-01T11:18:00+05:30'),
      createOrderAuditLog('Driver check-in verified', '2026-04-01T10:05:00+05:30'),
      createOrderAuditLog('Route activated', '2026-04-01T08:44:00+05:30'),
    ],
  },
];

export const INITIAL_MAINTENANCE_ENTRIES = [
  {
    id: 'maintenance-1',
    registration: 'MH 12 RT 4098',
    service: 'Full Engine Overhaul',
    lastService: '12 Dec 2025',
    nextDue: '15 Apr 2026',
    status: 'Critical',
    vendor: 'Mumbai Diesel Works',
    costEstimate: 'INR 42,000',
    notes: 'Turbo pressure variation flagged on west corridor run.',
  },
  {
    id: 'maintenance-2',
    registration: 'DL 01 LV 2284',
    service: 'Tyre Rotation',
    lastService: '01 Feb 2026',
    nextDue: '15 Apr 2026',
    status: 'Good',
    vendor: 'Northline Wheels',
    costEstimate: 'INR 6,500',
    notes: 'Routine service before Delhi NCR reassignment.',
  },
  {
    id: 'maintenance-3',
    registration: 'KA 03 HX 7712',
    service: 'Oil and Filter Change',
    lastService: '28 Jan 2026',
    nextDue: '20 Apr 2026',
    status: 'Warning',
    vendor: 'Bengaluru Fleet Care',
    costEstimate: 'INR 9,800',
    notes: 'Extended idle period increased reminder priority.',
  },
  {
    id: 'maintenance-4',
    registration: 'TS 09 MQ 1184',
    service: 'Brake Fluid Flush',
    lastService: '14 Aug 2025',
    nextDue: '14 Aug 2026',
    status: 'Good',
    vendor: 'Hyderabad Fleet Works',
    costEstimate: 'INR 4,200',
    notes: 'No active exceptions reported.',
  },
];

export const INITIAL_MAINTENANCE_ALERTS = [
  {
    id: 'alert-1',
    level: 'Critical',
    title: 'Engine Temperature Malfunction',
    note: 'Vehicle ID: FT-7729-LX - Delhi NCR corridor',
    action: 'Schedule Service',
    tone: 'danger',
    status: 'New',
  },
  {
    id: 'alert-2',
    level: 'Warning',
    title: 'Brake Pad Wear (85%)',
    note: 'Vehicle ID: FT-1102-MB - Mumbai western hub',
    action: 'Mark as Read',
    tone: 'warning',
    status: 'New',
  },
  {
    id: 'alert-3',
    level: 'Info',
    title: 'Software Update Available (v2.4.1)',
    note: 'All telematics units - Fleet-wide rollout',
    action: 'Install Now',
    tone: 'info',
    status: 'Available',
  },
];

export const INITIAL_MAINTENANCE_HISTORY = [
  {
    id: 'history-1',
    registration: 'MH 12 RT 4098',
    service: 'Cooling system flush',
    completedOn: '28 Mar 2026',
    technician: 'Mumbai Diesel Works',
    result: 'Completed and test driven',
  },
  {
    id: 'history-2',
    registration: 'DL 01 LV 2284',
    service: 'Brake pad replacement',
    completedOn: '19 Mar 2026',
    technician: 'Northline Wheels',
    result: 'Recalibrated ABS sensor',
  },
  {
    id: 'history-3',
    registration: 'TS 09 MQ 1184',
    service: 'Battery health check',
    completedOn: '11 Mar 2026',
    technician: 'Hyderabad Fleet Works',
    result: 'No replacement required',
  },
];

export const INITIAL_COMPANY_PROFILE = {
  legalEntityName: 'Saarthi Logistics Private Limited',
  domainPrefix: 'saarthi',
  headquartersAddress: '5th Floor, Trade Centre, Bandra Kurla Complex, Mumbai, Maharashtra, India',
};

export const INITIAL_TEAM_MEMBERS = [
  {
    id: 'manager-1',
    name: 'Ananya Rao',
    email: 'a.rao@saarthi.com',
    role: 'Super Admin',
    lastLogin: '2 mins ago',
    status: 'Active',
  },
  {
    id: 'manager-2',
    name: 'Vikram Singh',
    email: 'v.singh@saarthi.com',
    role: 'Fleet Dispatcher',
    lastLogin: '01 Apr, 11:45 am',
    status: 'Active',
  },
  {
    id: 'manager-3',
    name: 'Meera Joshi',
    email: 'm.joshi@saarthi.com',
    role: 'Billing Manager',
    lastLogin: '28 Mar, 09:12 am',
    status: 'Pending',
  },
];
