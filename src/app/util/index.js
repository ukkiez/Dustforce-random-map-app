export const isNum = ( value ) => {
  if ( typeof value === "string" ) {
    return false;
  }

  return ( !isNaN( parseInt( value, 10 ) ) );
};

// (modified from Underscore.js) returns a function, that, as long as it
// continues to be invoked, will not be triggered; the function will be called
// after it stops being called for N milliseconds; if `immediate` is passed,
// trigger the function on the leading edge, instead of the trailing
export const debounce = function( func, wait, immediate ) {
	let timeout;
	return function() {
		const context = this;
    const args = arguments;

		const later = function() {
			timeout = null;
			if ( !immediate ) {
        func.apply( context, args );
      }
		}

		const callNow = immediate && !timeout;
		clearTimeout( timeout );
		timeout = setTimeout( later, wait );
		if ( callNow ) {
      func.apply( context, args );
    }
	};
}

// limits the rate at which a function can be called
export const rateLimiter = function( func, ms = 100 ) {
  let waiting = false;

  return function() {
		const context = this;
    const args = arguments;

    if ( waiting ) {
      return;
    }

    func.apply( context, args );
    waiting = true;

    setTimeout(() => {
      waiting = false;
    }, ms );
  };
}

export const delay = ( ms, callback = function(){} ) => {
  return new Promise( ( resolve, reject ) => {
    setTimeout( () => {
      try {
        callback();
        resolve();
      }
      catch ( error ) {
        reject( error );
      }
    }, ms );
  } );
}
