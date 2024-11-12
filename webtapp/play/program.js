const time = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19];
var context;

function start() {
    context = new AudioContext();
    for(var i = 0; i < time.length; i++) {
        beep(1750, time[i]);
    }
}

function beep(frequency, time) {
    var oscillator = context.createOscillator();
    var gain = context.createGain();

    oscillator.type = 'sine';
    oscillator.frequency.value = frequency;
    oscillator.connect(context.destination);

    oscillator.start(time);
    oscillator.stop(time + 0.1);
}