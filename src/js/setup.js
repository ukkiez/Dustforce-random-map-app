import { log } from "./util/log.js";

import { switchPage } from "./initialize.js";

const setupData = JSON.parse( await Neutralino.filesystem.readFile( "./src/user-data/configuration.json" ) );

const os = NL_OS; // eslint-disable-line no-undef
log( os );
let homeDir = "";
if ( [ "Darwin", "Linux" ].includes( os ) ) {
  // use "printf" rather than "echo" to get the home directory without a new
  // line (consistently)
  ( { stdOut: homeDir } = await Neutralino.os.execCommand( "printf $HOME" ) );
}

let dustforceDirectory = "";
switch ( os ) {
  case "Darwin":
    dustforceDirectory = `${ homeDir }/Library/Application Support/Steam/steamapps/common/Dustforce/Dustforce.app/Contents/Resources/`;
    break;

  case "Linux":
    dustforceDirectory = `${ homeDir }/.local/share/Steam/steamapps/common/Dustforce/`;
    break;

  case "Windows":
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

const finish = async () => {
  const initializeTextEl = document.getElementById( "initializing-text" );
  initializeTextEl.style.display = "flex";

  const sleep = ms => new Promise( r => setTimeout(()=> r(), ms ) );

  for ( let i = 0; i < 3; i++ ) {
    await sleep( 750 );
    initializeTextEl.innerText = initializeTextEl.innerText + ".";
  }

  setupData.initialSetupDone = true;

  setupData.dustforceDirectory = dustforceDirectory;

  await Neutralino.filesystem.writeFile( "src/user-data/configuration.json", JSON.stringify( setupData, null, 2 ) );
  await sleep( 750 );

  switchPage( "setup.html", "index.html" );
}

let directoryExists = true;
if ( dustforceDirectory ) {
  try {
    await Neutralino.filesystem.getStats( dustforceDirectory );
  }
  catch ( error ) {
    directoryExists = false;
  }
}
else {
  directoryExists = false;
}

if ( directoryExists ) {
  // the Dustforce directory is where it is expected to be
  confirmationTextEl.innerText = "Directory Found.";

  await finish();
}
else {
  // the directory location is unknown, so force the user to provide it to us
  // (e.g. some Windows users put their installation on a different drive)
  confirmationTextEl.style.display = "none";
  openDirectoryLinkEl.style.display = "inline-block";

  openDirectoryLinkEl.addEventListener( "click", async () => {
    const absolutePath = await Neutralino.os.showFolderDialog( "Select Any Folder In The Dustforce Directory" );

    const rootIndex = absolutePath.indexOf( "Dustforce" );
    if ( rootIndex < 0 ) {
      event.target.value = "";
      warnAboutDirectory( "Invalid Path: select any folder of/in your Dustforce directory.");
      return;
    }

    let pathToRoot = absolutePath.substring( 0, rootIndex );
    if ( os === "Darwin" ) {
      pathToRoot = pathToRoot + "Dustforce/Dustforce.app/Contents/Resources";
    }
    else {
      pathToRoot = pathToRoot + "Dustforce";
    }

    dustforceDirectory = pathToRoot;

    openDirectoryLinkEl.style.display = "none";
    confirmationTextEl.innerText = `Path Seems Valid...`;
    confirmationTextEl.style.display = "block";
    directoryInputWarningEl.style.display = "none";

    await finish();
  } );
}
