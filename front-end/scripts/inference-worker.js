importScripts("https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@2.0.0/dist/tf.min.js");
importScripts("https://cdn.jsdelivr.net/npm/essentia.js@0.1.3/dist/essentia.js-model.umd.js");

const modelURL = "../msd-musicnn-1/model.json";
let model = new EssentiaModel.TensorflowMusiCNN(tf, modelURL);
let modelReady = false;
const msdTags = [
	"rock",
	"pop",
	"alternative",
	"indie",
	"electronic",
	"female vocalists",
	"dance",
	"2000s",
	"alternative rock",
	"jazz",
	"beautiful",
	"metal",
	"chillout",
	"male vocalists",
	"classic rock",
	"soul",
	"indie rock",
	"mellow",
	"electronica",
	"80s",
	"folk",
	"90s",
	"chill",
	"instrumental",
	"punk",
	"oldies",
	"blues",
	"hard rock",
	"ambient",
	"acoustic",
	"experimental",
	"female vocalist",
	"guitar",
	"hip-hop",
	"70s",
	"party",
	"country",
	"easy listening",
	"sexy",
	"catchy",
	"funk",
	"electro",
	"heavy metal",
	"progressive rock",
	"60s",
	"rnb",
	"indie pop",
	"sad",
	"house",
	"happy",
];

async function loadModel() {
	await model.initialize();
	modelReady = true;
	console.info("Model has been loaded!");
}

function outputPredictions(p) {
	postMessage({
		predictions: p,
	});
}

async function modelPredict(features) {
	if (modelReady) {
		let predictions = await model.predict(features);
		predictions = predictions[0]; // model.predict returns a [Array(50)]
		let taggedPredictions = {};
		predictions.map((p, i) => {
			taggedPredictions[msdTags[i]] = p;
			return 0;
		});
		// get top 3 labels
		predictions.sort();
		let topPredictions = predictions.slice(-5);
		let taggedTopPredictions = msdTags.filter((label) => topPredictions.includes(taggedPredictions[label]));
		// output to main thread
		outputPredictions(taggedPredictions);
	}
}

const channel = new MessageChannel();
const port1 = channel.port1;

postMessage(
	{
		port: channel.port2,
	},
	[channel.port2]
);

port1.onmessage = async function listenToAudioWorklet(msg) {
	// listen for comms acknowledgement
	if (msg.data.check) {
		console.info(`Check, check: received ${msg.data.check} from AudioWorkletProcessor!`);
	} else if (msg.data.features) {
		// should/can this eventhandler run async functions
		await modelPredict(msg.data.features);
	}
};

loadModel();
