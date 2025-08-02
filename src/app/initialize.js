import { getData } from "./util/data.js";
import { formatTime, formatMSToHumanReadable } from "./util/time/format.js";
import { addClass, removeClass } from "./util/dom.js";
import { obscureMainWindow } from "./util/ui.js";
import { syncLevelData } from "./util/sync.js";
import { log } from "./util/error.js";

const fs = nw.require( "fs" );
const path = nw.require( "path" );

let settings;
let config;
let personalBests;

let initialLoad = true;
let syncing = false;

export const switchPage = ( currentPage, destination ) => {
  const split = destination.split( "/" );
  if ( split.length === 1 ) {
    destination = split[ 0 ];
  }
  else {
    destination = split[ split.length - 1 ];
  }

  if ( destination === "settings.html" ) {
    const disablePointerEvents = true;
    const revertObscuration = obscureMainWindow( disablePointerEvents );

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

          revertObscuration();
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
const initMainBody = async ( userConfiguration ) => {
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

  if ( settings.scoreCategory === "any" ) {
    document.getElementById( "points-icon" ).src = "../assets/a-complete-icon.png";
    removeClass( document.getElementById( "mode-any-percent-tag" ), "hidden" );
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

  if ( syncing ) {
    // we were previously syncing, so continue to disable the start button
    const startBtnEl = document.getElementById( "start-btn" );
    addClass( startBtnEl, "disabled-btn" );
    addClass( startBtnEl, "fetching-maps" );
    document.getElementById( "start-btn-text" ).innerText = "Fetching maps";
  }

  // re-sync the remote level list if the last sync date was at least 1 minute
  // ago; only on app-start
  const now = ( new Date() ).getTime();
  const { levelMetadata } = userConfiguration;

  const { levelData } = getData( { levelData: true } );
  if ( !Object.keys( levelData.data ).length || ( initialLoad && now > ( levelMetadata?.lastSync + ( 1000 * 60 * 1 ) ) && ( levelMetadata?.rateLimitRemaining > 0 ) ) ) {
    initialLoad = false;

    const startBtnEl = document.getElementById( "start-btn" );
    addClass( startBtnEl, "disabled-btn" );
    addClass( startBtnEl, "fetching-maps" );
    document.getElementById( "start-btn-text" ).innerText = "Fetching maps";

    try {
      syncing = true;
      syncLevelData( levelData.version, ( wasNewData, result ) => {
        const newConfig = { ...userConfiguration };
        newConfig.levelMetadata.lastSync = now;
        newConfig.levelMetadata.rateLimitRemaining = result.rateLimitRemaining;

        if ( wasNewData ) {
          newConfig.levelMetadata.version = result.data.version;
        }

        fs.writeFileSync( path.join( global.__dirname, "user-data/configuration.json" ), JSON.stringify( newConfig, null, 2 ) );

        removeClass( document.getElementById( "start-btn" ), "disabled-btn" );
        removeClass( document.getElementById( "start-btn" ), "fetching-maps" );
        document.getElementById( "start-btn-text" ).innerText = "Start Challenge";

        syncing = false;
      } );
    }
    catch ( error ) {
      log.error( error );
    }
  }
}

const initSettingsBody = () => {
  document.getElementById( "download-settings-link" ).href = "../user-data/settings.json";

  const withMs = true;
  document.getElementById( "fastestSSTime-formatted" ).innerText = formatMSToHumanReadable( settings.fastestSSTime, withMs );

  const currentWindow = nw.Window.get();
  currentWindow.on( "loaded", function() {
    // get the height and width of the container div, and match the window size
    // with it (with some extra height to make sure nothing is cut off at the
    // bottom)
    const clientRectangle = document.getElementsByClassName( "container" )[ 0 ].getBoundingClientRect();
    currentWindow.resizeTo(
      parseInt( clientRectangle.width, 10 ),
      parseInt( clientRectangle.height, 10 ) + 35
    );
    currentWindow.setMinimumSize(
      parseInt( clientRectangle.width - 50, 10 ),
      parseInt( clientRectangle.height - 50, 10 )
    );
    currentWindow.setMaximumSize(
      parseInt( clientRectangle.width + 100, 10 ),
      parseInt( clientRectangle.height + 135, 10 )
    );
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

export let init = async () => {
  ( { settings, personalBests, userConfiguration: config } = await getData( { settings: true, personalBests: true, userConfiguration: true } ) );

  // set the user configured opacity
  document.body.style[ "background-color" ] = `rgba(0, 0, 0, ${ config.styling.opacity / 100 })`;

  if ( page === "setup.html" ) {
    import( "./setup.js" );
    return;
  }
  else if ( !config.initialSetupDone ) {
    // go to the initial setup page, where we'll confirm the dustforce
    // directory; this will only happen the first time someone opens the app
    switchPage( "", "./setup.html" );
    return;
  }

  if ( page === "index.html" ) {
    initMainBody( config );
  }
  else if ( page === "settings.html" ) {
    initSettingsBody();
    import( "./settings.js" );
  }
}

init();
