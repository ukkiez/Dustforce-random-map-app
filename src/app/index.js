// remove the native window shadow, as that will lead to the unfocussed window
// having a strange underlaying shadow effect of the last seen HTML (annoying
// Chromium bug probably); there's an option for this in the window manifest
// (package.json) but that doesn't appear to work
nw.Window.get().setShadow( false ); // eslint-disable-line no-undef

// prevent drag-and-drop behaviour (e.g. dragging an HTML file into the app,
// which by default would display that page instead)
document.body.addEventListener( "dragover", function( e ){
  e.preventDefault();
  e.stopPropagation();
}, false );

document.body.addEventListener( "drop", function( e ){
  e.preventDefault();
  e.stopPropagation();
}, false );

import "./initialize.js";
