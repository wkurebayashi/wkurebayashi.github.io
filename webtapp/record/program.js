var panel1, panel2, context, state = 0;
var last_tap = 0, last_beep = 0, log_tap = [], log_beep = [];

function transition() {
    if(state == 0) {
        state = 1;
        context = new AudioContext();
        panel1 = document.getElementById('panel1');
        panel2 = document.getElementById('panel2');
        record();
    } else if(state == 1) {
        state = 2;
        export_csv(log_beep, 'computer.csv');
        export_csv(log_tap, 'human.csv');
    }
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

            features = get_features(analyser, 11250);
            if(features[0] > 150 && features[1] > 3) {
                console.log('detected', features);
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