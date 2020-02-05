//IMPORT OSCILLOSCOPE JS
import { OScope } from './oscope.js';

var midiAccess = null;  // the MIDIAccess object.
var portamento = 0;  // portamento/glide speed
var activeNotes = []; // the stack of actively-pressed keys

let midiObject = {}; //midi event to store
let keyObject = {}; //keyboard event to store
let musicalLayer = []; //collection of musical events to store
let contextPlayback = null;
let oscillatorPlayback = null;
let envelopePlayback = null;
let attackPlayback = 0.05;      // attack speed
let releasePlayback = 0.05;   // release speed
let portamentoPlayback = 0;  // portamento/glide speed
let recordStartTime = null;

const userInfo = localStorage.getItem('userAccount');
const userInfoParsed = JSON.parse(userInfo);
console.log(userInfoParsed);

// DOM RECORD BUTTONS
const recordStartButton = document.getElementById('recordButton');
// const recordStopButton = document.getElementById('record-stop');
const recordPlayButton = document.getElementById('record-play');

// DOM SYNTH CONTROLS
const waveformControl = document.getElementById('waveform');
let waveform = waveformControl.value;
const gainControl = document.getElementById('gain');
const frequencyControlLP = document.getElementById('filterFrequencyLP');
const frequencyControlHP = document.getElementById('filterFrequencyHP');
const frequencyControlBP = document.getElementById('filterFrequencyBP');
const lfoControl = document.getElementById('lfoValue');



