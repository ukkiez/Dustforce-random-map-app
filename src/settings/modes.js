// store predefined modes that we can compare to the user-configured ones; NOTE
// that we don't use a .json file as we'd have to manually add that to the
// distribution bundle and expose it clearly to the user, which would open it up
// for hacking the settings easily
export const modes = {
  classic: {
    seed: "",
    startTime: 3600000,
    minSSCount: 10,
    fastestSSTime: 90000,
    skips: true,
    freeSkips: 1,
    freeSkipAfterXSolvedLevels: 0,
    CMPLevels: false
  },

  rapid: {
    seed: "",
    startTime: 1800000,
    minSSCount: 10,
    fastestSSTime: 45000,
    skips: true,
    freeSkips: 1,
    freeSkipAfterXSolvedLevels: 0,
    CMPLevels: false
  },

  blitz: {
    seed: "",
    startTime: 900000,
    minSSCount: 10,
    fastestSSTime: 20000,
    skips: true,
    freeSkips: 1,
    freeSkipAfterXSolvedLevels: 0,
    CMPLevels: false
  },

  casual: {
    seed: "",
    startTime: 3600000,
    minSSCount: 40,
    fastestSSTime: 120000,
    skips: true,
    freeSkips: 1,
    freeSkipAfterXSolvedLevels: 5,
    CMPLevels: false
  },

  hard: {
    seed: "",
    startTime: 3600000,
    minSSCount: 1,
    fastestSSTime: 180000,
    skips: false,
    freeSkips: 0,
    freeSkipAfterXSolvedLevels: 0,
    CMPLevels: false
  }
}
