function __awaiter(thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator.throw(value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments)).next());
    });
}

function generateRange(args) {
    return function (x) {
        var outputRange = args.outputCeil - args.outputFloor;
        var inputPct = (x - args.inputMin) / (args.inputMax - args.inputMin);
        return args.outputFloor + (inputPct * outputRange);
    };
}
// function testRange() {
// 	const range0to10 = generateRange({
// 		inputMin: 0,
// 		inputMax: 10,
// 		outputFloor: 0,
// 		outputCeil: 10
// 	});
// 	console.assert(range0to10(5) === 5);
// 	console.assert(range0to10(0) === 0);
// 	console.assert(range0to10(10) === 10);
// 	const range5to15 = generateRange({
// 		inputMin: 0,
// 		inputMax: 1,
// 		outputFloor: 5,
// 		outputCeil: 15
// 	});
// 	console.assert(range5to15(.5) === 10);
// 	console.assert(range5to15(0) === 5);
// 	console.assert(range5to15(1) === 15);
// 	const range5to15_taking10to20 = generateRange({
// 		inputMin: 10,
// 		inputMax: 20,
// 		outputFloor: 5,
// 		outputCeil: 15
// 	});
// 	console.assert(range5to15_taking10to20(15) === 10);
// 	console.assert(range5to15_taking10to20(10) === 5);
// 	console.assert(range5to15_taking10to20(20) === 15);
// 	console.log('pass!')
// }

var easeOutQuad = function (t) { return t * (2 - t); };
var ac = new (typeof webkitAudioContext !== 'undefined' ? webkitAudioContext : AudioContext)();
var endPlayTime = -1;
var endPlayTime2 = -1;
var freqRange400_2000 = generateRange({
    inputMin: 0,
    inputMax: 80,
    outputFloor: 400,
    outputCeil: 2000
});
var freqRange300_1500 = generateRange({
    inputMin: 0,
    inputMax: 80,
    outputFloor: 300,
    outputCeil: 1500
});
// assume magnitude is between 0 and 1, though it can be a tad higher
function spinSound(magnitude) {
    // automation start time
    var time = ac.currentTime;
    var freqMagnitude = magnitude;
    magnitude = Math.min(1, magnitude / 10);
    var x = (easeOutQuad(magnitude) * 1.1) - (0.6 - (0.6 * easeOutQuad(magnitude)));
    if (time + x - easeOutQuad(magnitude) < endPlayTime) {
        return;
    }
    var osc = ac.createOscillator();
    var gain = ac.createGain();
    // enforce range
    magnitude = Math.min(1, Math.max(0, magnitude));
    osc.type = 'triangle';
    osc.connect(gain);
    gain.connect(ac.destination);
    // max of 40 boops
    //const count = 6 + ( 1 * magnitude );
    // decay constant for frequency between each boop
    //const decay = 0.97;
    // starting frequency (min of 400, max of 900)
    var freq = freqRange400_2000(freqMagnitude);
    // boop duration (longer for lower magnitude)
    var dur = 0.1 * (1 - magnitude / 2);
    osc.frequency.setValueAtTime(freq, time);
    osc.frequency.linearRampToValueAtTime(freq * 1.8, time += dur);
    endPlayTime = time + dur;
    // fade out the last boop
    gain.gain.setValueAtTime(0.1, ac.currentTime);
    gain.gain.linearRampToValueAtTime(0, endPlayTime);
    // play it
    osc.start(ac.currentTime);
    osc.stop(endPlayTime);
}
function spinSound2(magnitude) {
    // automation start time
    var time = ac.currentTime;
    var freqMagnitude = magnitude;
    magnitude = Math.min(1, magnitude / 10);
    var x = (easeOutQuad(magnitude) * 1.1) - (0.3 - (0.3 * easeOutQuad(magnitude)));
    if (time + x - easeOutQuad(magnitude) < endPlayTime2) {
        return;
    }
    var osc = ac.createOscillator();
    var gain = ac.createGain();
    // enforce range
    magnitude = Math.min(1, Math.max(0, magnitude));
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(ac.destination);
    var freq = freqRange300_1500(freqMagnitude);
    // boop duration (longer for lower magnitude)
    var dur = 0.05 * (1 - magnitude / 2);
    osc.frequency.setValueAtTime(freq, time);
    osc.frequency.linearRampToValueAtTime(freq * 1.8, time += dur);
    endPlayTime2 = time + dur;
    // fade out the last boop
    gain.gain.setValueAtTime(0.15, ac.currentTime);
    gain.gain.linearRampToValueAtTime(0, endPlayTime2);
    // play it
    osc.start(ac.currentTime);
    osc.stop(endPlayTime2);
}

var _this = undefined;
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').then(function () {
        console.log('service worker is is all cool.');
    }).catch(function (e) {
        console.error('service worker is not so cool.', e);
        throw e;
    });
}
var maxVelocity = 0;
var img = new Image;
var canvas = document.querySelector('canvas');
var velocity = { r: 0, rotationVelocity: 0, maxVelocity: 10 };
var statsElems = {
    turns: document.querySelector('#turns'),
    velocity: document.querySelector('#velocity'),
    maxVelocity: document.querySelector('#maxVelocity')
};

