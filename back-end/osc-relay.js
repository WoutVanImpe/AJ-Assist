const osc = require("osc");
const express = require("express");
const WebSocket = require("ws");

const localAdres = "192.168.0.x";
const remoteAdres = "192.168.0.x";

const WS_PORT = 9001; 
const OSC_PORT = 9000; 

const udpPort = new osc.UDPPort({
	localAddress: localAdres,
	localPort: 57121, 
	remoteAddress: remoteAdres, 
	remotePort: OSC_PORT, 
});
udpPort.open();

const wss = new WebSocket.Server({ port: WS_PORT }, () => {
	console.log(`WebSocket server listening on ws://localhost:${WS_PORT}`);
});

wss.on("connection", (ws) => {
	console.log("Browser connected via WebSocket");

	ws.on("message", (msg) => {
		try {
			const oscMsg = JSON.parse(msg);
			udpPort.send(oscMsg);
			console.log("📨 OSC sent:", oscMsg);
		} catch (e) {
			console.error("Invalid OSC message from browser:", e);
		}
	});
});

const fromResolume = new osc.UDPPort({
	localAddress: myAdress, 
	localPort: 7400, 
});

fromResolume.on("message", (oscMsg) => {
	console.log("📥 OSC ontvangen van Resolume:", oscMsg);

	wss.clients.forEach((client) => {
		if (client.readyState === WebSocket.OPEN) {
			client.send(JSON.stringify(oscMsg));
		}
	});
});

fromResolume.on("ready", () => {
	console.log(`OSC listener klaar op poort ${fromResolume.options.localPort}`);
});

fromResolume.open();
