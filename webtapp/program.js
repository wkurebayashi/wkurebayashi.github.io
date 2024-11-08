const freq = 1760, freq_cut = 1500, freq_min = 1560, freq_max = 1960, fftSize = 128, T0 = 60/75;
var context, stage = 0, threshold, log_beep = [], log_tap = [], log_s = [], s, T, delta = 0, limit;

function transition(stage) {
    var field = document.getElementById('field');
    var button = document.getElementById('button');

    if(stage == 0) {
        field.innerHTML = '環境音を収録しています。';
        button.disabled = true;
        context = new AudioContext();
        setup();
    } else if(stage == 1) {
        field.innerHTML = 'より静かな場所に移動し、環境音の収録を再開します。';
        button.disabled = false;
        button.onclick = () => transition(0);
    } else if(stage == 2) {
        field.innerHTML = '実験を開始します。';
        button.disabled = false;
        button.onclick = () => transition(3);
    } else if(stage == 3) {
        field.innerHTML = 'ビープ音に合わせてタップして下さい。';
        button.disabled = true;
        setup2();
    } else if(stage == 4) {
        field.innerHTML = 'ビープ音が検出されませんでした。環境を調整し、実験を再開して下さい。'
        button.disabled = false;
        button.onclick = () => transition(3);
    } else if(stage == 5) {
        field.innerHTML = 'タップ音が検出されませんでした。環境を調整し、実験を再開して下さい。'
        button.disabled = false;
        button.onclick = () => transition(3);
    } else if(stage == 6) {
        field.innerHTML = 'ビープ音に合わせつつ、最初のテンポを維持してタップを続けて下さい。';
        experiment();
    } else if(stage == 7) {
        field.innerHTML = '実験は終了しました。';
        export_csv(log_tap, 'human.csv');
        export_csv(log_beep, 'computer.csv');
        // export_csv(log_s, 'computer2.csv');
    }
}

function setup() {
    navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
        const analyser = context.createAnalyser({fftSize: fftSize});
        const source = context.createMediaStreamSource(stream);
        source.connect(analyser);
        const buffer = [];

        function get_features() {
            var data = new Uint8Array(analyser.frequencyBinCount);
            analyser.getByteFrequencyData(data);
            const idx_min = Math.floor(freq_min / (context.sampleRate / analyser.fftSize));
            const idx_max = Math.floor(freq_max / (context.sampleRate / analyser.fftSize));
            for(var i = 0, sum = 0; i < data.length; i++) {
                if(i < idx_min || i > idx_max)
                    sum += data[i];
            }
            return sum;
        }

        function iteration() {
            var features = get_features();
            buffer.push(features);
            if(context.currentTime < limit) {
                requestAnimationFrame(iteration);
            } else {
                for(var i = 0, sum1 = 0, sum2 = 0; i < buffer.length; i++) {
                    sum1 += buffer[i];
                    sum2 += buffer[i]*buffer[i];
                }
                mean = sum1 / buffer.length;
                threshold = mean + 3*Math.sqrt(sum2/buffer.length - mean*mean);
                if(threshold < 10000) {
                    transition(2);
                } else {
                    transition(1);
                }
            }
        }

        limit = context.currentTime + 5;
        iteration();
    });
}

function setup2() {
    navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
        const analyser = context.createAnalyser({fftSize: fftSize});
        const source = context.createMediaStreamSource(stream);
        source.connect(analyser);
        var last_beep = 0, last_tap = 0, cnt_tap = 0, cnt_beep = 0;

        for(var i = 0; i < 10; i++) {
            beep(context.currentTime + i*T0);
        }

        s = context.currentTime + 9*T0;
        T = T0;

        function get_features() {
            var data = new Uint8Array(analyser.frequencyBinCount);
            analyser.getByteFrequencyData(data);
            const idx_cut = Math.floor(freq_cut / (context.sampleRate / analyser.fftSize));
            const idx_min = Math.floor(freq_min / (context.sampleRate / analyser.fftSize));
            const idx_max = Math.floor(freq_max / (context.sampleRate / analyser.fftSize));
            for(var i = 0, sum = 0, max = -1, freq_max = 0; i < data.length; i++) {
                if(i < idx_min || i > idx_max)
                    sum += data[i];
                if(i > idx_cut && data[i] > max) {
                    max = data[i];
                    freq_max = i * context.sampleRate / analyser.fftSize;
                }
            }
            return [sum, freq_max];
        }

        function iteration() {
            if(context.currentTime < limit) {
                var features = get_features();
                if(features[1] > freq_min && features[1] < freq_max) {
                    if(context.currentTime > last_beep + 0.2) cnt_beep++;
                    last_beep = context.currentTime;
                }
                if (features[0] > threshold) {
                    if(context.currentTime > last_tap + 0.2) cnt_tap++;
                    last_tap = context.currentTime;
                }
                requestAnimationFrame(iteration);
            } else {
                if(cnt_beep < 3)
                    transition(4);
                else if (cnt_tap < 5)
                    transition(5);
                else {
                    transition(6);
                }
                    
            }
        }

        limit = context.currentTime + 10*T0;
        iteration();
    });
}

