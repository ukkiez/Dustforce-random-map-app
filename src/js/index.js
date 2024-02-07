import { log } from "./util/log.js";

Neutralino.init();

// initially the application window is hidden, and is only unhidden after
// Neutralino is initialized to avoid white flashing on startup
Neutralino.events.on( "ready", async () => {
  log( "OnReady" );
  try {
    await Neutralino.window.show();
    import( "./initialize.js" );
  }
  catch ( error ) {
    log( error.message );
  }
});

Neutralino.events.on( "windowClose", async () => {
  const split = window.location.href.split( "/" );
  let destination = "";
  if ( split.length === 1 ) {
    destination = split[ 0 ];
  }
  else {
    destination = split[ split.length - 1 ];
  }

  if ( destination === "settings.html" ) {
    try {
      let windowSettings = await Neutralino.storage.getData( "windowSettings" );
      if ( windowSettings ) {
        windowSettings = JSON.parse( windowSettings );
        if ( windowSettings?.size ) {
          await Neutralino.window.setSize( {
            width: windowSettings.size.width,
            height: windowSettings.size.height,
            maxWidth: windowSettings.size.maxWidth,
            maxHeight: windowSettings.size.maxHeight,
          } );
        }
        if ( windowSettings?.position ) {
          await Neutralino.window.move( windowSettings.position.x, windowSettings.position.y );
        }
      }
    }
    catch ( error ) {
      log( error.message );
    }

    for ( const child of document.body.children ) {
      child.style.display = "none";
    }

    // insert some (placeholder) parting text
    const h = document.createElement( "h1" );
    const h2 = document.createElement( "h2" );
    const h3 = document.createElement( "h3" );
    const h4 = document.createElement( "h4" );
    const h5 = document.createElement( "h5" );
    const h6 = document.createElement( "h6" );
    const text = document.createTextNode( "Exiting..." );
    const text2 = document.createTextNode( "Exiting..." );
    const text3 = document.createTextNode( "Exiting..." );
    const text4 = document.createTextNode( "Exiting..." );
    const text5 = document.createTextNode( "Exiting..." );
    const text6 = document.createTextNode( "Exiting..." );
    h.appendChild( text );
    h2.appendChild( text2 );
    h3.appendChild( text3 );
    h4.appendChild( text4 );
    h5.appendChild( text5 );
    h6.appendChild( text6 );
    document.body.appendChild( h );
    document.body.appendChild( h2 );
    document.body.appendChild( h3 );
    document.body.appendChild( h4 );
    document.body.appendChild( h5 );
    document.body.appendChild( h6 );

    await new Promise( r => {
      setTimeout( () => {
        r();
      }, 500 );
    } );
  }

  await Neutralino.app.exit();
} );
