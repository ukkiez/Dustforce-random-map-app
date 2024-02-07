import { log } from "./util/log.js";

import { Timer } from "./classes/timer.js";
import { objectDiff } from "./util/index.js";
import { formatTime, formatMSToHumanReadable } from "./util/format.js";
import { addClass, removeClass } from "./util/dom.js";

import { modes } from "../settings/modes.js";

let config;
let settings;
try {
  config = JSON.parse( await Neutralino.filesystem.readFile( "src/user-data/configuration.json" ) );
  settings = JSON.parse( await Neutralino.filesystem.readFile( "src/user-data/settings.json" ) );
}
catch ( error ) {
  console.error( error );
}

export const switchPage = async ( currentPage, destination ) => {
  const split = destination.split( "/" );
  if ( split.length === 1 ) {
    destination = split[ 0 ];
  }
  else {
    destination = split[ split.length - 1 ];
  }

  if ( destination === "index.html" ) {
    if ( currentPage === "settings.html" ) {
      // set the display style of all body tags to "none" before switching pages
      // to help avoid visual flickering
      for ( const child of document.body.children ) {
        child.style.display = "none";
      }

      // move and resize the window to the original settings before the user
      // went to the settings
      const windowSettingsCache = JSON.parse( await Neutralino.storage.getData( "windowSettings" ) || {} );
      if ( windowSettingsCache?.size ) {
        await Neutralino.window.setSize( {
          width: windowSettingsCache.size.width,
          height: windowSettingsCache.size.height,
          maxWidth: windowSettingsCache.size.maxWidth,
          maxHeight: windowSettingsCache.size.maxHeight,
        } );
      }
      if ( windowSettingsCache?.position ) {
        await Neutralino.window.move( windowSettingsCache.position.x, windowSettingsCache.position.y );
      }
    }

    window.location.replace( "/views/" );
    return;
  }

  window.location.replace( destination );
}

let iconAnimationTimeout;
const initMainBody = async () => {
  const template = document.getElementById( "main-hub-template" );
  const clone = template.content.cloneNode( true );
  document.body.replaceChildren( clone );

  let _predefinedMode = false;
  for ( const [ key, mode ] of Object.entries( modes ) ) {
    if ( !objectDiff( mode, settings ) ) {
      document.getElementById( "mode" ).innerText = `${ key } Mode`;
      document.getElementById( "mode2" ).innerText = `${ key } Mode`;
      _predefinedMode = true;
    }
  }
  if ( !_predefinedMode ) {
    document.getElementById( "mode" ).innerText = "Custom Mode";
    document.getElementById( "mode2" ).innerText = "Custom Mode";
  }

  if ( settings.seed ) {
    document.getElementById( "seed" ).innerText = `Seed: ${ settings.seed }`;
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

  document.getElementById( "settings-icon-container" ).addEventListener( "click", () => {
    switchPage( "index.html", "./settings.html" );
  } );
}

const initSettingsBody = async () => {
  log( "initSettingsBody" );
  try {
    await Neutralino.storage.setData( "windowSettings", JSON.stringify( {
      size: await Neutralino.window.getSize(),
      position: await Neutralino.window.getPosition(),
    } ) );
  }
  catch ( e ) {
    console.log( e );
  }

  await Neutralino.window.setSize( {
    width: 330,
    height: 475,
    resizable: false,
  } );

  document.getElementById( "download-settings-link" ).addEventListener( "click", async () => {
    try {
      await Neutralino.os.showOpenDialog( "Open A Thing", {
        filters: [
          // filter extensions are fucked - the first element has to be
          // nonsensical in order for it to properly pick up the second element
          { name: "JSON", extensions: [ "__-gibberish-__", "JSON" ] },
        ]
      } );
    }
    catch ( e ) {
      console.log( e );
    }
  } );

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

export const initChallengeRunBody = () => {
  const template = document.getElementById( "challenge-run-template" );
  const clone = template.content.cloneNode( true );
  document.body.replaceChildren( clone );

  initTimers( true );
  initRunData();

  import( "./challenge/index.js" ).then( ( { initialize } ) => {
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
  log( "init(), page: ", page );
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

  if ( !page ) {
    initMainBody();

    initTimers();
    initRunData();

    import( "./challenge/index.js" ).then( ( { initialize } ) => {
      initialize();
    } );
  }
  else if ( page === "settings.html" ) {
    initSettingsBody();
    import( "./settings.js" );
  }
}

init();
