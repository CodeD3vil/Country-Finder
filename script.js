'use strict';

const btnRandom = document.querySelector('.btn-random');
const btnLocal = document.querySelector('.btn-local');
const btn = document.querySelector('.btn-country');
const btnRemove = document.querySelector('.btn-remove');
const countriesContainer = document.querySelector('.countries');
const resetButton = document.querySelector('.btn-reset');
const latitudeNumber = document.querySelector('.latitude-input');
const longitudeNumber = document.querySelector('.longitude-input');
const noCountryMessage = document.querySelector('.no-country');
const messagesContainer = document.querySelector('.messages');
const countryName = document.querySelector('.country-name');
const sectionCountries = document.querySelector('#countries-section');
const countryNameMessageElement = document.getElementById('country-name');
const neighborElements = document.querySelectorAll('.neighbor');

const goToCountriesSection = function (e) {
  const sectionCountriesCoordinates =
    countryNameMessageElement.getBoundingClientRect();
  // e.preventDefault();
  window.scrollTo({
    left: sectionCountriesCoordinates.left + window.scrollX,
    top: sectionCountriesCoordinates.top + window.scrollY,
    behavior: 'smooth',
  });
};

const removeErrorMessage = function () {
  const errorMessageElement = document.querySelectorAll('.no-county');
  errorMessageElement.forEach(el => el.remove('no-county'));
};

const noCountryFoundMessage = function (locality) {
  const noCityMessage = `
  <div class="no-county">
    <p class="no-country--message">You are in the middle of <span class= "no-country-location--text">${locality} 😲</span></p>
    <p class="no-country--message">Please try again.</p>
  </div>
  `;
  messagesContainer.insertAdjacentHTML('beforeend', noCityMessage);
  setTimeout(removeErrorMessage.bind(this), 5000);
};

const coordinatesOutOfRangeMessage = function () {
  const OutOfRangeMessage = `
  <div class="no-county">
    <p class="no-country--message">Latitude or longitude number <span class= "no-country-location--text">out of range</span>.</p>
    <p class="no-country--message">Please try again.</p>
  </div>
  `;
  messagesContainer.insertAdjacentHTML('beforeend', OutOfRangeMessage);
  setTimeout(removeErrorMessage.bind(this), 5000);
};

const renderMyLocation = function (countryData, className = '') {
  const language = Object.values(countryData.languages);
  const currency = Object.values(countryData.currencies);
  const html = `
              <article class="country ${className}" id="country">
                <img class="country__img" src="${countryData.flags.png}" />
                <div class="country__data">
                  <h3 class="country__name">${countryData.name.common}</h3>
                  <h4 class="country__region">${countryData.region}</h4>
                  <p class="country__row"><span>👫</span>${(
                    +countryData.population / 1000000
                  ).toFixed(1)} population</p>
                  <p class="country__row"><span>🗣️</span>${language[0]}</p>
                  <p class="country__row"><span>💰</span>${currency[0].name}</p>
                </div>
              </article>
              `;

  let neighborLink = `
              <a class="neigh" href="#">see my neighbors</a>
              `;
  neighborElements.forEach(neighborEl =>
    neighborEl.insertAdjacentHTML('beforeend', neighborLink)
  );
  countriesContainer.insertAdjacentHTML('beforeend', html);
  countriesContainer.style.opacity = 1;
};

const showError = function (errorMessage) {
  countriesContainer.insertAdjacentText('beforeend', errorMessage);
  countriesContainer.style.opacity = 1;
};

const resetLocation = function () {
  const countriesElement = document.querySelectorAll('.country');
  countriesElement.forEach(el => el.remove('country'));
  if (btn.classList.contains('clicked')) btn.classList.toggle('clicked');
  countryName.textContent = '';
  latitudeNumber.value = '';
  longitudeNumber.value = '';
};

const getMyLocationJSON = async function (apiURL) {
  const response = await fetch(apiURL);
  if (!response.ok) throw new Error(`an error occurred ${response.status}`);
  return await response.json();
};

const coordinatesMinMaxCheck = function (lat, lng) {
  if (lat < -90 || lat > 90 || lng < -180) {
    return true;
  }
};

const countryNameMessage = function (countryData) {
  if (!countryData.borders)
    countryName.textContent = `You are in ${countryData.name.common} which has no neighbors`;
  if (countryData.name.common)
    countryName.textContent = `You are in ${countryData.name.common} which has ${countryData.borders.length} neighbors.`;
  if (countryData.name.common && countryData.borders.length === 1)
    countryName.textContent = `You are in ${countryData.name.common} which has only 1 neighbor.`;
};

const checkCoordinates = function (lat, lng) {
  if (coordinatesMinMaxCheck(lat, lng)) {
    coordinatesOutOfRangeMessage();
    resetLocation();
    return;
  }
  getMyLocationJSON(
    `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`
  ).then(data => {
    if (!data.continent) {
      noCountryFoundMessage(data.locality);
      resetLocation();
      return;
    } else {
      myLocation(lat, lng);
    }
  });
};

const myLocation = function (lat, lng) {
  resetLocation();
  getMyLocationJSON(
    `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`
  )
    .then(data => {
      getMyLocationJSON(
        `https://restcountries.com/v3.1/name/${data.countryName}`
      ).then(([data]) => {
        renderMyLocation(data);
        goToCountriesSection();
        latitudeNumber.value = '';
        longitudeNumber.value = '';
        removeErrorMessage();
        countryNameMessage(data);
        let neighbors = data.borders;
        console.log(neighbors);
        neighbors.forEach(neighbor => {
          console.log(neighbor);
          getMyLocationJSON(
            `https://restcountries.com/v3.1/alpha/${neighbor}`
          ).then(([neighborData]) =>
            renderMyLocation(neighborData, 'neighbor')
          );
        });
      });
    })
    .catch(error =>
      showError(
        `Unable to find the country at these coordinates ${error.message}`
      )
    );
};

resetButton.addEventListener('click', function () {
  resetLocation();
  removeErrorMessage();
});

btn.addEventListener('click', function () {
  if (btn.classList.contains('clicked')) return;
  btn.classList.toggle('clicked');
  checkCoordinates(+latitudeNumber.value, +longitudeNumber.value);
  // myLocation(+latitudeNumber.value, +longitudeNumber.value);
  latitudeNumber.value = '';
  longitudeNumber.value = '';
});

const getLocalCoordinates = function () {
  return new Promise(function (resolve, reject) {
    navigator.geolocation.getCurrentPosition(resolve, reject);
  });
};

btnLocal.addEventListener('click', async function () {
  if (btn.classList.contains('clicked')) return;
  btn.classList.toggle('clicked');
  try {
    const localGeoPosition = await getLocalCoordinates();
    const { latitude, longitude } = localGeoPosition.coords;
    checkCoordinates(latitude, longitude);
  } catch (error) {
    console.log(error.message);
  }
});

btnRandom.addEventListener('click', function () {
  // if (btn.classList.contains('clicked')) return;
  // btn.classList.toggle('clicked');
  // let randomLatitude = (Math.random() * 181 - 90).toFixed(2);
  // let randomLongitude = (Math.random() * 361 - 180).toFixed(2)
  latitudeNumber.value = (Math.random() * 181 - 90).toFixed(2);
  longitudeNumber.value = (Math.random() * 361 - 180).toFixed(2);
  // checkCoordinates(+randomLatitude, +randomLongitude);
});

resetLocation();
