Real-time inference with [Essentia.js](https://mtg.github.io/essentia.js/) models 
=================

This is an example of the minimum code needed to run Essentia.js models in real-time. 

The main parts are an AudioWorkletProcessor (`scripts/feature-extract-processor.js`) to run feature extraction 
on its own dedicated audio thread, a Worker used to run the model (`scripts/inference-worker.js`), and `main.js`
to tie it all together and connect both threads via the [MessagePort](https://developer.mozilla.org/en-US/docs/Web/API/MessagePort) interface.

**Note**: This demo will only work in Chromium-based browsers, 
which allow setting the sample rate of the AudioContext to the 16000kHz necessary for this particular model.

Contents
------------
### ← scripts/

All the JS code actually performing real-time audio analysis.

### ← msd-musicnn-1/

The pre-trained MusiCNN model for music autotagging. Essentia Models are licensed under
Creative Commons Attribution-NonCommercial-NoDerivatives 4.0 (see msd-musicnn-1/LICENSE file).

### ← lib/

The necessary parts from the Essentia.js package, plus some helper code for buffer size matching.

Made at [MTG](https://www.upf.edu/web/mtg), in Barcelona
![alt text](https://raw.githubusercontent.com/MTG/mtg-logos/master/mtg/MTG_CMYK_logo-05.svg "Title")
-------------------