/*eslint-disable no-unused-vars*/
/*global google, idb */
/*eslint linebreak-style: ["error", "windows"]*/

/**
 * Common database helper functions.
 */

class DBHelper {
  
  /**
   * IndexDB instance.
   */
  static openDB() {
    if (!('indexedDB' in window)) {
      console.log('This browser doesn\'t support IndexedDB');
      return;
    }

    const dbPromise = idb.open('restaurants-app', 1, upgradeDb => {
      switch (upgradeDb.oldVersion) {
        case 0:
          var store = upgradeDb.createObjectStore('restaurants', {
            keyPath: 'id'
          });
          store.createIndex('name', 'id', { unique: true });
        /*eslint-disable no-fallthrough*/
        case 1:
          upgradeDb.createObjectStore('outbox', {
            autoIncrement: true,
            keyPath: 'id'
          });
      }
    });

    return dbPromise;
  }

  /**
   * Adding restaurants to the indexedDB.
   */
  static addRestaurants(restaurants) {
    return this.openDB()
      .then(db => {
        var tx = db.transaction('restaurants', 'readwrite');
        var store = tx.objectStore('restaurants');
        return Promise.all(
          restaurants.map(item => {
            return store.put(item);
          })
        ).catch(err => {
          tx.abort();
          console.error(err);
        });
      })
      .catch(err => console.error(err));
  }

  /**
   * Database URL.
   */
  static get DATABASE_URL() {
    const port = 1337; // Change this to your server port
    // return `http://localhost:${port}/restaurants`;
    return 'https://reviews-staging.herokuapp.com/restaurants';
  }

  /**
   * Reviews URL.
   */
  static get REVIEWS_URL() {
    const port = 1337; // Change this to your server port
    // return `http://localhost:${port}/reviews`;
    return 'https://reviews-staging.herokuapp.com/reviews';
  }

  /**
   * Fetch all restaurants.
   */

  static fetchRestaurantsFromServer() {
    let promise = new Promise((resolve, reject) => {
      fetch(this.DATABASE_URL).then(result => {
        resolve(result.json());
      });
    });
    return promise;
  }

  /**
   * We get an access to the indexedDB and fetch restaurants.
   * If restaurants are not chached, we fetch then from the server
   * and add to the objectStore.
   */

  static fetchRestaurants() {
    return this.openDB()
      .then(db =>
        db
          .transaction('restaurants', 'readwrite')
          .objectStore('restaurants')
          .getAll()
      )
      .then(restaurants => {
        if (!restaurants || restaurants.length === 0) {
          return this.fetchRestaurantsFromServer()
            .then(restaurants => {
              this.addRestaurants(restaurants);
              return restaurants;
            })
            .catch(err => console.error(err));
        } else return restaurants;
      });
  }

  /**
   * Fetch a restaurant by its ID from the server.
   */
  static fetchRestaurantFromServerById(id) {
    let promise = new Promise((resolve, reject) => {
      fetch(`${this.DATABASE_URL}/${id}`).then(result =>
        resolve(result.json())
      );
    }).catch(err => console.error(err));
    return promise;
  }

  /**
   * Fetch all restaurant reviews
   */
  static fetchAllRestaurantReviews() {
    let promise = new Promise((resolve, reject) => {
      fetch(`${this.REVIEWS_URL}`).then(result => resolve(result.json()));
    }).catch(err => console.error(err));
    return promise;
  }

  /**
   * Fetch a restaurant reviews
   */
  static fetchRestaurantReviews(id) {
    let promise = new Promise((resolve, reject) => {
      fetch(`${this.REVIEWS_URL}/?restaurant_id=${id}`).then(result =>
        resolve(result.json())
      );
    }).catch(err => console.error(err));
    return promise;
  }

  /**
   * Fetc a review by id
   */
  static fetchReviewById(id) {
    let promise = new Promise((resolve, reject) => {
      fetch(`${this.REVIEWS_URL}/${id}`).then(result => resolve(result.json()));
    }).catch(err => console.error(err)).then(response => console.table(response));
    return promise;
  }

