
/*
sound.js
===============

a complete micro library of useful, modular functions that help you load, play, control
and generate sound effects and music for games and interactive applications. all the
code targets the webaudio api.
*/


/*
fixing the webaudio api
--------------------------

the webaudio api is so new that it's api is not consistently implemented properly across
all modern browsers. thankfully, chris wilson's audio context monkey patch script
normalizes the api for maximum compatibility.

https://github.com/cwilso/audiocontext-monkeypatch/blob/gh-pages/audiocontextmonkeypatch.js

it's included here.
thank you, chris!

*/

(function (global, exports, perf) {
  'use strict';

  function fixsettarget(param) {
    if (!param)	// if nyi, just return
      return;
    if (!param.settargetattime)
      param.settargetattime = param.settargetvalueattime;
  }

  if (window.hasownproperty('webkitaudiocontext') &&
      !window.hasownproperty('audiocontext')) {
    window.audiocontext = webkitaudiocontext;

    if (!audiocontext.prototype.hasownproperty('creategain'))
      audiocontext.prototype.creategain = audiocontext.prototype.creategainnode;
    if (!audiocontext.prototype.hasownproperty('createdelay'))
      audiocontext.prototype.createdelay = audiocontext.prototype.createdelaynode;
    if (!audiocontext.prototype.hasownproperty('createscriptprocessor'))
      audiocontext.prototype.createscriptprocessor = audiocontext.prototype.createjavascriptnode;
    if (!audiocontext.prototype.hasownproperty('createperiodicwave'))
      audiocontext.prototype.createperiodicwave = audiocontext.prototype.createwavetable;


    audiocontext.prototype.internal_creategain = audiocontext.prototype.creategain;
    audiocontext.prototype.creategain = function() {
      var node = this.internal_creategain();
      fixsettarget(node.gain);
      return node;
    };

    audiocontext.prototype.internal_createdelay = audiocontext.prototype.createdelay;
    audiocontext.prototype.createdelay = function(maxdelaytime) {
      var node = maxdelaytime ? this.internal_createdelay(maxdelaytime) : this.internal_createdelay();
      fixsettarget(node.delaytime);
      return node;
    };

    audiocontext.prototype.internal_createbuffersource = audiocontext.prototype.createbuffersource;
    audiocontext.prototype.createbuffersource = function() {
      var node = this.internal_createbuffersource();
      if (!node.start) {
        node.start = function ( when, offset, duration ) {
          if ( offset || duration )
            this.notegrainon( when || 0, offset, duration );
          else
            this.noteon( when || 0 );
        };
      } else {
        node.internal_start = node.start;
        node.start = function( when, offset, duration ) {
          if( typeof duration !== 'undefined' )
            node.internal_start( when || 0, offset, duration );
          else
            node.internal_start( when || 0, offset || 0 );
        };
      }
      if (!node.stop) {
        node.stop = function ( when ) {
          this.noteoff( when || 0 );
        };
      } else {
        node.internal_stop = node.stop;
        node.stop = function( when ) {
          node.internal_stop( when || 0 );
        };
      }
      fixsettarget(node.playbackrate);
      return node;
    };

    audiocontext.prototype.internal_createdynamicscompressor = audiocontext.prototype.createdynamicscompressor;
    audiocontext.prototype.createdynamicscompressor = function() {
      var node = this.internal_createdynamicscompressor();
      fixsettarget(node.threshold);
      fixsettarget(node.knee);
      fixsettarget(node.ratio);
      fixsettarget(node.reduction);
      fixsettarget(node.attack);
      fixsettarget(node.release);
      return node;
    };

    audiocontext.prototype.internal_createbiquadfilter = audiocontext.prototype.createbiquadfilter;
    audiocontext.prototype.createbiquadfilter = function() {
      var node = this.internal_createbiquadfilter();
      fixsettarget(node.frequency);
      fixsettarget(node.detune);
      fixsettarget(node.q);
      fixsettarget(node.gain);
      return node;
    };

    if (audiocontext.prototype.hasownproperty( 'createoscillator' )) {
      audiocontext.prototype.internal_createoscillator = audiocontext.prototype.createoscillator;
      audiocontext.prototype.createoscillator = function() {
        var node = this.internal_createoscillator();
        if (!node.start) {
          node.start = function ( when ) {
            this.noteon( when || 0 );
          };
        } else {
          node.internal_start = node.start;
          node.start = function ( when ) {
            node.internal_start( when || 0);
          };
        }
        if (!node.stop) {
          node.stop = function ( when ) {
            this.noteoff( when || 0 );
          };
        } else {
          node.internal_stop = node.stop;
          node.stop = function( when ) {
            node.internal_stop( when || 0 );
          };
        }
        if (!node.setperiodicwave)
          node.setperiodicwave = node.setwavetable;
        fixsettarget(node.frequency);
        fixsettarget(node.detune);
        return node;
      };
    }
  }

  if (window.hasownproperty('webkitofflineaudiocontext') &&
      !window.hasownproperty('offlineaudiocontext')) {
    window.offlineaudiocontext = webkitofflineaudiocontext;
  }

}(window));

