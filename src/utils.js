import round from 'lodash/round';
import sample from 'lodash/sample';
import times from 'lodash/times';
import { ANIMALS } from './constants';

export function transformise(string) {
  const str = string.toLowerCase()
   .replace(/[' ]/g, '_') // replace spaces & apostrophes with an underscore
   .replace(/[^a-z0-9_]/g, '') // remove anything that isn't alphanumeric or underscore
   .replace(/[_]+/g, '_'); // replace multiple _'s with a single _
  return str;
}

export function randomLine() {
  return times(3).map(() => sample(ANIMALS));
}

export function randomResults() {
  return times(3).map(randomLine);
}