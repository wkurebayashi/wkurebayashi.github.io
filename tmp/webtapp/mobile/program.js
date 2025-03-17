const time = [0.000, 1.000, 2.000, 3.000, 4.000, 5.000, 6.000, 7.000, 8.000, 9.000, 10.061, 11.164, 12.228, 13.380, 14.527, 15.718, 16.900, 18.118, 19.359, 20.562, 21.714, 22.899, 24.121, 25.295, 26.500, 27.588, 28.599, 29.701, 30.814, 31.819, 32.805, 33.859, 34.835, 35.866, 36.850, 37.896, 38.923, 40.040, 41.138, 42.217, 43.318, 44.395, 45.558, 46.656, 47.746, 48.884, 49.991, 51.096, 52.133, 53.176, 54.175, 55.137, 56.227, 57.179, 58.115, 59.038, 59.965, 60.892, 61.837, 62.741, 63.700, 64.661, 65.615, 66.540, 67.659, 68.749, 69.822, 70.902, 72.052, 73.264, 74.434, 75.712, 76.897, 78.167, 79.401, 80.615, 81.803, 82.995, 84.169, 85.309, 86.412, 87.512, 88.655, 89.673, 90.624, 91.673, 92.595, 93.582, 94.589, 95.548, 96.561, 97.538, 98.506, 99.425, 100.501, 101.539, 102.560, 103.575, 104.543, 105.562, 106.535, 107.501, 108.523, 109.497, 110.460, 111.332, 112.218, 113.146, 114.060, 114.984, 115.769, 116.630, 117.398, 118.195, 118.987, 119.785, 120.551, 121.280, 122.053, 122.874, 123.610, 124.393, 125.132, 125.949, 126.750, 127.551, 128.424, 129.293, 130.202, 131.220, 132.157, 133.157, 134.146, 135.282, 136.269, 137.375, 138.462, 139.581, 140.588, 141.640, 142.627, 143.645, 144.599, 145.600, 146.557, 147.458, 148.506, 149.381, 150.297, 151.164, 152.017, 152.878, 153.736, 154.586, 155.480, 156.302, 157.243, 158.176, 159.071, 159.969, 160.880, 161.765, 162.735, 163.630, 164.633, 165.616, 166.507, 167.471, 168.414, 169.358, 170.254, 171.177, 172.056, 172.988, 173.810, 174.644, 175.505, 176.286, 177.044, 177.853, 178.641, 179.398, 180.196, 180.988, 181.807, 182.556, 183.430, 184.247, 185.045, 185.925, 186.831, 187.792, 188.746, 189.720];
var panel1, panel2, context, state = 0;
var last_tap = 0, last_beep = 0, log_tap = [], log_beep = [];

function transition() {
    if(state == 0) {
        state = 1;
        context = new AudioContext();
        panel1 = document.getElementById('panel1');
        panel2 = document.getElementById('panel2');
        for(var i = 0; i < time.length; i++)
            beep(time[i]);
        record();
    } else if(state == 1) {
        state = 2;
        export_csv(log_beep, 'computer.csv');
        export_csv(log_tap, 'human.csv');
    }
}

function beep(time) {
    var oscillator = context.createOscillator();
    oscillator.type = 'sine';
    oscillator.frequency.value = 1750;
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
                // console.log('detected', features);
                panel1.style.backgroundColor = 'pink';
                if(context.currentTime > last_beep + 0.1)
                    log_beep.push(context.currentTime);
                last_beep = context.currentTime;  
            } else {
                panel1.style.backgroundColor = 'white';
            }

            impact = get_impact(analyser);
            if(impact > 200) {
                // console.log('detected', features);
                panel2.style.backgroundColor = 'powderblue';
                if(context.currentTime > last_tap + 0.1)
                    log_tap.push(context.currentTime);
                last_tap = context.currentTime;
            } else {
                panel2.style.backgroundColor = 'white';
            }

            if(state == 1)
                requestAnimationFrame(iteration);
        }

        iteration();
    });
}

function get_impact(analyser) {
    var data = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteFrequencyData(data);
    var frequency_limit = 1000;
    var index_limit = Math.round(frequency_limit*analyser.fftSize/context.sampleRate);
    for(var i = 0, sum = 0; i < index_limit; i++) sum += data[i];
    return sum / index_limit;
}

function get_features(analyser, frequency) {
    const width1 = 3, width2 = 6;

    var data = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteFrequencyData(data); 
    const center = Math.round(frequency*analyser.fftSize/context.sampleRate);
    
    for(var i = 0, sum = 0, sum2 = 0; i < data.length; i++) {
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