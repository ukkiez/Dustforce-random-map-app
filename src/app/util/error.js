import { addClass, removeClass } from "./dom.js";
import { delay } from "./index.js";
import { obscureMainWindow } from "./ui.js";

const path = nw.require( "path" );
const fs = nw.require( "fs" );

export const showError = async ( { error, endMessage = "", fatal = false, obscure = false, delay: delayMS = 5000, callback = function(){} } ) => {
  const { name, message } = error;

  let revertObscuration = function() {};
  if ( obscure || fatal ) {
    let disablePointerEvents = true;
    revertObscuration = obscureMainWindow( disablePointerEvents );
  }

  const errorContainerEl = document.getElementById( "error-container" );
  removeClass( errorContainerEl, "hidden" );
  errorContainerEl.children[0].innerText = `An Error Has Occurred [${ name }]`;
  errorContainerEl.children[1].innerText = `'${ message }'${ endMessage }`;

  const _callback = () => {
    addClass( errorContainerEl, "hidden" );
    revertObscuration();
    callback();
  }

  await delay( delayMS, _callback );
}

const errorLogFilepath = path.join( global.__dirname, "error.log" );
export const log = {
  error: ( error, fatal = false ) => {
    const appendLog = () => {
      fs.appendFile( errorLogFilepath, `\n${ fatal && "FATAL: " }[${ error.name || "GenericError" }] - ${ error.message }`, function() {} );
    };

    if ( !fs.existsSync( errorLogFilepath ) ) {
      fs.writeFile( errorLogFilepath, "", appendLog );
    }
    else {
      appendLog();
    }
  }
};
