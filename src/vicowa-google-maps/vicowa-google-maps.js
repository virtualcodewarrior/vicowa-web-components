import { WebComponentBaseClass } from '/third_party/web-component-base-class/src/web-component-base-class.js';
import '../vicowa-string/vicowa-string.js';
import '../vicowa-icon/vicowa-icon.js';
import translator from '../utilities/translate.js';

const mapQueue = [];

/**
 * Class that represents the vicowa-button custom element
 * @extends WebComponentBaseClass
 * @property {number} latitude Latitude of the map location to show
 * @property {number} longitude Longitude of the map location to show
 * @property {number} zoom The zoom level onto the map, bigger numbers mean more zoomed in
 * @property {string} marker Put a marker on the map with the given text, the marker will be in the center of the map
 * @property {string} info More information to put in the marker
 * @property {string} apiKey The API key to use for the displayed maps(get this from google)
 * @property {string} type The type of the map to show, can be one of hybrid, roadmap, satellite, terrain
 */
class VicowaGoogleMaps extends WebComponentBaseClass {
	#activeTranslator;
	#markers;
	#infos;
	#map;
	constructor() {
		super();
		this.#activeTranslator = null;
		this.#markers = [];
		this.#infos = [];
	}

	static get properties() {
		return {
			latitude: {
				type: Number,
				value: 58.8282216,
				reflectToAttribute: true,
				observer: (control) => control.#locationUpdated(),
			},
			longitude: {
				type: Number,
				value: -112.261819,
				reflectToAttribute: true,
				observer: (control) => control.#locationUpdated(),
			},
			zoom: {
				type: Number,
				value: 0,
				reflectToAttribute: true,
				observer: (control) => control.#zoomUpdated(),
			},
			marker: {
				type: String,
				value: '',
				reflectToAttribute: true,
				observer: (control) => control.#locationUpdated(),
			},
			info: {
				type: String,
				value: '',
				reflectToAttribute: true,
				observer: (control) => control.#locationUpdated(),
			},
			type: {
				type: String,
				value: 'roadmap',
				reflectToAttribute: true,
				observer: (control) => control.#mapTypeUpdated(),
			},
			apiKey: {
				type: String,
				value: '',
				reflectToAttribute: false,
				observer: (control) => control.#loadMapAPI(),
			},
		};
	}

	addMarker(callback, latitude, longitude, title) {
		this.#initializeMap((map) => {
			const marker = new window.google.maps.Marker({
				position: new window.google.maps.LatLng(latitude, longitude),
				map,
				title,
			});
			this.#markers.push({
				marker,
				title,
			});
			if (callback) {
				callback(marker);
			}
		});
	}

	addInfo(callback, content, latitudeOrMarker, longitude) {
		this.#initializeMap((map) => {
			const infoWindow = new window.google.maps.InfoWindow({ content });
			this.#infos.push({
				info: infoWindow,
				content,
			});
			this.updateTranslation();
			if (infoWindow && typeof latitudeOrMarker !== 'number') {
				infoWindow.open(map, latitudeOrMarker);
			} else if (latitudeOrMarker && longitude) {
				infoWindow.setPosition(new window.google.maps.LatLng(latitudeOrMarker, longitude));
				infoWindow.open(map);
			}
			if (callback) {
				callback(infoWindow);
			}
		});
	}

	updateTranslation() {
		this.#markers.forEach((marker) => { marker.marker.setTitle(this.#activeTranslator.translate(marker.title).fetch()); });
		this.#infos.forEach((info) => { info.info.setContent(this.#activeTranslator.translate(info.content).fetch()); });
	}

	detached() {
		translator.removeTranslationUpdatedObserverOwner(this);
	}

	attached() {
		this.#loadMapAPI();

		translator.addTranslationUpdatedObserver((translatorInstance) => {
			this.#activeTranslator = translatorInstance;
			this.updateTranslation();
		}, this);
	}

	#initializeMap(callback) {
		if (!this.#map) {
			const doMap = () => {
				if (window.google.maps.LatLng) {
					const LatLng = new window.google.maps.LatLng(this.latitude, this.longitude);
					this.#map = new window.google.maps.Map(this.$.map, {
						zoom: Math.max(0, this.zoom),
						center: LatLng,
						mapTypeId: this.type,
					});

					if (this.marker) {
						this.addMarker((marker) => {
							if (this.info) {
								this.addInfo(null, this.info || this.marker, marker);
							}
						}, this.latitude, this.longitude, this.marker);
					}
					if (this.#map) {
						callback(this.#map);
					}
				}
			};
			if ('google' in window && window.google.maps && window.google.maps.LatLng) {
				doMap();
			} else {
				mapQueue.push(() => {
					if (!this.#map) {
						doMap();
					} else {
						callback(this.#map);
					}
				});
			}
		} else {
			callback(this.#map);
		}
	}

	#locationUpdated() {
		this.#initializeMap((map) => {
			const LatLng = new window.google.maps.LatLng(this.latitude, this.longitude);
			if (map) {
				map.panTo(LatLng);
			}
		});
	}

	#zoomUpdated() {
		this.#initializeMap((map) => {
			if (map) {
				map.setZoom(Math.max(0, this.zoom));
			}
		});
	}

	#mapTypeUpdated() {
		this.#initializeMap((map) => {
			if (map && this.type in ['roadmap', 'satellite', 'hybrid', 'terrain']) {
				map.setMapTypeId(this.type);
			}
		});
	}

	#loadMapAPI() {
		if (!('google' in window)) {
			let googleAPI = document.querySelector('head script[src*="https://maps.googleapis.com"]');
			mapQueue.push(() => { this.#locationUpdated(); });
			if (this.apiKey && !googleAPI) {
				const whenGoogleAPILoaded = () => {
					mapQueue.forEach((callback) => {
						callback();
					});
				};

				if (!('google' in window)) {
					if (!googleAPI) {
						googleAPI = document.createElement('script');
						googleAPI.src = `https://maps.googleapis.com/maps/api/js?key=${this.apiKey}`;
						document.querySelector('head').appendChild(googleAPI);
						googleAPI.onload = () => {
							googleAPI.notifyList.forEach((callback) => { callback(); });
						};
						googleAPI.notifyList = googleAPI.notifyList || [];
					}
					googleAPI.notifyList.push(whenGoogleAPILoaded);
				} else {
					whenGoogleAPILoaded();
				}
			}
		} else {
			this.#locationUpdated();
		}
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

window.customElements.define('vicowa-google-maps', VicowaGoogleMaps);
