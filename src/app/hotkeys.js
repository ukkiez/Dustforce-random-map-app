const { GlobalKeyboardListener } = nw.require( "node-global-key-listener" ); // eslint-disable-line no-undef
const keyboardListener = new GlobalKeyboardListener();

const _listeners = {
  start: null,
  replay: null,
  reset: null,
};

export const listeners = {
  start: ( callback ) => {
    _listeners.start = function( event ) {
      if ( event.state === "DOWN" && event.name === "EQUALS" ) {
        callback();
      }
    };

    keyboardListener.addListener( _listeners.start );
  },
  replay: ( callback ) => {
    _listeners.replay = function( event ) {
      if ( event.state === "DOWN" && event.name === "SEMICOLON" ) {
        callback();
      }
    }

    keyboardListener.addListener( _listeners.replay );
  },
  reset: ( callback ) => {
    _listeners.reset = function( event ) {
      if ( event.state === "DOWN" && event.name === "SQUARE BRACKET OPEN" ) {
        callback();
      }
    }

    keyboardListener.addListener( _listeners.reset );
  },
};

export const unregisterListeners = () => {
  for ( const listener of Object.values( _listeners ) ) {
    keyboardListener.removeListener( listener );
  }
}

import shortcuts from "../shortcuts.json";

/* eslint-disable no-undef */
const _start = new nw.Shortcut( { key: shortcuts.start } );
const _replay = new nw.Shortcut( { key: shortcuts.replay } );
const _reset = new nw.Shortcut( { key: shortcuts.reset } );

let registered = false;

export const registerHotkeys = () => {
  if ( !registered ) {
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
/* eslint-enable no-undef */

export const hotkeys = {
  _start,
  _replay,
  _reset
};
