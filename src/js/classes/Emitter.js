class Emitter {
  handlers = new Map();

  on( event, func ) {
    if ( !this.handlers.has( event ) ) {
      this.handlers.set( event, [] );
    }

    this.handlers.get( event ).push( func );
  }

  emit( event ) {
    const eventFunctions = this.handlers.get( event );
    for ( const func of eventFunctions ) {
      func();
    }
  }
}

export default Emitter;
