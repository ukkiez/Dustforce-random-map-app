const fs = nw.require( "fs" );

const setupData = JSON.parse( fs.readFileSync( `${ global.__dirname }/user-data/configuration.json` ) );

const startHotkeyEl = document.getElementById( "start-hotkey-input" );
const replayHotkeyEl = document.getElementById( "replay-hotkey-input" );
const resetHotkeyEl = document.getElementById( "reset-hotkey-input" );

// set initial field values
startHotkeyEl.value = setupData.hotkeys.start;
replayHotkeyEl.value = setupData.hotkeys.replay;
resetHotkeyEl.value = setupData.hotkeys.reset;

const initialData = {
  ...setupData.hotkeys,
};

const hotkeyData = {
  ...setupData.hotkeys,
};
const fieldValues = {
  start: { element: startHotkeyEl, value: "" },
  replay: { element: replayHotkeyEl, value: "" },
  reset: { element: resetHotkeyEl, value: "" },
};

// reset field values on click
startHotkeyEl.addEventListener( "click" , ( event ) => {
  event.target.value = "";
  hotkeyData.start = "";
  fieldValues.start.value = "";
} );
replayHotkeyEl.addEventListener( "click" , ( event ) => {
  event.target.value = "";
  hotkeyData.replay = "";
  fieldValues.replay.value = "";
} );
resetHotkeyEl.addEventListener( "click" , ( event ) => {
  event.target.value = "";
  hotkeyData.reset = "";
  fieldValues.reset.value = "";
} );

const modifiers = [
  "ShiftLeft",
  "ShiftRight",
  "ControlLeft",
  "ControlRight",
  "AltLeft",
  "AltRight",
  "AltLeft",
  "OSLeft",
  "MetaLeft",
  "MetaRight",
  "OSLeft",
  "OSRight",
];

const addHotkeyListener = ( input, field ) => {
  input.addEventListener( "keydown" , ( event ) => {
    let key = event.code;

    if ( key === "Tab" ) {
      return;
    }

    event.preventDefault();
    let modifierKey = "";
    if ( event.shiftKey ) {
      modifierKey = "Shift";
    }
    else if ( event.ctrlKey ) {
      modifierKey = "Ctrl";
    }
    else if ( event.altKey ) {
      modifierKey = "Alt";
    }
    else if ( event.metaKey ) {
      modifierKey = "Meta";
    }

    if ( event.shiftKey || event.ctrlKey || event.altKey || event.metaKey ) {
      if ( key.startsWith( "Key" ) ) {
        key = key.slice( 3 );
      }

      if ( !modifiers.includes( key ) ) {
        if ( event.key === " " ) {
          event.target.value = `${ modifierKey }+SPACE`;
        }
        else {
          event.target.value = `${ modifierKey }+${event.key.toUpperCase()}`;
        }
      }
    }
    else {
      if ( event.key === " " ) {
        event.target.value = "SPACE";
      }
      else {
        event.target.value = event.key.toUpperCase();
      }
    }

    for ( const [ key, { value } ] of Object.entries( fieldValues ) ) {
      // check if this hotkey was already set in a different field, and clear it
      // there, if it is
      if ( value === event.target.value ) {
        fieldValues[ key ].element.value = "";
        fieldValues[ key ].value = "";
      }
    }

    fieldValues[ field ].value = event.target.value;
  } );
}

addHotkeyListener( startHotkeyEl, "start" );
addHotkeyListener( replayHotkeyEl, "replay" );
addHotkeyListener( resetHotkeyEl, "reset" );

startHotkeyEl.addEventListener( "focusout", () => {
  if ( !startHotkeyEl.value ) {
    startHotkeyEl.value = initialData.start;
  }
} );
replayHotkeyEl.addEventListener( "focusout", () => {
  if ( !replayHotkeyEl.value ) {
    replayHotkeyEl.value = initialData.replay;
  }
} );
resetHotkeyEl.addEventListener( "focusout", () => {
  if ( !resetHotkeyEl.value ) {
    resetHotkeyEl.value = initialData.reset;
  }
} );

document.getElementById( "save-button" ).addEventListener( "click", () => {
  for ( const [ key, { value } ] of Object.entries( fieldValues ) ) {
    setupData.hotkeys[ key ] = value;
  }

  for ( const [ key, value ] of Object.entries( setupData.hotkeys ) ) {
    if ( !value ) {
      // revert to the original value
      setupData.hotkeys[ key ] = initialData[ key ];
    }
  }

  fs.writeFileSync( `${ global.__dirname }/user-data/configuration.json`, JSON.stringify( setupData, null, 2 ) );

  startHotkeyEl.value = setupData.hotkeys.start;
  replayHotkeyEl.value = setupData.hotkeys.replay;
  resetHotkeyEl.value = setupData.hotkeys.reset;
} );
