// use nw.require() instead of require() or import to make it actually available
// in the browser context
const fs = nw.require( "fs" );

import { formatMSToHumanReadable } from "./util/format.js";

import { settingsPath } from "./initialize.js";

// read instead of import, to make sure the data is updated when we change
// pages, something which does not seem to happen when importing
const settings = JSON.parse( fs.readFileSync( settingsPath ) );

const seedEl = document.getElementById( "seed-input" );
const timeEl = document.getElementById( "time-input" );
const minSSCountEl = document.getElementById( "minSSCount-input" );
const fastestSSTimeEl = document.getElementById( "fastestSSTime-input" );
const CMPLevelsEl = document.getElementById( "CMPLevels-input" );

const skipsEl = document.getElementById( "skips-input" );
const freeSkipsEl = document.getElementById( "freeSkips-input" );
const freeSkipsAfterXEl = document.getElementById( "freeSkipsAfterX-input" );

const freeSkipsContainer = document.getElementById( "skips-settings-container" );

let data = {};
const setInputValues = ( _settings ) => {
  const {
    seed,
    startTime,
    minSSCount,
    fastestSSTime,
    skips,
    freeSkips,
    freeSkipAfterXSolvedLevels,
    CMPLevels,
  } = _settings;

  // set initial values
  seedEl.value = seed;
  timeEl.value = ( startTime / 1000 / 60 );
  minSSCountEl.value = minSSCount;
  fastestSSTimeEl.value = fastestSSTime;
  CMPLevelsEl.checked = CMPLevels;

  skipsEl.checked = skips;
  freeSkipsEl.value = freeSkips;
  freeSkipsAfterXEl.value = freeSkipAfterXSolvedLevels;

  // possibly hide all skip options, depending on whether the user enabled skips
  // or not
  if ( !skips ) {
    freeSkipsContainer.style.display = "none";
  }
  else {
    freeSkipsContainer.style.display = "initial";
  }

  data = {
    ..._settings,
  }
}

// initialize the input values
setInputValues( settings );

let initialState = {
  ...data,
};

const saveData = ( _data ) => {
  fs.writeFileSync( settingsPath, JSON.stringify( _data, null, 2 ) );
  initialState = {
    ..._data,
  };
}

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

addCheckboxListener( CMPLevelsEl, "CMPLevels" );

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

let messageDisplayTimeout;
document.getElementById( "save-button" ).addEventListener( "click", () => {
  saveData( data );

  if ( messageDisplayTimeout ) {
    clearTimeout( messageDisplayTimeout );
  }
  // show the message that indicates the user saved the settings
  document.getElementById( "saved-message" ).style.display = "initial";
  messageDisplayTimeout = setTimeout( () => {
    document.getElementById( "saved-message" ).style.display = "none";
  }, 2000 );
} );

// handle importing
let importedMessageDisplayTimeout;
let failedImportedMessageDisplayTimeout;
const displayImportMessage = ( failed = false ) => {
  if ( failed ) {
    if ( failedImportedMessageDisplayTimeout ) {
      clearTimeout( failedImportedMessageDisplayTimeout );
    }
    // show the message that indicates the user failed to import settings
    document.getElementById( "failed-imported-message" ).style.display = "initial";
    failedImportedMessageDisplayTimeout = setTimeout( () => {
      document.getElementById( "failed-imported-message" ).style.display = "none";
    }, 2000 );
  }
  else {
    if ( importedMessageDisplayTimeout ) {
      clearTimeout( importedMessageDisplayTimeout );
    }
    // show the message that indicates the user successfully imported settings
    document.getElementById( "imported-message" ).style.display = "initial";
    importedMessageDisplayTimeout = setTimeout( () => {
      document.getElementById( "imported-message" ).style.display = "none";
    }, 2000 );
  }
}

const importSettingsInput = document.getElementById( "import-settings-input" );
importSettingsInput.addEventListener( "change", () => {
  const [ file ] = importSettingsInput.files;
  if ( !file ) {
    return;
  }

  if ( file.type !== "application/json" ) {
    displayImportMessage( true );
    return;
  }

  const reader = new FileReader();
  let importedSettings;
  reader.addEventListener( "load", () => {
    try {
      importedSettings = JSON.parse( reader.result );

      // verify the imported settings against the current file, to make sure all
      // fields (and only those) are there; technically the user can mess with
      // these since we don't compress the source code in the production build,
      // but it's the easiest for development purposes, and it's their own
      // responsibility if they do so

      const fields = Object.keys( settings );
      const importFields = Object.keys( importedSettings );
      if ( importFields.length !== fields.length ) {
        // the number of fields doesn't match in the first place, don't bother
        // with field checks
        displayImportMessage( true );
        return;
      }

      // create a set between both fields, and check if the eventual length is
      // the same as the current settings fields length, as duplicate fields
      // would be filtered out
      const set = new Set( importFields.concat( fields ) );
      if ( set.size !== fields.length ) {
        displayImportMessage( true );
        return;
      }
    }
    catch ( parsingError ) {
      displayImportMessage( true );
      return;
    }

    displayImportMessage();

    // finally, show the imported settings (but don't save, the user should do
    // that themselves)
    setInputValues( importedSettings );

    // reset the input
    importSettingsInput.value = "";
  } );
  reader.readAsBinaryString( file );
} );
