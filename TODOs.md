# TODOs
- In theory, people could go through all maps in a pool. If this happens, I guess the run must be ended with a special message...?
- Don't allow going to any other page, when a run is going
  - Of course, remove the settings route during runs
- Allow an easy way to import dustkid level data. We don't really want people mass-updating this themselves (or atleast, even just two people at the same time), so instead maybe we can just update it once ourselves, and then just post in the Discord some file.
- Figure out how to go about using seeds, when people can configure different
  rules... Perhaps we should generate seeds based on settings ourselves? But how
  would we make that always pick the appropriate maps with certain
  configurations?
  - We could generate a string representation of all the settings in a way, and
    add in an extra field for that! This is also a way we could have people
    share settings, instead of using files
      - This could even be something a simple as a comma separated string, like:
        "20,1,2000,true,false", though this could become very large as we add
        more settings. A hash would probably make more sense.
- Maybe have the settings in a grid, two columns (so two per row)
- Add a "X" to empty out the "seed" setting
- Add a "copy to clipboard" for the seed as well
- Add a settings icon in the bottom right/top right
- Figure out how to actually store data in Windows, since it doesn't seem like the JSON file is being permanently written to
  - If we change it, it seems to change while the app is active, but quit and
    restart is just the original again
- Add a setting to not include CMP maps
- Change the cursor to a "moving cursor" when hovering over the draggable timer container
  - Seems to have a problem, it doesn't change the cursor exactly for containers
    with -webkit-app-region: drag;
- Maybe add a setting to configure skip delay
  - Would need to add a tooltip as well to explain this one, which would be a
    nice little thing to learn to make in CSS I suppose, but a bit of extra work
- Add some little animations here and there (not too much)
  - Maybe add the "let's dust" thing to the start
  - Possibly do something with the SS count going up (rolling the number in, for example)
  - Maybe roll in the level name and author or something (or have a fade-in for it)
- Maybe add something next to the SS counter (could even be a skip counter,
  though no idea what we'd put as an icon for that)
- Close the splits file watcher when the timer ends (I guess add an event emitter somehow)
- Use Node Global Hotkeys if possible, since it doesn't block keys system-wide
  - It doesn't seem to work for Linux, so for Linux use NW Hotkeys
- Allow viewing of personal bests per setting
- Stylize the timer more
  - Could add some kind of bar indicating time left under the timer (like a
    sliding bar) the entire time, or just in the last minute or so
  - Perhaps stylize every minute gone by (with some colour change for example, or blinking)
- Stylize the "score screen"
- Maybe add the ability to pause runs? (meh)

# Done
- Change the way things are reset
- Add configuration window for all settings
- Add a toolbar icon for the app
- Add a "no skips" setting, which changes the skips text to "no skips" (greyed
  out with the same styling as 0 remaining)
  - If this is on, hide all other skips settings inputs
- Have the SS icon do some animation after getting an SS
  - Alternatively, just have the number next to it do some animation (since we
    already have the SS icon flipping on startup, and on page load)
- To alleviate the dumbass text disappearing on scroll, when tags are outside of
  the visible range (NWjs why), perhaps just have multiple pages of settings
  instead of the user being able to scroll, or alternatively just automatically
  resize the window to have everything fit on screen (fixed by going to a previous version of NW binaries (0.52.2, same as the SDK in-use))
