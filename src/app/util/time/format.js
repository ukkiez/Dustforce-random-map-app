import { isNum } from "../index.js";

export const msToHours = ( ms ) => {
  return Math.floor( ms / 3600000 );
};

export const msToMinutes = ( ms ) => {
  return Math.floor( ( ms / 60000 ) % 60 );
};

export const msToSeconds = ( ms ) => {
  return Math.floor( ( ms / 1000 ) % 60 );
};

export const msToTenths = ( ms ) => {
  return Math.floor( ( ms / 100 ) % 10 );
};

export const msToHundreths = ( ms ) => {
  return Math.floor( ( ms / 10 ) % 10 );
};

const formatHours = ( ms ) => {
  let hours = msToHours( ms );

  if ( hours === 0 ) {
    return;
  }

  return hours;
};

const formatMinutes = ( ms ) => {
  let hours = msToHours( ms );
  let minutes = msToMinutes( ms );

  if ( minutes === 0 ) {
    if ( hours ) {
      minutes = "00";
    }
    else {
      return;
    }
  }
  else if ( minutes < 10 ) {
    minutes = "0" + minutes;
  }
  return minutes;
};

const formatSeconds = ( ms ) => {
  let seconds = msToSeconds( ms );
  let overAMinute = ( ms >= 60000 );

  if ( seconds === 0 ) {
    if ( overAMinute ) {
      seconds = "00";
    }
    else {
      seconds = "0";
    }
  }
  else if ( overAMinute && seconds < 10 ) {
    // make sure that we see e.g. 01:05 instead of 01:5
    seconds = "0" + seconds;
  }
  return "" + seconds;
};

const formatTenths = ( ms ) => {
  let tenths = msToTenths( ms );

  if ( tenths === 0 ) {
    return "0";
  }

  return "" + tenths;
};

const formatHundreths = ( ms ) => {
  let hundreths = msToHundreths( ms );

  if ( hundreths === 0 ) {
    return "0";
  }

  return "" + hundreths;
};

export const formatTime = ( ms, withTenths, withHundreths, isDiff ) => {
  if ( !isNum( ms ) ) {
    return "-";
  }

  let timeSave;
  if ( isDiff ) {
    timeSave = ( ms > 0 );
  }

  // set the ms to positive to make the formatting logic simpler
  ms = Math.abs( ms );

  let hours = formatHours( ms );
  let minutes = formatMinutes( ms );
  let seconds = formatSeconds( ms );
  let tenths;
  let hundreths;

  if ( withTenths ) {
    tenths = formatTenths( ms );
  }
  if ( withHundreths ) {
    hundreths = formatHundreths( ms );
  }

  let string = "";
  if ( hours ) {
    string += `${ hours }:`;
  }
  if ( minutes ) {
    string += `${ minutes }:`;
  }
  string += `${ seconds }`;

  if ( withTenths ) {
    string += `.${ tenths }`;
  }

  if ( withHundreths ) {
    string += hundreths;
  }

  if ( isDiff ) {
    // show whether it is saved or lost time
    if ( timeSave ) {
      string = "-" + string;
    }
    else {
      string = "+" + string;
    }
  }

  return string;
};

export const formatMSToHumanReadable = ( ms, withMs = false ) => {
  const seconds = Math.floor( ( ms / 1000 ) % 60 );
  const minutes = Math.floor( ( ms / 1000 / 60 ) % 60 );
  const hours = Math.floor( ms / 1000 / 60 / 60);

  const pad = ( numberString, size ) => {
    let padding = numberString;
    while ( padding.length < size ) {
      padding = `0${ padding }`;
    }
    return padding;
  }

  const numbers = [
    pad( hours.toString(), 2 ),
    pad( minutes.toString(), 2),
    pad( seconds.toString(), 2 ),
  ];
  if ( hours < 1 ) {
    numbers.shift();
  }

  let humanized = numbers.join( ":" );

  if ( withMs ) {
    let lastDigits = ms.toString().slice( -3 );
    humanized += ( "." + pad( lastDigits, 3 ) );
  }

  return humanized;
}
