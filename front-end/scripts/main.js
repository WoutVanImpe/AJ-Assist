const toggleAudio = document.getElementById("toggle-audio");
const audioCtxOptions = {
	sampleRate: 16000,
};

// audio globals
let gumStream;
let AudioContext;
let audioCtx;
let mic;
let gain;
let featureExtractorNode;

let inferenceWorker;
let workerToWorkletPort;

let latestGenre = "-";

const socket = new WebSocket("ws://localhost:9001");

populateAudioSources();


function generateAndSendPrompt() {
	const subject = document.getElementById("subject").value.trim();
	const theme = document.getElementById("theme").value.trim();
	const background = document.getElementById("background").value;

	const bpmText = document.getElementById("bpm-display").textContent;
	const bpmValue = parseFloat(bpmText.split(" ")[1]);
	const energy = bpmToEnergy(bpmValue);

	let prompt = `A VJ-loop of ${subject || "something abstract"}`;
	if (theme) prompt += ` in ${theme} style`;
	if (background !== "none") prompt += ` with a ${background} background`;

	if (latestGenre) prompt += ` on ${latestGenre} music`;
	if (!isNaN(bpmValue) && bpmValue > 0 && energy) prompt += ` with ${energy} energy`;

	const promptMsg = {
		address: "/prompt",
		args: [
			{
				type: "s",
				value: prompt,
			},
		],
	};

	console.log("🚀 Sending prompt:", prompt);
	socket.send(JSON.stringify(promptMsg));

	// BPM separately
	if (!isNaN(bpmValue) && bpmValue > 0) {
		const bpmMsg = {
			address: "/bpm",
			args: [
				{
					type: "f",
					value: bpmValue,
				},
			],
		};
		console.log("🎵 Sending BPM:", bpmValue);
		socket.send(JSON.stringify(bpmMsg));
	}

	// Background separately
	const bgMsg = {
		address: "/background",
		args: [
			{
				type: "s",
				value: background,
			},
		],
	};
	console.log("🌌 Sending background:", background);
	socket.send(JSON.stringify(bgMsg));
}

["subject", "theme", "background"].forEach((id) => {
	document.getElementById(id).addEventListener("change", generateAndSendPrompt);
});


socket.addEventListener("message", (event) => {
	const data = JSON.parse(event.data);

	if (data.address === "/bpm") {
		const rawValue = data.args?.[0];
		const bpm = decodeOSCtoBPM(rawValue, 500);
		console.log("🎵 Ontvangen BPM:", bpm.toFixed(2));

		const bpmDisplay = document.getElementById("bpm-display");
		if (bpmDisplay) bpmDisplay.textContent = `BPM: ${bpm.toFixed(2)}`;
	}
});

function decodeOSCtoBPM(normalizedValue) {
	const value = normalizedValue * 480;
	const bpm = value + 20;
	return bpm;
}

function bpmToEnergy(bpm) {
	if (isNaN(bpm)) return null;
	if (bpm < 80) return "low";
	if (bpm < 130) return "medium";
	return "high";
}

async function createAudioProcessor(audioContext) {
	try {
		await audioContext.resume();
		let url = "./scripts/feature-extract-processor.js";
		await audioContext.audioWorklet.addModule(url);
	} catch (e) {
		console.log("There was an error loading the worklet processor:\n", e);
		return null;
	}

	return new AudioWorkletNode(audioContext, "feature-extract-processor");
}

function createInferenceWorker() {
	inferenceWorker = new Worker("./scripts/inference-worker.js");
	inferenceWorker.onmessage = function listenToWorker(msg) {
		if (msg.data.port) {
			// listen out for port transfer
			workerToWorkletPort = msg.data.port;
			console.log("Received port from worker\n", workerToWorkletPort);
			start();
		} else if (msg.data.predictions) {
			// listen out for model output
			printActivations(msg.data.predictions);
		}
	};
}

