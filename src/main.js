import 'normalize.css';
import './style.css';

require('dotenv').config();

import dayjs from 'dayjs';
import {flattenDeep} from 'lodash';

const winnipegTransitURL = new URL('https://api.winnipegtransit.com');
const searchParams = new URLSearchParams();
searchParams.append('api-key', process.env.APIKEY);

const streetSection = document.querySelector('.streets');
const stopSchedulesTableTitle = document.querySelector('#street-name');
const StopSchedulesTable = document.querySelector('table tbody');

search.onsubmit = handleStreetSearch;
streetSection.onclick = handleStreetClick;

const streetToHTML = street =>
  `<a href data-key="${street.key}">${street.name}</a>`;

const stopToHTML = stop => `<tr class="${stop.direction}">
  <td>${stop.crossStreet}</td>
  <td>${stop.direction}</td>
  <td>${stop.busNumber}</td>
  <td>${stop.nextBus.format('hh:mm A')}</td>
</tr>`;

const legendHTML = direction => {
  const opposite = {Northbound: 'Southbound', Eastbound: 'Westbound'};
  return `<dl id="legend">
    <dt class="${direction}"></dt>
    <dd>${direction}</dd>
    <dt class="${opposite[direction]}"></dt>
    <dd>${opposite[direction]}</dd>
  </dl>`;
};

function endpointURL(pathname, options) {
  winnipegTransitURL.pathname = `v3/${pathname}`;

  options = Object.entries(options);

  for (let [option, value] of options) searchParams.append(option, value);

  winnipegTransitURL.search = searchParams.toString();

  for (let [option] of options) searchParams.delete(option);

  return winnipegTransitURL.href;
}

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

  fetch(endpointURL('streets.json', {name, usage: 'long'}))
    .then(response => response.json())
    .then(result => result.streets)
    .then(showStreets);
}

function showStreets(streets) {
  streetSection.innerHTML =
    streets.length > 0
      ? streets.map(streetToHTML).join('')
      : `<div class="no-results">No Streets Found</div>`;
}

function handleStreetClick(clickEvent) {
  clickEvent.preventDefault();
  const street = clickEvent.target;
  if (street.nodeName === 'A') getStops(street.dataset.key);
}

function getStops(street) {
  fetch(endpointURL('stops.json', {street}))
    .then(response => response.json())
    .then(result => result.stops)
    .then(getStopSchedules);
}

function getStopSchedules(stops) {
  stops = stops
    .map(stop => stop.key)
    .map(key =>
      fetch(
        endpointURL(`stops/${key}/schedule.json`, {'max-results-per-route': 2})
      )
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
        )
    );

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

function showStopSchedules(stops) {
  const thereAreStops = stops.length > 0;

  stopSchedulesTableTitle.innerHTML = thereAreStops
    ? `<div>Displaying results for ${stops[0].name}</div>${legendHTML(
        stops[0].direction
      )}`
    : '';

  StopSchedulesTable.innerHTML = thereAreStops
    ? stops.map(stopToHTML).join('')
    : '';
}
