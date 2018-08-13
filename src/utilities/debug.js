/* eslint { 'no-console': 'off', 'no-empty-function': 'off' } */

// this replaces console, use this instead of console in our code
// this allows us to switch on and off actual console output
// if window.develop is defined it will just copy the console functions, else it replaces all console commands with empty functions
export default Object.keys(window.console).reduce((p_Previous, p_Key) => {
	p_Previous[p_Key] = (window.develop) ? window.console[p_Key] : () => {};
	return p_Previous;
}, {});
