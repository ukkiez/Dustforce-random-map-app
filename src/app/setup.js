const fs = nw.require( "fs" );
const path = nw.require( "path" );

import { switchPage } from "./initialize.js";

import { getData } from "./util/data.js";
const { userConfiguration: setupData } = getData( { userConfiguration: true } );

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

const confirmationTextEl = document.getElementById( "confirmation-text" );
const openDirectoryLinkEl = document.getElementById( "open-directory-link" );

const directoryInputWarningEl = document.getElementById( "dustforce-directory-input-warning" );
const warnAboutDirectory = ( string ) => {
  directoryInputWarningEl.innerText = string;
  directoryInputWarningEl.style.display = "block";
}

const finish = () => {
  const initializeTextEl = document.getElementById( "initializing-text" );
  initializeTextEl.style.display = "flex";

  setTimeout( () => {
    initializeTextEl.innerText = initializeTextEl.innerText + ".";
  }, 750 );
  setTimeout( () => {
    initializeTextEl.innerText = initializeTextEl.innerText + ".";
  }, 750 * 2 );
  setTimeout( () => {
    initializeTextEl.innerText = initializeTextEl.innerText + ".";

    setupData.initialSetupDone = true;

    setupData.dustforceDirectory = dustforceDirectory;

    fs.writeFileSync( `${ global.__dirname }/user-data/configuration.json`, JSON.stringify( setupData, null, 2 ) );

    setTimeout( () => {
      switchPage( "setup.html", "index.html" );
    }, 750 );

  }, 750 * 3 );
}

if ( fs.existsSync( dustforceDirectory ) ) {
  // the Dustforce directory is where it is expected to be
  confirmationTextEl.innerText = "Dustforce directory Found.";

  finish();
}
else {
  // the directory location is unknown, so force the user to provide it to us
  // (e.g. some Windows users put their installation on a different drive)
  confirmationTextEl.style.display = "none";
  openDirectoryLinkEl.style.display = "inline-block";

  const openDirectoryLink = document.getElementById( "open-directory-link" );
  openDirectoryLink.addEventListener( "change", ( event ) => {
    const { value: absolutePath } = event.target;

    const rootIndex = absolutePath.indexOf( "Dustforce" );
    if ( rootIndex < 0 ) {
      event.target.value = "";
      warnAboutDirectory( "Invalid Path: select any folder of/in your Dustforce directory." );
      return;
    }

    let pathToRoot = absolutePath.substring( 0, rootIndex );
    if ( os.platform() === "darwin" ) {
      pathToRoot = path.join( pathToRoot, "Dustforce/Dustforce.app/Contents/Resources" );
    }
    else {
      pathToRoot = path.join( pathToRoot, "Dustforce" );
    }

    dustforceDirectory = pathToRoot;

    openDirectoryLinkEl.style.display = "none";
    confirmationTextEl.innerText = `Path Seems Valid...`;
    confirmationTextEl.style.display = "block";
    directoryInputWarningEl.style.display = "none";

    finish();
  } );
}
