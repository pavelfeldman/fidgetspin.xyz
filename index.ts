if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./sw.js').then(function() {
    console.log('service worker is is all cool.');
  }).catch(function(e) {
    console.error('service worker is not so cool.', e);
    throw e;
  });
}

// thx https://github.com/Modernizr/Modernizr/blob/master/feature-detects/pointerevents.js
const USE_POINTER_EVENTS = 'onpointerdown' in document.createElement('div') ;

let velocity = 0;

const ac = new (typeof webkitAudioContext !== 'undefined' ? webkitAudioContext : AudioContext)();
const masterVolume = ac.createGain();
masterVolume.connect(ac.destination);

const appState = {
  muted: localStorage.getItem('fidget_muted') === 'true' ? true : false,
  spins: localStorage.getItem('fidget_spins') ? parseInt(localStorage.getItem('fidget_spins')!, 10) : 0,
  maxVelocity: localStorage.getItem('fidget_max_velocity') ? parseInt(localStorage.getItem('fidget_max_velocity')!, 10) : 0
};


const domElements = {
  turns: document.getElementById('turns')!,
  velocity: document.getElementById('velocity')!,
  maxVelocity: document.getElementById('maxVelocity')!,
  spinner: document.getElementById('spinner')!,
  traceSlow: document.getElementById('trace-slow')!,
  traceFast: document.getElementById('trace-fast')!,
  toggleAudio: document.getElementById('toggle-audio')!
};

let fidgetAlpha = 0;
let fidgetSpeed = 0;

function deferWork(fn: () => void) {
  if (typeof requestIdleCallback as any !== 'undefined') {
    requestIdleCallback(fn, {timeout: 60});
  } else if (typeof requestAnimationFrame !== 'undefined') {
    requestAnimationFrame(fn);
  } else {
    setTimeout(fn, 16.66);
  }
}

function stats() {
  velocity = Math.abs(fidgetSpeed * 60 /* fps */ * 60 /* sec */ / 2 / Math.PI) | 0;
  const newMaxVelocity =  Math.max(velocity, appState.maxVelocity);

  if (appState.maxVelocity !== newMaxVelocity) {
    deferWork(() => localStorage.setItem('fidget_max_velocity', `${appState.maxVelocity}`));
    appState.maxVelocity = newMaxVelocity;
  }

  appState.spins += Math.abs(fidgetSpeed / 2 / Math.PI);
  deferWork(() => localStorage.setItem('fidget_spins', `${appState.spins}`));
  const turnsText = appState.spins.toLocaleString(undefined, { maximumFractionDigits: 0 });
  const maxVelText = appState.maxVelocity.toLocaleString(undefined, {maximumFractionDigits: 1});

  domElements.turns.textContent = `${turnsText}`;
  domElements.velocity.textContent = `${velocity}`;
  domElements.maxVelocity.textContent = `${maxVelText}`;
}

const spinnerPos = domElements.spinner.getBoundingClientRect();
const centerX = spinnerPos.left + spinnerPos.width / 2;
const centerY = spinnerPos.top + spinnerPos.height / 2;
const centerRadius = spinnerPos.width / 10;

//
// Spin code
//

const touchInfo: {
  alpha: number;
  radius: number;
  down: boolean;
} = { alpha: 0, radius: 0, down: false };

let touchSpeed = 0;
let lastTouchAlpha = 0;

function getXYFromTouchOrPointer(e: TouchEvent | PointerEvent) {
  let x = 'touches' in e ? (e as TouchEvent).touches[0].clientX : (e as PointerEvent).clientX;
  let y = 'touches' in e ? (e as TouchEvent).touches[0].clientY : (e as PointerEvent).clientY;

  return {x: x - centerX, y: y - centerY};
}

function onTouchStart(e: TouchEvent | PointerEvent) {
  let {x, y} = getXYFromTouchOrPointer(e);
  onTouchMove(e);
  touchInfo.down = true;
  touchInfo.radius = Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2));
  lastTouchAlpha = touchInfo.alpha;
}

function onTouchMove(e: TouchEvent | PointerEvent) {
  let {x, y} = getXYFromTouchOrPointer(e);
  touchInfo.alpha = Math.atan2(x, y);
  e.preventDefault();
}

function touchEnd() {
  touchInfo.down = false;
}

function tick() {
  requestAnimationFrame(() => {
    if (touchInfo.down) {
      if (touchInfo.radius > centerRadius) {
        touchSpeed = touchInfo.alpha - lastTouchAlpha;
        if (touchSpeed < - Math.PI)
          touchSpeed += 2 * Math.PI;
        if (touchSpeed > Math.PI)
          touchSpeed -= 2 * Math.PI;

        fidgetSpeed = touchSpeed;
        lastTouchAlpha = touchInfo.alpha;
      }
    } else if (touchSpeed) {
      fidgetSpeed = touchSpeed * touchInfo.radius / centerRadius;
      touchSpeed = 0;
    }

    fidgetAlpha -= fidgetSpeed;
    domElements.spinner.style.transform = `rotate(${fidgetAlpha}rad)`;
    domElements.traceSlow.style.opacity = Math.abs(fidgetSpeed) > 0.2 ? '1' : '0.00001';
    domElements.traceFast.style.opacity = Math.abs(fidgetSpeed) > 0.4 ? '1' : '0.00001';
    stats();

    // Slow down over time
    fidgetSpeed = fidgetSpeed * 0.99;
    fidgetSpeed = Math.sign(fidgetSpeed) * Math.max(0, (Math.abs(fidgetSpeed) - 2e-4));

    const soundMagnitude = Math.abs(velocity * Math.PI / 60);
    if (soundMagnitude && !touchInfo.down) {
      spinSound(soundMagnitude);
      spinSound2(soundMagnitude);
    }

    tick();
  });
}


