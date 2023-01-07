import { addClass, removeClass } from "../util/dom.js";
import { formatTime } from "../util/format.js";

export class Timer {
  timerElement;
  diffElement;

  timeToCompare;

  // milliseconds
  time = 0;
  interval = 33;
  expected;

  tenths = false;
  hundreths = false;

  hasStarted = false;
  stopped = false;

  finished = false;

  constructor( { ...options } ) {
    const { timerElementId, diffElementId, timeToCompare, tenths, hundreths, startTime = 3600000, interval, _countdown = true } = options;

    this.timerElement = document.getElementById( timerElementId );
    if ( diffElementId ) {
      this.diffElement = document.getElementById( diffElementId );
    }
    this.timeToCompare = timeToCompare;

    this.tenths = tenths;
    this.hundreths = hundreths;
    this.time = ( startTime || this.time );
    this.interval = ( interval || this.interval );
  }

  start() {
    if ( this.hasStarted || this.finished ) {
      return;
    }

    this.hasStarted = true;

    // completely overwrite the classNames to ensure we didn't miss one
    this.timerElement.className = "running";

    // reset the expected date
    this.expected = Date.now() + this.interval;

    this.update();
  }

  update() {
    if ( !this.hasStarted ) {
      return;
    }

    const drift = Date.now() - this.expected;

    this.time -= this.interval;

    this.expected += this.interval;

    this.timerElement.innerHTML = formatTime( this.time, this.tenths, this.hundreths );

    if ( this.hasStarted ) {
      if ( this.time <= 0 ) {
        this.timerElement.innerHTML = formatTime( 0, this.tenths, this.hundreths );
        return;
      }

      // update the timer at ~30fps (33.3ms), taking into account possible drift
      setTimeout( () => {
        this.update();
      }, Math.max( 0, this.interval - drift ) );
    }
  }

  // stop() {
  //   if ( !this.hasStarted ) {
  //     return;
  //   }

  //   this.stopped = true;
  // }

  // resume() {
  //   if ( !this.stopped ) {
  //     return;
  //   }

  //   // reset the expected date
  //   this.expected = Date.now() + this.interval;

  //   this.stopped = false;

  //   this.update();
  // }

  reset( restart ) {
    if ( !this.finished && !this.hasStarted ) {
      return;
    }

    this.hasStarted = false;

    this.time = 0;

    let text = "0";
    if ( this.tenths ) {
      text += ":0";

      if ( this.hundreths ) {
        text += "0";
      }
    }
    this.timerElement.innerHTML = text;

    if ( this.diffElement ) {
      this.diffElement.innerHTML = "";
    }

    this.finished = false;

    if ( restart ) {
      this.start();
    }
  }

  finish() {
    if ( !this.hasStarted ) {
      return;
    }

    this.hasStarted = false;

    this.finished = true;
  }
}
