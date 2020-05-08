/*eslint-disable no-unused-vars*/
/*global google */
/*global DBHelper */
/*eslint linebreak-style: ["error", "windows"]*/

let restaurants, neighborhoods, cuisines;
var map;
var markers = [];
var fetchNeighborhoods;
var fetchCuisines;
var fillCuisinesHTML;
var fillNeighborhoodsHTML;
var fillRestaurantsHTML;
var updateRestaurants;
var resetRestaurants;
var addMarkersToMap;
var createRestaurantHTML;
var loadImages;

/**
 * Fetch neighborhoods and cuisines as soon as the page is loaded.
 */
document.addEventListener('DOMContentLoaded', event => {
  window.initMap = () => {
    updateRestaurants();
  };
  fetchNeighborhoods();
  fetchCuisines();
});

/**
 * Fetch all neighborhoods and set their HTML.
 */
fetchNeighborhoods = () => {
  const neigborhoods = DBHelper.fetchRestaurants()
    .then(restaurants => {
      const neighborhoods = restaurants.map(
        (v, i) => restaurants[i].neighborhood
      );

      const filtered = neighborhoods.filter(
        (v, i) => neighborhoods.indexOf(v) == i
      );

      fillNeighborhoodsHTML(filtered);
    })
    .catch(err => console.error(err));
};

/**
 * Set neighborhoods HTML.
 */
fillNeighborhoodsHTML = neighborhoods => {
  const select = document.getElementById('neighborhoods-select');
  neighborhoods.forEach(neighborhood => {
    const option = document.createElement('option');
    option.innerHTML = neighborhood;
    option.value = neighborhood;
    select.append(option);
  });
};

/**
 * Fetch all cuisines and set their HTML.
 */
fetchCuisines = () => {
  const neigborhoods = DBHelper.fetchRestaurants()
    .then(restaurants => {
      const cuisines = restaurants.map((v, i) => restaurants[i].cuisine_type);

      const filtered = cuisines.filter((v, i) => cuisines.indexOf(v) == i);

      fillCuisinesHTML(filtered);
    })
    .catch(err => console.error(err));
};

/**
 * Set cuisines HTML.
 */
fillCuisinesHTML = cuisines => {
  const select = document.getElementById('cuisines-select');

  cuisines.forEach(cuisine => {
    const option = document.createElement('option');
    option.innerHTML = cuisine;
    option.value = cuisine;
    select.append(option);
  });
};

/**
 * Update page and map for current restaurants.
 */
updateRestaurants = () => {
  const cSelect = document.getElementById('cuisines-select');
  const nSelect = document.getElementById('neighborhoods-select');

  const cIndex = cSelect.selectedIndex;
  const nIndex = nSelect.selectedIndex;

  const cuisine = cSelect[cIndex].value;
  const neighborhood = nSelect[nIndex].value;

  DBHelper.fetchRestaurants()
    .then(results => {
      if (cuisine != 'all') {
        // filter by cuisine
        results = results.filter(r => r.cuisine_type == cuisine);
      }
      if (neighborhood != 'all') {
        // filter by neighborhood
        results = results.filter(r => r.neighborhood == neighborhood);
      }

      self.restaurants = results;
      resetRestaurants(results);
      fillRestaurantsHTML();
    })
    .then(loaded => {
      const mapContainer = document.getElementById('map');
      const observer = new IntersectionObserver((entry, observer) => {
        if (entry[0].intersectionRatio > 0) {
          let loc = {
            lat: 40.722216,
            lng: -73.987501
          };
          self.map = new google.maps.Map(document.getElementById('map'), {
            zoom: 12,
            center: loc,
            scrollwheel: false
          });
          setTimeout(() => {
            var frames = document.getElementsByClassName('gm-style');
            frames[0].children[1].setAttribute(
              'title',
              'Google map with restaurant locations'
            );
            var innerDocument = frames[0].children[1].contentWindow.document;
            innerDocument.childNodes[0].setAttribute('lang', 'en');
            addMarkersToMap();
          }, 500);
          observer.unobserve(mapContainer);
        }
      });
      observer.observe(mapContainer);
    });
};

