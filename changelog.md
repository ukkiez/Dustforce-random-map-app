# Changelog

- [v1.0.1](#v1.0.1-h)
- [v1.0.2](#v1.0.2-h)

___
### <a id="v1.0.1-h"></a> v1.0.1
#### Major
- Fix `split.txt` parsing on Win32 for old levels with spaces in them.
- Improve initial app setup, double-checking `split.txt` can be found.
- Add level ban list, see: [exclusions](https://github.com/ukkiez/Dustforce-random-map-app/blob/master/level-filtering/exclusions.js).
#### Minor
- Show version number.
- Add the last level that a run ended on to the run review.
- Fix average score time calculation on resetting.
- Adjust score screen element positioning.
- Remove score screen final score text green colouring on PB.

___
### <a id="v1.0.2-h"></a> v1.0.2
#### Major
- Maps are now pre-installed before and during runs to mitigate map download times.
- Added "any%" run category. Points in an any% run are acquired by completing
  levels regardless of score – SS'ing levels will give a skip.
- The timer during a run now pauses for a fixed number of seconds, to account for loading time between levels.
#### Minor
- Remove extra RMA header in setup page.
- Seeded runs now no longer changes the displayed mode to "Custom Mode" even if
  the rest of the settings are the same as one of the default modes.
