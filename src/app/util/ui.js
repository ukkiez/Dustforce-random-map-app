import { addClass, removeClass } from "./dom.js";

// adds an opaque black overlay to the main window, returns a handler function
// to revert the changes
export const obscureMainWindow = ( disablePointerEvents, darkenedBackground = false ) => {
  const overlayEl = document.getElementById( "obscuring-overlay" );
  overlayEl.style.display = "block";
  if ( darkenedBackground ) {
    addClass( overlayEl, "darkened" );
  }
  if ( disablePointerEvents ) {
    document.body.style[ "pointer-events" ] = "none";
  }

  const reversionHandler = ( callback = function(){} ) => {
    overlayEl.style.display = "none";

    if ( disablePointerEvents ) {
      document.body.style[ "pointer-events" ] = "auto";
    }
    if ( darkenedBackground ) {
      removeClass( overlayEl, "darkened" );
    }

    callback();
  };

  return reversionHandler;
};
