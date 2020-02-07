//IMPORT OSCILLOSCOPE JS
import { OScope } from './oscope.js';

let currentUserAccount;
let userAccounts;
let keyOff;

var midiAccess = null;  // the MIDIAccess object.
var activeNotes = []; // the stack of actively-pressed keys

let midiObject = {}; // midi event to store
let keyObject = {}; // keyboard event to store
let musicalLayer = []; // collection of musical events to store
let layerToStore = []; // collection of musical events to put in local storage

let contextPlayback = null;
let envelopePlayback = null;
let recordStartTime = null;

getUserFromLS(); // get user from local storage

//DOM RECORD BUTTONS
const recordStartButton = document.getElementById('recordButton');
const recordSaveButton = document.getElementById('saveButton');
const recordNameInput = document.getElementById('saveSession');
const savedSessions = document.getElementById('savedSession');
const recordPlayButton = document.getElementById('playpause');

updateSongs(); // add user's songs to dom list

//DOM REVERB TOGGLE
const verbToggle = document.getElementById('verb-toggle');

//DOM SYNTH CONTROLS
const waveformControlSine = document.getElementById('sine');
const waveformControlSquare = document.getElementById('square');
const waveformControlTriangle = document.getElementById('triangle');
const waveformControlSawtooth = document.getElementById('sawtooth');
let waveform = waveformControlSine.value || waveformControlSquare.value || waveformControlTriangle.value || waveformControlSawtooth.value;

//PLAYBACK DOM
const playbackSpeed = document.getElementById('playback-speed');
const loopToggle = document.getElementById('loop-toggle');

//DOM GAIN CONTROL
const gainControl = document.getElementById('gain');
const bitsControl = document.getElementById('bits');

