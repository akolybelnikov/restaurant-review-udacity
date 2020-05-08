/*eslint-disable no-unused-vars*/
let restaurant;
/*eslint linebreak-style: ["error", "windows"]*/
/*global DBHelper */
/*global google */
/*global idb */

var getParameterByName;
var fillRestaurantHTML;
var fillBreadcrumb;
var fillRestaurantHoursHTML;
var fillReviewsHTML;
var createReviewHTML;
var addReview;
var submitReview;
var starClick;
var orderByDate;

/**
 * Initialize Google map, called from HTML.
 */
window.initMap = () => {

  const id = getParameterByName('id');
  if (!id) {
    // no id found in URL
    console.error('No restaurant id in URL');
    return;
  } else {
    DBHelper.fetchRestaurantById(id)
      .then(restaurant => {
        self.restaurant = restaurant;

        fillRestaurantHTML();

        self.map = new google.maps.Map(document.getElementById('map'), {
          zoom: 16,
          center: restaurant.latlng,
          scrollwheel: false
        });

        fillBreadcrumb();
        DBHelper.mapMarkerForRestaurant(self.restaurant, self.map);
      })
      .catch(err => console.error(err));
  }
};

/**
 * Create restaurant HTML and add it to the webpage
 */

fillRestaurantHTML = (restaurant = self.restaurant) => {
  const name = document.getElementById('restaurant-name');
  name.innerHTML = restaurant.name;

  const address = document.getElementById('restaurant-address');
  address.innerHTML = restaurant.address;

  const picture = document.getElementById('restaurant-picture');
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

  const cuisine = document.getElementById('restaurant-cuisine');
  cuisine.innerHTML = restaurant.cuisine_type;

  // fill operating hours
  if (restaurant.operating_hours) {
    fillRestaurantHoursHTML();
  }
  // fill reviews
  fillReviewsHTML();

  
  const emptyHeart = document.getElementById('empty-heart');
  const redHeart = document.getElementById('red-heart');


  /**
   * We are showing the proper heart icon based on is_favorable property of the restaurant
   */
  if (emptyHeart && redHeart) {
    if (self.restaurant.is_favorite === 'true') {
      redHeart.classList.remove('invisible');
      emptyHeart.classList.add('invisible');
    } else {
      redHeart.classList.add('invisible');
      emptyHeart.classList.remove('invisible');
    }
  }

  /**
   * Toggle class .invisible as user clicks on hearts icons to favour / unfavour the restaurant,
   * then change the status of the restaurant in the backend by posting a request to the proper API
   */

  emptyHeart.addEventListener('click', function() {
    emptyHeart.classList.add('invisible');
    redHeart.classList.remove('invisible');
    DBHelper.favorRestaurant(self.restaurant.id);
  });

  redHeart.addEventListener('click', function() {
    redHeart.classList.add('invisible');
    emptyHeart.classList.remove('invisible');
    DBHelper.unfavorRestaurant(self.restaurant.id);
  });
};

/**
 * Create restaurant operating hours HTML table and add it to the webpage.
 */
fillRestaurantHoursHTML = (
  operatingHours = self.restaurant.operating_hours
) => {
  const hours = document.getElementById('restaurant-hours');
  for (let key in operatingHours) {
    const row = document.createElement('tr');

    const day = document.createElement('td');
    day.innerHTML = key;
    day.className = 'weekday';
    row.appendChild(day);

    const time = document.createElement('td');
    time.innerHTML = operatingHours[key];
    time.className = 'time';
    row.appendChild(time);

    hours.appendChild(row);
  }
};

orderByDate = (arr, dateProp) => {
  return arr.slice().sort(function(a, b) {
    return arr[dateProp] < b[dateProp] ? -1 : 1;
  });
};

/**
 * Create all reviews HTML and add them to the webpage.
 */
fillReviewsHTML = () => {
  const container = document.getElementById('reviews-container');
  let reviews = [];
  const ul = document.getElementById('reviews-list');
  ul.innerHTML = '';

  DBHelper.fetchRestaurantReviews(self.restaurant.id)
    .then(data => {
      reviews = self.orderByDate(data, 'createdAt');
      if (!reviews) {
        const body = document.body;
        body.classList.add('full-height');
        const noReviews = document.createElement('p');
        noReviews.innerHTML = 'No reviews yet!';
        container.appendChild(noReviews);
        return;
      }

      reviews.forEach(review => {
        ul.appendChild(createReviewHTML(review));
      });
      container.appendChild(ul);
    })
    .catch(err => console.error(err));
};

/**
 * Create review HTML and add it to the webpage.
 */
createReviewHTML = review => {
  const li = document.createElement('li');
  const name = document.createElement('p');
  name.className = 'review-name';
  name.innerHTML = review.name;
  li.appendChild(name);

  const date = document.createElement('p');
  const updated = new Date(review.updatedAt).toDateString().split(' ');
  date.innerHTML = updated[1] + ' ' + updated[2] + ', ' + updated[3];
  date.className = 'review-date';
  li.appendChild(date);

  const rating = document.createElement('p');
  rating.innerHTML = `Rating: ${review.rating}`;
  rating.className = 'review-rating';
  li.appendChild(rating);

  if (review.comments) {
    const comments = document.createElement('p');
    comments.innerHTML = review.comments;
    li.appendChild(comments);
  }

  return li;
};

/**
 * Add restaurant name to the breadcrumb navigation menu
 */