/*
define the audio context
------------------------

all this code uses a single `audiocontext` if you want to use any of these functions
independently of this file, make sure that have an `audiocontext` called `actx`. 
*/
var actx = new audiocontext();

/*
sounds
------

`sounds` is an object that you can use to store all your loaded sound fles. 
it also has a helpful `load` method that manages asset loading. you can load sounds at
any time during the game by using the `sounds.load` method. you don't have to use
the `sounds` object or its `load` method, but it's a really convenient way to 
work with sound file assets.

here's how could use the `sound` object to load three sound files from a `sounds` folder and 
call a `setup` method when all the files have finished loading:

    sounds.load([
      "sounds/shoot.wav", 
      "sounds/music.wav",
      "sounds/bounce.mp3"
    ]);
    sounds.whenloaded = setup;

you can now access these loaded sounds in your application code like this:

var shoot = sounds["sounds/shoot.wav"],
    music = sounds["sounds/music.wav"],
    bounce = sounds["sounds/bounce.mp3"];

*/

var sounds = {
  //properties to help track the assets being loaded.
  toload: 0,
  loaded: 0,

  //file extensions for different types of sounds.
  audioextensions: ["mp3", "ogg", "wav", "webm"],

  //the callback function that should run when all assets have loaded.
  //assign this when you load the fonts, like this: `assets.whenloaded = makesprites;`.
  whenloaded: undefined,

  //the callback function to run after each asset is loaded
  onprogress: undefined,

  //the callback function to run if an asset fails to load or decode
  onfailed: function(source, error) {
      throw new error("audio could not be loaded: " + source);
  },

  //the load method creates and loads all the assets. use it like this:
  //`assets.load(["images/anyimage.png", "fonts/anyfont.otf"]);`.

  load: function(sources) {
    console.log("loading sounds..");

    //get a reference to this asset object so we can
    //refer to it in the `foreach` loop ahead.
    var self = this;

    //find the number of files that need to be loaded.
    self.toload = sources.length;
    sources.foreach(function(source){

      //find the file extension of the asset.
      var extension = source.split('.').pop();

      //#### sounds
      //load audio files that have file extensions that match
      //the `audioextensions` array.
      if (self.audioextensions.indexof(extension) !== -1) {

        //create a sound sprite.
        var soundsprite = makesound(source, self.loadhandler.bind(self), true, false, self.onfailed);

        //get the sound file name.
        soundsprite.name = source;

        //if you just want to extract the file name with the
        //extension, you can do it like this:
        //soundsprite.name = source.split("/").pop();
        //assign the sound as a property of the assets object so
        //we can access it like this: `assets["sounds/sound.mp3"]`.
        self[soundsprite.name] = soundsprite;
      }

      //display a message if the file type isn't recognized.
      else {
        console.log("file type not recognized: " + source);
      }
    });
  },

  //#### loadhandler
  //the `loadhandler` will be called each time an asset finishes loading.
  loadhandler: function () {
    var self = this;
    self.loaded += 1;

    if (self.onprogress) {
	self.onprogress(100 * self.loaded / self.toload);
    }

    //check whether everything has loaded.
    if (self.toload === self.loaded) {

      //if it has, run the callback function that was assigned to the `whenloaded` property
      console.log("sounds finished loading");

      //reset `loaded` and `toloaded` so we can load more assets
      //later if we want to.
      self.toload = 0;
      self.loaded = 0;
      self.whenloaded();
    }
  }
};