function experiment() {
    navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
        const analyser = context.createAnalyser({fftSize: fftSize});
        const source = context.createMediaStreamSource(stream);
        source.connect(analyser);
        var last_beep = 0, last_tap = 0;

        function get_features() {
            var data = new Uint8Array(analyser.frequencyBinCount);
            analyser.getByteFrequencyData(data);
            const idx_cut = Math.floor(freq_cut / (context.sampleRate / analyser.fftSize));
            const idx_min = Math.floor(freq_min / (context.sampleRate / analyser.fftSize));
            const idx_max = Math.floor(freq_max / (context.sampleRate / analyser.fftSize));
            for(var i = 0, sum = 0, max = -1, freq_max = 0; i < data.length; i++) {
                if(i < idx_min || i > idx_max)
                    sum += data[i];
                if(i > idx_cut && data[i] > max) {
                    max = data[i];
                    freq_max = i * context.sampleRate / analyser.fftSize;
                }
            }
            return [sum, freq_max];
        }

        function iteration() {
            if(context.currentTime < limit) {
                var features = get_features();
                if(features[1] > freq_min && features[1] < freq_max) {
                    if(context.currentTime > last_beep + 0.2) log_beep.push(context.currentTime);
                    if(context.currentTime - log_tap[log_tap.length-1] < 0.5*T) {
                        delta = log_tap[log_tap.length-1] - context.currentTime;
                    }
                    last_beep = context.currentTime;
                }
                if(features[0] > threshold) {
                    if(context.currentTime > last_tap + 0.2) {
                        log_tap.push(context.currentTime);
                        if(context.currentTime - log_beep[log_beep.length-1] < 0.5*T) {
                            delta = context.currentTime - log_beep[log_beep.length-1];
                        }
                    }
                    last_tap = context.currentTime;
                }
                requestAnimationFrame(iteration);
            } else {
                transition(7);
            }
        }

        limit = context.currentTime + 60;
        virtual_partner();
        iteration();
    });
}

function virtual_partner() {
    const alpha = 0.3, beta = 0.03, sigma = 0.03, k = 0.01;
    s = s + T - alpha*delta;
    T = T - beta*delta + k*(T0-T) + sigma*randn();
    delta = 0;
    if(s < limit) {
        log_s.push(s);
        beep(s);
        setTimeout(virtual_partner, 1000*(s+0.5*T-context.currentTime));
    } else
        return;
}

function beep(time) {
    var oscillator = context.createOscillator();
    var gain = context.createGain();

    oscillator.type = 'sine';
    oscillator.frequency.value = freq;
    oscillator.connect(context.destination);

    oscillator.start(time);
    oscillator.stop(time + 0.1);
}

function randn(){
	var x = Math.random(), y = Math.random();
	var z = Math.sqrt(-2*Math.log(x))*Math.cos(2*Math.PI*y);
	return z;
}

function export_csv(records, filename) {
    let data = records.join('\n');
    let bom  = new Uint8Array([0xEF, 0xBB, 0xBF]);
    let blob = new Blob([bom, data], {type: 'text/csv'});
    let url = (window.URL || window.webkitURL).createObjectURL(blob);
    let link = document.createElement('a');
    link.download = filename;
    link.href = url;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
 };