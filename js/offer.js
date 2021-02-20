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

let sendChannel = pc.createDataChannel('foo')
sendChannel.onclose = () => log('*** channel has closed')
sendChannel.onopen = () => log('*** channel has opened')
sendChannel.onmessage = e => log(`>>> ${e.data}`)

pc.oniceconnectionstatechange = e => log(`*** ${pc.iceConnectionState}`)
pc.onicecandidate = onIceCandidate;

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

pc.onnegotiationneeded = e => {
	pc.createOffer().then(d => pc.setLocalDescription(d)).catch(msg => log(`ERR ${msg}`))
}

window.sendMessage = () => {
	let message = document.getElementById('message').value
	if (message === '') {
		return;
	}

	document.getElementById('message').value = '';
	log(`<<< ${message}`);

	sendChannel.send(message)
}

window.startSession = () => {
	let sd = document.getElementById('remoteSessionDescription').value
	if (sd === '') {
		return alert('Session Description must not be empty')
	}

	try {
		pc.setRemoteDescription(new RTCSessionDescription({type: 'answer', sdp: atob(sd)}))
	} catch (e) {
		alert(e)
	}
}
