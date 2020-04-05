export function reverbFunction(audioCtx) {
    let convolverTime = 1.00;
    let convolverEffect = (function() {
        let convolver = audioCtx.createConvolver(), noiseBuffer = audioCtx.createBuffer(2, convolverTime * audioCtx.sampleRate, audioCtx.sampleRate), left = noiseBuffer.getChannelData(0), right = noiseBuffer.getChannelData(1);
        for (let i = 0; i < noiseBuffer.length; i++) {
            left[i] = Math.random() * 2 - 1;
            right[i] = Math.random() * 2 - 1;
        }
        convolver.buffer = noiseBuffer;
        return convolver;
    })();
    return convolverEffect;
}

export function compressorFunction(audioCtx) {
    const compressor = audioCtx.createDynamicsCompressor();
    compressor.threshold.setValueAtTime(-50, audioCtx.currentTime);
    compressor.knee.setValueAtTime(40, audioCtx.currentTime);
    compressor.ratio.setValueAtTime(12, audioCtx.currentTime);
    compressor.attack.setValueAtTime(0, audioCtx.currentTime);
    compressor.release.setValueAtTime(0.25, audioCtx.currentTime);
    return compressor;
}

export function bitCrushFunction(audioCtx) {
    let bufferSize = 4096;
    let bits = 4;
    let normFreq = [0.1, 0.2, 0.5, 1.0];
    let bitcrushEffect = (function() {
        let node = audioCtx.createScriptProcessor(bufferSize, 1, 1);
        node.bits = bits; // between 1 and 16
        node.normfreq = normFreq[0]; // between 0.0 and 1.0
        let step = Math.pow(1 / 2, node.bits);
        let phaser = 0;
        let last = 0;
        node.onaudioprocess = function(e) {
            let input = e.inputBuffer.getChannelData(0);
            let output = e.outputBuffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) {
                phaser += node.normfreq;
                if (phaser >= 1.0) {
                    phaser -= 1.0;
                    last = step * Math.floor(input[i] / step + 0.5);
                }
                output[i] = last;
            }
        };
        return node;
    })();
    return bitcrushEffect;
}