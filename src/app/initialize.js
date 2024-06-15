// use nw.require() instead of require() or import to make it actually available
// in the browser context
import { getData } from "./util/data.js";
import { formatTime, formatMSToHumanReadable } from "./util/format.js";
import { addClass, removeClass } from "./util/dom.js";

let settings;
let config;
let personalBests;

export let init;

export const switchPage = ( currentPage, destination ) => {
  const split = destination.split( "/" );
  if ( split.length === 1 ) {
    destination = split[ 0 ];
  }
  else {
    destination = split[ split.length - 1 ];
  }

  if ( destination === "settings.html" ) {
    // add an opaque black overlay to the main window and disable pointer events
    // while the user is altering the settings
    document.getElementById( "obscuring-overlay" ).style.display = "block";
    document.body.style[ "pointer-events" ] = "none";

    // open a new window with the settings configuration
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
          init();

          // ensure pointer events are enabled in case we disabled them while e.g. the
          // Settings are open
          document.body.style[ "pointer-events" ] = "auto";
        } );
        win.on( "loaded", function() {
          // // move the settings window to the position of the main window
          // win.moveTo( currentWindow.x, currentWindow.y - 100 );
          win.show();
          win.focus();
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

  import( "./runs/challenge.js" ).then( ( { initialize } ) => {
    document.getElementById( "start-btn" )?.addEventListener( "click", initialize );
  } );

  if ( settings.seed ) {
    document.getElementById( "seed" ).innerText = `Seed: ${ settings.seed }`;
  }
  else {
    document.getElementById( "seed" ).innerText = "Random Seed";
  }

  if ( settings.settingsName ) {
    document.getElementById( "mode" ).innerText = `${ settings.settingsName } Mode`;
    document.getElementById( "mode2" ).innerText = `${ settings.settingsName } Mode`;
  }

  // set the proper skips starting count
  const skipsElement = document.getElementById( "skips" );
  if ( !settings.skips || ( !settings.infiniteSkips && settings.freeSkips <= 0 ) ) {
    addClass( skipsElement, "none" );
  }

  if ( !settings.skips ) {
    skipsElement.innerText = "No Skips";
  }
  else if ( settings.infiniteSkips ) {
    skipsElement.innerText = "Infinite Skips";
  }
  else {
    skipsElement.innerText = `Free Skips: ${ settings.freeSkips }`;
  }

  document.getElementById( "main-time" ).innerHTML = formatTime( settings.startTime );

  const pb = personalBests[ settings.settingsName ];
  if ( settings.settingsName.toLowerCase() === "custom" ) {
    document.getElementById( "personal-best-score" ).innerText = "N/A";
  }
  else if ( pb?.score ) {
    document.getElementById( "personal-best-score" ).innerText = pb.score;
  }

  if ( iconAnimationTimeout ) {
    clearTimeout( iconAnimationTimeout );
  }
  iconAnimationTimeout = setTimeout( () => {
    // remove the animated class so we can toggle the animation whenever we want
    // (but only after a timeout, since we want the animation to finish playing
    // on pageload first)
    if ( document.getElementById( "points-icon" ) ) {
      removeClass( document.getElementById( "points-icon" ), "animated" );
    }
  }, 2000 );

  document.getElementById( "settings-icon" )?.addEventListener( "click", () => {
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

  document.getElementById( "map-search-btn" ).addEventListener( "click", () => {
    addClass( document.getElementById( "map-search-container" ), "opened" );
    addClass( document.getElementById( "map-list-container" ), "opened" );
    addClass( document.getElementById( "settings-container" ), "hidden" );
  } );
  document.getElementById( "map-search-back-btn" ).addEventListener( "click", () => {
    removeClass( document.getElementById( "map-search-container" ), "opened" );
    removeClass( document.getElementById( "map-list-container" ), "opened" );
    removeClass( document.getElementById( "settings-container" ), "hidden" );
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

init = () => {
  ( { settings, personalBests, userConfiguration: config } = getData( { settings: true, personalBests: true, userConfiguration: true } ) );

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
  }
  else if ( page === "settings.html" ) {
    initSettingsBody();
    import( "./settings.js" );
  }
}

init();
