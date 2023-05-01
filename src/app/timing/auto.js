import { settingsPath, timers, runData } from "../initialize.js";

import { reset } from "../reset.js";

import { addClass, removeClass } from "../util/dom.js";
import { seededRandom } from "../util/random.js";

import { listeners } from "../hotkeys.js";

import cmpLevels from "../../dustkid-data/cmp-levels.json";

// use nw.require() instead of require() or import to make it actually available
const fs = nw.require( "fs" );
const path = nw.require( "path" );
const open = nw.require( "open" );

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

const installAndMaybePlay = ( level, play = false ) => {
  if ( play ) {
    open( `${ installPlayPrefix }/${ level.id }/${ level.name }` );
  }
  else {
    open( `${ installPrefix }/${ level.id }/${ level.name }` );
  }
}

let blocked = false;
let timeout = null;
const block = ( ms = 3000 ) => {
  if ( timeout ) {
    // clear any previously active timeouts, that will unblock even though they
    // shouldn't
    clearTimeout( timeout );
  }

  blocked = true;
  timeout = setTimeout(() => {
    blocked = false;
    timeout = null;
  }, ms );
}

const adjustOnScreenMapInfo = ( name, author ) => {
  const nameEl = document.getElementById( "map-info-name" );
  const authorEl = document.getElementById( "map-info-author" );
  nameEl.innerText = name;
  authorEl.innerText = author;
}

// keep track of skips, which levels have been completed (SS or any%), and which
// have been solved (SS'd only), and which levels have been picked already
let { skips, completedLevelIds, solvedLevelIds, chosenLevelCache } = runData;

let mapPool = [];
let choiceIndex = 0;
const pickLevel = () => {
  let choice;
  if ( seed ) {
    // the map pool was already shuffled at the start of the run (see: function
    // tied to the start hotkey below), so simply pick maps start to end
    choice = mapPool[ choiceIndex ];
    choiceIndex++;
  }
  else {
    // no seed was given for this run, so just pick maps at random
    choice = mapPool[ Math.floor( Math.random() * mapPool.length ) ];
    while ( chosenLevelCache.has( choice ) ) {
      choice = mapPool[ Math.floor( Math.random() * mapPool.length ) ];
    }
  }

  chosenLevelCache.add( choice );

  const index = choice.lastIndexOf( "-" );

  const name = choice.substring( 0, index );
  const id = choice.substring( index + 1 );

  const author = authorsById.get( parseInt( id, 10 ) );
  adjustOnScreenMapInfo( name, author );

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
    }
  }
  else if ( change < 0 ) {
    // decrement the skips count (but not below 0)
    if ( skips > 0 ) {
      skips = Math.max( 0, skips + change );

      if ( skips <= 0 ) {
        addClass( element, "none" );
      }
    }
  }

  element.innerText = `Skips remaining: ${ skips }`;
}

let initialized = false;
let watcher;
// listeners.start( function() {
listeners.start.on( "active", function() {
  if ( !initialized ) {
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

      // don't allow going to the settings page, as it would load a different
      // page, and therefore stop the current run permanently
      document.getElementById( "settings-icon-container" ).style.display = "none";
      // hide the seed, as there is no place on the screen for it at the moment
      document.getElementById( "seed" ).style.display = "none";
    }
    initialized = true;

    if ( seed ) {
      // initialize the seeder
      const { shuffle } = seededRandom( { seed } );

      // shuffle the map pool, by the given seed, which consequently means that
      // when we pick a level below, we'll simply do it in order, start to end
      shuffle( mapPool );
    }

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
} );

// handle the timer's finish event emitter
timers[ 0 ].on( "finished", () => {
  console.log( "finished" );
  // close the watcher when the timer has finished
  watcher.close();
} );

// // let the player replay the level at any given time, they may for example have
// // exited the map, or even exited character select
// hotkeys._replay.on( "active", function() {
//   if ( timers[ 0 ].hasStarted ) {
//     installAndMaybePlay( currentLevel, true );
//   }
// } );

// listeners.replay( function() {
listeners.replay.on( "active", function() {
  if ( timers[ 0 ].hasStarted ) {
    installAndMaybePlay( currentLevel, true );
  }
} );

// listeners.reset( function() {
listeners.reset.on( "active", function() {
  initialized = false;
  choiceIndex = 0;

  if ( watcher ) {
    watcher.close();
  }

  reset();
  ( { skips, completedLevelIds, solvedLevelIds, chosenLevelCache } = runData );
} );

// // register some manual ways to increment/decrement the SS counter, just in case
// hotkeys._increment.on( "active", function() {
//   increment();
// } );
// hotkeys._decrement.on( "active", function() {
//   increment( true );
// } );
