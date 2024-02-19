import cmpLevels from "../../dustkid-data/cmp-levels.json";
import { filteredMetadata as levelData } from "../../dustkid-data/filtered-metadata.js";

export const getMapPoolSize = ( settings ) => {
  const { minSSCount, fastestSSTime, CMPLevels } = settings;

  const mapPool = new Set();
  for ( const [ levelFilename, metadata ] of Object.entries( levelData ) ) {
    if ( !CMPLevels ) {
      if ( cmpLevels.includes( levelFilename ) ) {
        // don't include cmp levels, as the user set them to be off
        continue;
      }
    }

    const { ss_count, fastest_time } = metadata;
    if ( ss_count >= minSSCount && fastest_time <= fastestSSTime ) {
      mapPool.add( levelFilename );
    }
  }

  return mapPool.size;
}
