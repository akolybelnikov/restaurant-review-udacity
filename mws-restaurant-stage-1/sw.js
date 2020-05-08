self.importScripts('js/dbhelper.js');
self.importScripts('node_modules/idb/lib/idb.js');
var staticCacheName = 'restaurants-static-v1';
var reviewsCacheName = 'reviews-dynamic-v2';
var imagesCache = 'restaurants-images';
/*eslint-disable no-unused-vars*/
var window = self;
var postReview;

self.addEventListener('install', function(event) {
  console.log('Attempting to install service worker and cache static assets');
  event.waitUntil(
    caches.open(staticCacheName).then(function(cache) {
      return cache.addAll([
        'js/main.js',
        'js/restaurant_info.js',
        'js/dbhelper.js',
        'css/styles.css',
        'index.html',
        'restaurant.html',
        '404.html',
        'offline.html'
      ]);
    })
  );
});

self.addEventListener('activate', function(event) {
  console.log('Activating service worker...');
  var cacheWhitelist = [staticCacheName, imagesCache];

  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.map(function(cacheName) {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

self.addEventListener('fetch', event => {
  var requestUrl = new URL(event.request.url);
  var cacheWhitelist = [staticCacheName, imagesCache];

  if (
    requestUrl.pathname.startsWith('/img/') ||
    requestUrl.pathname.startsWith('/responsive-images/')
  ) {
    event.respondWith(
      caches.open(imagesCache).then(cache => {
        return cache.match(event.request.url).then(response => {
          return (
            response ||
            fetch(event.request).then(networkResponse => {
              cache.put(event.request.url, networkResponse.clone());
              return networkResponse;
            })
          );
        });
      })
    );
    return;
  }

  if (
    requestUrl.pathname.startsWith('/reviews/') ||
    requestUrl.pathname.startsWith('/reviews-staging/')
  ) {

    if (self.navigator.onLine) {
      event.waitUntil(
        caches.keys().then(function(cacheNames) {
          return Promise.all(
            cacheNames.map(function(cacheName) {
              if (cacheWhitelist.indexOf(cacheName) === -1) {
                console.log(`Deleting ${cacheName}...`);
                return caches.delete(cacheName);
              }
            })
          );
        })
        .then(() => {
          return caches.open(reviewsCacheName).then(function(cache) {  
            fetch(event.request).then(networkResponse => {
              cache.put(event.request.url, networkResponse.clone()); 
              console.log(`Caching ${reviewsCacheName} for offline use...`)   
              return networkResponse;
            });
          });
        }).catch(err => {
          throw new Error(err);
        })
      );
    }

    event.respondWith(
      caches.open(reviewsCacheName).then(cache => {
        return cache.match(event.request.url).then(response => {
          return (
            response ||
            fetch(event.request).then(networkResponse => {
              cache.put(event.request.url, networkResponse.clone());
              return networkResponse;
            })
          );
        });
      })
    );
    return;
  }

  event.respondWith(
    caches
      .match(event.request)
      .then(function(response) {
        if (response) {
          return response;
        }
        return fetch(event.request).then(function(response) {
          if (response.status === 404) {
            return caches.match('404.html');
          }

          return caches.open(staticCacheName).then(function(cache) {
            if (event.request.url.indexOf('test') < 0) {
              cache.put(event.request.url, response.clone());
            }
            return response;
          });
        });
      })
      .catch(() => {
        return caches.match('offline.html');
      })
  );
});