//
// Audio code
//

let endPlayTime = -1;
let endPlayTime2 = -1;

interface rangeArgs {
  inputMin: number;
  inputMax: number;
  outputFloor: number;
  outputCeil: number;
};
function generateRange(args: rangeArgs) {
	return function (x: number):number {
		const outputRange = args.outputCeil - args.outputFloor;
		const inputPct = (x - args.inputMin) / (args.inputMax - args.inputMin);
		return args.outputFloor + (inputPct * outputRange);
  }
}
const freqRange400_2000 = generateRange({
  inputMin: 0,
  inputMax: 80,
  outputFloor: 400,
  outputCeil: 2000
});
const freqRange300_1500 = generateRange({
  inputMin: 0,
  inputMax: 80,
  outputFloor: 300,
  outputCeil: 1500
});

const easeOutQuad = (t: number) => t * (2 - t);

// assume magnitude is between 0 and 1, though it can be a tad higher
function spinSound( magnitude: number ) {
  // automation start time
  let time = ac.currentTime;
  const freqMagnitude = magnitude;
  magnitude = Math.min(1, magnitude / 10);
  let x = (easeOutQuad(magnitude) * 1.1) -(0.6 - (0.6 * easeOutQuad(magnitude)));

  if (time + x - easeOutQuad(magnitude) < endPlayTime) {
      return;
  }

  const osc  = ac.createOscillator();
  const gain = ac.createGain();

  // enforce range
  magnitude = Math.min( 1, Math.max( 0, magnitude ) );

  osc.type = 'triangle';
  osc.connect( gain );
  gain.connect(masterVolume);

  // max of 40 boops
  //const count = 6 + ( 1 * magnitude );
  // decay constant for frequency between each boop
  //const decay = 0.97;

  // starting frequency (min of 400, max of 900)
  let freq = freqRange400_2000(freqMagnitude);
  // boop duration (longer for lower magnitude)
  let dur = 0.1 * ( 1 - magnitude / 2 );
  osc.frequency.setValueAtTime( freq, time );
  osc.frequency.linearRampToValueAtTime( freq * 1.8, time += dur );
  endPlayTime = time + dur;

  // fade out the last boop
  gain.gain.setValueAtTime(0.1,   ac.currentTime);
  gain.gain.linearRampToValueAtTime( 0, endPlayTime );

  // play it
  osc.start(ac.currentTime);
  osc.stop(endPlayTime);
}

function spinSound2( magnitude: number ) {
  // automation start time
  let time = ac.currentTime;
  const freqMagnitude = magnitude;
  magnitude = Math.min(1, magnitude / 10);
  let x = (easeOutQuad(magnitude) * 1.1) - (0.3 - (0.3 * easeOutQuad(magnitude)));

  if (time + x - easeOutQuad(magnitude) < endPlayTime2) {
      return;
  }

  const osc  = ac.createOscillator();
  const gain = ac.createGain();

  // enforce range
  magnitude = Math.min( 1, Math.max( 0, magnitude ) );

  osc.type = 'sine';
  osc.connect( gain );
  gain.connect(masterVolume);

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

// Audio on IOS is very hard.
// http://www.holovaty.com/writing/ios9-web-audio/
// https://github.com/goldfire/howler.js/blob/8612912af28d6fb9f442c4f5a02827155bcf3464/src/howler.core.js#L278
function unlockAudio() {
  function unlock() {
    // Create an empty buffer.
    const source = ac.createBufferSource();
    source.buffer = ac.createBuffer(1, 1, 22050);;
    source.connect(ac.destination);

    // Play the empty buffer.
    if (typeof source.start === 'undefined') {
      (source as any).noteOn(0);
    } else {
      source.start(0);
    }

    // Setup a timeout to check that we are unlocked on the next event loop.
    source.onended = function() {
      source.disconnect(0);

      // Remove the touch start listener.
      document.removeEventListener('touchend', unlock, true);
    };
  }

  document.addEventListener('touchend', unlock, true);
}

function setMutedSideEffects(muted: boolean) {
  domElements.toggleAudio.classList.toggle('muted', muted);
  masterVolume.gain.setValueAtTime(appState.muted ? 0 : 1, ac.currentTime);
  localStorage.setItem('fidget_muted', `${appState.muted}`);
}

function toggleAudio(e: Event) {
  appState.muted = !appState.muted;
  setMutedSideEffects(appState.muted);

  // if something is spinning, we do not want to stop it if you touch the menu.
  e.stopPropagation();
}

(async () => {
  setMutedSideEffects(appState.muted);
  unlockAudio();
  tick();
  const listenFor = document.addEventListener as WhatWGAddEventListener;

  domElements.toggleAudio.addEventListener(
    USE_POINTER_EVENTS ? 'pointerdown' : 'touchstart',
    toggleAudio);

  listenFor(
    USE_POINTER_EVENTS ? 'pointerdown' : 'touchstart',
    onTouchStart,
    {passive: false}
  );

  listenFor(
    USE_POINTER_EVENTS ? 'pointermove' : 'touchmove',
    onTouchMove,
    {passive: false}
  );

  listenFor(
    USE_POINTER_EVENTS ? 'pointerup' : 'touchend',
    touchEnd,
  );

  listenFor(
    USE_POINTER_EVENTS ? 'pointercancel' : 'touchcancel',
    touchEnd,
  );
})();
