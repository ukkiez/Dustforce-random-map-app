import { reset } from "../reset.js";

import { Timer } from "../classes/timer.js";
import { getData, writeHexData } from "../util/data.js";
import { addClass, removeClass } from "../util/dom.js";
import { formatTime } from "../util/format.js";
import { seededRandom } from "../util/random.js";

import cmpLevels from "../../dustkid-data/cmp-levels.json";

// use nw.require() instead of require() or import to make it actually available
const fs = nw.require( "fs" );
const path = nw.require( "path" );
const { exec } = nw.require( "child_process" );

const { levelData, userConfiguration } = getData( {
  levelData: true,
  userConfiguration: true,
} );

const { dustforceDirectory } = userConfiguration;

const splitFile = path.join( dustforceDirectory, "split.txt" );

let settings = {};

const authorsById = new Map();

let timers = [];
const timerAction = ( action, bool = false ) => {
  for ( const timer of timers ) {
    if ( bool ) {
      timer[ action ]( bool );
    }
    else {
      timer[ action ]();
    }
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
    openCommand = 'start ""';
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
// const block = ( ms = 1500 ) => {
const block = ( ms = 10 ) => {
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

const initChallengeRunBody = () => {
  const template = document.getElementById( "challenge-run-template" );
  const clone = template.content.cloneNode( true );
  document.body.replaceChildren( clone );

  addClass( document.body, "challenge" );

  if ( !settings.skips ) {
    addClass( document.getElementById( "skips" ), "none" );
    addClass( document.getElementById( "skip-btn" ), "disabled-btn" )
  }
}

// keep track of skips, which levels have been completed (SS or any%), and which
// have been solved (SS'd only), and which levels have been picked already
let runData = {
  skips: null,
  completedLevelIds: new Set(),
  solvedLevelIds: new Set(),
  chosenLevelCache: new Set(),

  // used to display a review at the end of a run
  review: [],
  seed: null,
};

let mapPool = [];
let choiceIndex = 0;
const pickLevel = () => {
  // the map pool was already shuffled at the start of the run, so simply pick
  // maps start to end
  const choice = mapPool[ choiceIndex ];

  if ( !choice ) {
    // no maps remain, end the run
    runData._ranOutOfMaps = true;
    timerAction( "finish" );
    return false;
  }

  choiceIndex++;

  runData.chosenLevelCache.add( choice );

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

let currentLevel = {
  name: "",
  id: -1,
};

const handleSkipsCount = ( change ) => {
  if ( !settings.skips ) {
    // skips are not set to be on by the user
    return;
  }

  if ( settings.infiniteSkips ) {
    // the user has infinite skips, so nothing needs to be done
    return;
  }

  const skipsElement = document.getElementById( "skips" );
  const skipButtonElement = document.getElementById( "skip-btn" );

  if ( change > 0 ) {
    // increment the skips count
    runData.skips += change;
    if ( runData.skips > 0 ) {
      removeClass( skipsElement, "none" );
      removeClass( skipButtonElement, "disabled-btn" )
    }
  }
  else if ( change < 0 ) {
    // decrement the skips count (but not below 0)
    if ( runData.skips > 0 ) {
      runData.skips = Math.max( 0, runData.skips + change );

      if ( runData.skips <= 0 ) {
        addClass( skipsElement, "none" );
        addClass( skipButtonElement, "disabled-btn" )
      }
    }
  }

  skipsElement.innerText = `Skips remaining: ${ runData.skips }`;
}

let initialized = false;
let watcher;
const start = () => {
  if ( !initialized ) {
    // populate the map pool
    for ( const [ levelFilename, metadata ] of Object.entries( levelData ) ) {
      if ( !settings.CMPLevels ) {
        if ( cmpLevels.includes( levelFilename ) ) {
          // don't include cmp levels, as the user set them to be off
          continue;
        }
      }

      const { ss_count, fastest_time, author, atlas_id } = metadata;
      if ( ss_count >= settings.minSSCount && ss_count <= settings.maxSSCount && fastest_time <= settings.fastestSSTime ) {
        mapPool.push( levelFilename );
      }

      authorsById.set( atlas_id, author );
    }

    let _seed = settings.seed;
    if ( !_seed ) {
      // generate a random 5-digit seed if the user didn't provide a seed
      _seed = `${ Math.floor( Math.random() * 90000 ) + 10000 }`;
    }

    runData.seed = _seed;

    // initialize the seeder
    const { shuffle } = seededRandom( { seed: _seed } );

    // shuffle the map pool, by the given seed, which consequently means that
    // when we pick a level below, we'll simply do it in order, start to end
    shuffle( mapPool );

    // ensure split.txt exists, otherwise create an empty one
    if ( !fs.existsSync( splitFile ) ) {
      fs.writeFileSync( splitFile, "" );
    }

    timerAction( "start" );

    // see above
    block();

    currentLevel = pickLevel();
    if ( !currentLevel ) {
      return;
    }

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

          split.pop();
          const completion = split[ split.length - 1 ];
          const finesse = split[ split.length - 2 ];
          const filename = split[ split.length - 3 ];

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
            if ( runData.completedLevelIds.has( id ) ) {
              // remove a skip if this map was already any%'d, as that would've
              // incremented the skip counter
              handleSkipsCount( -1 );
            }
            else {
              runData.completedLevelIds.add( id );
            }

            runData.solvedLevelIds.add( id );

            runData.review.push( {
              levelname: currentLevel.name,
              filename: `${ currentLevel.name }-${ currentLevel.id }`,
              time: timers[ 0 ].elapsedTime,
              segment: timers[ 1 ].time,
              skipped: false,
            } );

            increment();

            currentLevel = pickLevel();
            if ( !currentLevel ) {
              return;
            }

            installAndMaybePlay( currentLevel, true );
            // see above
            block();

            if ( settings.freeSkipAfterXSolvedLevels > 0 ) {
              if ( runData.solvedLevelIds.size > 0 && ( runData.solvedLevelIds.size % settings.freeSkipAfterXSolvedLevels ) === 0 ) {
                // give a free skip after N solved levels, depending on the
                // configuration
                handleSkipsCount( 1 );
              }
            }

            // restart the map timer that's keeping track of how long the player
            // is taking for the current map
            if ( timers[ 1 ] ) {
              timers[ 1 ].reset( true );
            }

            // trigger the S-icon animation
            const el = document.getElementById( "points-icon" );
            addClass( el, "animated2" );
            setTimeout(() => {
              removeClass( el, "animated2" );
            }, 2000 );

            return;
          }

          if ( !runData.completedLevelIds.has( id ) ) {
            runData.completedLevelIds.add( id );

            if ( !ss ) {
              // add a skip as this level was any%'d and not already completed
              handleSkipsCount( 1 );
              return;
            }
          }
        } );
      }
    } );
  }
}