  /**
   * Post a restaurant review
   */
  static addRestaurantReview(review) {
    return fetch(`${this.REVIEWS_URL}/`, {
      method: 'POST',
      body: review
    }).then(response => response.json())
    .catch(err => console.error(err));
  }

  /**
   * Delete a restaurant review
   */
  static removeRestaurantReview(id) {
    return fetch(`${this.REVIEWS_URL}/${id}`, {
      method: 'DELETE'
    });
  }

  /**
   * Edit a restaurant review
   */
  static editRestaurantReview(id, review) {
    return fetch(`${this.REVIEWS_URL}/${id}`, {
      method: 'PUT',
      body: review
    });
  }

  /**
   * Fetch a restaurant from the indexedDB, if it has been cached.
   */

  static fetchRestaurantById(id) {
    return this.openDB()
      .then(db => {
        var tx = db.transaction('restaurants', 'readonly');
        var store = tx.objectStore('restaurants');
        var index = store.index('name');
        return index.get(parseInt(id));
      })
      .then(restaurant => {
        if (!restaurant) {
          return this.fetchRestaurantFromServerById(id);
        }
        return restaurant;
      });
  }

  /**
   * Restaurant page URL.
   */
  static urlForRestaurant(restaurant) {
    return `./restaurant.html?id=${restaurant.id}`;
  }

  /**
   * Restaurant image URL.
   */
  static imageUrlForRestaurant(restaurant) {
    return `img/${restaurant.id}.jpg`;
  }

  static srcsetUrlSmallForRestaurant(restaurant) {
    return `/responsive-images/${
      restaurant.id
    }-320_small_2x.jpg 2x, /responsive-images/${
      restaurant.id
    }-160_small_1x.jpg 1x`;
  }

  static srcsetUrlMediumForRestaurant(restaurant) {
    return `/responsive-images/${
      restaurant.id
    }-640_medium_2x.jpg 2x, /responsive-images/${
      restaurant.id
    }-320_medium_1x.jpg 1x`;
  }

  static imageAltForRestaurants(restaurant) {
    return `Restaurant ${restaurant.name} in ${restaurant.neighborhood}`;
  }

  /**
   * Map marker for a restaurant.
   */
  static mapMarkerForRestaurant(restaurant, map) {
    const marker = new google.maps.Marker({
      position: restaurant.latlng,
      title: restaurant.name,
      url: this.urlForRestaurant(restaurant),
      map: map,
      animation: google.maps.Animation.DROP
    });

    setTimeout(() => {
      var frames = document.getElementsByClassName('gm-style');
      if (frames[0]) {
        frames[0].children[1].setAttribute(
          'title',
          'Google map with the restaurants location'
        );
        var innerDocument = frames[0].children[1].contentWindow.document;
        innerDocument.childNodes[0].setAttribute('lang', 'en');
      }
    }, 1000);
    return marker;
  }

  /**
   * Set restaurant as favorite
   */
  static favorRestaurant(id) {
    fetch(
      `http://localhost:1337/restaurants/${
        self.restaurant.id
      }/?is_favorite=true`,
      {
        method: 'PUT'
      }
    )
      .then(res => res.json())
      .then(restaurant => {
        return this.openDB().then(db => {
          const tx = db
            .transaction('restaurants', 'readwrite')
            .objectStore('restaurants')
            .put(restaurant);
          return tx.complete;
        });
      })
      .catch(err => console.error(err));
  }

  /**
   * Remove favorite status off a restaurant
   */
  static unfavorRestaurant(id) {
    fetch(
      `http://localhost:1337/restaurants/${
        self.restaurant.id
      }/?is_favorite=false`,
      {
        method: 'PUT'
      }
    )
      .then(res => res.json())
      .then(restaurant => {
        return this.openDB().then(db => {
          const tx = db
            .transaction('restaurants', 'readwrite')
            .objectStore('restaurants')
            .put(restaurant);
          return tx.complete;
        });
      })
      .catch(err => console.error(err));
  }
}
