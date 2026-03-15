// Entry point for the Eberron Calendar Roll20 API script.
// This module constructs the public Calendar API object that matches
// the original calendar.js return value.

// Import all modules to ensure side effects run (on("ready",...) etc.)
import './config.js';
import './constants.js';
import './state.js';
import './color.js';
import './date-math.js';
import './parsing.js';
import './events.js';
import './rendering.js';
import './ui.js';
import './commands.js';
import './today.js';
import './weather.js';
import './boot-register.js';
import './moon.js';
import './planes.js';

// Import the public API and re-export it as the default
import { _public } from './init.js';

// Re-export all properties of _public so esbuild's IIFE wrapper
// returns them as the Calendar object's properties.
export const checkInstall = _public.checkInstall;
export const register = _public.register;
export const render = _public.render;
export const events = _public.events;
export const colors = _public.colors;
export const _test = _public._test;
