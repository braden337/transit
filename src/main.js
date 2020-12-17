import 'normalize.css';
import './style.css';

require('dotenv').config();

const winnipegTransitURL = new URL('https://api.winnipegtransit.com/v3');
const searchParams = new URLSearchParams();
searchParams.append('api-key', process.env.APIKEY);

const noStreetsFound = `<div class="no-results">No Streets Found</div>`;

const streetSection = document.querySelector('.streets');

search.onsubmit = handleStreetSearch;

function handleStreetSearch(submitEvent) {
  submitEvent.preventDefault();
  const data = new FormData(search);
  const name = data.get('street-name');

  if (name !== '') {
    getStreets(name);
    search.reset();
  }
}

function getStreets(name) {
  streetSection.innerHTML = '';

  searchParams.append('name', name);
  searchParams.append('usage', 'long');

  winnipegTransitURL.search = searchParams;
  winnipegTransitURL.pathname = '/v3/streets.json';

  const url = winnipegTransitURL.href;

  searchParams.delete('name');
  searchParams.delete('usage');

  fetch(url)
    .then(response => response.json())
    .then(result => showStreets(result.streets));
}

const streetToHTML = street =>
  `<a href="javascript:void(0);" data-street-key="${street.key}">${street.name}</a>`;

function showStreets(streets) {
  streetSection.innerHTML =
    streets.length > 0 ? streets.map(streetToHTML).join('') : noStreetsFound;
}