const skip = () => {
  if ( timers[ 0 ].finished ) {
    return;
  }

  if ( timers[ 0 ].hasStarted ) {
    if ( !settings.skips ) {
      // skips are not set to be on by the user
      return;
    }

    if ( blocked ) {
      return;
    }

    if ( !settings.infiniteSkips && ( runData.skips <= 0 ) ) {
      return;
    }

    runData.review.push( {
      levelname: currentLevel.name,
      filename: `${ currentLevel.name }-${ currentLevel.id }`,
      time: timers[ 0 ].elapsedTime,
      segment: timers[ 1 ].time,
      skipped: true,
    } );

    // skip to the next map, if user has a skip left
    currentLevel = pickLevel();
    if ( !currentLevel ) {
      return;
    }
    installAndMaybePlay( currentLevel, true );
    handleSkipsCount( -1 );

    // block the skip button for a bit, to make sure the player isn't skipping
    // while they can't actually load a new map in-game, as this is not possible
    // in loading screens, for example
    block();

    // restart the map timer that's keeping track of how long the player is
    // taking for the current map
    if ( timers[ 1 ] ) {
      timers[ 1 ].reset( true );
    }
    return;
  }
};

const initVars = () => {
  ( { settings } = getData( { settings: true } ) );

  currentLevel = {
    name: "",
    id: -1,
  };

  runData = {
    skips: settings.freeSkips,
    completedLevelIds: new Set(),
    solvedLevelIds: new Set(),
    chosenLevelCache: new Set(),

    review: [],
    seed: null,
  };

  mapPool = [];
  choiceIndex = 0;
}

