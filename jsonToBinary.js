const fs = require( "fs" );

const defaultSettingsPath = "./src/settings/";

const modes = JSON.stringify( require( "./src/settings/modes.json" ) );
const defaultSettings = JSON.stringify( require( "./src/settings/default-settings.json" ) );
const defaultPB = JSON.stringify( require( "./src/user-data/personal-bests.json" ) );
const filteredMetadata = JSON.stringify( require( "./src/dustkid-data/filtered-metadata.json" ) );

const modesB = Buffer.from( modes ).toString( "hex" );
const settingsB = Buffer.from( defaultSettings ).toString( "hex" );
const pbB = Buffer.from( defaultPB ).toString( "hex" );
const filteredMetadataB = Buffer.from( filteredMetadata ).toString( "hex" );

// create the default settings files in hex format
fs.writeFileSync( "./src/settings/modes.bin", modesB );
fs.writeFileSync( "./src/user-data/settings.bin", settingsB );
fs.writeFileSync( "./src/user-data/personal-bests.bin", pbB );
fs.writeFileSync( "./src/dustkid-data/filtered-metadata.bin", filteredMetadataB );


// console.log( "\n" );
// const bin = fs.readFileSync( "./src/settings/modes.bin", "utf8" );
// console.log( Buffer.from( bin, "hex" ).toString( "utf8" ) );
