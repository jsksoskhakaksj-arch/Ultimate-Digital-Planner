/* Service worker: เก็บตัวแอปไว้ใช้ออฟไลน์ ไม่แตะคำขอข้ามโดเมน (Google ล็อกอิน/Drive/ฟอนต์) และไม่เก็บข้อมูลผู้ใช้
   ใช้ "เสิร์ฟจากแคชก่อน แล้วอัปเดตเบื้องหลัง": อัปโหลดไฟล์ใหม่แล้ว เปิดครั้งแรกอาจยังเห็นฉบับเก่า ครั้งถัดไปเป็นฉบับใหม่ */
var CACHE = 'planner-shell-v1';
var SHELL = ['./', 'index.html', 'manifest.json', 'icon-192.png', 'icon-512.png'];

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(SHELL); }).then(function () { return self.skipWaiting(); }));
});

self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (ks) {
    return Promise.all(ks.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});

self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;
  var url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  e.respondWith(caches.open(CACHE).then(function (c) {
    return c.match(req, { ignoreSearch: true }).then(function (hit) {
      var net = fetch(req).then(function (r) {
        if (r && r.ok) c.put(req, r.clone());
        return r;
      }).catch(function () {
        return hit || (req.mode === 'navigate' ? c.match('index.html') : undefined);
      });
      return hit || net;
    });
  }));
});
