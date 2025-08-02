import { EventEmitter } from "events";

import { addClass, removeClass } from "../util/dom.js";
import { formatTime } from "../util/time/format.js";

export class Timer extends EventEmitter {
  timerElement;

  // milliseconds
  time = 0;
  interval = 33;
  expected;

  withTenths = false;
  withHundreths = false;

  countingDown = true;
  elapsedTime = 0;

  hasStarted = false;
  stopped = false;

  finished = false;

  updateTimeout = null;

  constructor( { ...options } ) {
    super();

    const { timerElementId, withTenths, withHundreths, startTime, interval, countingDown = true } = options;

    this.timerElement = document.getElementById( timerElementId );

    this.withTenths = withTenths;
    this.withHundreths = withHundreths;
    this.time = ( startTime || this.time );
    this.interval = ( interval || this.interval );
    this.countingDown = countingDown;
  }

  start() {
    if ( this.hasStarted || this.finished ) {
      return;
    }

    this.hasStarted = true;

    addClass( this.timerElement, "running" );

    // reset the expected date
    this.expected = Date.now() + this.interval;

    this.update();
  }

  update() {
    if ( !this.hasStarted || this.stopped ) {
      return;
    }

    const drift = Date.now() - this.expected;

    if ( this.countingDown ) {
      this.time -= this.interval;
    }
    else {
      this.time += this.interval;
    }

    this.elapsedTime += this.interval;

    this.expected += this.interval;

    let hundredths = this.withHundreths;
    if ( this.time >= ( 1000 * 60 * 60 * 10 ) ) {
      // reduce the amount of space the timer needs so it fits easier on the
      // screen
      hundredths = false;
    }

    this.timerElement.innerHTML = formatTime( this.time, this.withTenths, hundredths );

    if ( this.hasStarted ) {
      if ( this.countingDown && this.time <= 0 ) {
        this.finish();
        return;
      }

      // update the timer at ~30fps (33.3ms), taking into account possible drift
      this.updateTimeout = setTimeout( () => {
        this.update();
      }, Math.max( 0, this.interval - drift ) );
    }
  }

  stop() {
    if ( !this.hasStarted || this.finished ) {
      return;
    }

    addClass( this.timerElement, "stopped" );

    this.stopped = true;
  }

  resume() {
    if ( this.finished ) {
      return;
    }

    removeClass( this.timerElement, "stopped" );

    if ( !this.stopped ) {
      this.start();
      return;
    }

    // reset the expected date
    this.expected = Date.now() + this.interval;

    this.stopped = false;

    this.update();
  }

  reset( restart ) {
    if ( !this.finished && !this.hasStarted ) {
      return;
    }

    this.hasStarted = false;
    clearTimeout( this.updateTimeout );

    this.time = 0;

    let text = "0";
    if ( this.withTenths ) {
      text += ":0";

      if ( this.withHundreths ) {
        text += "0";
      }
    }
    this.timerElement.innerHTML = text;

    this.finished = false;
    this.stopped = false;

    removeClass( this.timerElement, "stopped" );

    if ( restart ) {
      this.start();
    }
  }

  finish( _preventEmit = false ) {
    if ( !this.hasStarted ) {
      return;
    }

    this.hasStarted = false;

    this.finished = true;

    this.timerElement.innerHTML = formatTime( 0, this.withTenths, this.withHundreths );

    if ( !_preventEmit ) {
      this.emit( "finished" );
    }
  }
}