var imgDimensions = { width: 300, height: 300 };
var touchInfo = { samples: [] };
var dPR = window.devicePixelRatio;
var timeRemaining = 5000;
var lastTouchEnd;
var lastTouchVelocity;
canvas.height = imgDimensions.height * dPR;
canvas.width = imgDimensions.width * dPR;
canvas.style.width = imgDimensions.width + "px";
canvas.style.height = imgDimensions.height + "px";
var ctx = canvas.getContext('2d');
var drewImage = false;
function boot() {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, new Promise(function (res) {
                    img.onload = function () {
                        res();
                    };
                    img.src = 'spinner.svg';
                })];
        });
    });
}
function paint() {
    canvas.style.transform = "translateY(-50%) rotate(" + velocity.r + "rad)";
    if (!drewImage) {
        ctx.drawImage(img, 0, 0, imgDimensions.width * dPR, imgDimensions.height * dPR);
        drewImage = true;
    }
}
function stats() {
    var vel = Math.abs(velocity.rotationVelocity * 100);
    maxVelocity = Math.max(vel, maxVelocity);
    var velocityText = vel.toLocaleString(undefined, { maximumFractionDigits: 1 });
    var turnsText = Math.abs(velocity.r / Math.PI).toLocaleString(undefined, { maximumFractionDigits: 0 });
    var maxVelText = maxVelocity.toLocaleString(undefined, { maximumFractionDigits: 1 });
    statsElems.turns.textContent = "" + turnsText;
    statsElems.velocity.textContent = "" + velocityText;
    statsElems.maxVelocity.textContent = "" + maxVelText;
}
function tick() {
    requestAnimationFrame(function () {
        velocity.r += velocity.rotationVelocity;
        if (lastTouchEnd) {
            var timeSinceLastTouch = Date.now() - lastTouchEnd;
            var timeLeftPct = timeSinceLastTouch / timeRemaining;
            if (timeLeftPct < 1) {
                var newVelocity = lastTouchVelocity - (easeOutQuad(timeLeftPct) * lastTouchVelocity);
                velocity.rotationVelocity = newVelocity;
                var soundMagnitude = Math.abs(newVelocity / velocity.maxVelocity * 200);
                spinSound(soundMagnitude);
                spinSound2(soundMagnitude);
            }
        }
        paint();
        stats();
        tick();
    });
}
function onTouchStart(e) {
    touchInfo.startX = e.touches[0].clientX;
    touchInfo.startY = e.touches[0].clientX;
    touchInfo.lastTimestamp = e.timeStamp;
}
function onTouchMove(e) {
    touchInfo.lastX = e.touches[0].clientX;
    touchInfo.lastY = e.touches[0].clientY;
    touchInfo.samples.push({
        xDistance: touchInfo.lastX - touchInfo.startX,
        duration: e.timeStamp - touchInfo.lastTimestamp
    });
    if (touchInfo.samples.length >= 3) {
        updateVelocity(touchInfo.samples);
        touchInfo.samples = [];
    }
    touchInfo.startX = touchInfo.lastX;
    touchInfo.startY = touchInfo.lastY;
    touchInfo.lastTimestamp = e.timeStamp;
}
function touchEnd() {
    updateVelocity(touchInfo.samples);
    touchInfo.samples = [];
}
function updateVelocity(samples) {
    var multiplier = 25;
    var totalDistance = samples.reduce(function (total, curr) { return total += curr.xDistance; }, 0);
    var totalDuration = samples.reduce(function (total, curr) { return total += curr.duration; }, 0);
    var touchSpeed = totalDistance / totalDuration / multiplier;
    if (!Number.isFinite(touchSpeed))
        return;
    if (Math.abs(velocity.rotationVelocity) < velocity.maxVelocity) {
        velocity.rotationVelocity -= touchSpeed;
    }
    resetLastTouch();
}
function resetLastTouch() {
    lastTouchEnd = Date.now();
    lastTouchVelocity = velocity.rotationVelocity;
}
(function () { return __awaiter(_this, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, boot()];
            case 1:
                _a.sent();
                tick();
                document.addEventListener('touchstart', onTouchStart);
                document.addEventListener('touchmove', onTouchMove);
                document.addEventListener('touchend', touchEnd);
                document.addEventListener('touchcancel', touchEnd);
                return [2 /*return*/];
        }
    });
}); })();
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VzIjpbInJhbmdlLnRzIiwiYXVkaW8udHMiLCJpbmRleC50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbnRlcmZhY2UgcmFuZ2VBcmdzIHtcbiAgaW5wdXRNaW46IG51bWJlcjtcbiAgaW5wdXRNYXg6IG51bWJlcjtcbiAgb3V0cHV0Rmxvb3I6IG51bWJlcjtcbiAgb3V0cHV0Q2VpbDogbnVtYmVyO1xufTtcblxuZXhwb3J0IGZ1bmN0aW9uIGdlbmVyYXRlUmFuZ2UoYXJnczogcmFuZ2VBcmdzKSB7XG5cdHJldHVybiBmdW5jdGlvbiAoeDogbnVtYmVyKSB7XG5cdFx0Y29uc3Qgb3V0cHV0UmFuZ2UgPSBhcmdzLm91dHB1dENlaWwgLSBhcmdzLm91dHB1dEZsb29yO1xuXHRcdGNvbnN0IGlucHV0UGN0ID0gKHggLSBhcmdzLmlucHV0TWluKSAvIChhcmdzLmlucHV0TWF4IC0gYXJncy5pbnB1dE1pbik7XG5cdFx0cmV0dXJuIGFyZ3Mub3V0cHV0Rmxvb3IgICsgKGlucHV0UGN0ICogb3V0cHV0UmFuZ2UpO1xuICB9XG59XG5cbi8vIGZ1bmN0aW9uIHRlc3RSYW5nZSgpIHtcbi8vIFx0Y29uc3QgcmFuZ2UwdG8xMCA9IGdlbmVyYXRlUmFuZ2Uoe1xuLy8gXHRcdGlucHV0TWluOiAwLFxuLy8gXHRcdGlucHV0TWF4OiAxMCxcbi8vIFx0XHRvdXRwdXRGbG9vcjogMCxcbi8vIFx0XHRvdXRwdXRDZWlsOiAxMFxuLy8gXHR9KTtcblxuLy8gXHRjb25zb2xlLmFzc2VydChyYW5nZTB0bzEwKDUpID09PSA1KTtcbi8vIFx0Y29uc29sZS5hc3NlcnQocmFuZ2UwdG8xMCgwKSA9PT0gMCk7XG4vLyBcdGNvbnNvbGUuYXNzZXJ0KHJhbmdlMHRvMTAoMTApID09PSAxMCk7XG5cbi8vIFx0Y29uc3QgcmFuZ2U1dG8xNSA9IGdlbmVyYXRlUmFuZ2Uoe1xuLy8gXHRcdGlucHV0TWluOiAwLFxuLy8gXHRcdGlucHV0TWF4OiAxLFxuLy8gXHRcdG91dHB1dEZsb29yOiA1LFxuLy8gXHRcdG91dHB1dENlaWw6IDE1XG4vLyBcdH0pO1xuXG4vLyBcdGNvbnNvbGUuYXNzZXJ0KHJhbmdlNXRvMTUoLjUpID09PSAxMCk7XG4vLyBcdGNvbnNvbGUuYXNzZXJ0KHJhbmdlNXRvMTUoMCkgPT09IDUpO1xuLy8gXHRjb25zb2xlLmFzc2VydChyYW5nZTV0bzE1KDEpID09PSAxNSk7XG5cbi8vIFx0Y29uc3QgcmFuZ2U1dG8xNV90YWtpbmcxMHRvMjAgPSBnZW5lcmF0ZVJhbmdlKHtcbi8vIFx0XHRpbnB1dE1pbjogMTAsXG4vLyBcdFx0aW5wdXRNYXg6IDIwLFxuLy8gXHRcdG91dHB1dEZsb29yOiA1LFxuLy8gXHRcdG91dHB1dENlaWw6IDE1XG4vLyBcdH0pO1xuLy8gXHRjb25zb2xlLmFzc2VydChyYW5nZTV0bzE1X3Rha2luZzEwdG8yMCgxNSkgPT09IDEwKTtcbi8vIFx0Y29uc29sZS5hc3NlcnQocmFuZ2U1dG8xNV90YWtpbmcxMHRvMjAoMTApID09PSA1KTtcbi8vIFx0Y29uc29sZS5hc3NlcnQocmFuZ2U1dG8xNV90YWtpbmcxMHRvMjAoMjApID09PSAxNSk7XG4vLyBcdGNvbnNvbGUubG9nKCdwYXNzIScpXG4vLyB9XG5cblxuIiwiaW1wb3J0IHsgZ2VuZXJhdGVSYW5nZSB9IGZyb20gJy4vcmFuZ2UnO1xuXG5leHBvcnQgY29uc3QgZWFzZU91dFF1YWQgPSAodDogbnVtYmVyKSA9PiB0ICogKDIgLSB0KTtcblxuY29uc3QgYWMgPSBuZXcgKHR5cGVvZiB3ZWJraXRBdWRpb0NvbnRleHQgIT09ICd1bmRlZmluZWQnID8gd2Via2l0QXVkaW9Db250ZXh0IDogQXVkaW9Db250ZXh0KSgpO1xubGV0IGVuZFBsYXlUaW1lID0gLTE7XG5sZXQgZW5kUGxheVRpbWUyID0gLTE7XG5cbmNvbnN0IGZyZXFSYW5nZTQwMF8yMDAwID0gZ2VuZXJhdGVSYW5nZSh7XG4gIGlucHV0TWluOiAwLFxuICBpbnB1dE1heDogODAsXG4gIG91dHB1dEZsb29yOiA0MDAsXG4gIG91dHB1dENlaWw6IDIwMDBcbn0pO1xuY29uc3QgZnJlcVJhbmdlMzAwXzE1MDAgPSBnZW5lcmF0ZVJhbmdlKHtcbiAgaW5wdXRNaW46IDAsXG4gIGlucHV0TWF4OiA4MCxcbiAgb3V0cHV0Rmxvb3I6IDMwMCxcbiAgb3V0cHV0Q2VpbDogMTUwMFxufSk7XG5cbi8vIGFzc3VtZSBtYWduaXR1ZGUgaXMgYmV0d2VlbiAwIGFuZCAxLCB0aG91Z2ggaXQgY2FuIGJlIGEgdGFkIGhpZ2hlclxuZXhwb3J0IGZ1bmN0aW9uIHNwaW5Tb3VuZCggbWFnbml0dWRlOiBudW1iZXIgKSB7XG4gIC8vIGF1dG9tYXRpb24gc3RhcnQgdGltZVxuICBsZXQgdGltZSA9IGFjLmN1cnJlbnRUaW1lO1xuICBjb25zdCBmcmVxTWFnbml0dWRlID0gbWFnbml0dWRlO1xuICBtYWduaXR1ZGUgPSBNYXRoLm1pbigxLCBtYWduaXR1ZGUgLyAxMCk7XG4gIGxldCB4ID0gKGVhc2VPdXRRdWFkKG1hZ25pdHVkZSkgKiAxLjEpIC0oMC42IC0gKDAuNiAqIGVhc2VPdXRRdWFkKG1hZ25pdHVkZSkpKTtcblxuICBpZiAodGltZSArIHggLSBlYXNlT3V0UXVhZChtYWduaXR1ZGUpIDwgZW5kUGxheVRpbWUpIHtcbiAgICAgIHJldHVybjtcbiAgfVxuXG4gIGNvbnN0IG9zYyAgPSBhYy5jcmVhdGVPc2NpbGxhdG9yKCk7XG4gIGNvbnN0IGdhaW4gPSBhYy5jcmVhdGVHYWluKCk7XG5cbiAgLy8gZW5mb3JjZSByYW5nZVxuICBtYWduaXR1ZGUgPSBNYXRoLm1pbiggMSwgTWF0aC5tYXgoIDAsIG1hZ25pdHVkZSApICk7XG5cbiAgb3NjLnR5cGUgPSAndHJpYW5nbGUnO1xuICBvc2MuY29ubmVjdCggZ2FpbiApO1xuICBnYWluLmNvbm5lY3QoIGFjLmRlc3RpbmF0aW9uICk7XG5cbiAgLy8gbWF4IG9mIDQwIGJvb3BzXG4gIC8vY29uc3QgY291bnQgPSA2ICsgKCAxICogbWFnbml0dWRlICk7XG4gIC8vIGRlY2F5IGNvbnN0YW50IGZvciBmcmVxdWVuY3kgYmV0d2VlbiBlYWNoIGJvb3BcbiAgLy9jb25zdCBkZWNheSA9IDAuOTc7XG5cbiAgLy8gc3RhcnRpbmcgZnJlcXVlbmN5IChtaW4gb2YgNDAwLCBtYXggb2YgOTAwKVxuICBsZXQgZnJlcSA9IGZyZXFSYW5nZTQwMF8yMDAwKGZyZXFNYWduaXR1ZGUpO1xuICAvLyBib29wIGR1cmF0aW9uIChsb25nZXIgZm9yIGxvd2VyIG1hZ25pdHVkZSlcbiAgbGV0IGR1ciA9IDAuMSAqICggMSAtIG1hZ25pdHVkZSAvIDIgKTtcbiAgb3NjLmZyZXF1ZW5jeS5zZXRWYWx1ZUF0VGltZSggZnJlcSwgdGltZSApO1xuICBvc2MuZnJlcXVlbmN5LmxpbmVhclJhbXBUb1ZhbHVlQXRUaW1lKCBmcmVxICogMS44LCB0aW1lICs9IGR1ciApO1xuICBlbmRQbGF5VGltZSA9IHRpbWUgKyBkdXI7XG5cbiAgLy8gZmFkZSBvdXQgdGhlIGxhc3QgYm9vcFxuICBnYWluLmdhaW4uc2V0VmFsdWVBdFRpbWUoMC4xLCAgIGFjLmN1cnJlbnRUaW1lKTtcbiAgZ2Fpbi5nYWluLmxpbmVhclJhbXBUb1ZhbHVlQXRUaW1lKCAwLCBlbmRQbGF5VGltZSApO1xuXG4gIC8vIHBsYXkgaXRcbiAgb3NjLnN0YXJ0KGFjLmN1cnJlbnRUaW1lKTtcbiAgb3NjLnN0b3AoZW5kUGxheVRpbWUpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gc3BpblNvdW5kMiggbWFnbml0dWRlOiBudW1iZXIgKSB7XG4gIC8vIGF1dG9tYXRpb24gc3RhcnQgdGltZVxuICBsZXQgdGltZSA9IGFjLmN1cnJlbnRUaW1lO1xuICBjb25zdCBmcmVxTWFnbml0dWRlID0gbWFnbml0dWRlO1xuICBtYWduaXR1ZGUgPSBNYXRoLm1pbigxLCBtYWduaXR1ZGUgLyAxMCk7XG4gIGxldCB4ID0gKGVhc2VPdXRRdWFkKG1hZ25pdHVkZSkgKiAxLjEpIC0gKDAuMyAtICgwLjMgKiBlYXNlT3V0UXVhZChtYWduaXR1ZGUpKSk7XG5cbiAgaWYgKHRpbWUgKyB4IC0gZWFzZU91dFF1YWQobWFnbml0dWRlKSA8IGVuZFBsYXlUaW1lMikge1xuICAgICAgcmV0dXJuO1xuICB9XG5cbiAgY29uc3Qgb3NjICA9IGFjLmNyZWF0ZU9zY2lsbGF0b3IoKTtcbiAgY29uc3QgZ2FpbiA9IGFjLmNyZWF0ZUdhaW4oKTtcblxuICAvLyBlbmZvcmNlIHJhbmdlXG4gIG1hZ25pdHVkZSA9IE1hdGgubWluKCAxLCBNYXRoLm1heCggMCwgbWFnbml0dWRlICkgKTtcblxuICBvc2MudHlwZSA9ICdzaW5lJztcbiAgb3NjLmNvbm5lY3QoIGdhaW4gKTtcbiAgZ2Fpbi5jb25uZWN0KCBhYy5kZXN0aW5hdGlvbiApO1xuXG4gIHZhciBmcmVxID0gZnJlcVJhbmdlMzAwXzE1MDAoZnJlcU1hZ25pdHVkZSk7XG4gIC8vIGJvb3AgZHVyYXRpb24gKGxvbmdlciBmb3IgbG93ZXIgbWFnbml0dWRlKVxuICB2YXIgZHVyID0gMC4wNSAqICgxIC0gbWFnbml0dWRlIC8gMik7XG4gIG9zYy5mcmVxdWVuY3kuc2V0VmFsdWVBdFRpbWUoZnJlcSwgdGltZSk7XG4gIG9zYy5mcmVxdWVuY3kubGluZWFyUmFtcFRvVmFsdWVBdFRpbWUoZnJlcSAqIDEuOCwgdGltZSArPSBkdXIpO1xuICBlbmRQbGF5VGltZTIgPSB0aW1lICsgZHVyO1xuICAvLyBmYWRlIG91dCB0aGUgbGFzdCBib29wXG4gIGdhaW4uZ2Fpbi5zZXRWYWx1ZUF0VGltZSgwLjE1LCBhYy5jdXJyZW50VGltZSk7XG4gIGdhaW4uZ2Fpbi5saW5lYXJSYW1wVG9WYWx1ZUF0VGltZSgwLCBlbmRQbGF5VGltZTIpO1xuXG4gIC8vIHBsYXkgaXRcbiAgb3NjLnN0YXJ0KGFjLmN1cnJlbnRUaW1lKTtcbiAgb3NjLnN0b3AoZW5kUGxheVRpbWUyKTtcbn1cbiIsImltcG9ydCB7IHNwaW5Tb3VuZCwgc3BpblNvdW5kMiwgZWFzZU91dFF1YWQgfSBmcm9tICcuL2F1ZGlvJztcblxuaWYgKCdzZXJ2aWNlV29ya2VyJyBpbiBuYXZpZ2F0b3IpIHtcbiAgbmF2aWdhdG9yLnNlcnZpY2VXb3JrZXIucmVnaXN0ZXIoJy9zdy5qcycpLnRoZW4oZnVuY3Rpb24oKSB7XG4gICAgY29uc29sZS5sb2coJ3NlcnZpY2Ugd29ya2VyIGlzIGlzIGFsbCBjb29sLicpO1xuICB9KS5jYXRjaChmdW5jdGlvbihlKSB7XG4gICAgY29uc29sZS5lcnJvcignc2VydmljZSB3b3JrZXIgaXMgbm90IHNvIGNvb2wuJywgZSk7XG4gICAgdGhyb3cgZTtcbiAgfSk7XG59XG5cbmxldCBtYXhWZWxvY2l0eSA9IDA7XG5jb25zdCBpbWcgPSBuZXcgSW1hZ2U7XG5cbmNvbnN0IGNhbnZhcyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJ2NhbnZhcycpIGFzIEhUTUxDYW52YXNFbGVtZW50O1xuY29uc3QgdmVsb2NpdHkgPSB7IHI6IDAsIHJvdGF0aW9uVmVsb2NpdHk6IDAsIG1heFZlbG9jaXR5OiAxMCB9O1xuXG5jb25zdCBzdGF0c0VsZW1zID0ge1xuICB0dXJuczogZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI3R1cm5zJykhLFxuICB2ZWxvY2l0eTogZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI3ZlbG9jaXR5JykhLFxuICBtYXhWZWxvY2l0eTogZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI21heFZlbG9jaXR5JykhXG59O1xuXG5pbnRlcmZhY2UgU2FtcGxlIHtcbiAgeERpc3RhbmNlOiBudW1iZXI7XG4gIGR1cmF0aW9uOiBudW1iZXI7XG59O1xuXG5jb25zdCBpbWdEaW1lbnNpb25zID0geyB3aWR0aDogMzAwLCBoZWlnaHQ6IDMwMCB9O1xuY29uc3QgdG91Y2hJbmZvOiB7XG4gIHN0YXJ0WD86IG51bWJlcjtcbiAgc3RhcnRZPzogbnVtYmVyO1xuICBsYXN0WD86IG51bWJlcjtcbiAgbGFzdFk/OiBudW1iZXI7XG4gIHNhbXBsZXM6IFNhbXBsZVtdO1xuICBsYXN0VGltZXN0YW1wPzogbnVtYmVyO1xufSA9IHsgc2FtcGxlczogW10gfTtcblxuY29uc3QgZFBSID0gd2luZG93LmRldmljZVBpeGVsUmF0aW87XG5sZXQgdGltZVJlbWFpbmluZyA9IDUwMDA7XG5sZXQgbGFzdFRvdWNoRW5kOiBudW1iZXI7XG5sZXQgbGFzdFRvdWNoVmVsb2NpdHk6IG51bWJlcjtcblxuY2FudmFzLmhlaWdodCA9IGltZ0RpbWVuc2lvbnMuaGVpZ2h0ICogZFBSO1xuY2FudmFzLndpZHRoID0gaW1nRGltZW5zaW9ucy53aWR0aCAqIGRQUjtcbmNhbnZhcy5zdHlsZS53aWR0aCA9IGAke2ltZ0RpbWVuc2lvbnMud2lkdGh9cHhgO1xuY2FudmFzLnN0eWxlLmhlaWdodCA9IGAke2ltZ0RpbWVuc2lvbnMuaGVpZ2h0fXB4YDtcblxuY29uc3QgY3R4ID0gY2FudmFzLmdldENvbnRleHQoJzJkJykhO1xubGV0IGRyZXdJbWFnZSA9IGZhbHNlO1xuXG5hc3luYyBmdW5jdGlvbiBib290KCkge1xuICByZXR1cm4gbmV3IFByb21pc2UoKHJlcykgPT4ge1xuICAgIGltZy5vbmxvYWQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICByZXMoKTtcbiAgICB9XG5cbiAgICBpbWcuc3JjID0gJ3NwaW5uZXIuc3ZnJztcbiAgfSk7XG59XG5cbmZ1bmN0aW9uIHBhaW50KCkge1xuICBjYW52YXMuc3R5bGUudHJhbnNmb3JtID0gYHRyYW5zbGF0ZVkoLTUwJSkgcm90YXRlKCR7dmVsb2NpdHkucn1yYWQpYDtcblxuICBpZiAoIWRyZXdJbWFnZSkge1xuICAgIGN0eC5kcmF3SW1hZ2UoaW1nLCAwLCAwLCBpbWdEaW1lbnNpb25zLndpZHRoICogZFBSLCBpbWdEaW1lbnNpb25zLmhlaWdodCAqIGRQUik7XG4gICAgZHJld0ltYWdlID0gdHJ1ZTtcbiAgfVxufVxuXG5mdW5jdGlvbiBzdGF0cygpIHtcbiAgY29uc3QgdmVsID0gTWF0aC5hYnModmVsb2NpdHkucm90YXRpb25WZWxvY2l0eSAqIDEwMCk7XG4gIG1heFZlbG9jaXR5ID0gTWF0aC5tYXgodmVsLCBtYXhWZWxvY2l0eSk7XG4gIGNvbnN0IHZlbG9jaXR5VGV4dCA9IHZlbC50b0xvY2FsZVN0cmluZyh1bmRlZmluZWQsIHsgbWF4aW11bUZyYWN0aW9uRGlnaXRzOiAxIH0pO1xuICBjb25zdCB0dXJuc1RleHQgPSBNYXRoLmFicyh2ZWxvY2l0eS5yIC8gTWF0aC5QSSkudG9Mb2NhbGVTdHJpbmcodW5kZWZpbmVkLCB7IG1heGltdW1GcmFjdGlvbkRpZ2l0czogMCB9KTtcbiAgY29uc3QgbWF4VmVsVGV4dCA9IG1heFZlbG9jaXR5LnRvTG9jYWxlU3RyaW5nKHVuZGVmaW5lZCwge21heGltdW1GcmFjdGlvbkRpZ2l0czogMX0pO1xuXG4gIHN0YXRzRWxlbXMudHVybnMudGV4dENvbnRlbnQgPSBgJHt0dXJuc1RleHR9YDtcbiAgc3RhdHNFbGVtcy52ZWxvY2l0eS50ZXh0Q29udGVudCA9IGAke3ZlbG9jaXR5VGV4dH1gO1xuICBzdGF0c0VsZW1zLm1heFZlbG9jaXR5LnRleHRDb250ZW50ID0gYCR7bWF4VmVsVGV4dH1gO1xufVxuXG5mdW5jdGlvbiB0aWNrKCkge1xuICByZXF1ZXN0QW5pbWF0aW9uRnJhbWUoKCkgPT4ge1xuICAgIHZlbG9jaXR5LnIgKz0gdmVsb2NpdHkucm90YXRpb25WZWxvY2l0eTtcblxuICAgIGlmIChsYXN0VG91Y2hFbmQpIHtcbiAgICAgIGNvbnN0IHRpbWVTaW5jZUxhc3RUb3VjaCA9IERhdGUubm93KCkgLSBsYXN0VG91Y2hFbmQ7XG4gICAgICBjb25zdCB0aW1lTGVmdFBjdCA9IHRpbWVTaW5jZUxhc3RUb3VjaCAvIHRpbWVSZW1haW5pbmc7XG4gICAgICBpZiAodGltZUxlZnRQY3QgPCAxKSB7XG4gICAgICAgIGNvbnN0IG5ld1ZlbG9jaXR5ID0gbGFzdFRvdWNoVmVsb2NpdHkgLSAoZWFzZU91dFF1YWQodGltZUxlZnRQY3QpICogbGFzdFRvdWNoVmVsb2NpdHkpO1xuICAgICAgICB2ZWxvY2l0eS5yb3RhdGlvblZlbG9jaXR5ID0gbmV3VmVsb2NpdHk7XG4gICAgICAgIGNvbnN0IHNvdW5kTWFnbml0dWRlID0gTWF0aC5hYnMobmV3VmVsb2NpdHkgLyB2ZWxvY2l0eS5tYXhWZWxvY2l0eSAqIDIwMCk7XG4gICAgICAgIHNwaW5Tb3VuZChzb3VuZE1hZ25pdHVkZSk7XG4gICAgICAgIHNwaW5Tb3VuZDIoc291bmRNYWduaXR1ZGUpO1xuICAgICAgfVxuICAgIH1cblxuICAgIHBhaW50KCk7XG4gICAgc3RhdHMoKTtcbiAgICB0aWNrKCk7XG4gIH0pO1xufVxuXG5mdW5jdGlvbiBvblRvdWNoU3RhcnQoZTogVG91Y2hFdmVudCkge1xuICB0b3VjaEluZm8uc3RhcnRYID0gZS50b3VjaGVzWzBdLmNsaWVudFg7XG4gIHRvdWNoSW5mby5zdGFydFkgPSBlLnRvdWNoZXNbMF0uY2xpZW50WDtcbiAgdG91Y2hJbmZvLmxhc3RUaW1lc3RhbXAgPSBlLnRpbWVTdGFtcDtcbn1cblxuZnVuY3Rpb24gb25Ub3VjaE1vdmUoZTogVG91Y2hFdmVudCkge1xuICB0b3VjaEluZm8ubGFzdFggPSBlLnRvdWNoZXNbMF0uY2xpZW50WDtcbiAgdG91Y2hJbmZvLmxhc3RZID0gZS50b3VjaGVzWzBdLmNsaWVudFk7XG5cbiAgdG91Y2hJbmZvLnNhbXBsZXMucHVzaCh7XG4gICAgeERpc3RhbmNlOiB0b3VjaEluZm8ubGFzdFggLSB0b3VjaEluZm8uc3RhcnRYISxcbiAgICBkdXJhdGlvbjogZS50aW1lU3RhbXAgLSB0b3VjaEluZm8ubGFzdFRpbWVzdGFtcCFcbiAgfSk7XG5cbiAgaWYgKHRvdWNoSW5mby5zYW1wbGVzLmxlbmd0aCA+PSAzKSB7XG4gICAgdXBkYXRlVmVsb2NpdHkodG91Y2hJbmZvLnNhbXBsZXMpO1xuICAgIHRvdWNoSW5mby5zYW1wbGVzID0gW107XG4gIH1cblxuICB0b3VjaEluZm8uc3RhcnRYID0gdG91Y2hJbmZvLmxhc3RYO1xuICB0b3VjaEluZm8uc3RhcnRZID0gdG91Y2hJbmZvLmxhc3RZO1xuICB0b3VjaEluZm8ubGFzdFRpbWVzdGFtcCA9IGUudGltZVN0YW1wO1xufVxuXG5mdW5jdGlvbiB0b3VjaEVuZCgpIHtcbiAgdXBkYXRlVmVsb2NpdHkodG91Y2hJbmZvLnNhbXBsZXMpO1xuICB0b3VjaEluZm8uc2FtcGxlcyA9IFtdO1xufVxuXG5cbmZ1bmN0aW9uIHVwZGF0ZVZlbG9jaXR5KHNhbXBsZXM6IFNhbXBsZVtdKSB7XG4gIGNvbnN0IG11bHRpcGxpZXIgPSAyNTtcblxuICBjb25zdCB0b3RhbERpc3RhbmNlID0gc2FtcGxlcy5yZWR1Y2UoKHRvdGFsLCBjdXJyKSA9PiB0b3RhbCArPSBjdXJyLnhEaXN0YW5jZSwgMCk7XG4gIGNvbnN0IHRvdGFsRHVyYXRpb24gPSBzYW1wbGVzLnJlZHVjZSgodG90YWwsIGN1cnIpID0+IHRvdGFsICs9IGN1cnIuZHVyYXRpb24sIDApO1xuICBjb25zdCB0b3VjaFNwZWVkID0gdG90YWxEaXN0YW5jZSAvIHRvdGFsRHVyYXRpb24gLyBtdWx0aXBsaWVyO1xuXG4gIGlmICghTnVtYmVyLmlzRmluaXRlKHRvdWNoU3BlZWQpKSByZXR1cm47XG5cbiAgaWYgKE1hdGguYWJzKHZlbG9jaXR5LnJvdGF0aW9uVmVsb2NpdHkpIDwgdmVsb2NpdHkubWF4VmVsb2NpdHkpIHtcbiAgICB2ZWxvY2l0eS5yb3RhdGlvblZlbG9jaXR5IC09IHRvdWNoU3BlZWQ7XG4gIH1cblxuICByZXNldExhc3RUb3VjaCgpO1xufVxuXG5mdW5jdGlvbiByZXNldExhc3RUb3VjaCgpIHtcbiAgbGFzdFRvdWNoRW5kID0gRGF0ZS5ub3coKTtcbiAgbGFzdFRvdWNoVmVsb2NpdHkgPSB2ZWxvY2l0eS5yb3RhdGlvblZlbG9jaXR5O1xufVxuXG4oYXN5bmMgKCkgPT4ge1xuICBhd2FpdCBib290KCk7XG4gIHRpY2soKTtcblxuICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCd0b3VjaHN0YXJ0Jywgb25Ub3VjaFN0YXJ0KTtcbiAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcigndG91Y2htb3ZlJywgb25Ub3VjaE1vdmUpO1xuICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCd0b3VjaGVuZCcsIHRvdWNoRW5kKTtcbiAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcigndG91Y2hjYW5jZWwnLCB0b3VjaEVuZCk7XG59KSgpO1xuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozt1QkFPOEIsSUFBZTtJQUM1QyxPQUFPLFVBQVUsQ0FBUztRQUN6QixJQUFNLFdBQVcsR0FBRyxJQUFJLENBQUMsVUFBVSxHQUFHLElBQUksQ0FBQyxXQUFXLENBQUM7UUFDdkQsSUFBTSxRQUFRLEdBQUcsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLFFBQVEsS0FBSyxJQUFJLENBQUMsUUFBUSxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUN2RSxPQUFPLElBQUksQ0FBQyxXQUFXLElBQUssUUFBUSxHQUFHLFdBQVcsQ0FBQyxDQUFDO0tBQ25ELENBQUE7Q0FDRjs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0lBbUNHOztBQzlDRyxJQUFNLFdBQVcsR0FBRyxVQUFDLENBQVMsSUFBSyxPQUFBLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUEsQ0FBQztBQUV0RCxJQUFNLEVBQUUsR0FBRyxLQUFLLE9BQU8sa0JBQWtCLEtBQUssV0FBVyxHQUFHLGtCQUFrQixHQUFHLFlBQVksR0FBRyxDQUFDO0FBQ2pHLElBQUksV0FBVyxHQUFHLENBQUMsQ0FBQyxDQUFDO0FBQ3JCLElBQUksWUFBWSxHQUFHLENBQUMsQ0FBQyxDQUFDO0FBRXRCLElBQU0saUJBQWlCLEdBQUcsYUFBYSxDQUFDO0lBQ3RDLFFBQVEsRUFBRSxDQUFDO0lBQ1gsUUFBUSxFQUFFLEVBQUU7SUFDWixXQUFXLEVBQUUsR0FBRztJQUNoQixVQUFVLEVBQUUsSUFBSTtDQUNqQixDQUFDLENBQUM7QUFDSCxJQUFNLGlCQUFpQixHQUFHLGFBQWEsQ0FBQztJQUN0QyxRQUFRLEVBQUUsQ0FBQztJQUNYLFFBQVEsRUFBRSxFQUFFO0lBQ1osV0FBVyxFQUFFLEdBQUc7SUFDaEIsVUFBVSxFQUFFLElBQUk7Q0FDakIsQ0FBQyxDQUFDOztBQUdILG1CQUEyQixT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
