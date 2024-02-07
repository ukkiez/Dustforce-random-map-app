import { paths } from "./paths.js";

import { objectDiff } from "./util/index.js";
import { formatMSToHumanReadable } from "./util/format.js";
import { addClass, removeClass } from "./util/dom.js";

import { modes } from "../settings/modes.js";

import { filteredMetadata } from "../dustkid-data/filtered-metadata.js";
import { cmpLevels } from "../dustkid-data/cmp-levels.js";

// read instead of import, to make sure the data is updated when we change
// pages, something which does not seem to happen when importing
const settings = JSON.parse( await Neutralino.filesystem.readFile( paths.settings ) );

const settingsNameEl = document.getElementById( "settings-name" );
const settingsListEl = document.getElementById( "settings-list" );

const seedEl = document.getElementById( "seed-input" );
const timeEl = document.getElementById( "time-input" );
const minSSCountEl = document.getElementById( "minSSCount-input" );

const fastestSSTimeEl = document.getElementById( "fastestSSTime-input" );
const formattedFastestTimeEl = document.getElementById( "fastestSSTime-formatted" );

const CMPLevelsEl = document.getElementById( "CMPLevels-input" );

const skipsEl = document.getElementById( "skips-input" );
const freeSkipsEl = document.getElementById( "freeSkips-input" );
const freeSkipsAfterXEl = document.getElementById( "freeSkipsAfterX-input" );

const freeSkipsContainer = document.getElementById( "skips-settings-container" );

let data = {
  ...settings,
};
let initialState = {
  ...settings,
};

const getMapPoolSize = () => {
  const mapPool = new Set();
  for ( const [ levelFilename, metadata ] of Object.entries( filteredMetadata ) ) {
    if ( !data.CMPLevels ) {
      if ( cmpLevels.includes( levelFilename ) ) {
        // don't include cmp levels, as the user set them to be off
        continue;
      }
    }

    const { ss_count, fastest_time } = metadata;
    if ( ss_count >= data.minSSCount && fastest_time <= data.fastestSSTime ) {
      mapPool.add( levelFilename );
    }
  }

  return mapPool.size;
}
const setMapPoolSize = () => {
  const mapPoolEl = document.getElementById( "map-pool-size" );
  const mapPoolNumberEl = document.getElementById( "map-pool-size-number" );
  const poolSize = getMapPoolSize();
  mapPoolNumberEl.innerText = poolSize.toLocaleString( "en-US" );

  if ( poolSize <= 0 ) {
    addClass( mapPoolEl, "error" );
    // make sure the save button is disabled, since no maps are left in the pool
    // with the currently-selected settings
    addClass( document.getElementById( "save-button" ), "disabled" );
  }
  else {
    removeClass( mapPoolEl, "error" );
  }
}

const handleSettingsName = () => {
  // check whether the current settings are the same as for one of the
  // predefined modes
  for ( const [ key, mode ] of Object.entries( modes ) ) {
    if ( !objectDiff( mode, data ) ) {
      settingsNameEl.innerText = `${ key } Mode`;
      return;
    }
  }

  settingsNameEl.innerText = "Custom Mode";
};

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
  const milliseconds = Math.floor( fastestSSTime );
  formattedFastestTimeEl.innerText = formatMSToHumanReadable( milliseconds, true );

  CMPLevelsEl.checked = CMPLevels;

  skipsEl.checked = skips;
  freeSkipsEl.value = freeSkips;
  freeSkipsAfterXEl.value = freeSkipAfterXSolvedLevels;

  // possibly hide all skip options, depending on whether the user enabled skips
  // or not
  if ( !skips ) {
    freeSkipsContainer.classList.add( "disabled" );
  }
  else {
    freeSkipsContainer.classList.remove( "disabled" );
  }
}

// initialize the input values and map pool size
setInputValues( settings );
setMapPoolSize();
handleSettingsName();

const stateHasChanged = () => {
  return objectDiff( initialState, data );
};

const can = {
  save: false,
  discard: false,
};
const handleStateChange = ( force = false ) => {
  let diff = false;
  if ( !force ) {
    diff = stateHasChanged();
  }

  if ( diff || force ) {
    can.save = true;
    removeClass( document.getElementById( "save-button" ), "disabled" );

    can.discard = true;
    removeClass( document.getElementById( "discard-button" ), "hidden" );
  }
  else {
    can.save = false;
    addClass( document.getElementById( "save-button" ), "disabled" );

    can.discard = false;
    addClass( document.getElementById( "discard-button" ), "hidden" );
  }

  // check if the settings name should be changed (e.g. Classic Mode to Custom
  // Mode)
  handleSettingsName();

  // recalculate the map pool size
  setMapPoolSize();
};

