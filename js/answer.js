const servers = {
	iceServers: [
		{
			urls: "stun:stun.l.google.com:19302"
		}
	]
};
let pc = new RTCPeerConnection(servers);

let log = msg => {
	document.getElementById('logs').innerHTML += msg + '<br>'
}

let receiveChannel;

pc.oniceconnectionstatechange = e => log(`*** ${pc.iceConnectionState}`)
pc.onicecandidate = onIceCandidate;
pc.addEventListener('datachannel', receiveChannelCallback);

async function onIceCandidate(event) {
	if (event.candidate === null) {
		document.getElementById('localSessionDescription').value = btoa(pc.localDescription.sdp)
	}

	if (pc.remoteDescription) {
		const candidate = event.candidate;
		if (candidate === null) {
			return;
		} // Ignore null candidates
		try {
			await pc.addIceCandidate(candidate);
		} catch (e) {
			log(`EEE addIceCandidate error: ${e}`);
		}
	}
}

function receiveChannelCallback(event) {
	receiveChannel = event.channel;
	receiveChannel.binaryType = 'arraybuffer';
	receiveChannel.onopen = () => log('*** channel has opened')
	receiveChannel.addEventListener('close', onReceiveChannelClosed);
	receiveChannel.addEventListener('message', onReceiveMessageCallback);
}

function onReceiveMessageCallback(event) {
	log(`>>> ${event.data}`);
}

function onReceiveChannelClosed() {
	pc.close();
	log('*** channel has closed');
}

window.sendMessage = () => {
	let message = document.getElementById('message').value
	if (message === '') {
		return;
	}

	document.getElementById('message').value = '';
	log(`<<< ${message}`);

	receiveChannel.send(message)
}

window.startSession = () => {
	let sd = document.getElementById('remoteSessionDescription').value
	if (sd === '') {
		return alert('Session Description must not be empty')
	}

	try {
		pc.setRemoteDescription(new RTCSessionDescription({type: 'offer', sdp: atob(sd)}))
		pc.createAnswer().then((a) => {
			pc.setLocalDescription(a);
			document.getElementById('localSessionDescription').value = btoa(a.sdp);
		});
	} catch (e) {
		alert(e)
	}
};
