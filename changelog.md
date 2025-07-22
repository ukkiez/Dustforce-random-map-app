# Changelog

- [v1.0.2](#v1.0.2-h)
- [v1.0.1](#v1.0.1-h)
___
### <a id="v1.0.2-h"></a> v1.0.2
### Major
- Added "Any%" run category. With Any%, rules are now reversed: points are acquired by completing
  levels regardless of score/finesse – SS'ing levels will give a free skip.
- Maps are now pre-installed before and during runs to mitigate map download times.
- The run timer now pauses for a fixed number of seconds between levels, to account for in-game loading times.
### Minor
- Remove extra RMA header in setup page.
- Seeded runs now no longer changes the displayed mode to "Custom Mode" even if
  the rest of the settings are the same as one of the default modes.
- Removed Casual and Hard modes from preset list.

___
### <a id="v1.0.1-h"></a> v1.0.1
### Major
- Fix `split.txt` parsing on Win32 for old levels with spaces in them.
- Improve initial app setup, double-checking `split.txt` can be found.
- Add level ban list, see: [exclusions](https://github.com/ukkiez/Dustforce-random-map-app/blob/master/level-filtering/exclusions.js).
### Minor
- Show version number.
- Add the last level that a run ended on to the run review.
- Fix average score time calculation on resetting.
- Adjust score screen element positioning.
- Remove score screen final score text green colouring on PB.
