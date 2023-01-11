const { GlobalKeyboardListener } = nw.require( "node-global-key-listener" );
const keyboardListener = new GlobalKeyboardListener();

const fs = nw.require( "fs" );
const path = nw.require( "path" );

import { switchPage } from "./initialize.js";

const setupData = JSON.parse( fs.readFileSync( `${ global.__dirname }/user-data/configuration.json` ) );

const os = nw.require( "os" );
const homedir = os.homedir();

let dustforceDirectory;
switch ( os.platform() ) {
  case "darwin":
    dustforceDirectory = `${ homedir }/Library/Application Support/Steam/steamapps/common/Dustforce/Dustforce.app/Contents/Resources/`;
    break;

  case "linux":
    dustforceDirectory = `${ homedir }/.local/share/Steam/steamapps/common/Dustforce/`;
    break;

  case "win32":
    dustforceDirectory = "C:\\Program Files (x86)\\Steam\\steamapps\\common\\Dustforce\\";
    break;
}

const directoryInputTextEl = document.getElementById( "dustforce-directory-input-text" );
const openDirectoryLinkEl = document.getElementById( "open-directory-link" );

const directoryInputWarningEl = document.getElementById( "dustforce-directory-input-warning" );
const warnAboutDirectory = () => {
  openDirectoryLinkEl.style.display = "none";
  directoryInputWarningEl.style.display = "block";

  setTimeout( () => {
    directoryInputWarningEl.style.display = "none";
    openDirectoryLinkEl.style.display = "inline-block";
  }, 3000 );
}

let _foundDustforceDirectory = false;
if ( !fs.existsSync( dustforceDirectory ) ) {
  // the Dustforce directory is where it is expected to be
  directoryInputTextEl.innerText = "Directory Found.";
  _foundDustforceDirectory = true;
}
else {
  // the directory location is unknown, so force the user to provide it to us
  // (e.g. some Windows users put their installation on a different drive)
  directoryInputTextEl.style.display = "none";
  openDirectoryLinkEl.style.display = "inline-block";

  const openDirectoryInput = document.getElementById( "open-directory-input" );
  openDirectoryInput.addEventListener( "change", ( event ) => {
    const { value: absolutePath } = event.target;

    const rootIndex = absolutePath.indexOf( "Dustforce" );
    if ( rootIndex < 0 ) {
      event.target.value = "";
      warnAboutDirectory();
      return;
    }

    let pathToRoot = absolutePath.substring( 0, rootIndex );
    if ( os.platform() === "darwin" ) {
      pathToRoot = path.join( pathToRoot, "Dustforce/Dustforce.app/Contents/Resources" );
    }
    else {
      pathToRoot = path.join( pathToRoot, "Dustforce" )
    }

    if ( !pathToRoot ) {
      event.target.value = "";
      warnAboutDirectory();
      return;
    }

    dustforceDirectory = pathToRoot;
    _foundDustforceDirectory = true;

    openDirectoryLinkEl.style.display = "none";
    directoryInputTextEl.innerText = "Path Seems Valid.";
    directoryInputTextEl.style.display = "block";
  } );
}

const startHotkeyEl = document.getElementById( "start-hotkey-input" );
const replayHotkeyEl = document.getElementById( "replay-hotkey-input" );
const resetHotkeyEl = document.getElementById( "reset-hotkey-input" );

const hotkeyData = {
  start: "",
  replay: "",
  reset: "",
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
const listener = keyboardListener.addListener( ( event ) => {
  if ( event.state === "DOWN" ) {
    if ( _listenTo ) {
      hotkeyData[ _listenTo ] = event.name;
    }
  }
} );

const addHotkeyListener = ( input, field ) => {
  input.addEventListener( "keydown" , ( event ) => {
    let key = event.code;
    if ( key !== "Tab" ) {
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
} );
replayHotkeyEl.addEventListener( "focusout", () => {
  _listenTo = "";
} );
resetHotkeyEl.addEventListener( "focusout", () => {
  _listenTo = "";
} );
startHotkeyEl.addEventListener( "focusin", () => {
  _listenTo = "start";
} );
replayHotkeyEl.addEventListener( "focusin", () => {
  _listenTo = "replay";
} );
resetHotkeyEl.addEventListener( "focusin", () => {
  _listenTo = "reset";
} );

document.getElementById( "done-button" ).addEventListener( "click", () => {
  if ( !_foundDustforceDirectory ) {
    // the location of the dustforce installation is required
    return;
  }

  if ( Object.values( fieldValues ).some( ( { value } ) => !value ) ) {
    // not all hotkeys were registered yet
    return;
  }

  setupData.initialSetupDone = true;
  setupData.hotkeys = {
    ...hotkeyData,
  };
  setupData.dustforceDirectory = dustforceDirectory;

  fs.writeFileSync( `${ global.__dirname }/user-data/configuration.json`, JSON.stringify( setupData, null, 2 ) );

  keyboardListener.removeListener( listener );

  switchPage( "setup.html", "index.html" );
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
