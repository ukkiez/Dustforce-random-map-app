// use nw.require() instead of require() or import to make it actually available
// in the browser context
const fs = nw.require( "fs" );

import { Timer } from "./classes/timer.js";
import { formatTime, formatMSToHumanReadable } from "./util/format.js";
import { addClass, removeClass } from "./util/dom.js";

const config = JSON.parse( fs.readFileSync( `${ global.__dirname }/user-data/configuration.json` ) );

export const settingsPath = `${ global.__dirname }/user-data/settings.json`;
const settings = JSON.parse( fs.readFileSync( settingsPath ) );

export const switchPage = ( currentPage, destination ) => {
  const split = destination.split( "/" );
  if ( split.length === 1 ) {
    destination = split[ 0 ];
  }
  else {
    destination = split[ split.length - 1 ];
  }

  if ( destination === "settings.html" ) {
    // open a new window with the settings configuration

    // get the current window
    const currentWindow = nw.Window.get();

    // clear out the body before switching to avoid janky visuals when we go
    // back from the settings page and reload this window
    document.body.innerHTML = "";

    currentWindow.hide();

    nw.Window.open( "views/settings.html", {
      position: "center",
      width: 360,
      height: 470,
      frame: false,
      always_on_top: true,
      transparent: true,
      resizable: true,
      // hide the window initially, and only show it after focusing the window;
      // this way, we can e.g. resize / move the window without janky initial
      // visuals; this may be causing an issue on Windows
      show: false,
    }, function( win ) {
      if ( typeof win !== "undefined" ) {
        win.on( "closed", function() {
          currentWindow.reload();
          currentWindow.show();
        } );
        win.on( "loaded", function() {
          // move the settings window to the position of the main window
          win.moveTo( currentWindow.x, currentWindow.y - 100 );
          win.focus();
          win.show();
        } );
      }
    } );

    return;
  }

  switch ( currentPage ) {
    case "settings.html": {
        // close the external settings window
        const settingsWindow = nw.Window.get();
        settingsWindow.close();
        break;
      }
  }

  window.location.href = destination;
}

let iconAnimationTimeout;
const initMainBody = () => {
  const template = document.getElementById( "main-hub-template" );
  const clone = template.content.cloneNode( true );
  document.body.replaceChildren( clone );

  document.getElementById( "close-app-btn" ).addEventListener( "click", () => {
    // close the application
    nw.Window.get().close();
  } );

  if ( settings.seed ) {
    document.getElementById( "seed" ).innerText = `Seed: ${ settings.seed }`;
  }

  if ( settings.settingsName ) {
    document.getElementById( "mode" ).innerText = `${ settings.settingsName } Mode`;
    document.getElementById( "mode2" ).innerText = `${ settings.settingsName } Mode`;
  }

  if ( !settings.skips ) {
    const skips = document.getElementById( "skips" );
    skips.innerText = "No Skips";
    addClass( skips, "none" );
  }

  if ( iconAnimationTimeout ) {
    clearTimeout( iconAnimationTimeout );
  }
  iconAnimationTimeout = setTimeout( () => {
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
  document.getElementById( "download-settings-link" ).href = "../user-data/settings.json";

  document.getElementById( "fastestSSTime-formatted" ).innerText = formatMSToHumanReadable( settings.fastestSSTime, true );

  const currentWindow = nw.Window.get();
  currentWindow.on( "loaded", function() {
    // get the height and width of the container div, and match the window size
    // with it (with some extra height to make sure nothing is cut off at the
    // bottom)
    const clientRectangle = document.getElementsByClassName( "container" )[ 0 ].getBoundingClientRect();
    currentWindow.resizeTo( parseInt( clientRectangle.width, 10 ), parseInt( clientRectangle.height, 10 ) + 35 );
    currentWindow.setMinimumSize( parseInt( clientRectangle.width - 50, 10 ), parseInt( clientRectangle.height - 50, 10 ) );
    currentWindow.setMaximumSize( parseInt( clientRectangle.width + 100, 10 ), parseInt( clientRectangle.height + 135, 10 ) );
  } );

  document.getElementById( "back-button" ).addEventListener( "click", () => {
    currentWindow.close();
  } );
}

export let timers = [];
const initTimers = ( _startChallengeRun ) => {
  const startTime = settings.startTime;

  const mainTimer = new Timer( {
    timerElementId: "main-time",
    tenths: true,
    hundreths: true,
    startTime,
  } );

  timers = [ mainTimer ];

  if ( _startChallengeRun ) {
    const mapTimer = new Timer( {
      timerElementId: "map-timer",
      tenths: true,
      hundreths: true,
      // time is forwards for this timer
      _countdown: false,
    } );

    timers.push( mapTimer );
    mapTimer.timerElement.innerHTML = formatTime( 0 );
  }

  mainTimer.timerElement.innerHTML = formatTime( startTime );
}

export let runData = {};
const initRunData = ( _startChallengeRun ) => {
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

    if ( _startChallengeRun ) {
      element.innerText = `Skips Remaining: ${ runData.skips }`;
    }
    else {
      element.innerText = `Free Skips: ${ runData.skips }`;
    }
  }
};

export const initChallengeRunBody = () => {
  const template = document.getElementById( "challenge-run-template" );
  const clone = template.content.cloneNode( true );
  document.body.replaceChildren( clone );

  initTimers( true );
  initRunData( true );

  import( "./timing/auto.js" ).then( ( { initialize } ) => {
    initialize();
  } );
}

const { href } = window.location;
const split = href.split( "/" );
const page = split[ split.length - 1 ];

const template = document.getElementById( "challenge-run-template" );
const giveChildrenClass = ( tag, _class ) => {
  if ( tag.children?.length ) {
    for ( const child of tag.children ) {
      addClass( child, _class );

      if ( child.children?.length ) {
        giveChildrenClass( child, _class );
      }
    }
  }
}
if ( template?.content?.children ) {
  for ( const child of template.content.children ) {
    addClass( child, "challenge" );
    giveChildrenClass( child, "challenge" );
  }
}

export const init = () => {
  // set the user configured opacity
  document.body.style[ "background-color" ] = `rgba(0, 0, 0, ${ config.styling.opacity / 100 })`;

  if ( page === "setup.html" ) {
    import( "./setup.js" );
    return;
  }
  else if ( !config.initialSetupDone ) {
    if ( page !== "setup.html" ) {
      // go to the initial setup page, where we'll confirm the dustforce
      // directory; this will only happen the first time someone opens the app
      switchPage( "", "./setup.html" );
    }
    return;
  }

  if ( page === "index.html" ) {
    initMainBody();

    initTimers();
    initRunData();

    import( "./timing/auto.js" ).then( ( { initialize } ) => {
      initialize();
    } );
  }
  else if ( page === "settings.html" ) {
    initSettingsBody();
    import( "./settings.js" );
  }
}

init();
