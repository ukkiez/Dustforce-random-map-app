/**
 Constructs `filtered-metadata.json`, under the following parameters:

 * filter out levels from the list of exlusions
 * Filter out levels with no ID (i.e. stock levels)
 * Filter out levels that are not Normal or Dustmod type (0 and 6 respectively)
 * Filter out levels without a level end
 * Filter out levels with no SS count
 * Map only level name, author, atlas ID, SS count, and fastest SS duration
   fields
 * Sort primarily by SS count highest to lowest, and secondarily fastest SS
   duration shortest to longest
 */

const fs = require( "fs" );
const path = require( "path" );

// "solvers" refers to players that SS'd levels; object keys are level file
// names (e.g. "Tower-Construction-1026"), values are arrays of player IDs that
// have SS'd the levels
const solversData = require( "./solvers.json" );
const levelMetadata = require( "./levels.json" );

const { excludedLevelIds } = require( "./exclusions.js" );

const destination = path.join( __dirname, "../src/dustkid-data/filtered-metadata.json" );
const destinationBin = path.join( __dirname, "../src/dustkid-data/filtered-metadata.bin" );

const ssCountByFilename = new Map();
for ( const [ filename, solvers ] of Object.entries( solversData ) ) {
  ssCountByFilename.set( filename, solvers.length );
}

/*
  - `levels.json` includes hidden and unpublished maps as of 10/05/2025
    - Keep in mind we prefer not to have hidden maps as they won't be visible to
      the user when following the Atlas link, and we don't know whether it's
      hidden upfront from the dfrandomizer dataset, and it skews run RNG towards
      maps with multiple copies, and potentially means you encounter the "same"
      map more than once a run
  - Unpublished maps can be filtered out by checking for an author
  - One problem with unpublished maps is that they are indistinct from
    "unreadable" maps, which often cannot even be opened in-game
*/

// const solversMap = new Map( Object.entries( solversData ) );

// const userId = 64233;
const filteredData = {};
let counter = 0;
for ( const [ filename, metadata ] of Object.entries( levelMetadata ) ) {
  const { level_type, level_end, name, author, atlas_id, fastest_time } = metadata;

  // if ( solversMap.get( filename )?.includes( userId ) ) {
  //   // filter out the user's SS'd maps
  //   continue;
  // }

  if ( excludedLevelIds.includes( atlas_id ) ) {
    console.log( `Excluded level: ${ name }-${atlas_id}` );
    continue;
  }

  if ( atlas_id === 0 ) {
    // filter out ID-less levels (i.e. stock levels)
    continue;
  }

  if ( ![ 0, 6 ].includes( level_type ) ) {
    // filter out levels that are not Normal nor Dustmod type
    ssCountByFilename.delete( filename );
    continue;
  }

  if ( level_end <= 0 ) {
    // filter out levels that do not have an end trigger
    ssCountByFilename.delete( filename );
    continue;
  }

  if ( !author ) {
    // filter out broken/unpublished maps
    continue;
  }

  if ( !ssCountByFilename.has( filename ) ) {
    // somehow no SS count could be determined for this level
    continue;
  }

  const count = ssCountByFilename.get( filename );

  filteredData[ filename ] = {
    name,
    author,
    atlas_id,
    fastest_time: count <= 0 ? null : fastest_time,
    ss_count: count,
  };
}

const sortedData = Object.fromEntries(
  Object.entries( filteredData ).sort( ( a, b ) => {
    const [ , metadataA ] = a;
    const [ , metadataB ] = b;

    if ( metadataA.ss_count === metadataB.ss_count ) {
      // secondarily sort by fastest SS time, shortest first
      return metadataA.fastest_time - metadataB.fastest_time;
    }

    // primarily sort by SS count, highest first
    return metadataB.ss_count - metadataA.ss_count;
  } )
  .map( ( data ) => {
    const [ levelFileName, metadata ] = data;
    return [ levelFileName, metadata ];
  } )
);

fs.writeFileSync( path.join( __dirname, "filtered-metadata.json" ), JSON.stringify( sortedData, null, 2 ) );
fs.writeFileSync( destination, JSON.stringify( sortedData, null, 2 ) );

const sortedDataB = Buffer.from( JSON.stringify( sortedData ) ).toString( "hex" );

// save the settings file as a binary
fs.writeFileSync( destinationBin, sortedDataB );
