import 'normalize.css';
import './style.css';

require('dotenv').config();

import dayjs from 'dayjs';
import {flattenDeep, uniq} from 'lodash';

const winnipegTransitURL = new URL('https://api.winnipegtransit.com');
const searchParams = new URLSearchParams();
searchParams.append('api-key', process.env.APIKEY);

const streetSection = document.querySelector('.streets');
const stopSchedulesTitle = document.querySelector('#street-name');
const stopSchedulesLegend = document.querySelector('#legend');
const crossStreetSelect = document.querySelector('#crossStreet');
const stopSchedules = document.querySelector('#schedules main');

let theStops = [];

search.onsubmit = handleStreetSearch;
streetSection.onclick = handleStreetClick;
crossStreetSelect.onchange = changeEvent =>
  showStopSchedules(changeEvent.target.value);

const streetToHTML = street =>
  `<a href data-key="${street.key}">${street.name}</a>`;

const directionSymbol = direction => {
  const symbols = {
    Northbound: '<i class="fas fa-lg fa-arrow-up"></i>',
    Southbound: '<i class="fas fa-lg fa-arrow-down"></i>',
    Westbound: '<i class="fas fa-lg fa-arrow-left"></i>',
    Eastbound: '<i class="fas fa-lg fa-arrow-right"></i>',
  };

  return symbols[direction];
};

const stopToHTML = stop => `<div class="row ${stop.direction}">
  <div>${stop.crossStreet}</div>
  <div>${directionSymbol(stop.direction)}</div>
  <div>${stop.busNumber}</div>
  <div>${stop.nextBus.format('hh:mm A')}</div>
</div>`;

const legendHTML = direction => {
  const opposite = {
    Northbound: 'Southbound',
    Eastbound: 'Westbound',
    Southbound: 'Northbound',
    Westbound: 'Eastbound',
  };
  
  return `<dt class="${direction}">${directionSymbol(direction)}</dt>
    <dd>${direction}</dd>
    <dt class="${opposite[direction]}">${directionSymbol(
    opposite[direction]
  )}</dt>
    <dd>${opposite[direction]}</dd>`;
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
  if (street.nodeName === 'A') {
    theStops = [];
    getStops(street.dataset.key);
  }
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
          a.busNumber.toString().localeCompare(b.busNumber) ||
          a.nextBus - b.nextBus
      )
    )
    .then(stops => {
      theStops = stops;
      showStopSchedules();
    });
}

function showStopSchedules(crossStreetFilter = '') {
  let thereAreStops = theStops.length > 0;

  const stops =
    thereAreStops && crossStreetFilter !== ''
      ? theStops.filter(stop => stop.crossStreet === crossStreetFilter)
      : theStops;

  thereAreStops = stops.length > 0;

  stopSchedulesTitle.innerText = thereAreStops
    ? `Displaying results for ${stops[0].name}`
    : '';

  const crossStreets = uniq(theStops.map(stop => stop.crossStreet));

  crossStreetSelect.innerHTML =
    thereAreStops && crossStreets.length > 1
      ? `<select>
        <option value="">All Cross Streets</option>
        ${crossStreets.map(
          crossStreet =>
            `<option ${
              crossStreet === crossStreetFilter ? 'selected' : ''
            } value="${crossStreet}">${crossStreet}</option>`
        )}
      </select>`
      : 'Cross Street';

  stopSchedulesLegend.innerHTML = thereAreStops
    ? legendHTML(stops[0].direction)
    : '';

  stopSchedules.innerHTML = thereAreStops ? stops.map(stopToHTML).join('') : '';
}
