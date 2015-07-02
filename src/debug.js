const DEBUG_ENABLED = true;

export function debug(args) {
  if (DEBUG_ENABLED) {
    console.log(args);
  }
};