/*
makesound
---------

`makesound` is the function you want to use to load and play sound files.
it creates and returns and webaudio sound object with lots of useful methods you can
use to control the sound. 
you can use it to load a sound like this:

    var anysound = makesound("sounds/anysound.mp3", loadhandler);


the code above will load the sound and then call the `loadhandler`
when the sound has finished loading. 
(however, it's more convenient to load the sound file using 
the `sounds.load` method described above, so i don't recommend loading sounds
like this unless you need more low-level control.)

after the sound has been loaded you can access and use it like this:

    function loadhandler() {
      anysound.loop = true;
      anysound.pan = 0.8;
      anysound.volume = 0.5;
      anysound.play();
      anysound.pause();
      anysound.playfrom(second);
      anysound.restart();
      anysound.setreverb(2, 2, false);
      anysound.setecho(0.2, 0.2, 0);
      anysound.playbackrate = 0.5;
    }
   
for advanced configurations, you can optionally supply `makesound` with optional 3rd and 
4th arguments:

   var anysound = makesound(source, loadhandler, loadthesound?, xhrobject);

`loadthesound?` is a boolean (true/false) value that, if `false` prevents the sound file
from being loaded. you would only want to set it to `false` like this if you were
using another file loading library to load the sound, and didn't want it to be loaded
twice.

`xhrobject`, the optional 4th argument, is the xhr object that was used to load the sound. again, you 
would only supply this if you were using another file loading library to load the sound,
and that library had generated its own xhr object. if you supply the `xhr` argument, `makesound`
will skip the file loading step (because you've already done that), but still decode the audio buffer for you.
(if you are loading the sound file using another file loading library, make sure that your sound
files are loaded with the xhr `responsetype = "arraybuffer"` option.)

for example, here's how you could use this advanced configuration to decode a sound that you've already loaded
using your own custom loading system:

   var soundsprite = makesound(source, decodehandler.bind(this), false, xhr);

when the file has finished being decoded, your custom `decodehandler` will run, which tells you
that the file has finished decoding.

if you're creating more than one sound like this, use counter variables to track the number of sounds
you need to decode, and the number of sounds that have been decoded. when both sets of counters are the
same, you'll know that all your sound files have finished decoding and you can proceed with the rest
of you application. (the [hexi game engine](https://github.com/kittykatattack/hexi) uses `makesound` in this way.)

*/

