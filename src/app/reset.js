import { init, timers } from "./initialize.js";

import { debounce } from "./util/index.js";

export const reset = debounce( () => {
  for ( const timer of timers ) {
    if ( timer.hasStarted && !timer.finished ) {
      timer.finish();
    }

    timer.reset();
  }

  init();
}, 100, true );
