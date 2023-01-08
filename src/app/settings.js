// use nw.require() instead of require() or import to make it actually available
// in the browser context
const fs = nw.require( "fs" ); // eslint-disable-line no-undef

import { formatMSToHumanReadable } from "./util/format.js";

import { settingsPath } from "./initialize.js";

// read instead of import, to make sure the data is updated when we change
// pages, something which does not seem to happen when importing
const settings = JSON.parse( fs.readFileSync( settingsPath ) );

const {
  seed,
  startTime,
  minSSCount,
  fastestSSTime,
  skips,
  freeSkips,
  freeSkipAfterXSolvedLevels,
  CMPLevels,
} = settings;

const seedEl = document.getElementById( "seed-input" );
const timeEl = document.getElementById( "time-input" );
const minSSCountEl = document.getElementById( "minSSCount-input" );
const fastestSSTimeEl = document.getElementById( "fastestSSTime-input" );

const skipsEl = document.getElementById( "skips-input" );
const freeSkipsEl = document.getElementById( "freeSkips-input" );
const freeSkipsAfterXEl = document.getElementById( "freeSkipsAfterX-input" );

const CMPLevelsEl = document.getElementById( "CMPLevels-input" );

// set initial values
seedEl.value = seed;
timeEl.value = ( startTime / 1000 / 60 );
minSSCountEl.value = minSSCount;
fastestSSTimeEl.value = fastestSSTime;

skipsEl.checked = skips;
freeSkipsEl.value = freeSkips;
freeSkipsAfterXEl.value = freeSkipAfterXSolvedLevels;
// possibly hide the skip options, depending on whether the user wants them on
// or not
const freeSkipsContainer = document.getElementById( "skips-settings-container" );
if ( !skips ) {
  freeSkipsContainer.style.display = "none";
}

CMPLevelsEl.checked = CMPLevels;

const data = {
  ...settings,
};
let initialState = {
  ...data,
};

const addCheckboxListener = ( element, field = "", callback ) => {
  element.addEventListener( "input", ( event ) => {
    const { checked } = event.target;
    data[ field ] = checked;

    if ( callback ) {
      // do any optional non-explicit extra thing
      callback( event );
    }
  } );
}

const addInputListener = ( element, field = "", transform, hasMin = false, hasMax = false, callback ) => {
  element.addEventListener( "input", ( event ) => {
    const isNum = event.target.attributes[ 0 ].nodeValue === "number";

    let value = isNum ? parseInt( event.target.value, 10 ) : event.target.value;
    if ( hasMin ) {
      const { min } = event.target;
      if ( value < min ) {
        event.target.value = parseInt( min, 10 );
      }
    }
    if ( hasMax ) {
      const { max } = event.target;
      if ( value > max ) {
        event.target.value = parseInt( max, 10 );
      }
    }

    if ( transform ) {
      data[ field ] = transform( event.target.value );
    }
    else {
      data[ field ] = isNum ? parseInt( event.target.value ) : event.target.value;
    }

    if ( callback ) {
      // do any optional non-explicit extra thing
      callback( event );
    }
  } );
}

const addFocusOutListener = ( element, field = "", transform, callback ) => {
  element.addEventListener( "focusout", ( event ) => {
    const isNum = event.target.attributes[ 0 ].nodeValue === "number";

    if ( !event.target.value ) {
      // reset the form and data values to the original
      if ( transform ) {
        event.target.value = transform( initialState[ field ] );
        data[ field ] = isNum ? parseInt( initialState[ field ] ) : initialState[ field ];
      }
      else {
        event.target.value = initialState[ field ];
        data[ field ] = isNum ? parseInt( initialState[ field ] ) : initialState[ field ];
      }
    }

    if ( callback ) {
      // do any optional non-explicit extra thing
      callback( event );
    }
  } );
}

addInputListener( seedEl, "seed", ( value ) => value.toLowerCase() );

addInputListener( timeEl, "startTime", ( value ) => value * 60 * 1000, true, true );
addFocusOutListener( timeEl, "startTime", ( value ) => ( value / 1000 ) / 60 );

addInputListener( minSSCountEl, "minSSCount", null, false, true );
addFocusOutListener( minSSCountEl, "minSSCount" );

const formattedFastestTimeEl = document.getElementById( "fastestSSTime-formatted" );
addInputListener( fastestSSTimeEl, "fastestSSTime", null, false, true, function( event ) {
  const milliseconds = Math.floor( event.target.value );
  formattedFastestTimeEl.innerText = formatMSToHumanReadable( milliseconds, true );
} );
addFocusOutListener( fastestSSTimeEl, "fastestSSTime" );

addCheckboxListener( skipsEl, "skips", ( event ) => {
  if ( !event.target.checked ) {
    freeSkipsContainer.style.display = "none";
  }
  else {
    freeSkipsContainer.style.display = "block";
  }
} );
addInputListener( freeSkipsEl, "freeSkips", null, false, true );
addFocusOutListener( freeSkipsEl, "freeSkips" );

addInputListener( freeSkipsAfterXEl, "freeSkipAfterXSolvedLevels", null, false, true );
addFocusOutListener( freeSkipsAfterXEl, "freeSkipAfterXSolvedLevels" );

addCheckboxListener( CMPLevelsEl, "CMPLevels" );

let messageDisplayTimeout;
document.getElementById( "save-button" ).addEventListener( "click", () => {
  fs.writeFileSync( settingsPath, JSON.stringify( data, null, 2 ) ); // eslint-disable-line no-undef
  initialState = {
    ...data,
  };

  if ( messageDisplayTimeout ) {
    clearTimeout( messageDisplayTimeout );
  }
  // show the message that indicates the user saved the settings
  document.getElementById( "saved-message" ).style.display = "initial";
  messageDisplayTimeout = setTimeout( () => {
    document.getElementById( "saved-message" ).style.display = "none";
  }, 2000 );
} );