function makesound(source, loadhandler, loadsound, xhr, failhandler) {

  //the sound object that this function returns.
  var o = {};

  //set the default properties.
  o.volumenode = actx.creategain();

  //create the pan node using the efficient `createstereopanner`
  //method, if it's available.
  if (!actx.createstereopanner) {
    o.pannode = actx.createpanner();
  } else {
    o.pannode = actx.createstereopanner();
  }
  o.delaynode = actx.createdelay();
  o.feedbacknode = actx.creategain();
  o.filternode = actx.createbiquadfilter();
  o.convolvernode = actx.createconvolver();
  o.soundnode = null;
  o.buffer = null;
  o.source = source;
  o.loop = false;
  o.playing = false;

  //the function that should run when the sound is loaded.
  o.loadhandler = undefined;

  //values for the `pan` and `volume` getters/setters.
  o.panvalue = 0;
  o.volumevalue = 1;

  //values to help track and set the start and pause times.
  o.starttime = 0;
  o.startoffset = 0;

  //set the playback rate.
  o.playbackrate = 1;

  //echo properties.
  o.echo = false;
  o.delayvalue = 0.3;
  o.feebackvalue = 0.3;
  o.filtervalue = 0;

  //reverb properties
  o.reverb = false;
  o.reverbimpulse = null;
  
  //the sound object's methods.
  o.play = function() {

    //set the start time (it will be `0` when the sound
    //first starts.
    o.starttime = actx.currenttime;

    //create a sound node.
    o.soundnode = actx.createbuffersource();

    //set the sound node's buffer property to the loaded sound.
    o.soundnode.buffer = o.buffer;

    //set the playback rate
    o.soundnode.playbackrate.value = this.playbackrate;

    //connect the sound to the pan, connect the pan to the
    //volume, and connect the volume to the destination.
    o.soundnode.connect(o.volumenode);

    //if there's no reverb, bypass the convolvernode
    if (o.reverb === false) {
      o.volumenode.connect(o.pannode);
    } 

    //if there is reverb, connect the `convolvernode` and apply
    //the impulse response
    else {
      o.volumenode.connect(o.convolvernode);
      o.convolvernode.connect(o.pannode);
      o.convolvernode.buffer = o.reverbimpulse;
    }
    
    //connect the `pannode` to the destination to complete the chain.
    o.pannode.connect(actx.destination);

    //add optional echo.
    if (o.echo) {

      //set the values.
      o.feedbacknode.gain.value = o.feebackvalue;
      o.delaynode.delaytime.value = o.delayvalue;
      o.filternode.frequency.value = o.filtervalue;

      //create the delay loop, with optional filtering.
      o.delaynode.connect(o.feedbacknode);
      if (o.filtervalue > 0) {
        o.feedbacknode.connect(o.filternode);
        o.filternode.connect(o.delaynode);
      } else {
        o.feedbacknode.connect(o.delaynode);
      }

      //capture the sound from the main node chain, send it to the
      //delay loop, and send the final echo effect to the `pannode` which
      //will then route it to the destination.
      o.volumenode.connect(o.delaynode);
      o.delaynode.connect(o.pannode);
    }

    //will the sound loop? this can be `true` or `false`.
    o.soundnode.loop = o.loop;

    //finally, use the `start` method to play the sound.
    //the start time will either be `0`,
    //or a later time if the sound was paused.
    o.soundnode.start(
      0, o.startoffset % o.buffer.duration
    );

    //set `playing` to `true` to help control the
    //`pause` and `restart` methods.
    o.playing = true;
  };

  o.pause = function() {
    //pause the sound if it's playing, and calculate the
    //`startoffset` to save the current position.
    if (o.playing) {
      o.soundnode.stop(0);
      o.startoffset += actx.currenttime - o.starttime;
      o.playing = false;
    }
  };

  o.restart = function() {
    //stop the sound if it's playing, reset the start and offset times,
    //then call the `play` method again.
    if (o.playing) {
      o.soundnode.stop(0);
    }
    o.startoffset = 0;
    o.play();
  };

  o.playfrom = function(value) {
    if (o.playing) {
      o.soundnode.stop(0);
    }
    o.startoffset = value;
    o.play();
  };

  o.setecho = function(delayvalue, feedbackvalue, filtervalue) {
    if (delayvalue === undefined) delayvalue = 0.3;
    if (feedbackvalue === undefined) feedbackvalue = 0.3;
    if (filtervalue === undefined) filtervalue = 0;
    o.delayvalue = delayvalue;
    o.feebackvalue = feedbackvalue;
    o.filtervalue = filtervalue;
    o.echo = true;
  };

  o.setreverb = function(duration, decay, reverse) {
    if (duration === undefined) duration = 2;
    if (decay === undefined) decay = 2;
    if (reverse === undefined) reverse = false;
    o.reverbimpulse = impulseresponse(duration, decay, reverse, actx);
    o.reverb = true;
  };

  //a general purpose `fade` method for fading sounds in or out.
  //the first argument is the volume that the sound should
  //fade to, and the second value is the duration, in seconds,
  //that the fade should last.
  o.fade = function(endvalue, durationinseconds) {
    if (o.playing) {
      o.volumenode.gain.linearramptovalueattime(
        o.volumenode.gain.value, actx.currenttime
      );
      o.volumenode.gain.linearramptovalueattime(
        endvalue, actx.currenttime + durationinseconds
      );
    }
  };

  //fade a sound in, from an initial volume level of zero.
  o.fadein = function(durationinseconds) {
    
    //set the volume to 0 so that you can fade
    //in from silence
    o.volumenode.gain.value = 0;
    o.fade(1, durationinseconds);
  
  };

  //fade a sound out, from its current volume level to zero.
  o.fadeout = function(durationinseconds) {
    o.fade(0, durationinseconds);
  };
  
  //volume and pan getters/setters.
  object.defineproperties(o, {
    volume: {
      get: function() {
        return o.volumevalue;
      },
      set: function(value) {
        o.volumenode.gain.value = value;
        o.volumevalue = value;
      },
      enumerable: true, configurable: true
    },

    //the pan node uses the high-efficiency stereo panner, if it's
    //available. but, because this is a new addition to the 
    //webaudio spec, it might not be available on all browsers.
    //so the code checks for this and uses the older 3d panner
    //if 2d isn't available.
    pan: {
      get: function() {
        if (!actx.createstereopanner) {
          return o.panvalue;
        } else {
          return o.pannode.pan.value;
        }
      },
      set: function(value) {
        if (!actx.createstereopanner) {
          //panner objects accept x, y and z coordinates for 3d
          //sound. however, because we're only doing 2d left/right
          //panning we're only interested in the x coordinate,
          //the first one. however, for a natural effect, the z
          //value also has to be set proportionately.
          var x = value,
              y = 0,
              z = 1 - math.abs(x);
          o.pannode.setposition(x, y, z);
          o.panvalue = value;
        } else {
          o.pannode.pan.value = value;
        }
      },
      enumerable: true, configurable: true
    }
  });

  //optionally load and decode the sound.
  if (loadsound) {
    this.loadsound(o, source, loadhandler, failhandler);
  }

  //optionally, if you've loaded the sound using some other loader, just decode the sound
  if (xhr) {
    this.decodeaudio(o, xhr, loadhandler, failhandler);
  }

  //return the sound object.
  return o;
}