const saveData = async ( _data ) => {
  await Neutralino.filesystem.writeFile( paths.settings, JSON.stringify( _data, null, 2 ) );
  // reset the initial state to the newly saved state
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

    handleStateChange();
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

    handleStateChange();
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

    handleStateChange();
  } );
}

// initialize listed modes in the settings list
for ( const mode of Object.keys( modes ) ) {
  const button = document.createElement( "button" );
  button.type = "button";
  button.innerText = mode;
  settingsListEl.appendChild( button );
}

for ( const button of settingsListEl.children ) {
  button.addEventListener( "click", () => {
    const value = button.innerText;
    const modeName = value.toLowerCase().replace( " ", "-" );
    if ( !modes[ modeName ] ) {
      event.preventDefault();
      return;
    }

    const mode = modes[ modeName ];
    for ( const [ key, setting ] of Object.entries( mode ) ) {
      data[ key ] = setting;
    }

    setInputValues( data );

    settingsListEl.classList.add( "hidden" );
    setTimeout( () => {
      settingsListEl.classList.remove( "hidden" );
    }, 100 );

    handleStateChange();
  } );
}

addInputListener( seedEl, "seed", ( value ) => value.toLowerCase() );

addInputListener( timeEl, "startTime", ( value ) => value * 60 * 1000, true, true );
addFocusOutListener( timeEl, "startTime", ( value ) => ( value / 1000 ) / 60 );

addInputListener( minSSCountEl, "minSSCount", null, false, true );
addFocusOutListener( minSSCountEl, "minSSCount" );

addInputListener( fastestSSTimeEl, "fastestSSTime", null, false, true, function( event ) {
  const milliseconds = Math.floor( event.target.value );
  formattedFastestTimeEl.innerText = formatMSToHumanReadable( milliseconds, true );
} );
addFocusOutListener( fastestSSTimeEl, "fastestSSTime" );

addCheckboxListener( CMPLevelsEl, "CMPLevels" );

addCheckboxListener( skipsEl, "skips", ( event ) => {
  if ( !event.target.checked ) {
    freeSkipsContainer.classList.add( "disabled" );
  }
  else {
    freeSkipsContainer.classList.remove( "disabled" );
  }
} );
addInputListener( freeSkipsEl, "freeSkips", null, false, true );
addFocusOutListener( freeSkipsEl, "freeSkips" );

addInputListener( freeSkipsAfterXEl, "freeSkipAfterXSolvedLevels", null, false, true );
addFocusOutListener( freeSkipsAfterXEl, "freeSkipAfterXSolvedLevels" );

let messageDisplayTimeout;
document.getElementById( "save-button" ).addEventListener( "click", async () => {
  await saveData( data );

  handleStateChange();

  if ( messageDisplayTimeout ) {
    clearTimeout( messageDisplayTimeout );
  }
  // show the message that indicates the user saved the settings
  document.getElementById( "saved-message" ).style.display = "initial";
  messageDisplayTimeout = setTimeout( () => {
    document.getElementById( "saved-message" ).style.display = "none";
  }, 2000 );
} );

document.getElementById( "discard-button" ).addEventListener( "click", () => {
  data = { ...initialState };
  setInputValues( { ...initialState } );
  handleStateChange();
} );

// seed copy-to-clipboard button logic
const seedCopyButton = document.getElementById( "seed-copy-btn" );
const seedCopyButtonFilled = document.getElementById( "seed-copy-btn-filled" );
let seedCopyButtonTimeout;
const copySeed = () => {
  const clipboard = nw.Clipboard.get();
  clipboard.set( seedEl.value || "" );

  addClass( seedCopyButton, "hidden" );
  removeClass( seedCopyButtonFilled, "hidden" );

  if ( seedCopyButtonTimeout ) {
    clearTimeout( seedCopyButtonTimeout );
  }
  seedCopyButtonTimeout = setTimeout( () => {
    addClass( seedCopyButtonFilled, "hidden" );
    removeClass( seedCopyButton, "hidden" );
  }, 1000 );
};
seedCopyButton.addEventListener( "click", copySeed );
seedCopyButtonFilled.addEventListener( "click", copySeed );

const clearSeedButton = document.getElementById( "clear-seed" );
clearSeedButton.addEventListener( "click", () => {
  seedEl.value = "";
  data.seed = "";
  handleStateChange();
} );

// handle importing
let importedMessageDisplayTimeout;
let failedImportedMessageDisplayTimeout;
const importSettingsInput = document.getElementById( "import-settings-input" );
const displayImportMessage = ( failed = false ) => {
  if ( failed ) {
    // reset the input
    importSettingsInput.value = "";

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
