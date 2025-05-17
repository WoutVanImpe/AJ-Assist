# AJ-Assist ✨
AJ-Assist is an interactive audiovisual tool that connects Resolume, TouchDesigner, and AI to create dynamic, audio-reactive visuals controlled through a web-based interface. Designed for live performances, it enables real-time control and OSC communication across multiple devices.

## Requirements ⚙️
- 1 powerful PC (strong CPU) or 1 average + 1 good/moderate PC
- This application (AJ-Assist)
- [TouchDesigner](https://derivative.ca/)
- [Resolume Arena](https://resolume.com/)
- [NDI Tools](https://www.ndi.tv/tools/)
- A sound input device (microphone, external soundcard, etc.)

## Up & running🏃‍➡️
- Open the terminal and insert the following lines:
```properties
    cd back-end
    npm install
```
- Go to the osc-relay.js file and insert your local and remote (other pc) IP in the localAddress and remoteAddress variable
- Open the integrated terminal of the back-end folder and run the osc-relay file
```properties
    node osc-relay.js
```
  or
```properties
    nodemon osc-relay.js
```
- Go to the front-end folder and open the index.html file with live server
- Open the Touchdesigner file and insert your local IP in the IP_of_this_device node
- Install al the requirements of the stream diffusion node in the settings 1 panel and start the stream
- Open a Resolume Arena project and open the preferences
- Go to OSC and check the OSC Output option
- Set it on IP Address and set the outgoing address on the IP address of the pc with the website control panel and set the outgoing port on 7400
- Open the edit OSC settings and add the global BPM in the OSC output
- Lastly add the NDI source of Touchdesigner to your Resolume composition

## Controls
- BPM is controlled in Resolume with the TAP button
- Rest is controlled via the control panel on the website program

## Sources 🗃️
- https://glitch.com/~essentiajs-models-rt
- https://derivative.ca/workshop/ai-workshop-%E2%80%93-introduction-streamdiffusion-td-may-ai-%E5%B7%A5%E4%BD%9C%E5%9D%8A-streamdiffusion-td-%E5%85%A5%E9%96%80%E6%93%8D%E4%BD%9C-%E4%BA%94%E6%9C%88%E4%BB%BD%E5%A0%B4%E6%AC%A1
