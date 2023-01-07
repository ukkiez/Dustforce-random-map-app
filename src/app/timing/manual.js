// import { timers } from "../initialize.js";

// // use nw.require() instead of require() or import to make it actually available
// const fs = nw.require( "fs" ); // eslint-disable-line no-undef

// const homedir = nw.require( "os" ).homedir(); // eslint-disable-line no-undef
// const splitFile = `${ homedir }/Library/Application Support/Steam/steamapps/common/Dustforce/Dustforce.app/Contents/Resources/split.txt`;

// const timerAction = ( action ) => {
//   for ( const timer of timers ) {
//     timer[ action ]();
//   }
// }

// const increment = ( _decrement = false ) => {
//   const counter = document.getElementById( "icon-text" );
//   let number = parseInt( counter.innerText, 10 );
//   if ( _decrement ) {
//     number--;
//   }
//   else {
//     number++;
//   }

//   if ( number < 0 ) {
//     number = 0;
//   }

//   counter.innerText = `${ number }`;
// };

// // register shortcuts
// /* eslint-disable no-undef */
// import shortcuts from "../../shortcuts.json";

// const _start = new nw.Shortcut( { key: shortcuts.start } );
// const _increment = new nw.Shortcut( { key: shortcuts.increment } );
// const _decrement = new nw.Shortcut( { key: shortcuts.decrement } );
// const _reset = new nw.Shortcut( { key: shortcuts.reset } );

// nw.App.registerGlobalHotKey( _start );
// nw.App.registerGlobalHotKey( _increment );
// nw.App.registerGlobalHotKey( _decrement );
// nw.App.registerGlobalHotKey( _reset );
// /* eslint-enable no-undef */

// _start.on( "active", function() {
//   timerAction( "start" );
// } );

// _increment.on( "active", function() {
//   increment();
// } );
// _decrement.on( "active", function() {
//   increment( true );
// } );

// _reset.on( "active", function() {
//   /* eslint-disable no-undef */
//   const win = nw.Window.get();

//   // before reloading unregister all hokeys, as there seems to be a bug where
//   // reloading the window keeps the hotkey registered but not actually bound to
//   // anything, leading to a "dead" key
//   nw.App.unregisterGlobalHotKey( _start );
//   nw.App.unregisterGlobalHotKey( _increment );
//   nw.App.unregisterGlobalHotKey( _decrement );
//   nw.App.unregisterGlobalHotKey( _reset );

//   // reload the entire app, a simple but effective way to reset the timers and
//   // potentially add new personal bests and best splits
//   win.reload();

//   // TODO: make it more visually appealing to reset the window, currently the
//   // CSS resetting sort of jerks the whole app around

//   /* eslint-enable no-undef */
// } );
