// Service worker for every page of the site:
// - offline: pages are fetched from the network first (so updates arrive) and fall back to the
//   last copy in the cache; pictures, fonts and icons come from the cache first.
// - the rest-timer notification: the page shows it through this registration and a tap on it
//   brings the app back.
const CACHE = 'gym-v2';
// The A/B log and its pictures are stored up front, so it works offline even before every folder was opened
const CORE = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './apple-touch-icon.png',
  './img/Butterfly_0.jpg', './img/Butterfly_1.jpg', './img/Dumbbell_Bench_Press_0.jpg',
  './img/Dumbbell_Bench_Press_1.jpg', './img/Dumbbell_Bicep_Curl_0.jpg', './img/Dumbbell_Bicep_Curl_1.jpg',
  './img/Dumbbell_Shoulder_Press_0.jpg', './img/Dumbbell_Shoulder_Press_1.jpg', './img/Hammer_Curls_0.jpg',
  './img/Hammer_Curls_1.jpg', './img/Hyperextensions_Back_Extensions_0.jpg', './img/Hyperextensions_Back_Extensions_1.jpg',
  './img/Incline_Dumbbell_Press_0.jpg', './img/Incline_Dumbbell_Press_1.jpg', './img/Leg_Extensions_0.jpg',
  './img/Leg_Extensions_1.jpg', './img/Leg_Press_0.jpg', './img/Leg_Press_1.jpg',
  './img/Leverage_Iso_Row_0.jpg', './img/Leverage_Iso_Row_1.jpg', './img/Reverse_Machine_Flyes_0.jpg',
  './img/Reverse_Machine_Flyes_1.jpg', './img/Seated_Leg_Curl_0.jpg', './img/Seated_Leg_Curl_1.jpg',
  './img/Side_Lateral_Raise_0.jpg', './img/Side_Lateral_Raise_1.jpg', './img/Standing_Calf_Raises_0.jpg',
  './img/Standing_Calf_Raises_1.jpg', './img/Standing_Dumbbell_Triceps_Extension_0.jpg', './img/Standing_Dumbbell_Triceps_Extension_1.jpg',
  './img/Straight-Arm_Dumbbell_Pullover_0.jpg', './img/Straight-Arm_Dumbbell_Pullover_1.jpg', './img/Triceps_Pushdown_0.jpg',
  './img/Triceps_Pushdown_1.jpg', './img/Wide-Grip_Lat_Pulldown_0.jpg', './img/Wide-Grip_Lat_Pulldown_1.jpg'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).catch(() => {}).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const isPage = req.mode === 'navigate' || url.pathname.endsWith('.html') || url.pathname.endsWith('/') || url.pathname.endsWith('.webmanifest');
  if (isPage) {
    // no-store: skip the browser's own HTTP cache, so an update is seen on the first load online
    e.respondWith(fetch(req, { cache: 'no-store' }).then(res => {
      if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
      return res;
    }).catch(() => caches.match(req, { ignoreSearch: true }).then(r => r || caches.match('./'))));
    return;
  }
  // Pictures, fonts, icons: cache first, then keep a copy of whatever the network returns
  e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(res => {
    if (res.ok || res.type === 'opaque') { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
    return res;
  })));
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true })
    .then(cs => cs.length ? cs[0].focus() : self.clients.openWindow('./')));
});
