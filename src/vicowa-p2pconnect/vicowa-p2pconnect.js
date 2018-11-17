import { webComponentBaseClass } from "../third_party/web-component-base-class/src/webComponentBaseClass.js";
import { COMMANDS, SIGNALING_EVENTS, WebRTCHandler } from "../utilities/webrtc.js";
import { uuidv4 } from "../utilities/utilities.js";
import { createQuickAccess } from "../../node_modules/web-component-base-class/src/tools.js";

const privateData = Symbol("privateData");

const componentName = "vicowa-p2pconnect";

function handleSignalingChange(p_Control) {

}

function handleIdChange(p_Control) {

}

function createPeer(p_Control, p_PeerInfo) {
	if (!Array.from(p_Control.$.peers.children).find((p_Child) => p_Child.peerId === p_PeerInfo.id)) {
		const wrapper = document.createElement("div");
		wrapper.classList.add("peer");
		const newElement = (p_Control.$.peerTemplate.assignedNodes().length ? p_Control.$.peerTemplate.assignedNodes() : p_Control.$.peerTemplate.children)[0].content.cloneNode(true);
		const controls = createQuickAccess(newElement, "name");
		controls.peer.textContent = p_PeerInfo.displayName;
		wrapper.appendChild(newElement);
		p_Control.$.peers.appendChild(wrapper);
		wrapper.peerId = p_PeerInfo.id;
	}
}

function removePeer(p_Control, p_PeerID) {
	const peer = Array.from(p_Control.$.peers.children).find((p_Child) => p_Child.peerId === p_PeerID);
	peer.parentNode.removeChild(peer);
}

class VicowaP2PConnect extends webComponentBaseClass {
	static get is() { return componentName; }
	constructor() {
		super();
		this[privateData] = {
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

	set signalingHandler(p_Handler) {
		this[privateData].webRTC = new WebRTCHandler(p_Handler);
		p_Handler.addObserver(SIGNALING_EVENTS.PEER_LIST, (p_Peers) => {
			p_Peers.forEach((p_PeerInfo) => {
				createPeer(this, p_PeerInfo);
			});
		});
		p_Handler.addObserver(SIGNALING_EVENTS.PEER_UPDATE, (p_Update) => {
			switch (p_Update.update) {
				case "add": createPeer(this, p_Update.data); break;
				case "remove": removePeer(this, p_Update.data.id); break;
			}
		});
		this[privateData].signaling = p_Handler;
		this[privateData].signaling.send({ command: COMMANDS.peerList });
	}

	detached() {
	}

	attached() {
		const controlData = this[privateData];
		this.addAutoEventListener(this.$.connect, "click", () => {
			controlData.channelGuid = uuidv4();
			controlData.signaling.send({ command: COMMANDS.inviteChannel, channel: controlData.channelGuid, peers: [] });
		});
	}
}

window.customElements.define(componentName, VicowaP2PConnect);
