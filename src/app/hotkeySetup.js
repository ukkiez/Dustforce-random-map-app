const { GlobalKeyboardListener } = nw.require( "node-global-key-listener" );
const keyboardListener = new GlobalKeyboardListener();

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

// start listening for keys, as we'll need whatever name the key listener itself
// thinks is being registered (which from testing we know can vary depending on
// the OS and probably keyboard language)
let _listenTo = "";
let listener;
const startListening = () => {
  return keyboardListener.addListener( ( event ) => {
    if ( event.state === "DOWN" ) {
      if ( event.name === "TAB" ) {
        // don't allow tab as a hotkey, as we're allowing users to cycle through
        // the inputs with tab
        return;
      }

      if ( _listenTo ) {
        hotkeyData[ _listenTo ] = event.name;
      }
    }
  } );
}

const addHotkeyListener = ( input, field ) => {
  input.addEventListener( "keydown" , ( event ) => {
    let key = event.code;

    if ( key === "Tab" ) {
      return;
    }

    event.preventDefault();
    let hotkey = "";
    if ( event.shiftKey ) {
      hotkey = "Shift";
    }
    else if ( event.ctrlKey ) {
      hotkey = "Ctrl";
    }
    else if ( event.altKey ) {
      hotkey = "Alt";
    }
    else if ( event.metaKey ) {
      hotkey = "Meta";
    }

    if ( key.startsWith( "Key" ) ) {
      key = key.slice( 3 );
    }

    if ( event.shiftKey || event.ctrlKey || event.altKey || event.metaKey ) {
      event.target.value = hotkey;
    }
    else if ( event.key === " " ) {
      event.target.value = "SPACE";
    }
    else {
      event.target.value = event.key.toUpperCase();
    }

    for ( const [ key, { value } ] of Object.entries( fieldValues ) ) {
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
  _listenTo = "";
  if ( !startHotkeyEl.value ) {
    startHotkeyEl.value = initialData.start;
  }
} );
replayHotkeyEl.addEventListener( "focusout", () => {
  _listenTo = "";
  if ( !replayHotkeyEl.value ) {
    replayHotkeyEl.value = initialData.replay;
  }
} );
resetHotkeyEl.addEventListener( "focusout", () => {
  _listenTo = "";
  if ( !resetHotkeyEl.value ) {
    resetHotkeyEl.value = initialData.reset;
  }
} );
startHotkeyEl.addEventListener( "focusin", () => {
  if ( !listener ) {
    listener = startListening();
  }

  _listenTo = "start";
} );
replayHotkeyEl.addEventListener( "focusin", () => {
  if ( !listener ) {
    listener = startListening();
  }

  _listenTo = "replay";
} );
resetHotkeyEl.addEventListener( "focusin", () => {
  if ( !listener ) {
    listener = startListening();
  }

  _listenTo = "reset";
} );

document.getElementById( "save-button" ).addEventListener( "click", () => {
  console.log( { initialData } );
  console.log( { hotkeyData } );
  setupData.hotkeys = {
    ...hotkeyData,
  };
  for ( const [ key, value ] of Object.entries( setupData.hotkeys ) ) {
    if ( !value ) {
      // revert to the original value
      setupData.hotkeys[ key ] = initialData[ key ];
    }
  }

  fs.writeFileSync( `${ global.__dirname }/user-data/configuration.json`, JSON.stringify( setupData, null, 2 ) );
  keyboardListener.removeListener( listener );

  startHotkeyEl.value = setupData.hotkeys.start;
  replayHotkeyEl.value = setupData.hotkeys.replay;
  resetHotkeyEl.value = setupData.hotkeys.reset;
} );

/*
  maybe allow key combinations in the future (this is currently annoying to
  handle with the key listener module)

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
const hasMultipleModifiers = ( event ) => {
  const modifiers = [ event.shiftKey, event.ctrlKey, event.altKey, event.metaKey ];
  if ( modifiers.filter( e => e ).length > 1 ) {
    return true;
  }
}
const addHotkeyListener = ( input ) => {
  input.addEventListener( "keydown" , ( event ) => {
    if ( hasMultipleModifiers( event ) ) {
      // don't allow multiple modifiers (e.g. Ctrl+Alt+B)
      return;
    }

    let key = event.code;
    if ( key !== "Tab" ) {
      event.preventDefault();
      let hotkey = "";
      hotkey += event.shiftKey ? "Shift" : "";
      hotkey += event.ctrlKey ? "Ctrl" : "";
      hotkey += event.altKey ? "Alt" : "";
      hotkey += event.metaKey ? "Meta" : "";
      if ( key.startsWith( "Key" ) ) {
        key = key.slice( 3 );
      }

      if ( !modifiers.includes( key ) ) {
        if ( event.key === " " ) {
          hotkey += "+" + "SPACE";
        }
        else {
          hotkey += "+" + event.key.toUpperCase();
        }
      }

      if ( event.shiftKey || event.ctrlKey || event.altKey || event.metaKey ) {
        event.target.value = hotkey;
      }
      else {
        if ( event.key === " " ) {
          event.target.value = "SPACE";
        }
        else {
          event.target.value = event.key.toUpperCase();
        }
      }
    }
  } );
}
*/
