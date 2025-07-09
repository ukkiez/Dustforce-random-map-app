const https = require( "https" );

const options = {
  method: "GET",
  hostname: "api.github.com",
  path: "/repos/ukkiez/Dustforce-random-map-app/contents/package.json",
  headers: {
    "Accept": "application/vnd.github.raw+json",
    "User-Agent": "random-map-app",
    "X-GitHub-Api-Version": "2022-11-28"
  }
};

const getLevelData = async () => {
  let result;
  let rateLimitRemaining = 0;
  let rateLimitUsed = 0;
  await new Promise( resolve => {
    const req = https.request( options, ( response ) => {
      console.log( response.statusCode );
      console.log( response.headers );
      rateLimitUsed = parseInt( response.headers[ "x-ratelimit-used" ], 10 );
      rateLimitRemaining = parseInt( response.headers[ "x-ratelimit-remaining" ], 10 );
      response.setEncoding( "utf8" );

      let data = "";
      response.on( "data", chunk => {
        data += chunk;
      } );

      response.on( "end", () => {
        setTimeout( () => {
          result = JSON.parse( data );
          resolve();
        }, 2000 );
      } );

    } ).on( "error", e => {
      console.error( e );
    } );

    req.end();
  } );

  console.log( { rateLimitRemaining } );
  console.log( { rateLimitUsed } );
  return result;
};

( async () => {
  const result = await getLevelData();
  console.log( { result } );
} )();
