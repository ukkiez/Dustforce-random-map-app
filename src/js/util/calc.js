export const toHours = ( ms ) => {
  return Math.floor( ms / 3600000 );
};

export const toMinutes = ( ms ) => {
  return Math.floor( ( ms / 60000 ) % 60 );
};

export const toSeconds = ( ms ) => {
  return Math.floor( ( ms / 1000 ) % 60 );
};

export const toTenths = ( ms ) => {
  return Math.floor( ( ms / 100 ) % 10 );
};

export const toHundreths = ( ms ) => {
  return Math.floor( ( ms / 10 ) % 10 );
};