//the `loadsound` function loads the sound file using xhr
function loadsound(o, source, loadhandler, failhandler) {
  var xhr = new xmlhttprequest();

  //use xhr to load the sound file.
  xhr.open("get", source, true);
  xhr.responsetype = "arraybuffer";

  //when the sound has finished loading, decode it using the
  //`decodeaudio` function (which you'll see ahead)
  xhr.addeventlistener("load", decodeaudio.bind(this, o, xhr, loadhandler, failhandler)); 

  //send the request to load the file.
  xhr.send();
}

//the `decodeaudio` function decodes the audio file for you and 
//launches the `loadhandler` when it's done
function decodeaudio(o, xhr, loadhandler, failhandler) {

  //decode the sound and store a reference to the buffer.
  actx.decodeaudiodata(
    xhr.response,
    function(buffer) {
      o.buffer = buffer;
      o.hasloaded = true;

      //this next bit is optional, but important.
      //if you have a load manager in your game, call it here so that
      //the sound is registered as having loaded.
      if (loadhandler) {
        loadhandler();
      }
    },
    function(error) {
      if (failhandler) failhandler(o.source, error);
    }
  );
}


/*
soundeffect
-----------

the `soundeffect` function let's you generate your sounds and musical notes from scratch
(reverb effect requires the `impulseresponse` function that you'll see further ahead in this file)

to create a custom sound effect, define all the parameters that characterize your sound. here's how to
create a laser shooting sound:

    soundeffect(
      1046.5,           //frequency
      0,                //attack
      0.3,              //decay
      "sawtooth",       //waveform
      1,                //volume
      -0.8,             //pan
      0,                //wait before playing
      1200,             //pitch bend amount
      false,            //reverse bend
      0,                //random pitch range
      25,               //dissonance
      [0.2, 0.2, 2000], //echo: [delay, feedback, filter]
      undefined         //reverb: [duration, decay, reverse?]
      3                 //maximum duration of sound, in seconds
    );

experiment by changing these parameters to see what kinds of effects you can create, and build
your own library of custom sound effects for games.
*/

