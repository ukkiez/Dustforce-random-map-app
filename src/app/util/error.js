import { addClass, removeClass } from "./dom.js";
import { delay } from "./index.js";
import { obscureMainWindow } from "./ui.js";

export const showError = async ( { error, fatal = false, obscure = false, delay: delayMS = 5000, callback = function(){} } ) => {
  const { name, message } = error;

  let revertObscuration = function() {};
  if ( obscure || fatal ) {
    let disablePointerEvents = true;
    revertObscuration = obscureMainWindow( disablePointerEvents );
  }

  const errorContainerEl = document.getElementById( "error-container" );
  removeClass( errorContainerEl, "hidden" );
  errorContainerEl.children[0].innerText = `An Error Has Occurred [${ name }]`;
  errorContainerEl.children[1].innerText = message;

  const _callback = () => {
    addClass( errorContainerEl, "hidden" );
    revertObscuration();
    callback();
  }

  await delay( delayMS, _callback );
}
