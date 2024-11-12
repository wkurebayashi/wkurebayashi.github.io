var panel1, panel2, context;

function start() {
    context = new AudioContext();
    panel1 = document.getElementById('panel1');
    panel2 = document.getElementById('panel2');
    record();
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
            } else {
                panel1.style.backgroundColor = 'white';
            }

            features = get_features(analyser, 11250);
            if(features[0] > 150 && features[1] > 3) {
                console.log('detected', features);
                panel2.style.backgroundColor = 'powderblue';
            } else {
                panel2.style.backgroundColor = 'white';
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