const fs = nw.require( "fs" );
const path = nw.require( "path" );

import { switchPage } from "./initialize.js";

import { getData } from "./util/data.js";
const { userConfiguration: setupData } = getData( { userConfiguration: true } );

const os = nw.require( "os" );
const homedir = os.homedir();

let dustforceDirectory = "";
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

if ( fs.existsSync( path.join( dustforceDirectory, "split.txt" ) ) ) {
  // the Dustforce directory and split.txt file are where they are expected to
  // be
  confirmationTextEl.innerText = "Dustforce directory Found.";

  finish();
}
else {
  // the directory location is unknown - for example, some Windows users put
  // their installation on a different drive - so force the user to provide it
  // to us
  confirmationTextEl.style.display = "none";
  openDirectoryLinkEl.style.display = "inline-block";

  const openDirectoryLink = document.getElementById( "open-directory-link" );
  openDirectoryLink.addEventListener( "change", ( event ) => {
    const { value: absolutePath } = event.target;

    // ensure split.txt exists, if not then the user might not have Dustmod
    // installed or they've selected the wrong directory
    switch ( os.platform() ) {
      case "darwin":
        if ( !fs.existsSync( path.join( absolutePath, "Dustforce.app/Contents/Resources/split.txt" ) ) ) {
          warnAboutDirectory( "Error: Could not find 'split.txt'.\n\nMake sure Dustmod is installed, and choose your root Dustforce directory." );
          return;
        }

        dustforceDirectory = path.join( absolutePath, "Dustforce.app/Contents/Resources" );
        break;

      default:
        if ( !fs.existsSync( path.join( absolutePath, "split.txt" ) ) ) {
          warnAboutDirectory( "Error: Could not find 'split.txt'.\n\nMake sure Dustmod is installed, and choose your root Dustforce directory." );
          return;
        }

        dustforceDirectory = absolutePath;
        break;
    }

    openDirectoryLinkEl.style.display = "none";
    confirmationTextEl.innerText = `Path Seems Valid...`;
    confirmationTextEl.style.display = "block";
    directoryInputWarningEl.style.display = "none";

    finish();
  } );
}
