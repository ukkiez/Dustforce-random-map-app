import { log } from "../util/log.js";

class FileWatcher {
  path;
  interval = 10;
  lastData;
  handler = function() {};
  finished;

  constructor( { ...options } ) {
    const { path, handler, interval } = options;
    this.path = path;
    this.handler = handler;

    if ( interval ) {
      this.interval = interval;
    }
  }

  async check() {
    if ( this.finished ) {
      return;
    }

    let data;
    try {
      data = await Neutralino.filesystem.readFile( this.path );
    }
    catch( error ) {
      log( error.message );
    }

    if ( data ) {
      if ( this.lastData && ( data !== this.lastData ) ) {
        this.handler( data );
      }

      this.lastData = data;
    }

    setTimeout(() => {
      this.check();
    }, this.interval );
  }

  init() {
    this.check();
  }

  stop() {
    this.finished = true;
  }
}

export default FileWatcher;
