const fs = nw.require( "fs" );
const path = nw.require( "path" );
const https = nw.require( "https" );

import { log } from "./error.js";

const filenameRegex = /filename="(.+)"/;

const IS_DEBUG = !!nw.process.env.DEBUG;

const atlasDownloadUrl = "https://atlas.dustforce.com/gi/downloader.php?id=";
export const downloadMap = async ( atlasId, dest, _filename = "" ) => {
  if ( _filename ) {
    // check whether the file already exists
    if ( fs.existsSync( path.join( dest, _filename ) ) ) {
      // map already exists
      return 1;
    }
    else {
      if ( IS_DEBUG ) {
        console.log( `Level ${ path.join( dest, _filename ) } does not exist - downloading...` );
      }
    }
  }

  let filename;
  try {
    await new Promise( ( resolve, reject ) => {
      const agent = new https.Agent( { timeout: 10000 } );
      https.get( atlasDownloadUrl + atlasId, { agent }, ( response ) => {
        const header = response.headers[ "content-disposition" ];
        if ( !header ) {
          log.error( `No headers found for map ID: "${ atlasId }"` );
          reject( -1 );
          return -1;
        }

        const match = header.match( filenameRegex );
        if ( !match.length ) {
          log.error( `No filename found for map ID: "${ atlasId }", with headers: `, response.headers[ "content-disposition" ] );
          reject( -1 );
          return;
        }

        const fileInfo = {
          mime: response.headers[ "content-type" ],
          size: parseInt( response.headers[ "content-length" ], 10 ),
        }

        filename = match[ 1 ];
        if ( IS_DEBUG ) {
          console.log( `Map "${ filename }" downloaded.` );
        }
        const file = fs.createWriteStream( path.join( dest, filename ) );
        response.pipe( file )
          .on( "error", reject )
          .once( "close", () => {
            if ( IS_DEBUG ) {
              console.log( `Map "${ filename }" saved. (${ ( fileInfo.size/1028 ).toFixed( 1 ) }kB )` );
            }
            resolve( 1 );
          } );
      } );
    } );
  }
  catch ( error ) {
    error.message = `Failed download for map ID: "${ atlasId }"; ${ error.message }`;
    log.error( error );
    return -1;
  }

  if ( !filename ) {
    const error = new Error( `No filename found for map ID: "${ atlasId }"; ${ error.message }` );
    error.name = "downloadMapError";
    log.error( error );
    return -1;
  }

  return 1;
}
