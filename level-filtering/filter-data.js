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
const solversData = require( path.join( __dirname, "solvers.json" ) );
const levelMetadata = require( path.join( __dirname, "./levels.json" ) );

const { parse: parseYAML } = require( "yaml" );

const currentDataPath = path.join( __dirname, "filtered-metadata.json" );
const destination = path.join( __dirname, "../src/dustkid-data/filtered-metadata.json" );
const destinationBin = path.join( __dirname, "../src/dustkid-data/filtered-metadata.bin" );

const ssCountByFilename = new Map();
for ( const [ filename, solvers ] of Object.entries( solversData ) ) {
  ssCountByFilename.set( filename, solvers.length );
}

/*
  - `levels.json` includes hidden and unpublished maps as of 10/05/2025
    - We'd prefer not to have hidden maps as they won't be visible to
      the user when following the Atlas link, we don't know whether it's
      hidden upfront from the dfrandomizer dataset, it skews run RNG towards
      maps with multiple copies, and potentially means you encounter the "same"
      map more than once a run
  - Unpublished maps can be filtered out by checking for an author
  - One problem with unpublished maps is that they are indistinct from
    "unreadable" maps, which most likely cannot be opened in-game
  - As of 23/07/2025 we've discovered there's gaps in Dustkid's data concerning
    authors, so some regular maps will be filtered out even though they're not
    unpublished/unreadable
*/


const excludedFilenames = parseYAML( fs.readFileSync( path.join( __dirname, "excluded-level-ids.yaml" ), "utf8" ) )[ "excluded-filenames" ];
const excludedAtlasIds = excludedFilenames.map( filename => parseInt( filename.substring( filename.lastIndexOf( "-" ) + 1 ), 10 ) );

const updateMetadataFile = async() => {
  const partialVersionString = await new Promise( resolve => {
    const readStream = fs.createReadStream( currentDataPath, {
      encoding: "utf8",
      start: 17,
      end: 24,
    } );

    readStream.on( "data", chunk => {
      resolve( chunk );
    } );
  } );

  const currentVersion = partialVersionString.match( /\d+\.\d+/, "g" )[ 0 ];

  let [ majorVersion, minorVersion ] = currentVersion.split( "." );
  switch ( process.argv[2] ) {
    case "major":
      majorVersion = `${ parseInt( majorVersion, 10 ) + 1 }`;
      break;

    case "minor":
      minorVersion = `${ parseInt( minorVersion, 10 ) + 1 }`;

    default:
      break;
  }

  const newVersion = `v${ majorVersion }.${ minorVersion }`;

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

    if ( excludedAtlasIds.includes( atlas_id ) ) {
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

  const result = JSON.stringify( {
    "version": newVersion,
    "data": sortedData,
  }, null, 2 );

  fs.writeFileSync( currentDataPath, result );
  fs.writeFileSync( destination, result );

  // const sortedDataBin = Buffer.from( JSON.stringify( sortedData ) ).toString( "hex" );

  // // save the settings file as a binary
  // fs.writeFileSync( destinationBin, sortedDataBin );
};

updateMetadataFile();