//KEYBOARD STUFF
document.addEventListener('DOMContentLoaded', function() {
    //SET UP AUDIO CONTEXT
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

    //SETUP OSCILLOSCOPE
    const myOscilloscope = new OScope(audioCtx, 'oscilloscope');
  
    //PROCESSING CHAIN
    const gain = audioCtx.createGain();

    //COMPRESSOR
    const compressor = audioCtx.createDynamicsCompressor();
    compressor.threshold.setValueAtTime(-50, audioCtx.currentTime);
    compressor.knee.setValueAtTime(40, audioCtx.currentTime);
    compressor.ratio.setValueAtTime(12, audioCtx.currentTime);
    compressor.attack.setValueAtTime(0, audioCtx.currentTime);
    compressor.release.setValueAtTime(0.25, audioCtx.currentTime);
      
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
    };

    //CONVOLVER EFFECT
    //convolverTime CHANGES REVERB TIME
    let convolverTime = 1.00;
    let convolverEffect = (function() {
        let convolver = audioCtx.createConvolver(),
            noiseBuffer = audioCtx.createBuffer(2, convolverTime * audioCtx.sampleRate, audioCtx.sampleRate),
            left = noiseBuffer.getChannelData(0),
            right = noiseBuffer.getChannelData(1);
        for (let i = 0; i < noiseBuffer.length; i++) {
            left[i] = Math.random() * 2 - 1;
            right[i] = Math.random() * 2 - 1;
        }
        convolver.buffer = noiseBuffer;
        return convolver;
    })();

    //BIT CRUSHER EFFECT
    //USE bits AND normFreq TO CHANGE BIT RATE AND NORM FREQ
    let bufferSize = 4096;
    let bits = bitsControl.value;
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
   
    //AUDIO CONNECTIONS
    gain.connect(bitcrushEffect);
    bitcrushEffect.connect(compressor);
    compressor.connect(myOscilloscope);
    myOscilloscope.connect(audioCtx.destination);

    //TOGGLE FOR TURNING ON AND OFF REVERB
    verbToggle.addEventListener('click', () => {
        if (verbToggle.checked) {
            bitcrushEffect.disconnect(compressor);
            bitcrushEffect.connect(convolverEffect);
            convolverEffect.connect(compressor);
        } else {
            bitcrushEffect.disconnect(convolverEffect);
            bitcrushEffect.connect(compressor);
        }
    });

    //EVENT LISTENERS FOR SYNTH WAVESHAPE PARAMETER INTERFACE
    waveformControlSine.addEventListener('click', function(event) {
        waveform = event.target.value;
    });
    waveformControlSquare.addEventListener('click', function(event) {
        waveform = event.target.value;
    });
    waveformControlTriangle.addEventListener('click', function(event) {
        waveform = event.target.value;
    });
    waveformControlSawtooth.addEventListener('click', function(event) {
        waveform = event.target.value;
    });
    
    //EVENT LISTENER FOR GAIN (MAIN VOLUME) SLIDER
    gainControl.addEventListener('mousemove', function(event) {
        gain.gain.setValueAtTime(event.target.value, audioCtx.currentTime);
    });
  
    //EVENT LISTENERS FOR MUSICAL KEYBOARD
    window.addEventListener('keydown', keyDown, false);
    window.addEventListener('keyup', keyUp, false);

    //EVENT LISTENERS FOR THE KEYBOARD IMAGES FOR COMPUTER KEYBOARD
    //ONLY ACCEPTS CERTAIN KEYCODES AND SENDS AN 'ACTIVE' STATUS TO A PARAMETER IN CSS
    window.addEventListener('keydown', function(e) {
        let x = e.keyCode;
        if (x === 65 || x === 87 || x === 83 || x === 69 || x === 68 || x === 70 || x === 84 || x === 71 || x === 89 || x === 72 || x === 85 || x === 74 || x === 75 || x === 79 || x === 76 || x === 80 || x === 186 || x === 222 || x === 221) {
            if (!keyOff) {
                const key = document.querySelector(`.key[data-key="${e.keyCode}"]`);
                key.classList.add('active');    
            }            
        } 
    });
    
    window.addEventListener('keyup', function(e) {
        let x = e.keyCode;
        if (x === 65 || x === 87 || x === 83 || x === 69 || x === 68 || x === 70 || x === 84 || x === 71 || x === 89 || x === 72 || x === 85 || x === 74 || x === 75 || x === 79 || x === 76 || x === 80 || x === 186 || x === 222 || x === 221) {
            const key = document.querySelector(`.key[data-key="${e.keyCode}"]`);
            key.classList.remove('active');  
        }
    });
    
  
    //CALLED ON KEYDOWN EVENT - CALLS PLAYNOTE IF KEY PRESSED IS ON MUSICAL
    //KEYBOARD && THAT KEY IS NOT CURRENTLY ACTIVE
    function keyDown(event) {
        const key = (event.detail || event.which).toString();
        if (keyboardFrequencyMap[key] && !activeOscillators[key] && !keyOff) {
            playNote(key);

            keyObject = {
                note_switch: 144,
                note_name: keyboardFrequencyMap[key],
                note_velocity: 127,
                note_time: audioCtx.currentTime - recordStartTime,
                note_waveform: waveform,
                note_gain: gain.gain.value
            };
            storingMusic(keyObject);
        }
    }
  
    //STOPS & DELETES OSCILLATOR ON KEY RELEASE IF KEY RELEASED IS ON MUSICAL
    //KEYBOARD && THAT KEY IS CURRENTLY ACTIVE
    function keyUp(event) {
        const key = (event.detail || event.which).toString();
        if (keyboardFrequencyMap[key] && activeOscillators[key] && !keyOff) {
            keyObject = {
                note_switch: 128,
                note_name: keyboardFrequencyMap[key],
                note_velocity: 0,
                note_time: audioCtx.currentTime - recordStartTime,
                note_waveform: waveform,
                note_gain: gain.gain.value
            };
            storingMusic(keyObject);

            activeOscillators[key].stop();
            delete activeOscillators[key];
        }
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
        osc.frequency.setValueAtTime(frequencyFromNoteNumber(noteNumber), audioCtx.currentTime);
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
            return;
    }

    function onMIDIReject() {
        alert("The MIDI system failed to start.  You're gonna have a bad time.");
    }

    function MIDIMessageEventHandler(event) {
        // Making Midi Object to store
        const midiFreq = frequencyFromNoteNumber(event.data[1]);
        midiObject = {
            note_switch: event.data[0],
            note_name: midiFreq,
            note_velocity: event.data[2],
            note_time: audioCtx.currentTime - recordStartTime,
            note_waveform: waveform,
            note_gain: gain.gain.value
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

    function storingMusic(musicObject) {
        musicalLayer.push(musicObject); // store musical event
    }

    //RECORDING
    recordStartButton.addEventListener('click', () => { // start recording on click
        recordingEvents(); // call recording function
    });

    window.addEventListener('keyup', (e) => { // start recording from keyboard
        if (!keyOff) { // allow r key for record if user isn't typing in the song name field
            const x = e.keyCode;
            if (x === 82 && recordStartButton.checked === false){
                recordStartButton.checked = true;
                recordingEvents();
            } else if (x === 82) {
                recordStartButton.checked = false;
                recordingEvents();
            }       
        }
    });

    function recordingEvents() { // actual recording process
        if (recordStartButton.checked) { // start recording
            musicalLayer = []; // clear array of musical events
            recordStartTime = audioCtx.currentTime; // stamp time the recording starts
        } else if (!recordStartButton.checked) { // stop recording
            layerToStore = musicalLayer.slice(); // make new array from musical events to save
        }
    }

    function SaveSong(name, layerToStore) { // object constructor for new song
        this.name = name;
        this.song = layerToStore;
    }

    recordSaveButton.addEventListener('click', () => { // save recorded song
        const newSongName = recordNameInput.value.toString(); // name the song using dom input
        const newSong = new SaveSong(newSongName, layerToStore); // construct new song object with song name current music events array
        currentUserAccount.recordingSession[newSongName] = newSong; // add new song to user's list

        for (let i = 0; i < userAccounts.length; i++) {
            if (currentUserAccount.name === userAccounts[i].name) {
                userAccounts[i] = currentUserAccount;
            }
        }

        localStorage.setItem('userAccounts', JSON.stringify(userAccounts)); // update user's song list in local storage
        const newOption = document.createElement('option'); 
        newOption.value = newSong.name;
        newOption.textContent = newSong.name;
        newOption.selected = true;
        savedSessions.appendChild(newOption); // show user's new song in dom
    });

    //PLAYBACK
    recordPlayButton.addEventListener('click', () => { // play recording button
        const songToPlayName = savedSessions.value; // grab selected song's name from dom
        const songToPlay = currentUserAccount.recordingSession[songToPlayName]; // match song name to song in user's collection
        playStoredMusic(songToPlay.song); // call recording playback function with selected song
    });


    function playStoredMusic(musicalLayer) { // recording playback function

        contextPlayback = new AudioContext();
        if (!recordPlayButton.checked) {
            contextPlayback.close(); // break playback if record button is not checked
            return;
        }

        const activeOscillatorsPlayback = {}; // object for oscillators incase more than one note is played at a time
        const playbackMultiplier = playbackSpeed.value;
        const lastNoteTime = musicalLayer.length; // store the last musical event in case of loop
        const loopTime = (musicalLayer[lastNoteTime - 1].note_time); // store the last musical event's scheduled time in case of loop
    
        for (let i = 0; i < musicalLayer.length; i++){ // loop through the song's scheduled events
            const currentNoteValue = musicalLayer[i];              
            if (currentNoteValue.note_switch === 144) { // if saved musical note is being pressed down

                const oscillatorPlayback = contextPlayback.createOscillator();

                activeOscillatorsPlayback[currentNoteValue.note_name] = oscillatorPlayback;  
                activeOscillatorsPlayback[currentNoteValue.note_name].start(); 
                envelopePlayback = contextPlayback.createGain();

                if (!recordPlayButton.checked) {
                    activeOscillatorsPlayback[currentNoteValue.note_name].stop(); // stop playback
                }

                oscillatorPlayback.connect(envelopePlayback); // route oscillator to gain
                oscillatorPlayback.type = currentNoteValue.note_waveform; // set waveform type
                envelopePlayback.connect(contextPlayback.destination); // route gain to output
                envelopePlayback.gain.value = 0.0; // set initial value

                oscillatorPlayback.frequency.setValueAtTime(currentNoteValue.note_name, currentNoteValue.note_time * (1 / playbackMultiplier)); // schedule frequency of current note
                envelopePlayback.gain.setValueAtTime(currentNoteValue.note_gain, currentNoteValue.note_time * (1 / playbackMultiplier)); // schedule gain level of current note
            } else if (currentNoteValue.note_switch === 128) { // if saved musical note is being lifted up    
                const oscillatorPlayback = activeOscillatorsPlayback[currentNoteValue.note_name];
                oscillatorPlayback.frequency.setValueAtTime(0, currentNoteValue.note_time * (1 / playbackMultiplier));
                envelopePlayback.gain.setValueAtTime(0, currentNoteValue.note_time * (1 / playbackMultiplier)); // schedule note to turn off              
            }
            
        }
        if (loopToggle.checked && recordPlayButton.checked) { // if loop toggle is checked, restart play function with same song after last scheduled event
            setTimeout(() => playStoredMusic(musicalLayer), (loopTime * (1 / playbackMultiplier)) * 1000);
        }
     
    }
});

function updateSongs() {
    let usersSongs = Object.values(currentUserAccount.recordingSession); // get the current user's list of songs
    for (let i = 0; i < usersSongs.length; i++) { // loop through the user's songs and create selectable list on dom
        const newOption = document.createElement('option');
        newOption.value = usersSongs[i].name;
        newOption.textContent = usersSongs[i].name;
        savedSessions.appendChild(newOption);
    }
}

function getUserFromLS() {
    const user = localStorage.getItem('currentUser'); // get current user
    userAccounts = JSON.parse(localStorage.getItem('userAccounts')); // get all users

    const nameDIV = document.getElementById('name-input');

    nameDIV.textContent = user;

    for (let i = 0; i < userAccounts.length; i++) { // match user to all users
        if (user === userAccounts[i].name) {
            currentUserAccount = userAccounts[i];
        }
    }
}

recordNameInput.addEventListener('focus', () => {
    keyOff = true; // boolean for disabling synth and record button when entering name for save file
});

recordNameInput.addEventListener('blur', () => {
    keyOff = false; // boolean for disabling synth and record button when entering name for save file 
});