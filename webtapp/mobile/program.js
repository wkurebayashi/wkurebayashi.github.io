const time = [0.000, 0.600, 1.200, 1.800, 2.400, 3.000, 3.600, 4.200, 4.800, 5.400, 6.061, 6.741, 7.359, 8.045, 8.707, 9.397, 10.070, 10.776, 11.507, 12.209, 12.876, 13.591, 14.367, 15.118, 15.922, 16.628, 17.275, 18.025, 18.795, 19.459, 20.105, 20.814, 21.437, 22.102, 22.706, 23.355, 23.966, 24.648, 25.293, 25.900, 26.515, 27.094, 27.754, 28.347, 28.936, 29.582, 30.212, 30.858, 31.460, 32.090, 32.702, 33.301, 34.052, 34.688, 35.327, 35.969, 36.627, 37.293, 37.980, 38.625, 39.319, 40.003, 40.665, 41.277, 42.058, 42.781, 43.451, 44.094, 44.773, 45.477, 46.107, 46.816, 47.411, 48.075, 48.697, 49.298, 49.882, 50.482, 51.081, 51.667, 52.237, 52.825, 53.475, 54.018, 54.510, 55.110, 55.594, 56.149, 56.727, 57.259, 57.845, 58.392, 58.928, 59.411, 60.049, 60.647, 61.231, 61.811, 62.352, 62.953, 63.524, 64.107, 64.768, 65.409, 66.069, 66.668, 67.312, 68.034, 68.773, 69.556, 70.231, 71.009, 71.716, 72.472, 73.237, 74.018, 74.772, 75.490, 76.247, 77.044, 77.740, 78.467, 79.128, 79.844, 80.514, 81.155, 81.836, 82.477, 83.125, 83.842, 84.442, 85.072, 85.659, 86.366, 86.901, 87.540, 88.150, 88.787, 89.317, 89.900, 90.432, 91.011, 91.546, 92.148, 92.728, 93.273, 93.987, 94.546, 95.163, 95.744, 96.321, 96.915, 97.511, 98.099, 98.732, 99.288, 99.957, 100.609, 101.212, 101.806, 102.400, 102.955, 103.581, 104.121, 104.757, 105.365, 105.875, 106.453, 107.011, 107.572, 108.088, 108.638, 109.151, 109.725, 110.199, 110.691, 111.220, 111.674, 112.111, 112.602, 113.073, 113.513, 113.989, 114.454, 114.939, 115.340, 115.854, 116.293, 116.693, 117.154, 117.617, 118.106, 118.558, 118.999, 119.436, 119.911, 120.418, 120.907, 121.363, 121.889, 122.318, 122.719, 123.210, 123.695, 124.296, 124.834, 125.333, 125.889, 126.510, 127.116, 127.636, 128.276, 128.820, 129.443, 130.034, 130.645, 131.243, 131.947, 132.587, 133.307, 133.958, 134.533, 135.175, 135.792, 136.478, 137.070, 137.765, 138.366, 139.008, 139.650, 140.223, 140.850, 141.464, 142.047, 142.619, 143.178, 143.746, 144.349, 144.802, 145.398, 145.904, 146.451, 147.013, 147.449, 147.928, 148.376, 148.887, 149.495, 150.018, 150.601, 151.156, 151.623, 152.130, 152.767, 153.289, 153.780, 154.383, 154.977, 155.493, 156.020, 156.585, 157.171, 157.714, 158.209, 158.799, 159.397, 159.863, 160.461, 161.069, 161.669, 162.186, 162.713, 163.296, 163.944, 164.433, 164.925, 165.520, 166.029, 166.585, 167.131, 167.662, 168.249, 168.732, 169.251, 169.847, 170.382, 170.913, 171.429, 171.832, 172.271, 172.838, 173.296, 173.797, 174.297, 174.774, 175.218, 175.747, 176.217, 176.653, 177.171, 177.554, 178.029, 178.470, 178.968, 179.377, 179.959, 180.424, 180.972, 181.462, 181.958, 182.456, 182.965, 183.456, 183.992, 184.592, 185.105, 185.761];
var panel1, panel2, context, state = 0;
var last_tap = 0, last_beep = 0, log_tap = [], log_beep = [];

function start() {
    context = new AudioContext();
    
}

function body_click() {
    if(state == 0) {
        state = 1;
        context = new AudioContext();
        panel1 = document.getElementById('panel1');
        panel2 = document.getElementById('panel2');
        label = document.getElementById('label');
        label.innerHTML = 'tap';
        for(var i = 0; i < time.length; i++) {
            beep(1750, context.currentTime + time[i]);
        }
        record();
    } else if(state == 1) {
        panel2.style.backgroundColor = 'powderblue';
        setInterval(() => {
            panel2.style.backgroundColor = 'white';
        }, 200);
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

function record() {
    navigator.mediaDevices.getUserMedia({audio: true, video: false}).then(stream => {
        const analyser = context.createAnalyser();
        const source = context.createMediaStreamSource(stream);
        source.connect(analyser);
        analyser.fftSize = 256;

        function iteration() {
            var features;
            
            features = get_features(analyser, 1750);
            if(features[0] > 150 && features[1] > 3) {
                console.log('detected', features);
                panel1.style.backgroundColor = 'pink';
                if(context.currentTime > last_beep + 0.1)
                    log_beep.push(context.currentTime);
                last_beep = context.currentTime;  
            } else {
                panel1.style.backgroundColor = 'white';
            }

            requestAnimationFrame(iteration);
        }

        iteration();
    });
}

function get_features(analyser, frequency) {
    const width1 = 3, width2 = 6;

    var data = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteFrequencyData(data); 
    const center = Math.round(frequency*analyser.fftSize/context.sampleRate);
    
    for(var i = 0, sum = 0, sum2 = 0; i < 256; i++) {
        if(i >= center - width2 && i <= center + width2
           && !(i >= center - width1 && i <= center + width1)) {
            sum += data[i];
            sum2 += data[i] * data[i];
        }
    }
    const mean = sum / (2*width2-2*width1);
    const std = Math.sqrt(sum2 / (2*width2-2*width1) - mean * mean);

    if(std == 0)
        return [data[center], 0];
    else
        return [data[center], (data[center] - mean) / std];
}

function export_csv(raw_data, filename) {
    var data = raw_data.join('\r\n');
    var bom  = new Uint8Array([0xEF, 0xBB, 0xBF]);
    var blob = new Blob([bom, data], {type: 'text/csv'});
    var url = (window.URL || window.webkitURL).createObjectURL(blob);
    var link = document.createElement('a');
    link.download = filename;
    link.href = url;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
 }