/**
 * Clear current restaurants, their HTML and remove their map markers.
 */
resetRestaurants = restaurants => {
  // Remove all restaurants
  self.restaurants = [];
  const ul = document.getElementById('restaurants-list');
  ul.innerHTML = '';

  // Remove all map markers
  self.markers.forEach(m => m.setMap(null));
  self.markers = [];
  self.restaurants = restaurants;
};

/**
 * Create all restaurants HTML and add them to the webpage.
 */
fillRestaurantsHTML = (restaurants = self.restaurants) => {
  const ul = document.getElementById('restaurants-list');
  restaurants.forEach(restaurant => {

    ul.append(createRestaurantHTML(restaurant));

  });
};

/**
 * Create restaurant HTML.
 */
createRestaurantHTML = restaurant => {
  const li = document.createElement('li');
  li.classList.add('restaurant-html');

  const mediaContainer = document.createElement('div');
  mediaContainer.className = 'media-container';

  const nameContainer = document.createElement('div');
  const name = document.createElement('h1');
  nameContainer.className = 'name-container';
  name.innerHTML = restaurant.name;
  nameContainer.append(name);
  mediaContainer.append(nameContainer);

  li.append(mediaContainer);

  const address = document.createElement('div');
  address.className = 'address-container';

  const neighborhood = document.createElement('p');
  neighborhood.innerHTML = restaurant.neighborhood;
  address.append(neighborhood);

  const addressText = document.createElement('p');
  addressText.innerHTML = restaurant.address;
  address.append(addressText);

  li.append(address);

  const more = document.createElement('div');
  more.className = 'button-container';
  const button = document.createElement('a');
  button.innerHTML = 'View Details';
  button.href = DBHelper.urlForRestaurant(restaurant);
  more.append(button);
  li.append(more);

  const observer = new IntersectionObserver((entry, observer) => {
    if (entry[0].intersectionRatio > 0) {
      mediaContainer.append(loadImages(restaurant));
      observer.unobserve(mediaContainer);
    }    
  });
  observer.observe(mediaContainer);

  return li;
};

loadImages = (restaurant) => {
  const picture = document.createElement('picture');
  picture.className = 'restaurant-picture';

  const largeSource = document.createElement('source');
  largeSource.media = '(min-width: 1024px)';
  largeSource.sizes = '100vw';
  largeSource.srcset = DBHelper.imageUrlForRestaurant(restaurant);
  picture.append(largeSource);

  const mediumSource = document.createElement('source');
  mediumSource.media = '(min-width: 415px) and (max-width: 768px)';
  mediumSource.sizes = '100vw';
  mediumSource.srcset = DBHelper.srcsetUrlMediumForRestaurant(restaurant);
  picture.append(mediumSource);

  const smallSource = document.createElement('source');
  smallSource.media = '(max-width: 414px)';
  smallSource.sizes = '100vw';
  smallSource.srcset = DBHelper.srcsetUrlSmallForRestaurant(restaurant);
  picture.append(smallSource);

  const image = document.createElement('img');
  image.className = 'restaurant-img';
  image.alt = DBHelper.imageAltForRestaurants(restaurant);
  image.src = DBHelper.imageUrlForRestaurant(restaurant);
  picture.append(image);

  return picture;
}

/**
 * Add markers for current restaurants to the map.
 */
addMarkersToMap = (restaurants = self.restaurants) => {
  restaurants.forEach(restaurant => {
    // Add marker to the map
    const marker = DBHelper.mapMarkerForRestaurant(restaurant, self.map);
    google.maps.event.addListener(marker, 'click', () => {
      window.location.href = marker.url;
    });
    self.markers.push(marker);
  });
};
