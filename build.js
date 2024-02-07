const fs = require( "fs" );
const { promises: fsPromises } = fs;

const path = require( "path" );

const { exec } = require( "child_process" );

const execAsync = ( command, log ) => {
  return new Promise( ( resolve, reject ) => {
    exec( command, {
      encoding: "utf8",
    }, ( error, stdout ) => {
      if ( error ) {
        reject( error );
      }

      if ( log && stdout ) {
        console.log( stdout );
      }

      resolve( stdout );
    } );
  } );
}

async function copyDir( src, dest, exclusions = [] ) {
  await fsPromises.mkdir( dest, { recursive: true } );

  const entries = await fsPromises.readdir( src, { withFileTypes: true } );
  for ( const entry of entries ) {
    if ( exclusions.includes( entry.name ) ) {
      continue;
    }

    const srcPath = path.join( src, entry.name );
    const destPath = path.join( dest, entry.name );

    if ( entry.isDirectory() ) {
      await copyDir( srcPath, destPath, exclusions );
    }
    else {
      await fsPromises.copyFile( srcPath, destPath );
    }
  }
}

const baseDir = "./dist/random-map-app";
const resources = path.join( baseDir, "resources.neu" );
const settingsDataDir = "./default-user-data";

const chMod = async ( filepath ) => {
  // give execution permissions
  await execAsync( `chmod +x ${ filepath }`, true );
}

const filenameByArchs = {
  "linux_x64": {
    filename: "Random-Map-App",
    transform: chMod,
  },
  "linux_armhf": {
    filename: "Random-Map-App",
    transform: chMod,
  },
  "linux_arm64": {
    filename: "Random-Map-App",
    transform: chMod,
  },
  "mac_x64": {
    filename: "Random-Map-App.app",
    transform: chMod,
  },
  "mac_universal": {
    filename: "Random-Map-App.app",
    transform: chMod,
  },
  "mac_arm64": {
    filename: "Random-Map-App.app",
    transform: chMod,
  },
  "win_x64.exe": {
    filename: "Random-Map-App.exe",
    dirname: "win_x64",
  },
};

const baseFilename = "random-map-app-";
( async () => {
  // clean up the dist folder
  try {
    // remove any existing build
    await fsPromises.rm( "./dist/random-map-app", { recursive: true } );
  }
  catch ( error ) {
    console.error( error );
  }

  await execAsync( "neu build", true );

  // build full distributable packages for each architecture
  for ( const [ arch, { filename, dirname, transform } ] of Object.entries( filenameByArchs ) ) {
    // create directory
    let destination;
    if ( dirname ) {
      destination = path.join( baseDir, dirname );
    }
    else {
      // use the arch name as the directory name
      destination = path.join( baseDir, arch );
    }

    await fsPromises.mkdir( destination );

    // move executable and apply a potential transform func to it
    const defaultFilename = baseFilename + arch;
    await execAsync( `mv ${ path.join( baseDir, defaultFilename ) } ${ path.join( destination, filename ) }`, true );
    if ( transform ) {
      await transform( path.join( destination, filename ) );
    }

    // add a copy of resources.neu
    await execAsync( `cp ${ resources } ${ destination }`, true );

    // add the default user JSON settings
    await copyDir( settingsDataDir, path.join( destination, "user-data" ) );
  }

  try {
    // clean up the remaining resources.neu file
    await fsPromises.rm( "./dist/random-map-app/resources.neu" );
  }
  catch ( error ) {
    console.error( error );
  }
} )();

// build steps:
// - uncomment the PRODUCTION paths in src/paths.js
// - disable inspector tools in the neutralino.config.json
// - run `node build.js`
