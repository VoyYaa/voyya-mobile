import http from 'node:http';

const PORT = Number(process.env.MOCK_API_PORT ?? 3999);
const HOST = process.env.MOCK_API_HOST ?? '127.0.0.1';
const STALE_AFTER_SEC = 45;
const HIDE_AFTER_SEC = 300;
const INTERVAL_SEC = 15;
const MAX_ATTEMPTS = 5;
const CURRENT_NOTICE = 'location-notice-v3';
const WINDOW = ['assigned', 'driver_en_route'];
const OPEN = ['assigned', 'driver_en_route', 'in_progress'];

const TENANT = {
  company_id: 1,
  company_name: 'Cootrayal',
  municipality_id: 1,
  municipality_name: 'Yarumal',
};
const USERS = {
  passenger: {
    user_id: 5,
    first_name: 'Laura',
    last_name: 'Pérez',
    role: 'passenger',
    tenant: null,
    profile_complete: true,
    pin_change_required: false,
  },
  driver: {
    user_id: 9,
    first_name: 'Carlos',
    last_name: 'Gómez',
    role: 'driver',
    tenant: TENANT,
    profile_complete: true,
    pin_change_required: false,
  },
};
const TOKENS = { 'passenger-token': 'passenger', 'driver-token': 'driver' };
const PICKUP = { lat: 6.9612, lng: -75.4178, address: 'Parque Principal, Yarumal' };
const DROPOFF = { lat: 6.9701, lng: -75.4092, address: 'Barrio El Centro, Yarumal' };
const FARE = {
  base_fare: 8000,
  night_surcharge: 0,
  holiday_surcharge: 0,
  total: 8000,
  commission: 800,
  currency: 'COP',
};

function freshState() {
  return {
    trip: null,
    offer: null,
    driverPos: null,
    onShift: false,
    consent: {
      driver: { state: 'none', version: null },
      passenger: { state: 'granted', version: CURRENT_NOTICE },
    },
    control: { throttleNext: 0, dropNext: false, offline: false },
    reports: [],
    log: [],
    nextId: 101,
  };
}

let S = freshState();

const iso = (ms) => new Date(ms).toISOString();
const json = (res, status, body, headers = {}) => {
  res.writeHead(status, { 'Content-Type': 'application/json', ...headers });
  res.end(JSON.stringify(body));
};

function session(role) {
  return {
    tokens: {
      access_token: `${role}-token`,
      refresh_token: `${role}-refresh`,
      token_type: 'Bearer',
      expires_in: 3600,
    },
    user: USERS[role],
  };
}

function consentStatus(role) {
  const entry = S.consent[role];
  const granted = entry.state === 'granted';
  return {
    purpose: 'location',
    state: entry.state,
    notice_version: entry.version,
    granted_at: granted ? iso(Date.now() - 60_000) : null,
    revoked_at: null,
    current_notice_version: CURRENT_NOTICE,
    requires_acceptance: !(granted && entry.version === CURRENT_NOTICE),
  };
}

function consentCoversSharing() {
  const entry = S.consent.driver;
  return entry.state === 'granted' && entry.version === CURRENT_NOTICE;
}

function inWindow() {
  return S.trip !== null && WINDOW.includes(S.trip.status);
}

function locationSharing() {
  if (!inWindow() || !consentCoversSharing()) return null;
  return { trip_request_id: S.trip.id, interval_sec: INTERVAL_SEC };
}

function driverTripView() {
  const trip = S.trip;
  if (trip === null || !OPEN.includes(trip.status)) return null;
  const windowOpen = WINDOW.includes(trip.status);
  const required = windowOpen && !trip.exempt;
  return {
    trip_request_id: trip.id,
    assignment_id: trip.id + 1000,
    status: trip.status,
    passenger: { name: 'Laura Pérez', contact_phone: '3001234567' },
    pickup_address: PICKUP.address,
    dropoff_address: DROPOFF.address,
    fare: FARE,
    arrived_at: trip.arrivedAt ? iso(trip.arrivedAt) : null,
    no_show_available_at: trip.arrivedAt ? iso(trip.arrivedAt + 120_000) : null,
    cash_collected_at: null,
    start_code_required: required,
    start_attempts_remaining: required ? (trip.blocked ? 0 : MAX_ATTEMPTS - trip.failed) : null,
    start_blocked: required && trip.blocked,
    pickup_location: { lat: PICKUP.lat, lng: PICKUP.lng },
    dropoff_location: trip.status === 'in_progress' ? { lat: DROPOFF.lat, lng: DROPOFF.lng } : null,
    location_sharing: locationSharing(),
  };
}

