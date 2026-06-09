import {obscureMainWindow} from "./ui.js";

import {init} from "../initialize.js";

export const switchPage = (currentPage, destination) => {
  const split = destination.split("/");
  if (split.length === 1) {
    destination = split[ 0 ];
  }
  else {
    destination = split[ split.length - 1 ];
  }

  if (destination === "settings.html") {
    const disablePointerEvents = true;
    const revertObscuration = obscureMainWindow(disablePointerEvents);

    // open a new window with the settings configuration
    nw.Window.open("views/settings.html", {
      position: "center",
      width: 360,
      height: 470,
      frame: false,
      always_on_top: true,
      transparent: true,
      resizable: true,
      // hide the window initially, and only show it after focusing the window;
      // this way, we can e.g. resize / move the window without janky initial
      // visuals; this may be causing an issue on Windows
      show: false,
    }, function(win) {
      if (typeof win !== "undefined") {
        win.on("closed", function() {
          init();

          revertObscuration();
        });
        win.on("loaded", function() {
          // // move the settings window to the position of the main window
          // win.moveTo( currentWindow.x, currentWindow.y - 100 );
          win.show();
          win.focus();
        });
      }
    });

    return;
  }

  switch (currentPage) {
    case "settings.html": {
      // close the external settings window
      const settingsWindow = nw.Window.get();
      settingsWindow.close();
      break;
    }
  }

  window.location.href = destination;
};
