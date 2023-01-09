const NwBuilder = require( "nw-builder" );

const fs = require( "fs" );
const { promises: fsPromises } = fs;

const path = require( "path" );

const { exec } = require( "child_process" );

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

// construct the Windows build manually, since this version of nw-builder can't
// do it, and newer versions don't actually properly function; note that this
// assumes the NW binaries have been downloaded and put in the cache beforehand
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
( async() => {
  await copyDir( nwBinaries, buildPath );
  await copyDir( srcPath, path.join( buildPath, "/package.nw" ), [
    "node_modules",
    ".eslintrc.json",
    "package-lock.json",
    ".DS_Store",
  ] );

  // copy the package.json to a temporary folder, build only non-dev modules,
  // and copy the folder to the build directory
  if ( fs.existsSync( "./temp" ) ) {
    fs.rmSync( "./temp", { recursive: true } );
  }
  fs.mkdirSync( "./temp" );
  fs.copyFileSync( path.join( srcPath, "/package.json" ), "./temp/package.json" );

  await new Promise( ( resolve, reject ) => {
    const child = exec( "npm i --omit=dev --prefix ./temp", {
      encoding: "utf8",

    }, ( error, stdout, stderr ) => {
      if ( error ) {
        reject( error );
      }

      console.log( stdout );
      resolve();
    } );
  } );

  await copyDir( "./temp/node_modules", buildPath + "/node_modules" );

  // rename nw.exe
  await fsPromises.rename( path.join( buildPath, "nw.exe" ), path.join( buildPath, "random-map-app.exe" ) );

  // clean up
  fs.rmSync( "./temp", { recursive: true } );
} )();

// build Mac and Linux versions
const nw = new NwBuilder( {
  files: [ "./src/**/*" ],
  version: "0.52.2",
  flavor: "normal",
  platforms: [ "osx64", "linux32", "linux64" ],
  cacheDir: "./cache",
  forceDownload: false,
  buildDir: "./dist",
  appName: "random-map-challenge",
  appVersion: "0.0.1",
  macIcns: "./src/assets/s-complete-icon.icns",
  winIco: "./src/assets/s-complete-icon.icns",
} );

nw.build();
