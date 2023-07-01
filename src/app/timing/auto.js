import { settingsPath, timers, runData } from "../initialize.js";

import { reset } from "../reset.js";

import { addClass, removeClass } from "../util/dom.js";
import { seededRandom } from "../util/random.js";

import cmpLevels from "../../dustkid-data/cmp-levels.json";

// use nw.require() instead of require() or import to make it actually available
const fs = nw.require( "fs" );
const path = nw.require( "path" );
// const open = nw.require( "open" );
const { exec } = nw.require( "child_process" );

const { dustforceDirectory } = JSON.parse( fs.readFileSync( `${ global.__dirname }/user-data/configuration.json` ) );

const splitFile = path.join( dustforceDirectory, "split.txt" );

const { seed, minSSCount, fastestSSTime, CMPLevels: _CMPLevelsOn, skips: _skipsOn, freeSkipAfterXSolvedLevels } = JSON.parse( fs.readFileSync( settingsPath ) );

// parse the filtered level metadata JSON file instead of importing it, so we
// can be sure that on window reload we're getting all the new data
const levelData = JSON.parse( fs.readFileSync( `${ global.__dirname }/dustkid-data/filtered-metadata.json` ) );

const authorsById = new Map();

const timerAction = ( action ) => {
  for ( const timer of timers ) {
    timer[ action ]();
  }
}

const increment = ( _decrement = false ) => {
  if ( !timers[ 0 ].hasStarted ) {
    return;
  }

  const counter = document.getElementById( "points-icon-text" );
  let number = parseInt( counter.innerText, 10 );
  if ( _decrement ) {
    number--;
  }
  else {
    number++;
  }

  if ( number < 0 ) {
    number = 0;
  }

  counter.innerText = `${ number }`;
};

const installPrefix = "dustforce://install";
const installPlayPrefix = "dustforce://installPlay";

const os = nw.require( "os" );

let openCommand = "";
switch ( os.platform() ) {
  case "darwin":
  case "linux":
    openCommand = "open";
    break;

  case "win32":
  default:
    openCommand = "start";
    break;
}

const openApp = ( url ) => {
  exec( `${ openCommand } "${ url }"` );
}

const installAndMaybePlay = ( level, play = false ) => {
  if ( play ) {
    openApp( `${ installPlayPrefix }/${ level.id }/${ level.name }` );
  }
  else {
    openApp( `${ installPrefix }/${ level.id }/${ level.name }` );
  }
}

let blocked = false;
let timeout = null;
const block = ( ms = 1500 ) => {
  if ( timeout ) {
    // clear any previously active timeouts that would unblock before the
    // current function call
    clearTimeout( timeout );
  }

  blocked = true;
  timeout = setTimeout(() => {
    blocked = false;
    timeout = null;
  }, ms );
}

const adjustOnScreenMapInfo = ( levelId, name, author ) => {
  const nameEl = document.getElementById( "map-info-name" );
  const authorEl = document.getElementById( "map-info-author" );
  nameEl.innerText = name;
  authorEl.innerText = author;

  // allow users to go to the Atlas page by clicking on the map name
  nameEl.onclick = () => {
    nw.Shell.openExternal( `https://atlas.dustforce.com/${ levelId }` );
  };
}

// keep track of skips, which levels have been completed (SS or any%), and which
// have been solved (SS'd only), and which levels have been picked already
let { skips, completedLevelIds, solvedLevelIds, chosenLevelCache } = runData;

let mapPool = [];
let choiceIndex = 0;
const pickLevel = () => {
  // the map pool was already shuffled at the start of the run, so simply pick
  // maps start to end
  const choice = mapPool[ choiceIndex ];
  choiceIndex++;

  chosenLevelCache.add( choice );

  const index = choice.lastIndexOf( "-" );

  const name = choice.substring( 0, index );
  const id = choice.substring( index + 1 );

  const author = authorsById.get( parseInt( id, 10 ) );
  adjustOnScreenMapInfo( id, name, author );

  return {
    name,
    id,
  };
}

const config = {
  minSSCount,
  fastestSSTime,
  freeSkipAfterXSolvedLevels,
}

let currentLevel = {
  name: "",
  id: -1,
};

const handleSkipsCount = ( change ) => {
  if ( !_skipsOn ) {
    // skips are not set to be on by the user
    return;
  }

  const element = document.getElementById( "skips" );

  if ( change > 0 ) {
    // increment the skips count
    skips += change;
    if ( skips > 0 ) {
      removeClass( element, "none" );
      removeClass( document.getElementById( "skip-btn" ), "disabled-btn" )
    }
  }
  else if ( change < 0 ) {
    // decrement the skips count (but not below 0)
    if ( skips > 0 ) {
      skips = Math.max( 0, skips + change );

      if ( skips <= 0 ) {
        addClass( element, "none" );
        addClass( document.getElementById( "skip-btn" ), "disabled-btn" )
      }
    }
  }

  element.innerText = `Skips remaining: ${ skips }`;
}