function passengerStatus() {
  const trip = S.trip;
  if (trip === null) return null;
  const windowOpen = WINDOW.includes(trip.status);
  const ui = {
    assigned: 'driver_assigned',
    driver_en_route: trip.arrivedAt ? 'driver_waiting' : 'driver_en_route',
    in_progress: 'trip_in_progress',
    completed: 'trip_completed',
    cancelled_by_passenger: 'trip_cancelled',
    cancelled_by_driver: 'trip_cancelled',
    no_show: 'trip_no_show',
  }[trip.status];
  let codeState = 'not_applicable';
  if (windowOpen) codeState = trip.exempt ? 'not_required' : trip.blocked ? 'blocked' : 'active';
  let tracking = null;
  if (windowOpen) {
    const pos = S.driverPos;
    const ageSec = pos ? Math.floor((Date.now() - pos.at) / 1000) : null;
    const usable = pos && pos.at >= trip.assignedAt && ageSec < HIDE_AFTER_SEC;
    tracking = {
      window_age_sec: Math.floor((Date.now() - trip.assignedAt) / 1000),
      stale_after_sec: STALE_AFTER_SEC,
      hide_after_sec: HIDE_AFTER_SEC,
      position:
        usable && consentCoversSharing() ? { lat: pos.lat, lng: pos.lng, age_sec: ageSec } : null,
    };
  }
  return {
    trip_request_id: trip.id,
    status: trip.status,
    ui,
    service_type: 'taxi',
    requested_company: null,
    fare: FARE,
    driver: {
      name: 'Carlos Gómez',
      plate: 'ABC123',
      model: 'Chevrolet Spark 2019',
      contact_phone: '3009876543',
      eta: { min_minutes: 4, max_minutes: 6, is_estimate: true },
      company: { company_id: 1, display_name: 'Cootrayal' },
    },
    arrived_at: trip.arrivedAt ? iso(trip.arrivedAt) : null,
    free_cancellation_until: iso(trip.assignedAt + 120_000),
    updated_at: iso(Date.now()),
    server_time: iso(Date.now()),
    start_code: codeState === 'active' ? trip.code : null,
    start_code_state: codeState,
    driver_tracking: tracking,
  };
}

function newTrip(options = {}) {
  const status = options.status ?? 'assigned';
  S.trip = {
    id: S.nextId++,
    status,
    assignedAt: Date.now() - (options.assignedAgoSec ?? 0) * 1000,
    arrivedAt: status === 'driver_en_route' && options.arrived ? Date.now() - 5000 : null,
    failed: options.failed ?? 0,
    blocked: options.blocked ?? false,
    code: options.code ?? '4821',
    exempt: options.exempt ?? false,
  };
  S.driverPos = null;
  S.onShift = true;
}

function startTrip(body, res) {
  const trip = S.trip;
  if (!trip || !WINDOW.includes(trip.status)) {
    return json(res, 409, { code: 'INVALID_TRIP_TRANSITION', message: 'El viaje cambió.' });
  }
  if (trip.exempt) {
    trip.status = 'in_progress';
    return json(res, 200, { trip_request_id: trip.id, status: trip.status, idempotent: false });
  }
  if (!body || body.start_code === undefined) {
    return json(res, 422, {
      code: 'START_CODE_REQUIRED',
      message: 'Para iniciar este viaje pídele el código al pasajero.',
    });
  }
  if (trip.blocked) {
    return json(res, 409, {
      code: 'START_CODE_BLOCKED',
      message: 'El inicio de este viaje quedó bloqueado.',
      blocked_at: iso(Date.now()),
    });
  }
  if (body.start_code !== trip.code) {
    trip.failed += 1;
    if (trip.failed >= MAX_ATTEMPTS) {
      trip.blocked = true;
      return json(res, 409, {
        code: 'START_CODE_BLOCKED',
        message: 'El inicio de este viaje quedó bloqueado.',
        blocked_at: iso(Date.now()),
      });
    }
    return json(res, 422, {
      code: 'START_CODE_INVALID',
      message: 'Código incorrecto.',
      attempts_remaining: MAX_ATTEMPTS - trip.failed,
    });
  }
  trip.status = 'in_progress';
  return json(res, 200, { trip_request_id: trip.id, status: trip.status, idempotent: false });
}

function authRole(req) {
  const header = req.headers.authorization ?? '';
  return TOKENS[header.replace(/^Bearer /, '')] ?? null;
}