function start() {
	console.log("Initializing audio...");

	const selectedDeviceId = document.getElementById("audioSourceSelect").value;

	const constraints = {
		audio: selectedDeviceId && selectedDeviceId !== "default" ? { deviceId: { exact: selectedDeviceId } } : true, 
		video: false,
	};

	navigator.mediaDevices
		.getUserMedia(constraints)
		.then(startAudioProcessing)
		.catch((err) => {
			alert("Kon geen audio-invoer starten: " + err.message);
		});
}

async function startAudioProcessing(stream) {
	gumStream = stream;

	let audioTracks = gumStream.getAudioTracks();
	audioTracks.forEach((t) => {
		console.log("MediaStream constraints are: ", t.getSettings());
	});

	if (gumStream.active) {
		if (audioCtx.state == "closed") {
			audioCtx = new AudioContext(audioCtxOptions);
		} else if (audioCtx.state == "suspended") {
			audioCtx.resume();
		}

		try {
			mic = audioCtx.createMediaStreamSource(gumStream);
			gain = audioCtx.createGain();
			gain.gain.setValueAtTime(0, audioCtx.currentTime);
			featureExtractorNode = await createAudioProcessor(audioCtx);

			featureExtractorNode.port.postMessage(
				{
					port: workerToWorkletPort,
				},
				[workerToWorkletPort]
			);

			try {
				mic.connect(featureExtractorNode);
				featureExtractorNode.connect(gain);
				gain.connect(audioCtx.destination);
			} catch (e) {
				console.log(`There was a problem connecting the audio graph \n ${e}`);
			}

			// set button to stop
			toggleAudio.classList.toggle("recording");
			toggleAudio.innerHTML = "Stop";
			toggleAudio.disabled = false;
		} catch (e) {
			alert("Due to sample rate requirements, this demo cannot run on Firefox. Please, try a Chromium-based browser instead.");
		}
	} else {
		throw "Mic stream not active";
	}
}

async function populateAudioSources() {
	try {
		// Vraag tijdelijk toegang om labels te kunnen tonen
		await navigator.mediaDevices.getUserMedia({ audio: true });

		const devices = await navigator.mediaDevices.enumerateDevices();
		const select = document.getElementById("audioSourceSelect");
		select.innerHTML = ""; // reset opties

		const audioInputs = devices.filter((d) => d.kind === "audioinput");
		audioInputs.forEach((device) => {
			const option = document.createElement("option");
			option.value = device.deviceId;
			option.text = device.label || `Audio device ${select.length + 1}`;

			
			if (device.deviceId === "default") {
				option.selected = true;
			}

			select.appendChild(option);
		});
	} catch (err) {
		console.error("Error listing audio devices:", err);
	}
}

function stop() {
	// stop mic stream
	gumStream.getAudioTracks().forEach(function (track) {
		track.stop();
		gumStream.removeTrack(track);
	});

	audioCtx.close().then(function () {
		// manage button state
		toggleAudio.classList.toggle("recording");
		toggleAudio.innerHTML = "Start";

		// disconnect nodes
		mic.disconnect();
		featureExtractorNode.disconnect();
		gain.disconnect();
		mic = undefined;
		featureExtractorNode = undefined;
		gain = undefined;

		console.log("Stopped mic stream ...");
	});

	inferenceWorker = undefined;
	workerToWorkletPort = undefined;
}

function printActivations(predictions) {
	const display = document.querySelector("#activation-display");
	display.innerHTML = `<pre>${JSON.stringify(predictions, null, 4)}</pre>`;

	
	const sorted = Object.entries(predictions).sort(([, a], [, b]) => b - a);
	const topGenre = sorted[0][0];

	latestGenre = topGenre;
	generateAndSendPrompt();

	const genreDisplay = document.getElementById("genre-display");
	if (genreDisplay) genreDisplay.textContent = `Genre: ${topGenre}`;
}

function main() {
	try {
		AudioContext = window.AudioContext || window.webkitAudioContext;
		audioCtx = new AudioContext(audioCtxOptions);
	} catch (e) {
		throw "Could not instantiate AudioContext: " + e.message;
	}

	toggleAudio.addEventListener("click", function buttonClickHandler() {
		let recording = this.classList.contains("recording");
		if (!recording) {
			this.disabled = true;
			createInferenceWorker(); // and then start
		} else {
			stop();
		}
	});
}

main();