const initRunData = () => {
  // set the proper skips starting count
  const element = document.getElementById( "skips" );
  if ( !settings.skips || ( settings.freeSkips <= 0 && !settings.infiniteSkips ) ) {
    addClass( element, "none" );
  }

  if ( !settings.skips ) {
    element.innerText = "No Skips";
  }
  else if ( settings.infiniteSkips ) {
    element.innerText = "Infinite Skips";
  }
  else {
    element.innerText = `Skips Remaining: ${ settings.freeSkips }`;
  }
};

const initTimers = () => {
  const startTime = settings.startTime;

  const mainTimer = new Timer( {
    timerElementId: "main-time",
    tenths: true,
    hundreths: true,
    startTime,
  } );

  timers = [ mainTimer ];

  const mapTimer = new Timer( {
    timerElementId: "map-timer",
    tenths: true,
    hundreths: true,
    // time is forwards for this timer
    _countdown: false,
  } );

  timers.push( mapTimer );
  mapTimer.timerElement.innerHTML = formatTime( 0 );

  mainTimer.timerElement.innerHTML = formatTime( startTime );
}

const processScoreScreen = () => {
  // add the last level for the review, and consider it as "skipped"
  runData.review.push( {
    levelname: currentLevel.name,
    filename: `${ currentLevel.name }-${ currentLevel.id }`,
    time: timers[ 0 ].elapsedTime,
    segment: timers[ 1 ].time,
    skipped: true,
  } );

  removeClass( document.body, "challenge" );

  const template = document.getElementById( "score-screen-template" );
  const clone = template.content.cloneNode( true );
  document.body.replaceChildren( clone );

  document.getElementById( "done-btn" ).addEventListener( "click", () => {
    // exit the score screen and return to the main menu
    reset();
  } );

  const modeEl = document.getElementById( "score-screen-mode" );
  modeEl.innerText = `${ settings.settingsName } Mode`;

  const scoreEl = document.getElementById( "score-screen-points" );
  scoreEl.innerText = runData.solvedLevelIds.size;

  if ( runData.solvedLevelIds.size >= 100 ) {
    // adjust the font size to everything fit on one line
    scoreEl.style.fontSize = "11vw";
  }

  const scoreScreenSkipsEl = document.getElementById( "score-screen-remaining-skips" );
  if ( !settings.infiniteSkips ) {
    scoreScreenSkipsEl.innerText = `Skips Remaining: ${ runData.skips }`;
  }
  else {
    scoreScreenSkipsEl.innerText = `Infinite Skips`;
  }

  const seedEl = document.getElementById( "score-screen-seed" );
  if ( settings.seed ) {
    seedEl.innerText = `Seed: ${ runData.seed }`;
  }
  else {
    seedEl.innerText = `Random Seed: ${ runData.seed }`;
  }

  const { personalBests } = getData( { personalBests: true } );

  let previousBest;
  let _newPersonalBest = false;
  // PBs for seeded runs and custom settings are not tracked and stored
  if ( !settings.seed && settings.settingsName.toLowerCase() !== "custom" ) {
    if ( personalBests[ settings.settingsName ]?.score ) {
      previousBest = personalBests[ settings.settingsName ];
    }

    if ( runData.solvedLevelIds.size && ( !previousBest || runData.solvedLevelIds.size > previousBest.score ) ) {
      _newPersonalBest = true;
    }
  }

  if ( _newPersonalBest ) {
    addClass( scoreEl, "pb" );
    addClass( document.getElementById( "new-pb-icon" ), "pb" );
  }

  const comparePbToggleEl = document.getElementById( "compare-pb-toggle" );
  if ( previousBest ) {
    comparePbToggleEl.onclick = () => {
      const elements = document.getElementsByClassName( "review-element-time" );
      for ( const e of elements ) {
        if ( e.classList.contains( "hidden" ) ) {
          removeClass( e, "hidden" );
        }
        else {
          addClass( e, "hidden" );
        }
      }

      if ( comparePbToggleEl.innerText.includes( "segments" ) ) {
        comparePbToggleEl.innerText = "splits";
      }
      else {
        comparePbToggleEl.innerText = "segments";
      }
    }
  }
  else {
    addClass( comparePbToggleEl, "hidden" );
  }

  const runreviewContainerEl = document.getElementById( "run-review-container" );

  // process the run data to create a run review in the UI
  let previousCheckedDiff;
  let scoredLevelIndex = 0;
  for ( let i = 0; i < runData.review.length; i++ ) {
    const { levelname, filename, time, segment, skipped } = runData.review[ i ];
    /* HTML layout:
      <!-- <div class="review-element-container">
        <span class="review-element-index"></span>
        <span class="review-element-levelname clickable"></span>
        <span class="review-element-time review-element-current-time"></span>
        <span class="review-element-time review-element-time-diff"></span>
      </div> -->
    */
    const containerEl = document.createElement( "div" );
    addClass( containerEl, "review-element-container" );

    const levelEl = document.createElement( "span" );
    levelEl.innerText = levelname;
    addClass( levelEl, "review-element-levelname" );
    addClass( levelEl, "clickable" );
    const levelId = filename.split( "-" ).pop();
    // allow users to go to the Atlas page by clicking on the map name
    levelEl.onclick = () => {
      nw.Shell.openExternal( `https://atlas.dustforce.com/${ levelId }` );
    };

    const indexEl = document.createElement( "span" );
    addClass( indexEl, "review-element-index" );

    if ( skipped ) {
      addClass( levelEl, "skipped" );
      indexEl.innerText = "-";
    }
    else {
      scoredLevelIndex++;
      indexEl.innerText = `${ scoredLevelIndex }`;
    }

    const timeEl = document.createElement( "span" );
    addClass( timeEl, "review-element-time" );
    addClass( timeEl, "review-element-current-time" );
    timeEl.innerText = `${ formatTime( segment, true ) }`;

    runreviewContainerEl.appendChild( containerEl );

    containerEl.appendChild( indexEl );
    containerEl.appendChild( levelEl );
    containerEl.appendChild( timeEl );

    if ( previousBest ) {
      console.log( previousBest.review?.[ i ] );
      const previousRunElement = previousBest.review?.[ i ];

      // add a hidden (display: none;) span that the user can view via a
      // toggle, which hides timeEl
      const timeDiffEl = document.createElement( "span" );
      addClass( timeDiffEl, "review-element-time" );
      addClass( timeDiffEl, "review-element-time-diff" );
      addClass( timeDiffEl, "hidden" );
      if ( previousRunElement ) {
        const timeDiff = previousRunElement.time - time;
        timeDiffEl.innerText = formatTime( timeDiff, true, false, true );

        // colour-code the split to indicate time gain/loss
        if ( !previousCheckedDiff ) {
          timeDiff >= 0 ? addClass( timeDiffEl, "time-ahead-gained" ) : addClass( timeDiffEl, "time-behind-lost" )
        }
        else if ( timeDiff >= 0 ) {
          previousCheckedDiff < timeDiff ? addClass( timeDiffEl, "time-ahead-gained" ) : addClass( timeDiffEl, "time-ahead-lost" );
        }
        else {
          previousCheckedDiff < timeDiff ? addClass( timeDiffEl, "time-behind-gained" ) : addClass( timeDiffEl, "time-behind-lost" );
        }

        previousCheckedDiff = timeDiff;
      }
      else {
        timeDiffEl.innerText = formatTime( time, true );
      }

      containerEl.appendChild( timeDiffEl );
    }
  }

  // const reviewDropdownBtn = document.getElementById( "review-dropdown-btn" );
  const reviewDropdownBtn = document.getElementById( "review-btn" );
  reviewDropdownBtn.onclick = () => {
    const container = document.getElementById( "run-review-container" );
    if ( !container.classList.contains( "toggled" ) ) {
      addClass( document.getElementById( "score-screen-container" ), "toggled" );
      addClass( container, "toggled" );
      addClass( reviewDropdownBtn, "toggled" );
      addClass( document.getElementById( "run-review-header" ), "toggled" );
      addClass( document.getElementById( "compare-pb-toggle" ), "toggled" );
      addClass( document.getElementById( "score-screen-stats-container" ), "toggled" );
    }
    else {
      removeClass( document.getElementById( "score-screen-container" ), "toggled" );
      removeClass( container, "toggled" );
      removeClass( reviewDropdownBtn, "toggled" );
      removeClass( document.getElementById( "run-review-header" ), "toggled" );
      removeClass( document.getElementById( "compare-pb-toggle" ), "toggled" );
      removeClass( document.getElementById( "score-screen-stats-container" ), "toggled" );
    }
  };

  // calculate and display some statistics
  const averageTimeEl = document.getElementById( "score-screen-average-time" );
  const skippedLevelTimeEl = document.getElementById( "score-screen-skipped-time-loss" );
  let scoredSegments = [];
  let skippedSegments = [];
  for ( const { segment, skipped } of runData.review ) {
    if ( skipped ) {
      skippedSegments.push( segment );
    }
    else {
      scoredSegments.push( segment );
    }
  }

  if ( scoredSegments.length ) {
    averageTimeEl.innerText = `Avg. Score Time: ${ formatTime( timers[ 0 ].elapsedTime / scoredSegments.length, true ) }`;
  }

  if ( settings.skips ) {
    addClass( skippedLevelTimeEl, "applicable" );
    if ( skippedSegments.length ) {
      skippedLevelTimeEl.innerText = `Skip Time Loss: ${ formatTime( skippedSegments.reduce( ( a, b ) => a + b, 0 ), true ) }`;
    }
    else {
      skippedLevelTimeEl.innerText = "Skip Time Loss: None";
    }
  }

  // save the new personal best data immediately
  if ( _newPersonalBest ) {
    const userReviewData = runData.review.map( ( { filename, time, segment, skipped } ) => {
      return { filename, time, segment, skipped };
    } );

    const newPersonalBestData = { ...personalBests };
    newPersonalBestData[ settings.settingsName ] = {
      score: runData.solvedLevelIds.size,
      review: [ ...userReviewData ],
      seed: runData.seed,
    };
    writeHexData( `${ global.__dirname }/user-data/personal-bests.bin`, newPersonalBestData );
  }
}

export const initialize = () => {
  initialized = false;

  initVars();
  initChallengeRunBody();
  initTimers();
  initRunData();

  document.getElementById( "skip-btn" ).addEventListener( "click", skip );

  // handle the timer's finish event emitter
  timers[ 0 ].on( "finished", () => {
    if ( watcher ) {
      // close the watcher when the timer has finished
      watcher.close();
    }

    timers[ 1 ].finish( true );

    processScoreScreen();
  } );

  document.getElementById( "replay-btn" )?.addEventListener( "click", () => {
    if ( timers[ 0 ].hasStarted ) {
      installAndMaybePlay( currentLevel, true );
    }
  } );

  document.getElementById( "reset-btn" )?.addEventListener( "click", () => {
    if ( watcher ) {
      watcher.close();
    }

    timerAction( "finish", true );

    processScoreScreen();
    // reset();
  } );

  // start the actual run
  start();
  initialized = true;
};
