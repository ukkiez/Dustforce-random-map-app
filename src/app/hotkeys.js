const fs = nw.require( "fs" );

const { hotkeys } = JSON.parse( fs.readFileSync( `${ global.__dirname }/user-data/configuration.json` ) );

export const listeners = {};

let _start;
let _replay;
let _reset;

let registered = false;

export const registerHotkeys = () => {
  if ( !registered ) {
    _start = new nw.Shortcut( { key: hotkeys.start } );
    _replay = new nw.Shortcut( { key: hotkeys.replay } );
    _reset = new nw.Shortcut( { key: hotkeys.reset } );

    listeners.start = _start;
    listeners.replay = _replay;
    listeners.reset = _reset;

    nw.App.registerGlobalHotKey( _start );
    nw.App.registerGlobalHotKey( _replay );
    nw.App.registerGlobalHotKey( _reset );

    registered = true;
  }
}

export const unregisterHotkeys = () => {
  if ( registered ) {
    nw.App.unregisterGlobalHotKey( _start );
    nw.App.unregisterGlobalHotKey( _replay );
    nw.App.unregisterGlobalHotKey( _reset );

    registered = false;
  }
}
