export const isNum = ( value ) => {
  if ( typeof value === "string" ) {
    return false;
  }

  return ( !isNaN( parseInt( value, 10 ) ) );
};
