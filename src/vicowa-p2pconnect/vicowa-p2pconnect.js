/* eslint-disable */
// disable eslint while this code is not done
import { WebComponentBaseClass } from "/third_party/web-component-base-class/src/web-component-base-class.js";
import { COMMANDS, SIGNALING_EVENTS, WebRTCHandler } from "../utilities/webrtc.js";
import { uuidv4 } from "../utilities/utilities.js";
import { createQuickAccess } from "../../node_modules/web-component-base-class/src/tools.js";

class VicowaP2PConnect extends WebComponentBaseClass {
	#privateData;
	constructor() {
		super();
		this.#privateData = {
			webRTC: null,
			signaling: null,
			channelGuid: null,
		};
	}

	static get properties() {
		return {
			signalingServer: {
				type: String,
				value: "",
				reflectToAttribute: true,
				observer: handleSignalingChange,
			},
			peerId: {
				type: String,
				value: "",
				reflectToAttribute: true,
				observer: handleIdChange,
			},
		};
	}

	set signalingHandler(handler) {
		this.#privateData.webRTC = new WebRTCHandler(handler);
		handler.addObserver(SIGNALING_EVENTS.PEER_LIST, (peers) => {
			peers.forEach((peerInfo) => {
				createPeer(this, peerInfo);
			});
		});
		handler.addObserver(SIGNALING_EVENTS.PEER_UPDATE, (update) => {
			switch (update.update) {
				case "add": createPeer(this, update.data); break;
				case "remove": removePeer(this, update.data.id); break;
			}
		});
		this.#privateData.signaling = handler;
		this.#privateData.signaling.send({ command: COMMANDS.peerList });
	}

	detached() {
	}

	attached() {
		const controlData = this.#privateData;
		this.addAutoEventListener(this.$.connect, "click", () => {
			controlData.channelGuid = uuidv4();
			controlData.signaling.send({ command: COMMANDS.inviteChannel, channel: controlData.channelGuid, peers: [] });
		});
	}

	#handleSignalingChange() {

	}

	#handleIdChange() {

	}

	#createPeer(peerInfo) {
		if (!Array.from(this.$.peers.children).find((child) => child.peerId === peerInfo.id)) {
			const wrapper = document.createElement("div");
			wrapper.classList.add("peer");
			const newElement = (this.$.peerTemplate.assignedNodes().length ? this.$.peerTemplate.assignedNodes() : this.$.peerTemplate.children)[0].content.cloneNode(true);
			const controls = createQuickAccess(newElement, "name");
			controls.peer.textContent = peerInfo.displayName;
			wrapper.appendChild(newElement);
			this.$.peers.appendChild(wrapper);
			wrapper.peerId = peerInfo.id;
		}
	}

	#removePeer(peerID) {
		const peer = Array.from(this.$.peers.children).find((child) => child.peerId === peerID);
		peer.parentNode.removeChild(peer);
	}

	static get template() {
		return `
		<style>
			:host {
					display: block;
				}
		
			.peer {
					cursor: pointer;
				}
			.peer:hover,
			.peer.selected {
					background: blue;
					color: white;
				}
		</style>
		<div id="peers"></div>
		<vicowa-button id="connect" string="Connect"><slot name="custom-connect"></slot></vicowa-button>
		<slot id="peer-template" name="peer-template"><template><div name="peer"></div></template></slot>`;
	}
}

window.customElements.define("vicowa-p2pconnect", VicowaP2PConnect);