async function readBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString('utf8');
  if (raw.length === 0) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function control(body, res) {
  switch (body.action) {
    case 'reset':
      S = freshState();
      break;
    case 'consent':
      S.consent[body.role] = { state: body.state, version: body.version ?? null };
      break;
    case 'offer':
      S.offer = {
        assignment_id: 55,
        trip_request_id: 101,
        origin: { address: PICKUP.address, lat: PICKUP.lat, lng: PICKUP.lng },
        dropoff_neighborhood: 'El Centro',
        total_fare: 8000,
        distance_to_origin_m: 420,
        expires_at: iso(Date.now() + 600_000),
        seconds_to_respond: 600,
      };
      break;
    case 'newTrip':
      newTrip(body);
      break;
    case 'set':
      Object.assign(S.trip ?? {}, body.trip ?? {});
      Object.assign(S.control, body.control ?? {});
      break;
    case 'driverPosition':
      S.driverPos = { lat: body.lat, lng: body.lng, at: Date.now() - (body.ageSec ?? 0) * 1000 };
      break;
    case 'closeTrip':
      if (S.trip) S.trip.status = body.status ?? 'cancelled_by_passenger';
      break;
    default:
      return json(res, 400, { code: 'UNKNOWN_ACTION', message: String(body.action) });
  }
  return json(res, 200, { ok: true, control: S.control, trip: S.trip });
}

