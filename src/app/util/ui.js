// adds an opaque black overlay to the main window, returns a handler function
// to revert the changes
export const obscureMainWindow = ( disablePointerEvents ) => {
  document.getElementById( "obscuring-overlay" ).style.display = "block";
  if ( disablePointerEvents ) {
    document.body.style[ "pointer-events" ] = "none";
  }

  const reversionHandler = ( callback = function(){} ) => {
    document.getElementById( "obscuring-overlay" ).style.display = "none";

    if ( disablePointerEvents ) {
      document.body.style[ "pointer-events" ] = "auto";
    }

    callback();
  };

  return reversionHandler;
};
