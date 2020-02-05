//IMPORT OSCILLOSCOPE JS
import { OScope } from './oscope.js';

let currentUserAccount;
let userAccounts;

var midiAccess = null;  // the MIDIAccess object.
var activeNotes = []; // the stack of actively-pressed keys

let midiObject = {}; //midi event to store
let keyObject = {}; //keyboard event to store
let musicalLayer = []; //collection of musical events to store
let layerToStore = [];

let contextPlayback = null;
let envelopePlayback = null;
let recordStartTime = null;

getUserFromLS();

// DOM RECORD BUTTONS
const recordStartButton = document.getElementById('recordButton');
// const recordKeyPress = document.getElementById('recordButton');
const recordSaveButton = document.getElementById('saveButton');
const recordNameInput = document.getElementById('saveSession');
const savedSessions = document.getElementById('savedSession');
const recordPlayButton = document.getElementById('playbutton');

updateSongs();

// DOM SYNTH CONTROLS
const waveformControl = document.getElementById('waveform');
let waveform = waveformControl.value;
const gainControl = document.getElementById('gain');
const frequencyControlLP = document.getElementById('filterFrequencyLP');
const frequencyControlHP = document.getElementById('filterFrequencyHP');
const frequencyControlBP = document.getElementById('filterFrequencyBP');

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
        // '84': 783.990871963498588,  //T - G
        // '54': 830.609395159890277, //6 - G#
        // '89': 880.000000000000000,  //Y - A
        // '55': 932.327523036179832, //7 - A#
        // '85': 987.766602512248223,  //U - B
    };
  
    //CONNECTIONS
    gain.connect(filterLP);
    filterLP.connect(compressor);
    compressor.connect(myOscilloscope);
    // filterHP.connect(filterBP);
    // filterBP.connect(myOscilloscope);
    myOscilloscope.connect(audioCtx.destination);
  
    //EVENT LISTENERS FOR SYNTH PARAMETER INTERFACE
    waveformControl.addEventListener('change', function(event) {
        waveform = event.target.value;
    });
  
    gainControl.addEventListener('mousemove', function(event) {
        gain.gain.setValueAtTime(event.target.value, audioCtx.currentTime);
    });

    frequencyControlLP.addEventListener('mousemove', function(event) {
        filterLP.type = 'lowpass';
        filterLP.frequency.setValueAtTime(event.target.value, audioCtx.currentTime);
    });

    frequencyControlHP.addEventListener('mousemove', function(event) {
        filterHP.type = 'highpass';
        filterHP.frequency.setValueAtTime(event.target.value, audioCtx.currentTime);
    });

    frequencyControlBP.addEventListener('mousemove', function(event) {
        filterBP.type = 'bandpass';
        filterBP.frequency.setValueAtTime(event.target.value, audioCtx.currentTime);
    });
  
    //EVENT LISTENERS FOR MUSICAL KEYBOARD
    window.addEventListener('keydown', keyDown, false);
    window.addEventListener('keyup', keyUp, false);

    //EVENT LISTENERS FOR THE KEYBOARD IMAGES FOR COMPUTER KEYBOARD
    window.addEventListener('keydown', function(e) {
        let x = e.keyCode;
        if (x === 65 || x === 87 || x === 83 || x === 69 || x === 68 || x === 70 || x === 84 || x === 71 || x === 89 || x === 72 || x === 85 || x === 74 || x === 75 || x === 79 || x === 76 || x === 80 || x === 186 || x === 222 || x === 221) {
            const key = document.querySelector(`.key[data-key="${e.keyCode}"]`);
            key.classList.add('active');    
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
        if (keyboardFrequencyMap[key] && !activeOscillators[key]) {
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

        keyObject = {
            note_switch: 128,
            note_name: keyboardFrequencyMap[key],
            note_velocity: 0,
            note_time: audioCtx.currentTime - recordStartTime,
            note_waveform: waveform,
            note_gain: gain.gain.value
        };
        storingMusic(keyObject);

        if (keyboardFrequencyMap[key] && activeOscillators[key]) {
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
            note_time: audioCtx.currentTime - recordStartTime,
            note_waveform: waveform,
            note_gain: gain.gain.value
        };
        storingMusic(midiObject);

        console.log(gain);

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
        recordingEvents();
    });

    window.addEventListener('keyup', (e) => {
        const x = e.keyCode;
        if (x === 82 && recordStartButton.checked === false){
            recordStartButton.checked = true;
            recordingEvents();
        } else if (x === 82) {
            recordStartButton.checked = false;
            recordingEvents();
        }        
    });

    function recordingEvents() {
        if (recordStartButton.checked) {
            musicalLayer = [];
            recordStartTime = audioCtx.currentTime;
            console.log('recording');
        } else if (!recordStartButton.checked) {
            layerToStore = musicalLayer.slice();
            console.log('stop recording');
        }
    }


    
    function storingMusic(musicObject) {
        musicalLayer.push(musicObject);
    }

    function SaveSong(name, layerToStore) {
        this.name = name;
        this.song = layerToStore;
    }

    recordSaveButton.addEventListener('click', () => {
        const newSongName = recordNameInput.value.toString();
        const newSong = new SaveSong(newSongName, layerToStore);
        currentUserAccount.recordingSession[newSongName] = newSong;

        for (let i = 0; i < userAccounts.length; i++) {
            if (currentUserAccount.name === userAccounts[i].name) {
                userAccounts[i] = currentUserAccount;
            }
        }

        localStorage.setItem('userAccounts', JSON.stringify(userAccounts));
        updateSongs();
    });




    //PLAYBACK

    recordPlayButton.addEventListener('click', () => {
        const songToPlayName = savedSessions.value;
        const songToPlay = currentUserAccount.recordingSession[songToPlayName];
        playStoredMusic(songToPlay.song);
    });


    function playStoredMusic(musicalLayer) {

        contextPlayback = new AudioContext();
        const activeOscillatorsPlayback = {};
        const playbackMultiplier = 1;
    
    
        for (let i = 0; i < musicalLayer.length; i++){
            const currentNoteValue = musicalLayer[i];                       
            if (currentNoteValue.note_switch === 144) { //note on!

                const oscillatorPlayback = contextPlayback.createOscillator();

                activeOscillatorsPlayback[currentNoteValue.note_name] = oscillatorPlayback;  
                activeOscillatorsPlayback[currentNoteValue.note_name].start(); 
                envelopePlayback = contextPlayback.createGain();
               
                oscillatorPlayback.connect(envelopePlayback);
                oscillatorPlayback.type = currentNoteValue.note_waveform;
                envelopePlayback.connect(contextPlayback.destination);
                envelopePlayback.gain.value = 0.0;

                oscillatorPlayback.frequency.setValueAtTime(currentNoteValue.note_name, currentNoteValue.note_time * (1 / playbackMultiplier));
                envelopePlayback.gain.setValueAtTime(currentNoteValue.note_gain, currentNoteValue.note_time * (1 / playbackMultiplier));
            } else if (currentNoteValue.note_switch === 128) { //note off!      

                const oscillatorPlayback = activeOscillatorsPlayback[currentNoteValue.note_name];
                oscillatorPlayback.frequency.setValueAtTime(0, currentNoteValue.note_time * (1 / playbackMultiplier));
                envelopePlayback.gain.setValueAtTime(0, currentNoteValue.note_time * (1 / playbackMultiplier));              
            }
        }
    }
});


function updateSongs() {
    let usersSongs = Object.values(currentUserAccount.recordingSession);
    for (let i = 0; i < usersSongs.length; i++) {
        const newOption = document.createElement('option');
        newOption.value = usersSongs[i].name;
        newOption.textContent = usersSongs[i].name;
        savedSessions.appendChild(newOption);
    }
}

function getUserFromLS() {
    const user = localStorage.getItem('currentUser');
    userAccounts = JSON.parse(localStorage.getItem('userAccounts'));

    for (let i = 0; i < userAccounts.length; i++) {
        if (user === userAccounts[i].name) {
            currentUserAccount = userAccounts[i];
        }
    }
}