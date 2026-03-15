import { CONFIG_DEFAULTS } from './config.js';
import { state_name } from './constants.js';
import { fromSerial, regularMonthIndex } from './date-math.js';
import { ensureSettings } from './state.js';

export var TIME_OF_DAY_DEFAULT_BUCKET = 'nighttime';

export var TIME_OF_DAY_BUCKETS = [
  { key:'middle_of_night', label:'Middle of the Night', shortLabel:'Middle of Night', startHour:0,  endHour:4,  midpointHour:2  },
  { key:'early_morning',   label:'Early Morning',       shortLabel:'Early Morning',  startHour:4,  endHour:8,  midpointHour:6  },
  { key:'morning',         label:'Morning',             shortLabel:'Morning',        startHour:8,  endHour:12, midpointHour:10 },
  { key:'afternoon',       label:'Afternoon',           shortLabel:'Afternoon',      startHour:12, endHour:16, midpointHour:14 },
  { key:'evening',         label:'Evening',             shortLabel:'Evening',        startHour:16, endHour:20, midpointHour:18 },
  { key:'nighttime',       label:'Nighttime',           shortLabel:'Nighttime',      startHour:20, endHour:24, midpointHour:22 }
];

export var SOLAR_DAYLIGHT_TABLE = [
  { key:'mid_winter',   sunrise:8.0, sunset:16.0 },
  { key:'late_winter',  sunrise:7.5, sunset:16.5 },
  { key:'early_spring', sunrise:7.0, sunset:17.0 },
  { key:'mid_spring',   sunrise:6.5, sunset:18.0 },
  { key:'late_spring',  sunrise:6.0, sunset:19.0 },
  { key:'early_summer', sunrise:5.5, sunset:19.5 },
  { key:'mid_summer',   sunrise:5.0, sunset:20.0 },
  { key:'late_summer',  sunrise:5.5, sunset:19.5 },
  { key:'early_autumn', sunrise:6.0, sunset:18.5 },
  { key:'mid_autumn',   sunrise:6.5, sunset:17.5 },
  { key:'late_autumn',  sunrise:7.0, sunset:17.0 },
  { key:'early_winter', sunrise:7.5, sunset:16.5 }
];

var _TIME_BUCKET_META: any = {};
for (var _ti = 0; _ti < TIME_OF_DAY_BUCKETS.length; _ti++){
  _TIME_BUCKET_META[TIME_OF_DAY_BUCKETS[_ti].key] = TIME_OF_DAY_BUCKETS[_ti];
}

export function normalizeTimeBucketKey(bucket: any){
  var key = String(bucket || '').toLowerCase().trim();
  if (!key) return null;
  key = key.replace(/[\s-]+/g, '_');
  var aliases: any = {
    midnight: 'middle_of_night',
    middle_of_the_night: 'middle_of_night',
    middleofthenight: 'middle_of_night',
    middle_night: 'middle_of_night',
    dawn: 'early_morning',
    sunrise: 'early_morning',
    early: 'early_morning',
    midday: 'afternoon',
    noon: 'afternoon',
    day: 'morning',
    dusk: 'evening',
    sunset: 'evening',
    night: 'nighttime',
    late_night: 'nighttime'
  };
  if (aliases[key]) key = aliases[key];
  return _TIME_BUCKET_META[key] ? key : null;
}

export function timeBucketMeta(bucket: any){
  return _TIME_BUCKET_META[normalizeTimeBucketKey(bucket)] || null;
}

export function bucketLabel(bucket: any){
  var meta = timeBucketMeta(bucket);
  return meta ? meta.label : '';
}

export function bucketShortLabel(bucket: any){
  var meta = timeBucketMeta(bucket);
  return meta ? meta.shortLabel : '';
}

export function bucketMidpointHour(bucket: any){
  var meta = timeBucketMeta(bucket);
  return meta ? meta.midpointHour : null;
}

export function bucketMidpointTimeFrac(bucket: any){
  var hour = bucketMidpointHour(bucket);
  if (hour == null) return 0;
  return hour / 24;
}

export function nextTimeBucket(bucket: any){
  var key = normalizeTimeBucketKey(bucket);
  if (!key) return TIME_OF_DAY_BUCKETS[0].key;
  for (var i = 0; i < TIME_OF_DAY_BUCKETS.length; i++){
    if (TIME_OF_DAY_BUCKETS[i].key === key){
      return TIME_OF_DAY_BUCKETS[(i + 1) % TIME_OF_DAY_BUCKETS.length].key;
    }
  }
  return TIME_OF_DAY_BUCKETS[0].key;
}

export function ensureTimeOfDayState(){
  var root = state[state_name];
  if (!root.timeOfDay || typeof root.timeOfDay !== 'object'){
    root.timeOfDay = { active:false, bucket:null };
  }
  var tod = root.timeOfDay;
  tod.active = !!tod.active;
  tod.bucket = normalizeTimeBucketKey(tod.bucket);
  if (!tod.bucket) tod.active = false;
  if (!tod.active) tod.bucket = null;
  return tod;
}

export function getTimeOfDayState(){
  return ensureTimeOfDayState();
}

export function clearTimeOfDay(){
  var tod = ensureTimeOfDayState();
  tod.active = false;
  tod.bucket = null;
  return tod;
}

export function activateTimeOfDay(bucket: any){
  var key = normalizeTimeBucketKey(bucket);
  if (!key) return null;
  var tod = ensureTimeOfDayState();
  tod.active = true;
  tod.bucket = key;
  return tod;
}

export function isTimeOfDayActive(){
  var tod = ensureTimeOfDayState();
  return !!(tod.active && tod.bucket);
}

export function currentTimeBucket(){
  var tod = ensureTimeOfDayState();
  return (tod.active && tod.bucket) ? tod.bucket : null;
}

export function effectiveTimeBucket(fallback?: any){
  return currentTimeBucket() ||
    normalizeTimeBucketKey(fallback) ||
    TIME_OF_DAY_DEFAULT_BUCKET;
}

export function solarSeasonIndex(monthIndex: any){
  var hem = ensureSettings().hemisphere || CONFIG_DEFAULTS.hemisphere;
  var offset = (hem === 'south') ? 6 : 0;
  return (regularMonthIndex(monthIndex) + offset) % SOLAR_DAYLIGHT_TABLE.length;
}

export function solarProfileForMonth(monthIndex: any){
  return SOLAR_DAYLIGHT_TABLE[solarSeasonIndex(monthIndex)] || SOLAR_DAYLIGHT_TABLE[0];
}

export function solarProfileForSerial(serial: any){
  var d = fromSerial(serial|0);
  return solarProfileForMonth(d.mi);
}

export function isBucketDaylit(monthIndex: any, bucket: any){
  var meta = timeBucketMeta(bucket);
  if (!meta) return false;
  var solar = solarProfileForMonth(monthIndex);
  if (!solar) return false;
  var hour = meta.midpointHour;
  return hour >= solar.sunrise && hour < solar.sunset;
}

export function daylightStatusForSerial(serial: any, bucket?: any){
  var d = fromSerial(serial|0);
  var key = normalizeTimeBucketKey(bucket) || effectiveTimeBucket();
  return {
    bucket: key,
    bucketLabel: bucketLabel(key),
    solar: solarProfileForMonth(d.mi),
    daylit: isBucketDaylit(d.mi, key)
  };
}
