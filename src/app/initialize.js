// use nw.require() instead of require() or import to make it actually available
// in the browser context
const fs = nw.require( "fs" );

import { Timer } from "./classes/timer.js";
import { formatTime, formatMSToHumanReadable } from "./util/format.js";
import { addClass, removeClass } from "./util/dom.js";

import { registerListeners, unregisterListeners } from "./hotkeys.js";
// import { registerHotkeys, unregisterHotkeys } from "./hotkeys.js";

const platform = nw.require( "os" ).platform();

const path = nw.require( "path" );

import defaultSettings from "../user-data/default-settings.json";
import defaultShortcuts from "../user-data/default-shortcuts.json";

export let settingsPath;
let shortcutsPath;
let settings = JSON.parse( fs.readFileSync( `${ global.__dirname }/user-data/settings.json` ) );
switch ( platform ) {
  case "darwin":
    // read instead of import, to make sure the data is updated when we change
    // pages, something which does not seem to happen when importing
    settingsPath = `${ global.__dirname }/user-data/settings.json`;
    shortcutsPath = `${ global.__dirname }/user-data/shortcuts.json`;
    settings = JSON.parse( fs.readFileSync( settingsPath ) );
    break;

  case "linux":
  case "win32": {
    // ensure the user data directory and settings.json are in the same
    // directory as the app executable, as the Linux and Windows versions are
    // zipped and create temp directories for each app session, so the above
    // Darwin version does not work across multiple sessions
    const nwPath = nw.process.execPath;
    const exeDir = path.dirname( nwPath );

    settingsPath = `${ exeDir }/user-data/settings.json`;
    shortcutsPath = `${ exeDir }/user-data/shortcuts.json`;
    if ( !fs.existsSync( `${ exeDir }/user-data` ) ) {
      fs.mkdirSync( `${ exeDir }/user-data` );
    }
    if ( !fs.existsSync( settingsPath ) ) {
      // make a copy of the default settings, for reasons described directly
      // above
      fs.writeFileSync( settingsPath, JSON.stringify( defaultSettings, null, 2 ) );
    }
    if ( !fs.existsSync( shortcutsPath ) ) {
      // do the same for shortcuts
      fs.writeFileSync( shortcutsPath, JSON.stringify( defaultShortcuts, null, 2 ) );
    }

    settings = JSON.parse( fs.readFileSync( settingsPath ) )
    break;
  }
}

const switchPage = ( currentPage, destination ) => {
  const split = destination.split( "/" );
  if ( split.length === 1 ) {
    destination = split[ 0 ];
  }
  else {
    destination = split[ split.length - 1 ];
  }

  if ( destination === "settings.html" ) {
    unregisterListeners();
  }

  switch ( currentPage ) {
    case "index.html":
      // set the display style of all body tags to "none" before switching
      // pages; there is a bug with -webkit-app-region: drag, where the region
      // remains draggable even when the relevant tag is gone; setting display
      // style to "none" fixes it, though it makes the switching of pages look
      // kind of jerky if you only do it to one tag, so just do it to all tags
      // instead of just the draggable ones
      for ( const child of document.body.children ) {
        child.style.display = "none";
      }
      break;

    case "settings.html":
      // see above
      for ( const child of document.body.children ) {
        child.style.display = "none";
      }
      break;
  }

  window.location.href = destination;
}

const initMainBody = () => {
  const temp = document.getElementsByTagName( "template" )[ 0 ];
  const clone = temp.content.cloneNode( true );
  document.body.replaceChildren( clone );

  if ( settings.seed ) {
    document.getElementById( "seed" ).innerText = `Seed: ${ settings.seed }`;
  }

  if ( !settings.skips ) {
    const skips = document.getElementById( "skips" );
    skips.innerText = "No Skips";
    addClass( skips, "none" );
  }

  setTimeout( () => {
    // remove the animated class so we can toggle the animation whenever we want
    // (but only after a timeout, since we want the animation to finish playing
    // on pageload first)
    removeClass( document.getElementById( "points-icon" ), "animated" );
  }, 2000 );

  document.getElementById( "settings-icon" ).addEventListener( "click", () => {
    switchPage( "index.html", "./settings.html" );
  } );
}

const initSettingsBody = () => {
  document.getElementById( "download-settings-link" ).href = settingsPath;

  document.getElementById( "fastestSSTime-formatted" ).innerText = formatMSToHumanReadable( settings.fastestSSTime, true );

  document.getElementById( "back-button" ).addEventListener( "click", () => {
    switchPage( "settings.html", "./index.html" );
  } );
}

export let timers = [];
const initTimers = () => {

  const startTime = settings.startTime;

  const mainTimer = new Timer( {
    timerElementId: "main-time",
    tenths: true,
    hundreths: true,
    startTime,
  } );
  timers = [ mainTimer ];

  mainTimer.timerElement.innerHTML = formatTime( startTime );
}

export let runData = {};
const initRunData = () => {
  // keep track of skips, which levels have been completed (SS or any%), and
  // which have been solved (SS'd only), and which levels have been picked
  // already
  runData = {
    skips: settings.freeSkips,
    completedLevelIds: new Set(),
    solvedLevelIds: new Set(),
    chosenLevelCache: new Set(),
  };

  if ( settings.skips ) {
    // set the proper skips starting count
    const element = document.getElementById( "skips" );
    if ( runData.skips <= 0 ) {
      addClass( element, "none" );
    }

    element.innerText = `Skips remaining: ${ runData.skips }`;
  }
};

const { href } = window.location;
const split = href.split( "/" );
const page = split[ split.length - 1 ];

export const init = () => {
  if ( page === "index.html" ) {
    // // register global hotkeys using NW.Shortcuts
    // registerHotkeys();
    registerListeners();

    initMainBody();

    initTimers();
    initRunData();

    import( "./timing/auto.js" );
  }
  else if ( page === "settings.html" ) {
    unregisterListeners();

    initSettingsBody();
    import( "./settings.js" );
  }
}

init();
