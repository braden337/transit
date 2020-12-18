import 'normalize.css';
import './style.css';

require('dotenv').config();

import dayjs from 'dayjs';
import {flattenDeep} from 'lodash';

const winnipegTransitURL = new URL('https://api.winnipegtransit.com/v3');
const searchParams = new URLSearchParams();
searchParams.append('api-key', process.env.APIKEY);

const noStreetsFound = `<div class="no-results">No Streets Found</div>`;

const streetSection = document.querySelector('.streets');
const stopSchedulesTableTitle = document.querySelector('#street-name');
const StopSchedulesTable = document.querySelector('table tbody');

search.onsubmit = handleStreetSearch;
streetSection.onclick = handleStreetClick;

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
    .then(result => result.streets)
    .then(showStreets);
}

const streetToHTML = street =>
  `<a href data-key="${street.key}">${street.name}</a>`;

function showStreets(streets) {
  streetSection.innerHTML =
    streets.length > 0 ? streets.map(streetToHTML).join('') : noStreetsFound;
}

function handleStreetClick(clickEvent) {
  clickEvent.preventDefault();
  const street = clickEvent.target;
  if (street.nodeName === 'A') getStops(street.dataset.key);
}

function getStops(streetKey) {
  searchParams.append('street', streetKey);

  winnipegTransitURL.search = searchParams;
  winnipegTransitURL.pathname = '/v3/stops.json';

  const url = winnipegTransitURL.href;

  searchParams.delete('street');

  fetch(url)
    .then(response => response.json())
    .then(result => result.stops)
    .then(getStopSchedules);
}

function getStopSchedules(stops) {
  searchParams.append('max-results-per-route', 2);
  winnipegTransitURL.search = searchParams;

  stops = stops
    .map(stop => stop.key)
    .map(key => {
      winnipegTransitURL.pathname = `/v3/stops/${key}/schedule.json`;

      const url = winnipegTransitURL.href;

      return fetch(url)
        .then(response => response.json())
        .then(result => result['stop-schedule'])
        .then(schedule =>
          schedule['route-schedules'].map(bus =>
            bus['scheduled-stops']
              .map(stop =>
                stop.times.arrival !== undefined
                  ? stop.times.arrival.scheduled
                  : null
              )
              .map(arrival => ({
                name: schedule.stop.street.name,
                crossStreet: schedule.stop['cross-street'].name,
                direction: schedule.stop.direction,
                busNumber: bus.route.number,
                nextBus: arrival !== null ? dayjs(arrival) : null,
              }))
              .filter(stop => stop.nextBus !== null)
          )
        );
    });

  searchParams.delete('max-results-per-route');

  Promise.all(stops)
    .then(stops => flattenDeep(stops))
    .then(stops =>
      stops.sort(
        (a, b) =>
          a.crossStreet.localeCompare(b.crossStreet) ||
          a.direction.localeCompare(b.direction) ||
          a.busNumber - b.busNumber ||
          a.nextBus - b.nextBus
      )
    )
    .then(showStopSchedules);
}

const stopToHTML = stop => `<tr>
  <td>${stop.name}</td>
  <td>${stop.crossStreet}</td>
  <td>${stop.direction}</td>
  <td>${stop.busNumber}</td>
  <td>${stop.nextBus.format('hh:mm A')}</td>
</tr>`;

function showStopSchedules(stops) {
  const thereAreStops = stops.length > 0;

  stopSchedulesTableTitle.innerText = thereAreStops
    ? `Displaying results for ${stops[0].name}`
    : '';

  StopSchedulesTable.innerHTML = thereAreStops
    ? stops.map(stopToHTML).join('')
    : '';
}
