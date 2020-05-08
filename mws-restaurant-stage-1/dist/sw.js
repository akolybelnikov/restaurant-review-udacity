"use strict";self.importScripts("js/dbhelper.js"),self.importScripts("lib/idb.js");var postReview,staticCacheName="restaurants-static-v1",reviewsCacheName="reviews-dynamic-v2",imagesCache="restaurants-images",window=self;self.addEventListener("install",function(e){console.log("Attempting to install service worker and cache static assets"),e.waitUntil(caches.open(staticCacheName).then(function(e){return e.addAll(["js/main.js","js/restaurant_info.js","js/dbhelper.js","css/styles.css","index.html","restaurant.html","404.html","offline.html"])}))}),self.addEventListener("activate",function(e){console.log("Activating service worker...");var t=[staticCacheName,imagesCache];e.waitUntil(caches.keys().then(function(e){return Promise.all(e.map(function(e){if(-1===t.indexOf(e))return caches.delete(e)}))}))}),self.addEventListener("fetch",function(n){var e=new URL(n.request.url),t=[staticCacheName,imagesCache];if(!e.pathname.startsWith("/img/")&&!e.pathname.startsWith("/responsive-images/"))return e.pathname.startsWith("/reviews/")||e.pathname.startsWith("/reviews-staging/")?(self.navigator.onLine&&n.waitUntil(caches.keys().then(function(e){return Promise.all(e.map(function(e){if(-1===t.indexOf(e))return console.log("Deleting "+e+"..."),caches.delete(e)}))}).then(function(){return caches.open(reviewsCacheName).then(function(t){fetch(n.request).then(function(e){return t.put(n.request.url,e.clone()),console.log("Caching "+reviewsCacheName+" for offline use..."),e})})}).catch(function(e){throw new Error(e)})),void n.respondWith(caches.open(reviewsCacheName).then(function(t){return t.match(n.request.url).then(function(e){return e||fetch(n.request).then(function(e){return t.put(n.request.url,e.clone()),e})})}))):void n.respondWith(caches.match(n.request).then(function(e){return e||fetch(n.request).then(function(t){return 404===t.status?caches.match("404.html"):caches.open(staticCacheName).then(function(e){return n.request.url.indexOf("test")<0&&e.put(n.request.url,t.clone()),t})})}).catch(function(){return caches.match("offline.html")}));n.respondWith(caches.open(imagesCache).then(function(t){return t.match(n.request.url).then(function(e){return e||fetch(n.request).then(function(e){return t.put(n.request.url,e.clone()),e})})}))});