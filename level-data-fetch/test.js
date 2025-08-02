const fs = require( "fs" );
const path = require( "path" );
const https = require( "https" );

const options = {
  method: "GET",
  hostname: "api.github.com",
  path: "/repos/ukkiez/Dustforce-random-map-app/contents/level-filtering/filtered-metadata.json",
  headers: {
    "Accept": "application/vnd.github.raw+json",
    "User-Agent": "random-map-app",
    "X-GitHub-Api-Version": "2022-11-28"
  }
};

const getLevelData = async () => {
  const result = {
    data: null,
    statusCode: null,
    rateLimitRemaining: 0,
    rateLimitUsed: 0,
    error: null,
  };

  return result;

  await new Promise( ( resolve, reject ) => {
    const req = https.request( options, ( response ) => {
      result.statusCode = response.statusCode;
      result.rateLimitUsed = parseInt( response.headers[ "x-ratelimit-used" ], 10 );
      result.rateLimitRemaining = parseInt( response.headers[ "x-ratelimit-remaining" ], 10 );
      response.setEncoding( "utf8" );

      let data = "";
      response.on( "data", chunk => {
        data += chunk;
      } );

      response.on( "end", () => {
        if ( response.statusCode !== 200 ) {
          result.error = JSON.parse( data );
        }
        else {
          result.data = JSON.parse( data );
        }
        resolve();
      } );
    } ).on( "error", error => {
      result.error = error;
      reject();
    } );

    req.end();
  } );

  return result;
};

( async () => {
  let result
  try {
    result = await getLevelData();
  }
  catch ( error ) {
    console.log( "CATCH" );
    console.log( error );
  }

  ( { data, statusCode, error, message, rateLimitRemaining, rateLimitUsed } = result );

  if ( !result.data ) {
    // handle missing data
    console.log( "MISSING DATA" );
    return;
  }

  console.log( { error, statusCode, message, rateLimitRemaining, rateLimitUsed } );

  const version = data.version;
  const levelLength = Object.values( data.data ).length;
  console.log( { version, levelLength } );

  const dataBin = Buffer.from( JSON.stringify( data ) ).toString( "hex" );

  // save the settings file as a binary
  fs.writeFileSync(
    path.join( __dirname, "../src/dustkid-data/filtered-metadata.bin" ),
    dataBin,
  );
} )();