function soundeffect(
  frequencyvalue,      //the sound's fequency pitch in hertz
  attack,              //the time, in seconds, to fade the sound in
  decay,               //the time, in seconds, to fade the sound out
  type,                //waveform type: "sine", "triangle", "square", "sawtooth"
  volumevalue,         //the sound's maximum volume
  panvalue,            //the speaker pan. left: -1, middle: 0, right: 1
  wait,                //the time, in seconds, to wait before playing the sound
  pitchbendamount,     //the number of hz in which to bend the sound's pitch down
  reverse,             //if `reverse` is true the pitch will bend up
  randomvalue,         //a range, in hz, within which to randomize the pitch
  dissonance,          //a value in hz. it creates 2 dissonant frequencies above and below the target pitch
  echo,                //an array: [delaytimeinseconds, feedbacktimeinseconds, filtervalueinhz]
  reverb,              //an array: [durationinseconds, decayrateinseconds, reverse]
  timeout              //a number, in seconds, which is the maximum duration for sound effects
) {

  //set the default values
  if (frequencyvalue === undefined) frequencyvalue = 200;
  if (attack === undefined) attack = 0;
  if (decay === undefined) decay = 1;
  if (type === undefined) type = "sine";
  if (volumevalue === undefined) volumevalue = 1;
  if (panvalue === undefined) panvalue = 0;
  if (wait === undefined) wait = 0;
  if (pitchbendamount === undefined) pitchbendamount = 0;
  if (reverse === undefined) reverse = false;
  if (randomvalue === undefined) randomvalue = 0;
  if (dissonance === undefined) dissonance = 0;
  if (echo === undefined) echo = undefined;
  if (reverb === undefined) reverb = undefined;
  if (timeout === undefined) timeout = undefined;

  //create an oscillator, gain and pan nodes, and connect them
  //together to the destination
  var oscillator, volume, pan;
  oscillator = actx.createoscillator();
  volume = actx.creategain();
  if (!actx.createstereopanner) {
    pan = actx.createpanner();
  } else {
    pan = actx.createstereopanner();
  }
  oscillator.connect(volume);
  volume.connect(pan);
  pan.connect(actx.destination);

  //set the supplied values
  volume.gain.value = volumevalue;
  if (!actx.createstereopanner) {
    pan.setposition(panvalue, 0, 1 - math.abs(panvalue));
  } else {
    pan.pan.value = panvalue; 
  }
  oscillator.type = type;

  //optionally randomize the pitch. if the `randomvalue` is greater
  //than zero, a random pitch is selected that's within the range
  //specified by `frequencyvalue`. the random pitch will be either
  //above or below the target frequency.
  var frequency;
  var randomint = function(min, max){
    return math.floor(math.random() * (max - min + 1)) + min
  };
  if (randomvalue > 0) {
    frequency = randomint(
      frequencyvalue - randomvalue / 2,
      frequencyvalue + randomvalue / 2
    );
  } else {
    frequency = frequencyvalue;
  }
  oscillator.frequency.value = frequency;

  //apply effects
  if (attack > 0) fadein(volume);
  fadeout(volume);
  if (pitchbendamount > 0) pitchbend(oscillator);
  if (echo) addecho(volume);
  if (reverb) addreverb(volume);
  if (dissonance > 0) adddissonance();

  //play the sound
  play(oscillator);

  //the helper functions:
  
  function addreverb(volumenode) {
    var convolver = actx.createconvolver();
    convolver.buffer = impulseresponse(reverb[0], reverb[1], reverb[2], actx);
    volumenode.connect(convolver);
    convolver.connect(pan);
  }

  function addecho(volumenode) {

    //create the nodes
    var feedback = actx.creategain(),
        delay = actx.createdelay(),
        filter = actx.createbiquadfilter();

    //set their values (delay time, feedback time and filter frequency)
    delay.delaytime.value = echo[0];
    feedback.gain.value = echo[1];
    if (echo[2]) filter.frequency.value = echo[2];

    //create the delay feedback loop, with
    //optional filtering
    delay.connect(feedback);
    if (echo[2]) {
      feedback.connect(filter);
      filter.connect(delay);
    } else {
      feedback.connect(delay);
    }

    //connect the delay loop to the oscillator's volume
    //node, and then to the destination
    volumenode.connect(delay);

    //connect the delay loop to the main sound chain's
    //pan node, so that the echo effect is directed to
    //the correct speaker
    delay.connect(pan);
  }

  //the `fadein` function
  function fadein(volumenode) {

    //set the volume to 0 so that you can fade
    //in from silence
    volumenode.gain.value = 0;

    volumenode.gain.linearramptovalueattime(
      0, actx.currenttime + wait
    );
    volumenode.gain.linearramptovalueattime(
      volumevalue, actx.currenttime + wait + attack
    );
  }

  //the `fadeout` function
  function fadeout(volumenode) {
    volumenode.gain.linearramptovalueattime(
      volumevalue, actx.currenttime + attack + wait
    );
    volumenode.gain.linearramptovalueattime(
      0, actx.currenttime + wait + attack + decay
    );
  }

  //the `pitchbend` function
  function pitchbend(oscillatornode) {
    //if `reverse` is true, make the note drop in frequency. useful for
    //shooting sounds

    //get the frequency of the current oscillator
    var frequency = oscillatornode.frequency.value;

    //if `reverse` is true, make the sound drop in pitch
    if (!reverse) {
      oscillatornode.frequency.linearramptovalueattime(
        frequency, 
        actx.currenttime + wait
      );
      oscillatornode.frequency.linearramptovalueattime(
        frequency - pitchbendamount, 
        actx.currenttime + wait + attack + decay
      );
    }

    //if `reverse` is false, make the note rise in pitch. useful for
    //jumping sounds
    else {
      oscillatornode.frequency.linearramptovalueattime(
        frequency, 
        actx.currenttime + wait
      );
      oscillatornode.frequency.linearramptovalueattime(
        frequency + pitchbendamount, 
        actx.currenttime + wait + attack + decay
      );
    }
  }

  //the `adddissonance` function
  function adddissonance() {

    //create two more oscillators and gain nodes
    var d1 = actx.createoscillator(),
        d2 = actx.createoscillator(),
        d1volume = actx.creategain(),
        d2volume = actx.creategain();

    //set the volume to the `volumevalue`
    d1volume.gain.value = volumevalue;
    d2volume.gain.value = volumevalue;

    //connect the oscillators to the gain and destination nodes
    d1.connect(d1volume);
    d1volume.connect(actx.destination);
    d2.connect(d2volume);
    d2volume.connect(actx.destination);

    //set the waveform to "sawtooth" for a harsh effect
    d1.type = "sawtooth";
    d2.type = "sawtooth";

    //make the two oscillators play at frequencies above and
    //below the main sound's frequency. use whatever value was
    //supplied by the `dissonance` argument
    d1.frequency.value = frequency + dissonance;
    d2.frequency.value = frequency - dissonance;

    //fade in/out, pitch bend and play the oscillators
    //to match the main sound
    if (attack > 0) {
      fadein(d1volume);
      fadein(d2volume);
    }
    if (decay > 0) {
      fadeout(d1volume);
      fadeout(d2volume);
    }
    if (pitchbendamount > 0) {
      pitchbend(d1);
      pitchbend(d2);
    }
    if (echo) {
      addecho(d1volume);
      addecho(d2volume);
    }
    if (reverb) {
      addreverb(d1volume);
      addreverb(d2volume);
    }
    play(d1);
    play(d2);
  }

  //the `play` function
  function play(node) {
    node.start(actx.currenttime + wait);

    //oscillators have to be stopped otherwise they accumulate in 
    //memory and tax the cpu. they'll be stopped after a default
    //timeout of 2 seconds, which should be enough for most sound 
    //effects. override this in the `soundeffect` parameters if you
    //need a longer sound
    node.stop(actx.currenttime + wait + 2);
  }
}

