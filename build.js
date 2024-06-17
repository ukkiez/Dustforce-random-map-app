const NwBuilder = require( "nw-builder" );

const fs = require( "fs" );
const { promises: fsPromises } = fs;

const path = require( "path" );

const { exec } = require( "child_process" );

const execAsync = ( command, log ) => {
  return new Promise( ( resolve, reject ) => {
    const child = exec( command, {
      encoding: "utf8",
    }, ( error, stdout, stderr ) => {
      if ( error ) {
        reject( error );
      }

      if ( log ) {
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

const unixDirs = [ "dist/RMA_osx64/", "dist/RMA_linux32/", "dist/RMA_linux64/" ];

// build Mac and Linux versions
const nw = new NwBuilder( {
  files: [ "./src/**/*" ],
  version: "0.52.2",
  flavor: "normal",
  platforms: [ "osx64", "linux32", "linux64" ],
  cacheDir: "./cache",
  forceDownload: false,
  buildDir: "./dist",
  appName: "random-map-app",
  appVersion: "1.0.0",
  macIcns: "./src/assets/s-complete-icon.icns",
  winIco: "./src/assets/s-complete-icon.icns",
} );

const modulesPath = "./src/node_modules";
( async () => {
  try {
    // remove node modules (since we only use dev modules anyway)
    fs.rmSync( modulesPath, { recursive: true } );
  }
  catch ( e ) {
    console.error( e );
  }

  // clear out the dist folder
  await fsPromises.rm( "./dist/", { recursive: true } );

  // overwrite the user settings and configuration with the defaults
  await fsPromises.rm( "./src/user-data/settings.json" );
  await fsPromises.rm( "./src/user-data/configuration.json" );
  await fsPromises.copyFile( "./src/settings/default-settings.json", "./src/user-data/settings.json" );
  await fsPromises.copyFile( "./src/settings/default-configuration.json", "./src/user-data/configuration.json" );

  // TODO: overwrite the personal bests

  await nw.build();
  console.log( "> Built Mac&Linux" );

  // rename directories to a clearer name for the user
  await fsPromises.rename( "dist/random-map-app/osx64", "dist/RMA_osx64" );
  await fsPromises.rename( "dist/random-map-app/linux32", "dist/RMA_linux32" );
  await fsPromises.rename( "dist/random-map-app/linux64", "dist/RMA_linux64" );

  // remove the leftover directory
  await fsPromises.rmdir( "dist/random-map-app" );

  // remove useless credits html
  for ( const dir of unixDirs ) {
    await fsPromises.rm( dir + "credits.html" );
  }

  // // create a zip file for distribution; note that we CD into the "dist"
  // // directory first so the zip archive doesn't include the folder
  // await execAsync( "cd dist && zip -ry RMA-osx64.zip random-map-app_osx64/random-map-app.app", true );
  // await execAsync( "cd dist && zip -ry RMA-linux32.zip random-map-app_linux32", true );
  // await execAsync( "cd dist && zip -ry RMA-linux64.zip random-map-app_linux64", true );
  // console.log( "> Compressed Mac&Linux" );
} )().then( async () => {
  const buildWindows = async () => {
    // construct the Windows build manually, since this version of nw-builder
    // can't do it, and newer versions don't actually properly function; note
    // that this assumes the NW binaries have been downloaded and put in the
    // cache folder beforehand
    const buildPath = "./dist/win32";
    const srcPath = "./src";
    const nwBinaries = "./cache/0.52.2-normal/win32";
    try {
      // remove any existing build
      fs.rmSync( buildPath, { recursive: true } );
    }
    catch ( e ) {}

    fs.mkdirSync( buildPath );
    fs.mkdirSync( path.join( buildPath, "package.nw" ) );
    await copyDir( nwBinaries, buildPath );
    await copyDir( srcPath, path.join( buildPath, "/package.nw" ), [
      "node_modules",
      ".eslintrc.json",
      "package-lock.json",
      ".DS_Store",
    ] );

    // // copy the package.json to a temporary folder, build only non-dev modules,
    // // and copy the folder to the build directory
    // if ( fs.existsSync( "./temp" ) ) {
    //   fs.rmSync( "./temp", { recursive: true } );
    // }
    // fs.mkdirSync( "./temp" );
    // fs.copyFileSync( path.join( srcPath, "/package.json" ), "./temp/package.json" );

    // await execAsync( "npm i --omit=dev --prefix ./temp", true );

    // await copyDir( "./temp/node_modules", buildPath + "/node_modules" );

    // rename nw.exe
    await fsPromises.rename( path.join( buildPath, "nw.exe" ), path.join( buildPath, "random-map-app.exe" ) );

    // // clean up
    // fs.rmSync( "./temp", { recursive: true } );

    // rename directories to a clearer name for the user
    await fsPromises.rename( "dist/win32", "dist/RMA_win32" );

    // // create a zip file for distribution; note that we CD into the "dist"
    // // directory first so the zip archive doesn't include the folder
    // await execAsync( "cd dist && zip -ry RMA-win32.zip random-map-app_win32", true );
    console.log( "> Built Windows" );
  }

  if ( process.argv.includes( "win" ) || process.argv.includes( "windows" ) ) {
    await buildWindows();
  }
} );

