const fs = nw.require( "fs" );
const path = nw.require( "path" );
const https = nw.require( "https" );

const IS_DEBUG = !!nw.process.env.DEBUG;

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

const fetchLevelData = async () => {
  const result = {
    data: null,
    statusCode: null,
    rateLimitRemaining: 0,
    rateLimitUsed: 0,
    error: null,
  };

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

export const syncLevelData = async ( currentVersion, callback = function(){} ) => {
  const result = await fetchLevelData();

  const { data, statusCode, error, message, rateLimitRemaining, rateLimitUsed } = result;

  if ( !result.data ) {
    throw new Error( "Missing level synchronization data." );
  }

  const version = data.version;
  const levelLength = Object.values( data.data ).length;

  if ( IS_DEBUG ) {
    console.log( { error, statusCode, message, rateLimitRemaining, rateLimitUsed } );
    console.log( { version, levelLength } );
  }

  let wasNewData = false;

  if ( version !== currentVersion ) {
    const dataBin = Buffer.from( JSON.stringify( data ) ).toString( "hex" );

    // save the settings file as a binary
    fs.writeFileSync(
      path.join( global.__dirname, "dustkid-data/filtered-metadata.bin" ),
      dataBin,
    );

    wasNewData = true;
  }

  // emulate some delay for the user
  setTimeout(() => {
    callback( wasNewData, result );
  }, 3000);
};