/*
impulseresponse
---------------

the `makesound` and `soundeffect` functions uses `impulseresponse`  to help create an optional reverb effect.  
it simulates a model of sound reverberation in an acoustic space which 
a convolver node can blend with the source sound. make sure to include this function along with `makesound`
and `soundeffect` if you need to use the reverb feature.
*/

function impulseresponse(duration, decay, reverse, actx) {

  //the length of the buffer.
  var length = actx.samplerate * duration;

  //create an audio buffer (an empty sound container) to store the reverb effect.
  var impulse = actx.createbuffer(2, length, actx.samplerate);

  //use `getchanneldata` to initialize empty arrays to store sound data for
  //the left and right channels.
  var left = impulse.getchanneldata(0),
      right = impulse.getchanneldata(1);

  //loop through each sample-frame and fill the channel
  //data with random noise.
  for (var i = 0; i < length; i++){

    //apply the reverse effect, if `reverse` is `true`.
    var n;
    if (reverse) {
      n = length - i;
    } else {
      n = i;
    }

    //fill the left and right channels with random white noise which
    //decays exponentially.
    left[i] = (math.random() * 2 - 1) * math.pow(1 - n / length, decay);
    right[i] = (math.random() * 2 - 1) * math.pow(1 - n / length, decay);
  }

  //return the `impulse`.
  return impulse;
}