fillBreadcrumb = (restaurant = self.restaurant) => {
  const breadcrumb = document.getElementById('breadcrumb');
  const li = document.createElement('li');
  li.innerHTML = restaurant.name;
  breadcrumb.appendChild(li);
};

/**
 * Get a parameter by name from page URL.
 */
getParameterByName = (name, url) => {
  if (!url) url = window.location.href;
  name = name.replace(/[[\]]/g, '\\$&');
  const regex = new RegExp(`[?&]${name}(=([^&#]*)|&|#|$)`),
    results = regex.exec(url);
  if (!results) return null;
  if (!results[2]) return '';
  return decodeURIComponent(results[2].replace(/\+/g, ' '));
};

/**
 * Clear star ratings and close modal on form submit
 */
submitReview = () => {
  for (let i = 1; i <= 5; i++) {
    document.getElementById(`empty-star-${i}`).classList.remove('invisible');
    document.getElementById(`full-star-${i}`).classList.add('invisible');
  }
};

/**
 * Form validation functions go here
 */
const username = document.getElementById('username');
const userrating = document.getElementById('userrating');
const form = document.getElementById('form');

form.addEventListener('change', function() {
  if (username.value && userrating.value) {
    form.elements[3].disabled = false;
  }
});

/**
 * Star rating icons toggle function
 */

starClick = id => {
  const status = id.split('-')[0];
  const rating = id.split('-')[2];

  switch (status) {
    case 'empty':
      userrating.value = parseInt(rating);
      for (let i = 1; i <= parseInt(rating); i++) {
        document.getElementById(`empty-star-${i}`).classList.add('invisible');
        document.getElementById(`full-star-${i}`).classList.remove('invisible');
      }
      if (username.value) {
        form.elements[3].disabled = false;
      }
      break;
    case 'full':
      userrating.value > 1
        ? (userrating.value = parseInt(rating) - 1)
        : (userrating.value = null);
      for (let i = parseInt(rating) + 1; i <= 5; i++) {
        document
          .getElementById(`empty-star-${i}`)
          .classList.remove('invisible');
        document.getElementById(`full-star-${i}`).classList.add('invisible');
      }
      if (username.value) {
        form.elements[3].disabled = false;
      }
      break;
  }
};

const button = document.getElementById('formhandler');
const dismissButton = document.getElementById('dismiss-button');
const successMessage = document.getElementById('review-success');
const offlineMessage = document.getElementById('review-offline');

button.addEventListener('click', function(event) {

  const formData = new FormData();

  formData.append('restaurant_id', self.restaurant.id);
  formData.append('name', form.name.value);
  formData.append('rating', parseInt(form.rating.value));
  formData.append('createdAt', Date.now());

  if (form.comments.value) {
    formData.append('comments', form.comments.value);
  }

  if (navigator.onLine) {
    DBHelper.addRestaurantReview(formData).then(() => {
      form.reset();
      self.fillReviewsHTML();
      successMessage.classList.remove('invisible');
      console.log('Review has been published.');
      setTimeout(() => {
        successMessage.classList.add('invisible');
      }, 3000);
    });
  } else {
    let review = {
      restaurant_id: self.restaurant.id,
      name: form.name.value,
      rating: parseInt(form.rating.value),
      comments: form.comments.value,
      createdAt: Date.now()
    };

    return DBHelper.openDB()
    .then(db => {
      const tx = db.transaction('outbox', 'readwrite');
      const store = tx.objectStore('outbox');
      store.put(review);
      return tx.complete;
    })
    .then(() => {
      form.reset();
      console.log('Review has been stored in the IndexedDB.');
      offlineMessage.classList.remove('invisible');
      setTimeout(() => {
        offlineMessage.classList.add('invisible');
      }, 3000);
    })
    .catch(function(err) {
      form.reset();
      console.log(
        'Something went wrong with the database.'
      );
      console.error(err);
      throw err;
    });
  }  
});

dismissButton.addEventListener('click', event => {
  form.reset();
});

window.addEventListener('online', function(e) {
  console.log('online again!');
  return DBHelper.openDB()
    .then(db => {
      const tx = db.transaction('outbox', 'readonly');
      const store = tx.objectStore('outbox')
      return store.getAll();
    })
    .then(reviews => {
      if (reviews && reviews.length > 0) {
        return Promise.all(
          reviews.map(review => {
  
            const formData = new FormData();
  
            formData.append('restaurant_id', review.restaurant_id);
            formData.append('name', review.name);
            formData.append('rating', review.rating);
            formData.append('createdAt', review.createdAt);
  
            if (review.comments) {
              formData.append('comments', review.comments);
            }
            return fetch(`${DBHelper.REVIEWS_URL}/`, {
              method: 'POST',
              body: formData
            }).then(response => {
              return response.json();
            })
            .then(data => {
              if (data) {
                return DBHelper.openDB()
                  .then(db => {
                    const tx = db.transaction('outbox', 'readwrite');
                    const store = tx.objectStore('outbox');
                    return store.delete(review.id);
                  });
                }
            }).catch((err) => {
              console.error(err);
              throw err;
            }).then(() => {
              self.fillReviewsHTML();
              successMessage.classList.remove('invisible');
              setTimeout(() => {
                successMessage.classList.add('invisible');
              }, 3000);
              console.log('Review has been sent to the server and removed from the IndexedDB.');
            });
          })
        );
      }
    });
});