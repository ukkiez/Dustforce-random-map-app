import { init, timers } from "./initialize.js";

import { debounce } from "./util/index.js";
import { removeClass } from "./util/dom.js";

export const reset = debounce( () => {
  for ( const timer of timers ) {
    if ( timer.hasStarted && !timer.finished ) {
      timer.finish();
    }

    timer.reset();
  }

  removeClass( document.body, "challenge" );

  init();
}, 100, true );
