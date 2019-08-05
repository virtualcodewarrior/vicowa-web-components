import { webComponentBaseClass } from "../third_party/web-component-base-class/src/webComponentBaseClass.js";
import "../vicowa-string/vicowa-string.js";
import "../vicowa-icon/vicowa-icon.js";
import translator from "../utilities/translate.js";

const componentName = "vicowa-google-maps";

const mapQueue = [];

function initializeMap(p_MapsControl, p_Callback) {
	if (!p_MapsControl._map) {
		const doMap = () => {
			if (window.google.maps.LatLng) {
				const LatLng = new window.google.maps.LatLng(p_MapsControl.latitude, p_MapsControl.longitude);
				p_MapsControl._map = new window.google.maps.Map(p_MapsControl.$.map, {
					zoom: Math.max(0, p_MapsControl.zoom),
					center: LatLng,
					mapTypeId: p_MapsControl.type,
				});

				if (p_MapsControl.marker) {
					p_MapsControl.addMarker((p_Marker) => {
						if (p_MapsControl.info) {
							p_MapsControl.addInfo(null, p_MapsControl.info || p_MapsControl.marker, p_Marker);
						}
					}, p_MapsControl.latitude, p_MapsControl.longitude, p_MapsControl.marker);
				}
				if (p_MapsControl._map) {
					p_Callback(p_MapsControl._map);
				}
			}
		};
		if ("google" in window && window.google.maps && window.google.maps.LatLng) {
			doMap();
		} else {
			mapQueue.push(() => {
				if (!p_MapsControl._map) {
					doMap();
				} else {
					p_Callback(p_MapsControl._map);
				}
			});
		}
	} else {
		p_Callback(p_MapsControl._map);
	}
}

function locationUpdated(p_MapsControl) {
	initializeMap(p_MapsControl, (p_Map) => {
		const LatLng = new window.google.maps.LatLng(p_MapsControl.latitude, p_MapsControl.longitude);
		if (p_Map) {
			p_Map.panTo(LatLng);
		}
	});
}

function zoomUpdated(p_MapsControl) {
	initializeMap(p_MapsControl, (p_Map) => {
		if (p_Map) {
			p_Map.setZoom(Math.max(0, p_MapsControl.zoom));
		}
	});
}

function mapTypeUpdated(p_MapsControl) {
	initializeMap(p_MapsControl, (p_Map) => {
		if (p_Map && p_MapsControl.type in ["roadmap", "satellite", "hybrid", "terrain"]) {
			p_Map.setMapTypeId(p_MapsControl.type);
		}
	});
}

function loadMapAPI(p_MapControl) {
	if (!("google" in window)) {
		let googleAPI = document.querySelector('head script[src*="https://maps.googleapis.com"]');
		mapQueue.push(() => { locationUpdated(p_MapControl); });
		if (p_MapControl.apiKey && !googleAPI) {
			const whenGoogleAPILoaded = () => {
				mapQueue.forEach((p_Callback) => {
					p_Callback();
				});
			};

			if (!("google" in window)) {
				if (!googleAPI) {
					googleAPI = document.createElement("script");
					googleAPI.src = `https://maps.googleapis.com/maps/api/js?key=${p_MapControl.apiKey}`;
					document.querySelector("head").appendChild(googleAPI);
					googleAPI.onload = () => {
						googleAPI.notifyList.forEach((p_Callback) => { p_Callback(); });
					};
					googleAPI.notifyList = googleAPI.notifyList || [];
				}
				googleAPI.notifyList.push(whenGoogleAPILoaded);
			} else {
				whenGoogleAPILoaded();
			}
		}
	} else {
		locationUpdated(p_MapControl);
	}
}

/**
 * Class that represents the vicowa-button custom element
 * @extends webComponentBaseClass
 * @property {number} latitude Latitude of the map location to show
 * @property {number} longitude Longitude of the map location to show
 * @property {number} zoom The zoom level onto the map, bigger numbers mean more zoomed in
 * @property {string} marker Put a marker on the map withe the given text, the marker will be in the center of the map
 * @property {string} info More information to put in the marker
 * @property {string} apiKey The API key to use for the displayed maps(get this from google)
 * @property {string} type The type of the map to show, can be one of hybrid, roadmap, satellite, terrain
 */
class VicowaGoogleMaps extends webComponentBaseClass {
	static get is() { return componentName; }
	constructor() {
		super();
		this._activeTranslator = null;
		this._markers = [];
		this._infos = [];
	}

	static get properties() {
		return {
			latitude: {
				type: Number,
				value: 58.8282216,
				reflect: true,
				observer: locationUpdated,
			},
			longitude: {
				type: Number,
				value: -112.261819,
				reflect: true,
				observer: locationUpdated,
			},
			zoom: {
				type: Number,
				value: 0,
				reflect: true,
				observer: zoomUpdated,
			},
			marker: {
				type: String,
				value: "",
				reflect: true,
				observer: locationUpdated,
			},
			info: {
				type: String,
				value: "",
				reflect: true,
				observer: locationUpdated,
			},
			type: {
				type: String,
				value: "roadmap",
				reflect: true,
				observer: mapTypeUpdated,
			},
			apiKey: {
				type: String,
				value: "",
				reflect: false,
				observer: loadMapAPI,
			},
		};
	}

	addMarker(p_Callback, p_Latitude, p_Longitude, p_Title) {
		initializeMap(this, (p_Map) => {
			const marker = new window.google.maps.Marker({
				position: new window.google.maps.LatLng(p_Latitude, p_Longitude),
				map: p_Map,
				title: p_Title,
			});
			this._markers.push({
				marker,
				title: p_Title,
			});
			if (p_Callback) {
				p_Callback(marker);
			}
		});
	}

	addInfo(p_Callback, p_Content, p_LatitudeOrMarker, p_Longitude) {
		initializeMap(this, (p_Map) => {
			const infoWindow = new window.google.maps.InfoWindow({ content: p_Content });
			this._infos.push({
				info: infoWindow,
				content: p_Content,
			});
			this.updateTranslation();
			if (infoWindow && typeof p_LatitudeOrMarker !== "number") {
				infoWindow.open(p_Map, p_LatitudeOrMarker);
			} else if (p_LatitudeOrMarker && p_Longitude) {
				infoWindow.setPosition(new window.google.maps.LatLng(p_LatitudeOrMarker, p_Longitude));
				infoWindow.open(p_Map);
			}
			if (p_Callback) {
				p_Callback(infoWindow);
			}
		});
	}

	updateTranslation() {
		this._markers.forEach((p_Marker) => { p_Marker.marker.setTitle(this._activeTranslator.translate(p_Marker.title).fetch()); });
		this._infos.forEach((p_Info) => { p_Info.info.setContent(this._activeTranslator.translate(p_Info.content).fetch()); });
	}

	detached() {
		translator.removeTranslationUpdatedObserverOwner(this);
	}

	attached() {
		loadMapAPI(this);

		translator.addTranslationUpdatedObserver((p_Translator) => {
			this._activeTranslator = p_Translator;
			this.updateTranslation();
		}, this);
	}

	static get template() {
		return `
			<style>
				:host {
					display: block;
				}
			
				#map {
					position: relative;
					width: 100%;
					height: 100%;
				}
			</style>
			<div id="map"></div>
		`;
	}
}

window.customElements.define(componentName, VicowaGoogleMaps);
