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
if ( fs.existsSync( dustforceDirectory ) ) {
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

  for ( const [ key, { value } ] of Object.entries( fieldValues ) ) {
    setupData.hotkeys[ key ] = value;
  }

  setupData.dustforceDirectory = dustforceDirectory;

  fs.writeFileSync( `${ global.__dirname }/user-data/configuration.json`, JSON.stringify( setupData, null, 2 ) );

  switchPage( "setup.html", "index.html" );
} );
