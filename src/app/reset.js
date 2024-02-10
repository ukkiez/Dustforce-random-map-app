import { init } from "./initialize.js";

import { debounce } from "./util/index.js";
import { removeClass } from "./util/dom.js";

export const reset = debounce( () => {
  removeClass( document.body, "challenge" );

  init();
}, 100, true );