/*
keyboard
--------

this isn't really necessary - i just included it for fun to help with the 
examples in the `index.html` files.
the `keyboard` helper function creates `key` objects
that listen for keyboard events. create a new key object like
this:

    var keyobject = g.keyboard(asciikeycodenumber);

then assign `press` and `release` methods like this:

    keyobject.press = function() {
      //key object pressed
    };
    keyobject.release = function() {
      //key object released
    };

keyboard objects also have `isdown` and `isup` booleans that you can check.
this is so much easier than having to write out tedious keyboard even capture 
code from scratch.

like i said, the `keyboard` function has nothing to do with generating sounds,
so just delete it if you don't want it!
*/

function keyboard(keycode) {
  var key = {};
  key.code = keycode;
  key.isdown = false;
  key.isup = true;
  key.press = undefined;
  key.release = undefined;
  //the `downhandler`
  key.downhandler = function(event) {
    if (event.keycode === key.code) {
      if (key.isup && key.press) key.press();
      key.isdown = true;
      key.isup = false;
    }
    event.preventdefault();
  };

  //the `uphandler`
  key.uphandler = function(event) {
    if (event.keycode === key.code) {
      if (key.isdown && key.release) key.release();
      key.isdown = false;
      key.isup = true;
    }
    event.preventdefault();
  };

  //attach event listeners
  window.addeventlistener(
    "keydown", key.downhandler.bind(key), false
  );
  window.addeventlistener(
    "keyup", key.uphandler.bind(key), false
  );
  return key;
}