let initialized = false;
let watcher;
const startAndSkip = () => {
  if ( !initialized ) {
    // don't allow going to the settings page, as it would load a different
    // page, and therefore stop the current run permanently
    document.getElementById( "settings-icon-container" ).style.display = "none";

    // hide the seed, as there is no place on the screen for it at the moment
    document.getElementById( "seed" ).style.display = "none";

    // hide the hub buttons, and load the challenge run buttons
    const hubButtonContainer = document.querySelector( ".hub-btn-container" );
    hubButtonContainer.style.display = "none";

    // give the map name element a class that visually indicates you can click
    // it (to go to the map's Atlas page)
    document.getElementById( "map-info-name" ).classList.add( "clickable" );

    const challengeButtons = document.getElementsByClassName( "challenge-run-btn" );
    for ( const button of challengeButtons ) {
      button.style.visibility = "visible";
    }

    mapPool = [];

    // populate the map pool
    for ( const [ levelFilename, metadata ] of Object.entries( levelData ) ) {
      if ( !_CMPLevelsOn ) {
        if ( cmpLevels.includes( levelFilename ) ) {
          // don't include cmp levels, as the user set them to be off
          continue;
        }
      }

      const { ss_count, fastest_time, author, atlas_id } = metadata;
      if ( ss_count >= config.minSSCount && fastest_time <= config.fastestSSTime ) {
        mapPool.push( levelFilename );
      }

      authorsById.set( atlas_id, author );
    }
    initialized = true;

    let _seed = seed;
    if ( !_seed ) {
      // generate a random 5-digit seed if the user didn't provide a seed
      _seed = `${ Math.floor( Math.random() * 90000 ) + 10000 }`;
    }

    // initialize the seeder
    const { shuffle } = seededRandom( { seed: _seed } );

    // shuffle the map pool, by the given seed, which consequently means that
    // when we pick a level below, we'll simply do it in order, start to end
    shuffle( mapPool );

    // ensure split.txt exists, otherwise create an empty one
    if ( !fs.existsSync( splitFile ) ) {
      fs.writeFileSync( splitFile, "" );
    }
  }

  if ( timers[ 0 ].finished ) {
    return;
  }

  if ( timers[ 0 ].hasStarted ) {
    if ( !_skipsOn ) {
      // skips are not set to be on by the user
      return;
    }

    if ( blocked ) {
      return;
    }

    if ( skips <= 0 ) {
      return;
    }

    // skip to the next map, if user has a skip left
    currentLevel = pickLevel();
    installAndMaybePlay( currentLevel, true );
    handleSkipsCount( -1 );

    // block the skip button for a bit, to make sure the player isn't skipping
    // while they can't actually load a new map in-game, as this is not possible
    // in loading screens, for example
    block();
    return;
  }

  timerAction( "start" );

  // see above
  block();

  currentLevel = pickLevel();
  installAndMaybePlay( currentLevel, true );

  // initiate the observer for split.txt; TODO: maybe debounce the callback in
  // case fs.watch() fires multiple times, which seems to happen occassionally,
  // though the code takes this into account already
  watcher = fs.watch( splitFile, ( event ) => {
    if ( timers[ 0 ].finished ) {
      watcher.close();
      return;
    }

    if ( event === "change" ) {
      const readable = fs.createReadStream( splitFile );
      readable.setEncoding( "utf8" );
      readable.on( "data", ( string ) => {
        const split = string.split( "\n" )[ 1 ].split( /\s/ );
        const [ filename, finesse, completion ] = split;

        if ( isNaN( parseInt( filename[ filename.length - 1 ], 10 ) ) ) {
          // there is no number at the end of the filename, i.e. no atlas ID
          // (which should mean a stock level), which we should not see in the
          // filtered levels JSON data
          return;
        }

        const id = filename.substring( filename.lastIndexOf( "-" ) + 1 );
        if ( id !== currentLevel.id ) {
          return;
        }

        const ss = ( completion === "100" ) && ( finesse === "0" );
        if ( ss ) {
          if ( completedLevelIds.has( id ) ) {
            // remove a skip if this map was already any%'d
            handleSkipsCount( -1 );
          }
          else {
            completedLevelIds.add( id );
          }

          solvedLevelIds.add( id );

          increment();

          currentLevel = pickLevel();
          installAndMaybePlay( currentLevel, true );
          // see above
          block();

          if ( config.freeSkipAfterXSolvedLevels > 0 ) {
            if ( solvedLevelIds.size > 0 && ( solvedLevelIds.size % config.freeSkipAfterXSolvedLevels ) === 0 ) {
              // give a free skip after N solved levels, depending on the
              // configuration
              handleSkipsCount( 1 );
            }
          }

          // trigger the S-icon animation
          const el = document.getElementById( "points-icon" );
          addClass( el, "animated2" );
          setTimeout(() => {
            removeClass( el, "animated2" );
          }, 2000 );

          return;
        }

        if ( !completedLevelIds.has( id ) ) {
          completedLevelIds.add( id );

          if ( !ss ) {
            // add a skip as this level was any%'d and not already completed
            handleSkipsCount( 1 );
            return;
          }
        }
      } );
    }
  } );
};

export const initialize = () => {
  document.getElementById( "start-btn" ).addEventListener( "click", startAndSkip );
  document.getElementById( "skip-btn" ).addEventListener( "click", startAndSkip );

  // handle the timer's finish event emitter
  timers[ 0 ].on( "finished", () => {
    // close the watcher when the timer has finished
    watcher.close();
  } );

  document.getElementById( "replay-btn" ).addEventListener( "click", () => {
    if ( timers[ 0 ].hasStarted ) {
      installAndMaybePlay( currentLevel, true );
    }
  } );

  document.getElementById( "reset-btn" ).addEventListener( "click", () => {
    initialized = false;
    choiceIndex = 0;

    if ( watcher ) {
      watcher.close();
    }

    reset();
    ( { skips, completedLevelIds, solvedLevelIds, chosenLevelCache } = runData );
  } );
};
