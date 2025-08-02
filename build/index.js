const NwBuilder = require( "nw-builder" );

const fs = require( "fs" );
const { promises: fsPromises } = fs;

const path = require( "path" );
const { join } = path;

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

async function pathExists( path ) {
  try {
    await fsPromises.stat( path );
    return true;
  }
  catch ( error ) {
    return false;
  }
}

async function removeIfExists( path, recursive = false ) {
  if ( await pathExists( path ) ) {
    await fsPromises.rm( path, { recursive } );

    return true;
  }

  return false;
}

const PATHS = {
  ROOT: path.resolve( `${ __dirname }/..` ),
  BUILD: path.resolve( __dirname ),
};

PATHS.SRC = join( PATHS.ROOT, "src" );
PATHS.DIST = join( PATHS.BUILD, "dist" );
PATHS.DEFAULTS = join( PATHS.BUILD, "defaults" );
PATHS.USER_DATA = join( PATHS.SRC, "user-data" );

const unixDirs = [ join( PATHS.DIST, "RMA_osx64" ), join( PATHS.DIST, "RMA_linux32" ), join( PATHS.DIST, "RMA_linux64" ) ];

// build Mac and Linux versions
const nw = new NwBuilder( {
  files: [ join( PATHS.SRC, "**/*" ) ],
  version: "0.52.2",
  flavor: "normal",
  platforms: [ "osx64", "linux32", "linux64" ],
  cacheDir: join( PATHS.BUILD, "cache" ),
  forceDownload: false,
  buildDir: PATHS.DIST,
  appName: "random-map-app",
  appVersion: "1.0.2",
  macIcns: join( PATHS.SRC, "assets/s-complete-icon.icns" ),
  winIco: join( PATHS.SRC, "assets/s-complete-icon.icns" ),
  downloadUrl: "https://dl.node-webkit.org/",
} );

const modulesPath = join( PATHS.SRC, "node_modules" );
( async () => {
  // remove node modules since we only use dev modules anyway
  await removeIfExists( modulesPath, recursive = true );

  // clear out the dist folder
  await removeIfExists( PATHS.DIST, recursive = true );

  // overwrite the user settings and configuration with the defaults
  await removeIfExists( join( PATHS.USER_DATA, "settings.json" ) );
  await removeIfExists( join( PATHS.USER_DATA, "configuration.json" ) );
  await removeIfExists( join( PATHS.USER_DATA, "personal-bests.bin" ) );
  await fsPromises.copyFile( join( PATHS.DEFAULTS, "settings.bin" ), join( PATHS.USER_DATA, "settings.bin" ) );
  await fsPromises.copyFile( join( PATHS.DEFAULTS, "configuration.json" ), join( PATHS.USER_DATA, "configuration.json" ) );
  await fsPromises.copyFile( join( PATHS.DEFAULTS, "personal-bests.bin" ), join( PATHS.USER_DATA, "personal-bests.bin" ) );

  await nw.build();
  console.log( "> Built Mac&Linux" );

  // rename directories to a clearer name for the user
  await fsPromises.rename( join( PATHS.DIST, "random-map-app/osx64" ), join( PATHS.DIST, "RMA_osx64" ) );
  await fsPromises.rename( join( PATHS.DIST, "random-map-app/linux32" ), join( PATHS.DIST, "RMA_linux32" ) );
  await fsPromises.rename( join( PATHS.DIST, "random-map-app/linux64" ), join( PATHS.DIST, "RMA_linux64" ) );

  // remove the leftover directory
  await removeIfExists( join( PATHS.DIST, "random-map-app" ), recursive = true );

  // remove useless credits html
  for ( const dir of unixDirs ) {
    await removeIfExists( join( dir, "credits.html" ) );
  }

  // // create a zip file for distribution; note that we CD into the "dist"
  // // directory first so the zip archive doesn't include the folder
  // await execAsync( "cd dist && zip -ry RMA-osx64.zip random-map-app_osx64/random-map-app.app", true );
  // await execAsync( "cd dist && zip -ry RMA-linux32.zip random-map-app_linux32", true );
  // await execAsync( "cd dist && zip -ry RMA-linux64.zip random-map-app_linux64", true );
  // console.log( "> Compressed Mac&Linux" );
} )()
.then( async () => {
  const buildWindows = async () => {
    // construct the Windows build manually, since this version of nw-builder
    // can't do it, and newer versions don't actually properly function; note
    // that this assumes the NW binaries have been downloaded and put in the
    // cache folder beforehand
    const buildPath = join( PATHS.DIST, "win32" );
    const nwBinaries = join( PATHS.BUILD, "cache/0.52.2-normal/win32" );
    try {
      // remove any existing build
      fs.rmSync( buildPath, { recursive: true } );
    }
    catch ( e ) {}

    fs.mkdirSync( buildPath );
    fs.mkdirSync( join( buildPath, "package.nw" ) );
    await copyDir( nwBinaries, buildPath );
    await copyDir( PATHS.SRC, join( buildPath, "/package.nw" ), [
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
    // fs.copyFileSync( join( PATHS.SRC, "/package.json" ), "./temp/package.json" );

    // await execAsync( "npm i --omit=dev --prefix ./temp", true );

    // await copyDir( "./temp/node_modules", buildPath + "/node_modules" );

    // rename nw.exe
    await fsPromises.rename( join( buildPath, "nw.exe" ), join( buildPath, "random-map-app.exe" ) );

    // // clean up
    // fs.rmSync( "./temp", { recursive: true } );

    // rename directories to a clearer name for the user
    await fsPromises.rename( buildPath, join( PATHS.DIST, "RMA_win32" ) );

    // // create a zip file for distribution; note that we CD into the "dist"
    // // directory first so the zip archive doesn't include the folder
    // await execAsync( "cd dist && zip -ry RMA-win32.zip random-map-app_win32", true );
    console.log( "> Built Windows" );
  }

  if ( process.argv.includes( "win" ) || process.argv.includes( "windows" ) ) {
    await buildWindows();
  }
} )
.catch( error => {
  console.log( error );
} );