//KEYBOARD STUFF
document.addEventListener('DOMContentLoaded', function(event) {
    //SET UP AUDIO CONTEXT
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

    //SETUP OSCILLOSCOPE
    const myOscilloscope = new OScope(audioCtx, 'oscilloscope');
  
    //PROCESSING CHAIN
    const gain = audioCtx.createGain();
    const filterLP = audioCtx.createBiquadFilter();
    const filterHP = audioCtx.createBiquadFilter();
    const filterBP = audioCtx.createBiquadFilter();
  
    //OBJECT FOR STORING ACTIVE NOTES
    const activeOscillators = {};
  
    //KEYCODE TO MUSICAL FREQUENCY CONVERSION
    const keyboardFrequencyMap = {
        '65': 261.625565300598634,  //A - C
        '87': 277.182630976872096, //W - C#
        '83': 293.664767917407560,  //S - D
        '69': 311.126983722080910, //E - D#
        '68': 329.627556912869929,  //D - E
        '70': 349.228231433003884,  //F - F
        '84': 369.994422711634398, //T - F#
        '71': 391.995435981749294,  //G - G
        '89': 415.304697579945138, //Y - G#
        '72': 440.000000000000000,  //H - A
        '85': 466.163761518089916, //U - A#
        '74': 493.883301256124111,  //J - B
        '75': 523.251130601197269,  //K - C
        '79': 554.365261953744192, //O - C#
        '76': 587.329535834815120,  //L - D
        '80': 622.253967444161821, //P - D#
        '186': 659.255113825739859,  //; - E
        '222': 698.456462866007768,  //' - F
        '221': 739.988845423268797, //] - F#
        // '84': 783.990871963498588,  //T - G
        // '54': 830.609395159890277, //6 - G#
        // '89': 880.000000000000000,  //Y - A
        // '55': 932.327523036179832, //7 - A#
        // '85': 987.766602512248223,  //U - B
    };

    //LFO
    let lfo = audioCtx.createOscillator();
    lfo.type = 'square';
    lfo.frequency.value = 10;
    let lfoGain = audioCtx.createGain();
    lfo.connect(lfoGain);   
    lfo.start();
    lfoGain.gain.setValueAtTime(0.25, audioCtx.currentTime);


  
    //CONNECTIONS
    gain.connect(filterLP);
    filterLP.connect(filterHP);
    filterHP.connect(filterBP);
    filterBP.connect(myOscilloscope);
    myOscilloscope.connect(audioCtx.destination);
  
    //EVENT LISTENERS FOR SYNTH PARAMETER INTERFACE
    waveformControl.addEventListener('change', function(event) {
        waveform = event.target.value;
    });
  
    gainControl.addEventListener('change', function(event) {
        gain.gain.setValueAtTime(event.target.value, audioCtx.currentTime);
    });

    frequencyControlLP.addEventListener('change', function(event) {
        filterLP.type = 'lowpass';
        filterLP.frequency.setValueAtTime(event.target.value, audioCtx.currentTime);
    });

    frequencyControlHP.addEventListener('change', function(event) {
        filterHP.type = 'highpass';
        filterHP.frequency.setValueAtTime(event.target.value, audioCtx.currentTime);
    });

    frequencyControlBP.addEventListener('change', function(event) {
        filterBP.type = 'bandpass';
        filterBP.frequency.setValueAtTime(event.target.value, audioCtx.currentTime);
    });

    lfoControl.addEventListener('change', function(event) {
        lfo.frequency.setValueAtTime(event.target.value, audioCtx.currentTime);
    });
  
    //EVENT LISTENERS FOR MUSICAL KEYBOARD
    window.addEventListener('keydown', keyDown, false);
    window.addEventListener('keyup', keyUp, false);

    //EVENT LISTENERS FOR THE KEYBOARD IMAGES FOR COMPUTER KEYBOARD
    window.addEventListener('keydown', function(e) {
        const key = document.querySelector(`.key[data-key="${e.keyCode}"]`);
        key.classList.add('active');
    });

    window.addEventListener('keyup', function(e) {
        const key = document.querySelector(`.key[data-key="${e.keyCode}"]`);
        key.classList.remove('active');
    });
  
    //CALLED ON KEYDOWN EVENT - CALLS PLAYNOTE IF KEY PRESSED IS ON MUSICAL
    //KEYBOARD && THAT KEY IS NOT CURRENTLY ACTIVE
    function keyDown(event) {
        const key = (event.detail || event.which).toString();

        keyObject = {
            note_switch: 144,
            note_name: keyboardFrequencyMap[key],
            note_velocity: 127,
            note_time: audioCtx.currentTime - recordStartTime
        };
        storingMusic(keyObject);

        if (keyboardFrequencyMap[key] && !activeOscillators[key]) {
            playNote(key);
        }
    }
  
    //STOPS & DELETES OSCILLATOR ON KEY RELEASE IF KEY RELEASED IS ON MUSICAL
    //KEYBOARD && THAT KEY IS CURRENTLY ACTIVE
    function keyUp(event) {
        const key = (event.detail || event.which).toString();

        keyObject = {
            note_switch: 128,
            note_name: keyboardFrequencyMap[key],
            note_velocity: 0,
            note_time: audioCtx.currentTime - recordStartTime
        };
        storingMusic(keyObject);

        if (keyboardFrequencyMap[key] && activeOscillators[key]) {
            activeOscillators[key].stop();
            delete activeOscillators[key];
        }
        lfoGain.disconnect(audioCtx.destination);
    }
  
        
    //HANDLES CREATION & STORING OF OSCILLATORS
    function playNote(key) {
        const osc = audioCtx.createOscillator();
        osc.frequency.setValueAtTime(keyboardFrequencyMap[key], audioCtx.currentTime);
        osc.type = waveform;
        activeOscillators[key] = osc;
        activeOscillators[key].connect(gain);
        activeOscillators[key].start();
    }


    //MIDI
    function noteOn(noteNumber) {
        const osc = audioCtx.createOscillator();
        osc.frequency.setTargetAtTime(frequencyFromNoteNumber(noteNumber), 0, portamento);
        osc.type = waveform;
        activeOscillators[noteNumber] = osc;
        activeOscillators[noteNumber].connect(gain);
        activeOscillators[noteNumber].start();
    }

    function noteOff(noteNumber) {
        var position = activeNotes.indexOf(noteNumber);
        if (position !== -1) {
            activeNotes.splice(position, 1);
        }
        if (activeNotes.length === 0) {  // shut off the envelope
            activeOscillators[noteNumber].stop();
            delete activeOscillators[noteNumber];
        } else {
            activeOscillators[noteNumber].stop();
            delete activeOscillators[noteNumber];
        }

    }

    function frequencyFromNoteNumber(note) {
        return 440 * Math.pow(2, (note - 69) / 12);
    }

    if (navigator.requestMIDIAccess)
        navigator.requestMIDIAccess().then(onMIDIInit, onMIDIReject);
    else
        alert("No MIDI support present in your browser.  You're gonna have a bad time.");


    function onMIDIInit(midi) {
        midiAccess = midi;

        var haveAtLeastOneDevice = false;
        var inputs = midiAccess.inputs.values();
        for (var input = inputs.next(); input && !input.done; input = inputs.next()) {
            input.value.onmidimessage = MIDIMessageEventHandler;
            haveAtLeastOneDevice = true;
        }
        if (!haveAtLeastOneDevice)
            // alert("No MIDI input devices present.  You're gonna have a bad time.");
            return;
    }

    function onMIDIReject(err) {
        alert("The MIDI system failed to start.  You're gonna have a bad time.");
    }

    function MIDIMessageEventHandler(event) {
        // Making Midi Object to store
        const midiFreq = frequencyFromNoteNumber(event.data[1]);
        midiObject = {
            note_switch: event.data[0],
            note_name: midiFreq,
            note_velocity: event.data[2],
            note_time: audioCtx.currentTime - recordStartTime
        };
        storingMusic(midiObject);

        switch (event.data[0] & 0xf0) {
            case 0x90:
                if (event.data[2] !== 0) {  // if velocity != 0, this is a note-on message
                    noteOn(event.data[1]);
                    return;
                }
                break;
            // if velocity == 0, fall thru: it's a note-off.  MIDI's weird, y'all.
            case 0x80:
                noteOff(event.data[1]);
                return;
        }
    }





    //RECORDING

    recordStartButton.addEventListener('click', () => {
        musicalLayer = [];
        recordStartTime = audioCtx.currentTime;
    });
    
    function storingMusic(musicObject) {
        musicalLayer.push(musicObject);
        console.log(musicalLayer);
    }




    //PLAYBACK

    //

    function playStoredMusic(musicalLayer) {

        contextPlayback = new AudioContext();
        const activeOscillatorsPlayback = {};
    
        // set up the basic oscillator chain, muted to begin with.
        // oscillatorPlayback = contextPlayback.createOscillator();
        // oscillatorPlayback.frequency.setValueAtTime(440, 0);
        // envelopePlayback = contextPlayback.createGain();
        // oscillatorPlayback.connect(envelopePlayback);
        // oscillatorPlayback.type = 'sawtooth';
        // envelopePlayback.connect(contextPlayback.destination);
        // envelopePlayback.gain.value = 0.0;  // Mute the sound
        // oscillatorPlayback.start();  // Go ahead and start up the oscillator
    
        for (let i = 0; i < musicalLayer.length; i++){
            const currentNoteValue = musicalLayer[i];
            const oscillatorPlayback = contextPlayback.createOscillator();

            activeOscillatorsPlayback[currentNoteValue.note_name] = oscillatorPlayback;

            
    
            if (currentNoteValue.note_switch === 144) { //note on!
                // oscillatorPlayback.frequency.setValueAtTime(440, 0);
                envelopePlayback = contextPlayback.createGain();
               
                oscillatorPlayback.connect(envelopePlayback);
                oscillatorPlayback.type = 'sawtooth';
                envelopePlayback.connect(contextPlayback.destination);
                envelopePlayback.gain.value = 0.0;  // Mute the sound
                oscillatorPlayback.start();  // Go ahead and start up the oscillator
                oscillatorPlayback.frequency.setTargetAtTime(currentNoteValue.note_name, currentNoteValue.note_time, portamento);
                envelopePlayback.gain.setTargetAtTime(1.0, currentNoteValue.note_time, attackPlayback);
            } else if (currentNoteValue.note_switch === 128) { //note off!               
                console.log('off');
                console.log(currentNoteValue.note_name);
                // activeOscillatorsPlayback[currentNoteValue.note_name].stop();

                envelopePlayback.gain.setTargetAtTime(0, currentNoteValue.note_time, releasePlayback);
                // oscillatorPlayback.stop();
                console.log(oscillatorPlayback);
                delete activeOscillatorsPlayback[currentNoteValue.note_name];
                console.log(activeOscillatorsPlayback);
                
                // activeOscillatorsPlayback[currentNoteValue.note_name].stop();
                
            }
        }
    }
});
