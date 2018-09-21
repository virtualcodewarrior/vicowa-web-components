const features = {
	get webp() { return document.createElement("canvas").toDataURL("image/webp").indexOf("data:image/webp") === 0; },
	get touch() { return "ontouchstart" in window || ("DocumentTouch" in window && document instanceof window.DocumentTouch) || window.navigator.maxTouchPoints > 0 || window.navigator.msMaxTouchPoints > 0; },
};

export default features;
