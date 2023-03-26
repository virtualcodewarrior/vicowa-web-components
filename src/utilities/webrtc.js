/* eslint-disable */
// disable eslint while this code is not done
import observerFactory from './observerFactory.js';

const privateData = Symbol('privateData');

const MAX_CHUNK_SIZE = 262144;

function sendIceCandidate(p_WebRTC, p_Client, p_Candidate) {
	const classData = p_WebRTC[privateData];
	classData.comChannel.send(p_Candidate);
}

function handleSignalingMessage(p_WebRTC, p_Event) {
	switch (p_Event.command) {
		case 'candidate': break;
		case 'offer': break;
		case 'answer': break;
	}
}

function sendOffer(p_WebRTC, p_Offer) {
	const classData = p_WebRTC[privateData];
	classData.comChannel.send(p_Offer);
}

function addChannelHandlers(p_WebRTC, p_Channel) {
	p_Channel.onmessage = () => {

	};
	p_Channel.onclose = () => {

	};
}

function handleReceiveDataChannel(p_WebRTC, p_Channel) {
	if (p_Channel) {
		const classData = p_WebRTC[privateData];
		if (p_Channel.label === 'mainDataChannel') {
			classData.mainDataChannel = p_Channel;
		} else if (p_Channel.label === 'controlChannel') {
			classData.controlChannel = p_Channel;
		}

		addChannelHandlers(p_WebRTC, p_Channel);
	}
}

/**
 * Enum for signaling events
 * @readonly
 * @enum {string}
 */
export const SIGNALING_EVENTS = Object.freeze({
	MESSAGE: 'MESSAGE',
	CLOSE: 'CLOSE',
	ERROR: 'ERROR',
	PEER_LIST: 'PEER_LIST',
	PEER_UPDATE: 'PEER_UPDATE',
});

export const COMMANDS = Object.freeze({
	peerList: 'peerList',
	peerUpdate: 'peerUpdate',
	inviteChannel: 'inviteChannel',
	requestChannelAccess: 'requestChannelAccess',
});

export class SignalingBase {
	constructor(p_ComObject) {
		this[privateData] = {
			observer: observerFactory(),
			comObject: p_ComObject,
		};

		p_ComObject.onmessage = (p_Message) => { this.onMessage(p_Message); };
		p_ComObject.onerror = (p_Error) => { this.onError(p_Error); };
		p_ComObject.onclose = (p_Info) => { this.onClose(p_Info); };
	}

	connectChannel(p_ChannelName) {
		this.send({
			command: 'channelConnect',
			id: p_ChannelName,
		});
	}

	getPeerList() { this.send({ command: 'peerList' }); }
	send(p_Message) {
		this[privateData].comObject.send(p_Message);
	}

	onMessage(p_Message) { this[privateData].observer.notify(SIGNALING_EVENTS.MESSAGE, p_Message); }
	onClose(p_Info) { this[privateData].observer.notify(SIGNALING_EVENTS.CLOSE, p_Info); }
	onError(p_Error) { this[privateData].observer.notify(SIGNALING_EVENTS.ERROR, p_Error); }

	/**
	 * Add an observer to handle signaling events
	 * @param {SIGNALING_EVENTS} p_Event The event this is observing
	 * @param {Function} p_Callback The callback function
	 */
	addObserver(p_Event, p_Callback) {
		this[privateData].observer.addObserver(p_Event, p_Callback);
		if (p_Event === SIGNALING_EVENTS.PEER_LIST) {
			this.addObserver(SIGNALING_EVENTS.MESSAGE, (p_Message) => {
				switch (p_Message.command) {
					case COMMANDS.peerList:
						this[privateData].observer.notify(SIGNALING_EVENTS.PEER_LIST, p_Message.data);
						break;
					case COMMANDS.peerUpdate:
						this[privateData].observer.notify(SIGNALING_EVENTS.PEER_UPDATE, p_Message);
						break;
				}
			});
		}
	}

	/**
	 * Remove an observer to handle signaling events
	 * @param {SIGNALING_EVENTS} p_Event The event this is observing
	 * @param {Function} p_Callback The callback function
	 */
	removeObserver(p_Event, p_Callback) {
		this[privateData].observer.removeObserver(p_Event, p_Callback);
	}
}

export class WebRTCHandler {
	constructor(p_SignalingHandler) {
		this[privateData] = {
			signaling: p_SignalingHandler,
			comChannel: null,
			localStream: null,
			peerConfig: null,
			localPeer: null,
			mainDataChannel: null,
			controlChannel: null,
		};
	}

	async connectToChannel(p_ChannelID, p_Options) {
		const classData = this[privateData];
		classData.comChannel = await classData.signaling.connectChannel(p_ChannelID);
		classData.comChannel.onMessage = (p_Message) => { handleSignalingMessage.bind(this, p_Message); };

		classData.localPeer = new RTCPeerConnection(classData.peerConfig);
		classData.localPeer.onicecandidate = (p_CandidateInfo) => sendIceCandidate(this, classData.localPeer, p_CandidateInfo);
		classData.localPeer.ondatachannel = (p_Event) => handleReceiveDataChannel(this, p_Event.channel);
		const offer = await classData.localPeer.createOffer({ offerToReceiveAudio: p_Options.audio, offerToReceiveVideo: p_Options.video });
		await classData.localPeer.setLocalDescription(offer);
		sendOffer(this, offer);

	}

	async startAudioCall(p_Options) {
		const classData = this[privateData];
		classData.localStream = await window.navigator.mediaDevices.getUserMedia({
			audio: true,
			video: false,
		});
	}

	async startVideoCall(p_LocalVideoCanvas, p_RemoteVideoCanvas, p_Options) {
		const classData = this[privateData];
		const options = Object.assign({ audio: true }, p_Options);
		classData.localStream = await window.navigator.mediaDevices.getUserMedia({
			audio: options.audio,
			video: true,
		});

		p_LocalVideoCanvas.srcObject = privateData.localStream;
	}

	openDataChannel(p_ChannelID, p_Options) {
		const classData = this[privateData];
		const options = Object.assign({ ordered: true }, p_Options);
		classData.mainDataChannel = classData.localPeer.createDataChannel('mainChannel', options);
		classData.controlChannel = classData.localPeer.createDataChannel('controlChannel', { ordered: true });

		const handleChannelOpen = (p_Channel) => {

		};

		const handleChannelClose = (p_Channel) => {

		};

		classData.mainDataChannel.addEventListener('open', () => { handleChannelOpen(classData.mainDataChannel); });
		classData.mainDataChannel.addEventListener('close', () => { handleChannelClose(classData.mainDataChannel); });

		classData.controlChannel.addEventListener('open', () => { handleChannelOpen(classData.mainDataChannel); });
		classData.controlChannel.addEventListener('close', () => { handleChannelClose(classData.mainDataChannel); });
	}

	sendData(p_Channel, p_Data) {
		let bufferedAmount = p_Channel.bufferedAmount;
		let currentLocation = 0;
		while (currentLocation < p_Data.length) {
			p_Channel.send(p_Data);
		}
	}

	closeDataChannel() {
		const classData = this[privateData];
		classData.mainDataChannel.close();
		classData.controlChannel.close();
	}
}


