/* eslint no-var: off, object-shorthand: off, prefer-template: off, prefer-arrow-callback: off */

var userAgent = ("navigator" in window && "userAgent" in window.navigator && window.navigator.userAgent.toLowerCase()) || "";
var appVersion = ("navigator" in window && "appVersion" in window.navigator && window.navigator.appVersion.toLowerCase()) || "";

// try to figure out information about the browser this is running in.
var isOpera = (!!window.opr && !!window.opr.addons) || !!window.opera || window.navigator.userAgent.indexOf(" OPR/") >= 0; // Opera 8.0 and up
var isFirefox = typeof InstallTrigger !== "undefined"; // Firefox
var isFirefoxPrivateMode = isFirefox && !navigator.serviceWorker; // no service workers in firefox private mode
var isOldIE = /* @cc_on!@*/false || !!document.documentMode; // Internet Explorer 6-11
var isIE11 = !(window.ActiveXObject) && "ActiveXObject" in window; // Internet Explorer 11 explicitly
var isEdge = !isOldIE && !!window.StyleMedia; // Edge 20 and up
var isIE = isOldIE || isEdge; // internet explorer 6 to edge
var isChrome = !!window.chrome && (window.navigator.vendor === "Google Inc.") && !isOpera; // Chrome 1 and up
var isBlink = (isChrome || isOpera) && !!window.CSS; // Blink engine
var isIos = /iphone/i.test(userAgent) || /ipad/i.test(userAgent) || /ipod/i.test(userAgent); // ios
var isAndroid = /android/i.test(userAgent); // android
var isLinux = /linux/i.test(appVersion); // linux
var isMac = /mac/i.test(appVersion); // mac
var isWindows = /win/i.test(appVersion); // windows
var isTouch = "ontouchstart" in window || ("DocumentTouch" in window && document instanceof window.DocumentTouch) || window.navigator.maxTouchPoints > 0 || window.navigator.msMaxTouchPoints > 0; // touch enabled
var isSafari = Object.prototype.toString.call(window.HTMLElement).indexOf("Constructor") > 0 || (!isChrome && !isOpera && window.webkitAudioContext !== undefined); // Safari 3 and up: "[object HTMLElementConstructor]"
var isIFrame = window.self !== window.top; // running in an iFrame
var isCrossDomain = false;

try {
	isCrossDomain = window.top.location.hostname !== document.location.hostname;
} catch (p_Error) {
	// when we are cross domain the above code will throw
	isCrossDomain = true;
}

window.browserInfo = {
	// browser
	isOpera: isOpera,
	isFirefox: isFirefox,
	isFirefoxPrivateMode: isFirefoxPrivateMode,
	isOldIE: isOldIE,
	isIE11: isIE11,
	isEdge: isEdge,
	isIE: isIE,
	isChrome: isChrome,
	isBlink: isBlink,
	isSafari: isSafari,
	// operating system
	isIos: isIos,
	isAndroid: isAndroid,
	isLinux: isLinux,
	isMac: isMac,
	isWindows: isWindows,
	// touch support
	isTouch: isTouch,
	// special run conditions
	isIFrame: isIFrame,
	isCrossDomain: isCrossDomain,
};

window.attachInfoClass = function(p_TargetElement) {
	var info = [];
	if (isOpera) {
		info.push("opera");
	} else if (isSafari) {
		info.push("safari");
	} else if (isFirefox) {
		info.push("firefox");
	} else if (isEdge) {
		info.push("edge");
	} else if (isOldIE) {
		info.push("ie");
	} else if (isChrome) {
		info.push("chrome");
	}
	if (isTouch) {
		info.push("touch");
	}
	if (isIFrame) {
		info.push("iframe");
	}
	if (isCrossDomain) {
		info.push("xdomain");
	}

	p_TargetElement.setAttribute("class", (p_TargetElement.getAttribute("class") || "") + " " + info.join(" "));
};