async function handle(req, res) {
  const url = new URL(req.url ?? '/', 'http://mock');
  const path = url.pathname;
  const method = req.method ?? 'GET';
  const body = method === 'GET' ? null : await readBody(req);

  if (path === '/__state') {
    return json(res, 200, {
      trip: S.trip,
      driverPos: S.driverPos,
      onShift: S.onShift,
      consent: S.consent,
      reports: S.reports,
      log: S.log.slice(-40),
    });
  }
  if (path === '/__control' && method === 'POST') return control(body ?? {}, res);

  const role = authRole(req);
  S.log.push(
    `${new Date().toISOString().slice(11, 19)} ${method} ${path}${role ? ` [${role}]` : ''}`,
  );

  if (S.control.offline) return req.socket.destroy();

  if (S.control.throttleNext > 0 && /\/start$/.test(path)) {
    S.control.throttleNext -= 1;
    return json(
      res,
      429,
      { statusCode: 429, message: 'ThrottlerException: Too Many Requests' },
      { 'Retry-After': String(S.control.retryAfter ?? 7) },
    );
  }

  if (method === 'POST' && path === '/auth/otp/request') {
    return json(res, 200, { sent: true, resend_in_sec: 30, expires_in_sec: 300 });
  }
  if (method === 'POST' && path === '/auth/otp/verify') return json(res, 200, session('passenger'));
  if (method === 'POST' && path === '/auth/driver/login') return json(res, 200, session('driver'));
  if (method === 'POST' && path === '/auth/refresh') {
    const refreshed = session(
      String(body?.refresh_token ?? '').startsWith('driver') ? 'driver' : 'passenger',
    );
    return json(res, 200, { ...refreshed.tokens, user: refreshed.user });
  }
  if (method === 'POST' && path === '/auth/logout') return json(res, 200, { ok: true });

  if (role === null) return json(res, 401, { code: 'UNAUTHORIZED', message: 'Sesión inválida' });

  if (path === '/consents' && method === 'GET') return json(res, 200, [consentStatus(role)]);
  if (path === '/consents' && method === 'POST') {
    S.consent[role] = { state: 'granted', version: body?.notice_version ?? CURRENT_NOTICE };
    return json(res, 200, consentStatus(role));
  }
  if (path === '/consents/revoke' && method === 'POST') {
    S.consent[role] = { state: 'revoked', version: null };
    return json(res, 200, consentStatus(role));
  }

  if (path === '/push-tokens' || path === '/push-tokens/revoke') {
    res.writeHead(204);
    return res.end();
  }

  if (path === '/trips/active' && method === 'GET') {
    const status = passengerStatus();
    const open = status && OPEN.includes(status.status) ? status : null;
    return json(res, 200, { active_trip: open });
  }
  const tripMatch = path.match(/^\/trips\/(\d+)(?:\/([a-z-]+))?$/);
  if (tripMatch) {
    const action = tripMatch[2];
    if (!S.trip || S.trip.id !== Number(tripMatch[1])) {
      return json(res, 404, {
        code: 'TRIP_REQUEST_NOT_FOUND',
        message: 'No encontramos el viaje.',
      });
    }
    const trip = S.trip;
    if (!action && method === 'GET') {
      return json(res, 200, passengerStatus(), { 'Cache-Control': 'no-store' });
    }
    if (action === 'cancel') {
      trip.status = 'cancelled_by_passenger';
      return json(res, 200, {
        trip_request_id: trip.id,
        status: 'cancelled_by_passenger',
        free_of_charge: true,
        penalty_recorded: false,
        cancelled_at: iso(Date.now()),
      });
    }
    if (action === 'en-route') {
      trip.status = 'driver_en_route';
      return json(res, 200, { trip_request_id: trip.id, status: trip.status, idempotent: false });
    }
    if (action === 'arrived') {
      trip.arrivedAt = Date.now();
      return json(res, 200, {
        trip_request_id: trip.id,
        status: trip.status,
        idempotent: false,
        arrived_at: iso(trip.arrivedAt),
        no_show_available_at: iso(trip.arrivedAt + 120_000),
      });
    }
    if (action === 'start') {
      S.log.push(`start body=${JSON.stringify(body)}`);
      if (S.control.dropNext) {
        S.control.dropNext = false;
        const before = trip.failed;
        startTrip(body, { writeHead() {}, end() {} });
        S.log.push(`start dropped (failed ${before} -> ${trip.failed}, status ${trip.status})`);
        return req.socket.destroy();
      }
      return startTrip(body, res);
    }
    if (action === 'complete') {
      trip.status = 'completed';
      return json(res, 200, {
        trip_request_id: trip.id,
        status: 'completed',
        idempotent: false,
        finished_at: iso(Date.now()),
        net_earnings: 7200,
      });
    }
    if (action === 'no-show') {
      trip.status = 'no_show';
      return json(res, 200, { trip_request_id: trip.id, status: 'no_show', idempotent: false });
    }
  }

  if (path === '/driver/me' && method === 'GET') {
    const view = driverTripView();
    return json(
      res,
      200,
      {
        shift: {
          status: view ? 'on_trip' : S.onShift ? 'available' : 'off_shift',
          on_shift: S.onShift,
          vehicle_linked: true,
          location_updated_at: S.driverPos ? iso(S.driverPos.at) : null,
        },
        active_trip: view,
      },
      { 'Cache-Control': 'no-store' },
    );
  }
  if (path === '/driver/shift' && method === 'PUT') {
    if (
      body?.on_shift &&
      !(S.consent.driver.state === 'granted' && S.consent.driver.version === CURRENT_NOTICE)
    ) {
      return json(res, 403, {
        code: 'LOCATION_CONSENT_REQUIRED',
        message: 'Debes aceptar el aviso de ubicación.',
      });
    }
    S.onShift = Boolean(body?.on_shift);
    return json(res, 200, {
      status: S.onShift ? 'available' : 'off_shift',
      on_shift: S.onShift,
      vehicle_linked: true,
      location_updated_at: iso(Date.now()),
    });
  }
  if (path === '/driver/location' && method === 'POST') {
    if (S.consent.driver.state !== 'granted') {
      return json(res, 403, {
        code: 'LOCATION_CONSENT_REQUIRED',
        message: 'Debes aceptar el aviso de ubicación.',
      });
    }
    S.driverPos = { lat: body.lat, lng: body.lng, at: Date.now() };
    S.reports.push({ at: iso(S.driverPos.at), lat: body.lat, lng: body.lng });
    if (S.reports.length > 200) S.reports.shift();
    return json(
      res,
      200,
      { ok: true, location_sharing: locationSharing() },
      { 'Cache-Control': 'no-store' },
    );
  }
  if (path === '/driver/trips/cash-pending') return json(res, 200, []);
  if (path === '/assignments/nearby') return json(res, 200, S.offer ? [S.offer] : []);
  const acceptMatch = path.match(/^\/assignments\/(\d+)\/(accept|cancel|reject)$/);
  if (acceptMatch && method === 'POST') {
    if (acceptMatch[2] === 'accept') {
      newTrip({ status: 'assigned' });
      S.offer = null;
      return json(res, 200, {
        result: 'accepted',
        assignment_id: S.trip.id + 1000,
        trip_request_id: S.trip.id,
        trip_request_status: 'assigned',
        passenger: {
          name: 'Laura Pérez',
          contact_phone: '3001234567',
          pickup_address: PICKUP.address,
        },
      });
    }
    if (acceptMatch[2] === 'cancel' && S.trip) {
      S.trip.status = 'cancelled_by_driver';
      return json(res, 200, {
        assignment_id: S.trip.id + 1000,
        trip_request_id: S.trip.id,
        trip_request_status: 'cancelled_by_driver',
        searching_again: false,
      });
    }
    return json(res, 200, { ok: true });
  }

  return json(res, 404, { code: 'NOT_MOCKED', message: `${method} ${path}` });
}

http
  .createServer((req, res) => {
    handle(req, res).catch((error) =>
      json(res, 500, { code: 'MOCK_ERROR', message: String(error) }),
    );
  })
  .listen(PORT, HOST, () => {
    console.log(`mock-api-llegada-segura escuchando en ${HOST}:${PORT}`);
  });
