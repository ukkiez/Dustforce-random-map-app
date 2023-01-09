const { nwbuild } = require( "nw-builder" );

const build = async function() {
  await nwbuild( {
    srcDir: "./src/**/*",
    mode: "build",
    version: "0.52.2",
    flavor: "normal",
    platform: "osx64",
    outDir: "./dist",
    cache: true,
    cacheDir: "./cache",
    app: {
      name: "RMC",
      // icon: "./src/assets/s-complete-icon.png",
    },
  });
}

// nwbuild --platforms osx64 --srcDir src/* --buildDir dist/* src/* --flavor normal --cacheDir cache/ --version 0.52.2 --zip false

( async() => {
  await build();
} );
