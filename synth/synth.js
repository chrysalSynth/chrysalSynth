var context = null;   // the Web Audio "context" object
var midiAccess = null;  // the MIDIAccess object.
var oscillator = null;  // the single oscillator
var envelope = null;    // the envelope for the single oscillator
var attack = 0.05;      // attack speed
var release = 0.05;   // release speed
var portamento = 0;  // portamento/glide speed
var activeNotes = []; // the stack of actively-pressed keys

let activeMusic = false;

let midiObject = {}; //musical event to store
let musicalLayer = []; //collection of musical events to store

let contextPlayback = null;
let oscillatorPlayback = null;
let envelopePlayback = null;
let attackPlayback = 0.05;      // attack speed
let releasePlayback = 0.05;   // release speed
let portamentoPlayback = 0;  // portamento/glide speed

let recordStartTime = null;

window.addEventListener('click', function() {
  // patch up prefixes

    if (!activeMusic) {
        window.AudioContext = window.AudioContext || window.webkitAudioContext;

        context = new AudioContext();
        if (navigator.requestMIDIAccess)
            navigator.requestMIDIAccess().then(onMIDIInit, onMIDIReject);
        else
            alert("No MIDI support present in your browser.  You're gonna have a bad time.");

        // set up the basic oscillator chain, muted to begin with.
        oscillator = context.createOscillator();
        oscillator.frequency.setValueAtTime(110, 0);
        envelope = context.createGain();
        oscillator.connect(envelope);
        oscillator.type = 'sawtooth';
        envelope.connect(context.destination);
        envelope.gain.value = 0.0;  // Mute the sound
        oscillator.start();  // Go ahead and start up the oscillator
        context.resume();
        activeMusic = true;
    };


});

function onMIDIInit(midi) {
    midiAccess = midi;

    var haveAtLeastOneDevice=false;
    var inputs=midiAccess.inputs.values();
    for ( var input = inputs.next(); input && !input.done; input = inputs.next()) {
        input.value.onmidimessage = MIDIMessageEventHandler;
        haveAtLeastOneDevice = true;
    }
    if (!haveAtLeastOneDevice)
        alert("No MIDI input devices present.  You're gonna have a bad time.");
}

function onMIDIReject(err) {
    alert("The MIDI system failed to start.  You're gonna have a bad time.");
}

function MIDIMessageEventHandler(event) {
  // Mask off the lower nibble (MIDI channel, which we don't care about)
    midiObject = { 
        note_switch: event.data[0],
        note_name: event.data[1],
        note_velocity: event.data[2],
        note_time: context.currentTime - recordStartTime
    };
    storingMusic(midiObject);
    switch (event.data[0] & 0xf0) {
        case 0x90:
            if (event.data[2] !== 0) {  // if velocity != 0, this is a note-on message
                noteOn(event.data[1]);
                return;
            }
        // if velocity == 0, fall thru: it's a note-off.  MIDI's weird, y'all.
        case 0x80:
            noteOff(event.data[1]);
            return;
    }
}

function frequencyFromNoteNumber( note ) {
    return 440 * Math.pow(2,(note-69)/12);
}

function noteOn(noteNumber) {
    activeNotes.push(noteNumber);
    oscillator.frequency.cancelScheduledValues(0);
    oscillator.frequency.setTargetAtTime(frequencyFromNoteNumber(noteNumber), 0, portamento);
    envelope.gain.cancelScheduledValues(0);
    envelope.gain.setTargetAtTime(1.0, 0, attack);
    // console.log(context.currentTime, 'note-on');
}

function noteOff(noteNumber) {
    var position = activeNotes.indexOf(noteNumber);
    if (position !== -1) {
        activeNotes.splice(position, 1);
    }
    if (activeNotes.length === 0) {  // shut off the envelope
        envelope.gain.cancelScheduledValues(0);
        envelope.gain.setTargetAtTime(0.0, 0, release );
    } else {
        oscillator.frequency.cancelScheduledValues(0);
        oscillator.frequency.setTargetAtTime(frequencyFromNoteNumber(activeNotes[activeNotes.length-1]), 0, portamento);
    }
    // console.log(context.currentTime, 'note-off');
}












const testDiv = document.getElementById('test-div');
const recordStartButton = document.createElement('button');
const recordStopButton = document.createElement('button');
const recordPlayButton = document.createElement('button');
recordStartButton.textContent = 'Record Start';
recordStartButton.style.color = 'red';
testDiv.appendChild(recordStartButton);
recordStopButton.textContent = 'Record Stop';
recordStopButton.style.color = 'red';
testDiv.appendChild(recordStopButton);
recordPlayButton.textContent = 'Record PLAY';
recordPlayButton.style.color = 'red';
testDiv.appendChild(recordPlayButton);


// setTimeout(() => {playStoredMusic(musicalLayer)}, 10000);






recordStartButton.addEventListener('click', () => {
    musicalLayer = [];
    recordStartTime = context.currentTime;
});

recordPlayButton.addEventListener('click', () => {
    {playStoredMusic(musicalLayer)}
});

function storingMusic(midiObject) {
    musicalLayer.push(midiObject);
    console.log(musicalLayer);
};

function playStoredMusic(musicalLayer) {

    contextPlayback = new AudioContext();

    // set up the basic oscillator chain, muted to begin with.
    oscillatorPlayback = contextPlayback.createOscillator();
    oscillatorPlayback.frequency.setValueAtTime(440, 0);
    envelopePlayback = contextPlayback.createGain();
    oscillatorPlayback.connect(envelopePlayback);
    oscillatorPlayback.type = 'sawtooth';
    envelopePlayback.connect(contextPlayback.destination);
    envelopePlayback.gain.value = 0.0;  // Mute the sound
    oscillatorPlayback.start();  // Go ahead and start up the oscillator

    for (let i = 0; i < musicalLayer.length; i++){
        const currentNoteValue = musicalLayer[i];

        if (currentNoteValue.note_switch === 144) { //note on!
            oscillatorPlayback.frequency.setTargetAtTime(frequencyFromNoteNumber(currentNoteValue.note_name), currentNoteValue.note_time, portamento);
            envelopePlayback.gain.setTargetAtTime(1.0, currentNoteValue.note_time, attackPlayback);
        } else if (currentNoteValue.note_switch === 128) { //note off!
            envelopePlayback.gain.setTargetAtTime(0, currentNoteValue.note_time, releasePlayback);
        }
    }
}