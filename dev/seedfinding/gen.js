const fs = require( "fs" );

// see: https://stackoverflow.com/a/68523152/11417877

function mulberry32(a) {
  return function() {
    let t = a += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  }
}

function cyrb128(str) {
  let h1 = 1779033703, h2 = 3144134277,
      h3 = 1013904242, h4 = 2773480762;

  for ( let i = 0, k; i < str.length; i++ ) {
    k = str.charCodeAt(i);
    h1 = h2 ^ Math.imul(h1 ^ k, 597399067);
    h2 = h3 ^ Math.imul(h2 ^ k, 2869860233);
    h3 = h4 ^ Math.imul(h3 ^ k, 951274213);
    h4 = h1 ^ Math.imul(h4 ^ k, 2716044179);
  }

  h1 = Math.imul(h3 ^ (h1 >>> 18), 597399067);
  h2 = Math.imul(h4 ^ (h2 >>> 22), 2869860233);
  h3 = Math.imul(h1 ^ (h3 >>> 17), 951274213);
  h4 = Math.imul(h2 ^ (h4 >>> 19), 2716044179);

  return [(h1^h2^h3^h4)>>>0, (h2^h1)>>>0, (h3^h1)>>>0, (h4^h1)>>>0];
}

const seededRandom = ( { rng = null, seed = "apples" } = {} ) => {
  rng = rng || mulberry32(cyrb128(seed)[0]);

  const randFloat = (lo, hi, defaultHi=1) => {
    if (hi === undefined) {
      hi = lo === undefined ? defaultHi : lo;
      lo = 0;
    }

    return rng() * (hi - lo) + lo;
  };

  const randInt = (lo, hi) => Math.floor(randFloat(lo, hi, 2));

  const shuffle = a => {
    for (let i = a.length - 1; i > 0; i--) {
      const j = randInt(i + 1);
      const x = a[i];
      a[i] = a[j];
      a[j] = x;
    }
  };

  return { randFloat, randInt, shuffle };
};

const levelDataB = fs.readFileSync("../../src/dustkid-data/filtered-metadata.bin", "utf8");
const levelDataJSON = JSON.parse(Buffer.from( levelDataB, "hex" ).toString( "utf8" ));
const cmpLevels = require("../../src/dustkid-data/cmp-levels.json" );

// populate the map pool
const mapPool = [];
const entries = Object.entries( levelDataJSON.data );
for (let i = 0; i < entries.length; i++) {
  const [ levelFilename, metadata ] = entries[i];

  if ( cmpLevels.includes( levelFilename ) ) {
    // don't include cmp levels, as the user set them to be off
    continue;
  }

  const { ss_count, fastest_time, author, atlas_id } = metadata;
  if ( ss_count >= 10 && ss_count <= 500 && fastest_time <= 45000 ) {
    mapPool.push( {
      author,
      fastest_time,
      levelFilename
    } );
  }
}

const createMapPool = ( seed, sliceEnd = null ) => {
  if ( typeof seed === "number" ) {
    seed = `${ seed }`;
  }

  // initialize the seeder
  const { shuffle } = seededRandom( { seed } );

  const clonedMapPool = [ ...mapPool ];

  // shuffle the map pool, by the given seed, which consequently means that
  // when we pick a level below we'll simply do it in order, start to end
  shuffle( clonedMapPool );

  if ( !sliceEnd ) {
    return clonedMapPool;
  }

  return clonedMapPool.slice(0, sliceEnd);
}

/*
  Check set of seeds
*/
// const arr = [
//   { seed: 1009635 },
//   { seed: 3751530 },
//   { seed: 3811581 },
//   { seed: 5669832 },
//   { seed: 6867957 },
//   { seed: 8109153 },
// ];
// for ( const { seed } of arr ) {
//   const pool = createMapPool( seed, 60 );
//   if (pool.every(e => e.author === pool[0].author)) {
//     console.log({seed}, pool[0].author);
//     console.log( pool );
//   }
// }

/*
  Check individual seed
*/
// const pool = createMapPool( "3751530", 60 );
// for ( let i = 0; i < pool.length; i++ ) {
//   console.log( i, pool[ i ] );
// }

/*
  Find seeds
*/
const START = 25_000_000;
const TOTAL = 10_000_000;
const LOG_STEP = 100000;
for ( let i = START; i < (START + TOTAL); i++ ) {
  // generate a random 8-digit seed if the user didn't provide a seed
  // const seed = `${ Math.floor( Math.random() * 90000000 ) + 10000000 }`;

  const seed = i;
  const pool = createMapPool( seed, 50 );
  let counts = {
    naegleria: 0,
    slish: 0,
    brilhante: 0,
    varredor: 0,
    ukkiez: 0,
    xiamul: 0,
    jvcpro: 0,
    "jdude0822": 0,
    twinkieswf: 0,
    linley: 0,
    lgb: 0,
    "dcbc1000": 0,
    "dcbc2000": 0,
    "dcbc3000": 0,
    spam: 0,
    ibums: 0,
    riokaii: 0,
    holykau: 0,
  };
  const levels = [];

  for ( const e of pool ) {
    for ( const key of Object.keys( counts ) ) {
      if ( ( new RegExp( key, "i" ) ).test( e.levelFilename ) || e.author.toLowerCase() === key ) {
        counts[ key ]++;
        levels.push( e.levelFilename );
      }
    }
  }

  const totalCount = new Set( levels ).size;
  if ( totalCount >= 25 ) {
    console.log( { seed, count: totalCount, levels } );
  }

  if ( i > 0 && i % LOG_STEP === 0 ) {
    console.log( "Step: ", i );
  }
}
console.log( "Done." );
