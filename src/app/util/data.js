const fs = nw.require( "fs" );

import cmpLevels from "../../dustkid-data/cmp-levels.json";
// level data is never modified, so read it once on file import and return the
// same copy whenever asked for
const levelDataB = fs.readFileSync( `${ global.__dirname }/dustkid-data/filtered-metadata.bin`, "utf8" );
const levelDataJSON = JSON.parse( Buffer.from( levelDataB, "hex" ).toString( "utf8" ) );

export const stringifyJSON = ( json ) => {
  try {
    JSON.parse( json );
  }
  catch ( error ) {
    // data seems to not yet be stringified as JSON, so do so
    return JSON.stringify( json );
  }

  return json;
}

export const HexToUtf8 = ( data ) => {
  return Buffer.from( data, "hex" ).toString( "utf8" );
}

export const dataToHex = ( data, isJSON = false ) => {
  if ( isJSON ) {
    return Buffer.from( stringifyJSON( data ) ).toString( "hex" );
  }

  return Buffer.from( data ).toString( "hex" );
}

export const writeHexData = ( path, data, isJSON = true ) => {
  const dataHex = dataToHex( data, isJSON );

  try {
    fs.writeFileSync( path, dataHex );
  }
  catch ( error ) {
    console.error( error );
    return false;
  }

  return true;
}

export const getData = ( { ...options } ) => {
  const { levelData, modes, personalBests, userConfiguration, settings } = options;

  const readFileSync = ( path ) => {
    return JSON.parse( HexToUtf8( fs.readFileSync( path, "utf8" ) ) );
  }

  const data = {};
  if ( modes ) {
    data.modes = readFileSync( `${ global.__dirname }/settings/modes.bin` );
  }
  if ( personalBests ) {
    data.personalBests = readFileSync( `${ global.__dirname }/user-data/personal-bests.bin` );
  }
  if ( settings ) {
    data.settings = readFileSync( `${ global.__dirname }/user-data/settings.bin` );
  }
  if ( userConfiguration ) {
    data.userConfiguration = JSON.parse( fs.readFileSync( `${ global.__dirname }/user-data/configuration.json` ) );
  }

  if ( levelData ) {
    data.levelData = levelDataJSON;
  }

  return data;
}

export const getMapPoolSize = ( settings ) => {
  const { minSSCount, maxSSCount, fastestSSTime, CMPLevels } = settings;

  const { levelData } = getData( { levelData: true } );

  const mapPool = new Set();
  for ( const [ levelFilename, metadata ] of Object.entries( levelData ) ) {
    if ( !CMPLevels ) {
      if ( cmpLevels.includes( levelFilename ) ) {
        // don't include cmp levels, as the user set them to be off
        continue;
      }
    }

    const { ss_count, fastest_time } = metadata;
    if ( ss_count >= minSSCount && ss_count <= maxSSCount && fastest_time <= fastestSSTime ) {
      mapPool.add( levelFilename );
    }
  }

  return mapPool.size;
}
