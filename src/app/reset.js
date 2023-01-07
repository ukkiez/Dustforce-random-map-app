import { init, timers } from "./initialize.js";

export const reset = () => {
  for ( const timer of timers ) {
    if ( timer.hasStarted && !timer.finished ) {
      timer.finish();
    }

    timer.reset();
  }

  init();
}
