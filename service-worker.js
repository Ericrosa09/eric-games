

importscripts('https://storage.googleapis.com/workbox-cdn/releases/6.0.2/workbox-sw.js');

workbox.routing.registerroute(
    ({request}) => request.destination === 'image',
    new workbox.strategies.networkfirst()
);

const cachename = 'szgames-1';
// list the files to precache
const precacheresources = [
 '/offline.html'
];

// when the service worker is installing, open the cache and add the precache resources to it
self.addeventlistener('install', (event) => {
  console.log('service worker install event!');
  event.waituntil(caches.open(cachename).then((cache) => cache.addall(precacheresources)));

});

const cachenamestodelete = ['sz-games', 'szgames'];

self.addeventlistener('activate', (event) => {
  console.log('service worker activate event!');
  event.waituntil(
    caches.keys().then(cachenames => {
      return promise.all(
        cachenames.filter(cachename => {
          // delete the specific caches
          return cachenamestodelete.includes(cachename);
        }).map(cachename => {
          return caches.delete(cachename);
        })
      );
    })
  );
});


self.addeventlistener('fetch', event => {
    event.respondwith(
      caches.match(event.request).then(response => {
        if (response) {
          return response;
        }
        return fetch(event.request);
      })
    );
  });