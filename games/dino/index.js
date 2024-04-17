// copyright (c) 2014 the chromium authors. all rights reserved.
// use of this source code is governed by a bsd-style license that can be
// found in the license file.
// extract from chromium source code by @liuwayong
(function () {
    'use strict';
    /**
     * t-rex runner.
     * @param {string} outercontainerid outer containing element id.
     * @param {object} opt_config
     * @constructor
     * @export
     */
    function runner(outercontainerid, opt_config) {
        // singleton
        if (runner.instance_) {
            return runner.instance_;
        }
        runner.instance_ = this;

        this.outercontainerel = document.queryselector(outercontainerid);
        this.containerel = null;
        this.snackbarel = null;
        this.detailsbutton = this.outercontainerel.queryselector('#details-button');

        this.config = opt_config || runner.config;

        this.dimensions = runner.defaultdimensions;

        this.canvas = null;
        this.canvasctx = null;

        this.trex = null;

        this.distancemeter = null;
        this.distanceran = 0;

        this.highestscore = 0;

        this.time = 0;
        this.runningtime = 0;
        this.msperframe = 1000 / fps;
        this.currentspeed = this.config.speed;

        this.obstacles = [];

        this.activated = false; // whether the easter egg has been activated.
        this.playing = false; // whether the game is currently in play state.
        this.crashed = false;
        this.paused = false;
        this.inverted = false;
        this.inverttimer = 0;
        this.resizetimerid_ = null;

        this.playcount = 0;

        // sound fx.
        this.audiobuffer = null;
        this.soundfx = {};

        // global web audio context for playing sounds.
        this.audiocontext = null;

        // images.
        this.images = {};
        this.imagesloaded = 0;

        if (this.isdisabled()) {
            this.setupdisabledrunner();
        } else {
            this.loadimages();
        }
    }
    window['runner'] = runner;


    /**
     * default game width.
     * @const
     */
    var default_width = 600;

    /**
     * frames per second.
     * @const
     */
    var fps = 60;

    /** @const */
    var is_hidpi = window.devicepixelratio > 1;

    /** @const */
    var is_ios = /ipad|iphone|ipod/.test(window.navigator.platform);

    /** @const */
    var is_mobile = /android/.test(window.navigator.useragent) || is_ios;

    /** @const */
    var is_touch_enabled = 'ontouchstart' in window;

    /**
     * default game configuration.
     * @enum {number}
     */
    runner.config = {
        acceleration: 0.001,
        bg_cloud_speed: 0.2,
        bottom_pad: 10,
        clear_time: 3000,
        cloud_frequency: 0.5,
        gameover_clear_time: 750,
        gap_coefficient: 0.6,
        gravity: 0.6,
        initial_jump_velocity: 12,
        invert_fade_duration: 12000,
        invert_distance: 700,
        max_blink_count: 3,
        max_clouds: 6,
        max_obstacle_length: 3,
        max_obstacle_duplication: 2,
        max_speed: 13,
        min_jump_height: 35,
        mobile_speed_coefficient: 1.2,
        resource_template_id: 'audio-resources',
        speed: 6,
        speed_drop_coefficient: 3,
        arcade_mode_initial_top_position: 35,
        arcade_mode_top_position_percent: 0.1
    };


    /**
     * default dimensions.
     * @enum {string}
     */
    runner.defaultdimensions = {
        width: default_width,
        height: 150
    };


    /**
     * css class names.
     * @enum {string}
     */
    runner.classes = {
        arcade_mode: 'arcade-mode',
        canvas: 'runner-canvas',
        container: 'runner-container',
        crashed: 'crashed',
        icon: 'icon-offline',
        inverted: 'inverted',
        snackbar: 'snackbar',
        snackbar_show: 'snackbar-show',
        touch_controller: 'controller'
    };


    /**
     * sprite definition layout of the spritesheet.
     * @enum {object}
     */
    runner.spritedefinition = {
        ldpi: {
            cactus_large: { x: 332, y: 2 },
            cactus_small: { x: 228, y: 2 },
            cloud: { x: 86, y: 2 },
            horizon: { x: 2, y: 54 },
            moon: { x: 484, y: 2 },
            pterodactyl: { x: 134, y: 2 },
            restart: { x: 2, y: 2 },
            text_sprite: { x: 655, y: 2 },
            trex: { x: 848, y: 2 },
            star: { x: 645, y: 2 }
        },
        hdpi: {
            cactus_large: { x: 652, y: 2 },
            cactus_small: { x: 446, y: 2 },
            cloud: { x: 166, y: 2 },
            horizon: { x: 2, y: 104 },
            moon: { x: 954, y: 2 },
            pterodactyl: { x: 260, y: 2 },
            restart: { x: 2, y: 2 },
            text_sprite: { x: 1294, y: 2 },
            trex: { x: 1678, y: 2 },
            star: { x: 1276, y: 2 }
        }
    };


    /**
     * sound fx. reference to the id of the audio tag on interstitial page.
     * @enum {string}
     */
    runner.sounds = {
        button_press: 'offline-sound-press',
        hit: 'offline-sound-hit',
        score: 'offline-sound-reached'
    };


    /**
     * key code mapping.
     * @enum {object}
     */
    runner.keycodes = {
        jump: { '38': 1, '32': 1 },  // up, spacebar
        duck: { '40': 1 },  // down
        restart: { '13': 1 }  // enter
    };


    /**
     * runner event names.
     * @enum {string}
     */
    runner.events = {
        anim_end: 'webkitanimationend',
        click: 'click',
        keydown: 'keydown',
        keyup: 'keyup',
        mousedown: 'mousedown',
        mouseup: 'mouseup',
        resize: 'resize',
        touchend: 'touchend',
        touchstart: 'touchstart',
        visibility: 'visibilitychange',
        blur: 'blur',
        focus: 'focus',
        load: 'load'
    };


    runner.prototype = {
        /**
         * whether the easter egg has been disabled. cros enterprise enrolled devices.
         * @return {boolean}
         */
        isdisabled: function () {
            // return loadtimedata && loadtimedata.valueexists('disabledeasteregg');
            return false;
        },

        /**
         * for disabled instances, set up a snackbar with the disabled message.
         */
        setupdisabledrunner: function () {
            this.containerel = document.createelement('div');
            this.containerel.classname = runner.classes.snackbar;
            this.containerel.textcontent = loadtimedata.getvalue('disabledeasteregg');
            this.outercontainerel.appendchild(this.containerel);

            // show notification when the activation key is pressed.
            document.addeventlistener(runner.events.keydown, function (e) {
                if (runner.keycodes.jump[e.keycode]) {
                    this.containerel.classlist.add(runner.classes.snackbar_show);
                    document.queryselector('.icon').classlist.add('icon-disabled');
                }
            }.bind(this));
        },

        /**
         * setting individual settings for debugging.
         * @param {string} setting
         * @param {*} value
         */
        updateconfigsetting: function (setting, value) {
            if (setting in this.config && value != undefined) {
                this.config[setting] = value;

                switch (setting) {
                    case 'gravity':
                    case 'min_jump_height':
                    case 'speed_drop_coefficient':
                        this.trex.config[setting] = value;
                        break;
                    case 'initial_jump_velocity':
                        this.trex.setjumpvelocity(value);
                        break;
                    case 'speed':
                        this.setspeed(value);
                        break;
                }
            }
        },

        /**
         * cache the appropriate image sprite from the page and get the sprite sheet
         * definition.
         */
        loadimages: function () {
            if (is_hidpi) {
                runner.imagesprite = document.getelementbyid('offline-resources-2x');
                this.spritedef = runner.spritedefinition.hdpi;
            } else {
                runner.imagesprite = document.getelementbyid('offline-resources-1x');
                this.spritedef = runner.spritedefinition.ldpi;
            }

            if (runner.imagesprite.complete) {
                this.init();
            } else {
                // if the images are not yet loaded, add a listener.
                runner.imagesprite.addeventlistener(runner.events.load,
                    this.init.bind(this));
            }
        },

        /**
         * load and decode base 64 encoded sounds.
         */
        loadsounds: function () {
            if (!is_ios) {
                this.audiocontext = new audiocontext();

                var resourcetemplate =
                    document.getelementbyid(this.config.resource_template_id).content;

                for (var sound in runner.sounds) {
                    var soundsrc =
                        resourcetemplate.getelementbyid(runner.sounds[sound]).src;
                    soundsrc = soundsrc.substr(soundsrc.indexof(',') + 1);
                    var buffer = decodebase64toarraybuffer(soundsrc);

                    // async, so no guarantee of order in array.
                    this.audiocontext.decodeaudiodata(buffer, function (index, audiodata) {
                        this.soundfx[index] = audiodata;
                    }.bind(this, sound));
                }
            }
        },

        /**
         * sets the game speed. adjust the speed accordingly if on a smaller screen.
         * @param {number} opt_speed
         */
        setspeed: function (opt_speed) {
            var speed = opt_speed || this.currentspeed;

            // reduce the speed on smaller mobile screens.
            if (this.dimensions.width < default_width) {
                var mobilespeed = speed * this.dimensions.width / default_width *
                    this.config.mobile_speed_coefficient;
                this.currentspeed = mobilespeed > speed ? speed : mobilespeed;
            } else if (opt_speed) {
                this.currentspeed = opt_speed;
            }
        },

        /**
         * game initialiser.
         */
        init: function () {
            // hide the static icon.
            document.queryselector('.' + runner.classes.icon).style.visibility =
                'hidden';

            this.adjustdimensions();
            this.setspeed();

            this.containerel = document.createelement('div');
            this.containerel.classname = runner.classes.container;

            // player canvas container.
            this.canvas = createcanvas(this.containerel, this.dimensions.width,
                this.dimensions.height, runner.classes.player);

            this.canvasctx = this.canvas.getcontext('2d');
            this.canvasctx.fillstyle = '#f7f7f7';
            this.canvasctx.fill();
            runner.updatecanvasscaling(this.canvas);

            // horizon contains clouds, obstacles and the ground.
            this.horizon = new horizon(this.canvas, this.spritedef, this.dimensions,
                this.config.gap_coefficient);

            // distance meter
            this.distancemeter = new distancemeter(this.canvas,
                this.spritedef.text_sprite, this.dimensions.width);

            // draw t-rex
            this.trex = new trex(this.canvas, this.spritedef.trex);

            this.outercontainerel.appendchild(this.containerel);

            if (is_mobile) {
                this.createtouchcontroller();
            }

            this.startlistening();
            this.update();

            window.addeventlistener(runner.events.resize,
                this.debounceresize.bind(this));
        },

        /**
         * create the touch controller. a div that covers whole screen.
         */
        createtouchcontroller: function () {
            this.touchcontroller = document.createelement('div');
            this.touchcontroller.classname = runner.classes.touch_controller;
            this.outercontainerel.appendchild(this.touchcontroller);
        },

        /**
         * debounce the resize event.
         */
        debounceresize: function () {
            if (!this.resizetimerid_) {
                this.resizetimerid_ =
                    setinterval(this.adjustdimensions.bind(this), 250);
            }
        },

        /**
         * adjust game space dimensions on resize.
         */
        adjustdimensions: function () {
            clearinterval(this.resizetimerid_);
            this.resizetimerid_ = null;

            var boxstyles = window.getcomputedstyle(this.outercontainerel);
            var padding = number(boxstyles.paddingleft.substr(0,
                boxstyles.paddingleft.length - 2));

            this.dimensions.width = this.outercontainerel.offsetwidth - padding * 2;
            this.dimensions.width = math.min(default_width, this.dimensions.width); //arcade mode
            if (this.activated) {
                this.setarcademodecontainerscale();
            }
            
            // redraw the elements back onto the canvas.
            if (this.canvas) {
                this.canvas.width = this.dimensions.width;
                this.canvas.height = this.dimensions.height;

                runner.updatecanvasscaling(this.canvas);

                this.distancemeter.calcxpos(this.dimensions.width);
                this.clearcanvas();
                this.horizon.update(0, 0, true);
                this.trex.update(0);

                // outer container and distance meter.
                if (this.playing || this.crashed || this.paused) {
                    this.containerel.style.width = this.dimensions.width + 'px';
                    this.containerel.style.height = this.dimensions.height + 'px';
                    this.distancemeter.update(0, math.ceil(this.distanceran));
                    this.stop();
                } else {
                    this.trex.draw(0, 0);
                }

                // game over panel.
                if (this.crashed && this.gameoverpanel) {
                    this.gameoverpanel.updatedimensions(this.dimensions.width);
                    this.gameoverpanel.draw();
                }
            }
        },

        /**
         * play the game intro.
         * canvas container width expands out to the full width.
         */
        playintro: function () {
            if (!this.activated && !this.crashed) {
                this.playingintro = true;
                this.trex.playingintro = true;

                // css animation definition.
                var keyframes = '@-webkit-keyframes intro { ' +
                    'from { width:' + trex.config.width + 'px }' +
                    'to { width: ' + this.dimensions.width + 'px }' +
                    '}';
                
                // create a style sheet to put the keyframe rule in 
                // and then place the style sheet in the html head    
                var sheet = document.createelement('style');
                sheet.innerhtml = keyframes;
                document.head.appendchild(sheet);

                this.containerel.addeventlistener(runner.events.anim_end,
                    this.startgame.bind(this));

                this.containerel.style.webkitanimation = 'intro .4s ease-out 1 both';
                this.containerel.style.width = this.dimensions.width + 'px';

                // if (this.touchcontroller) {
                //     this.outercontainerel.appendchild(this.touchcontroller);
                // }
                this.playing = true;
                this.activated = true;
            } else if (this.crashed) {
                this.restart();
            }
        },


        /**
         * update the game status to started.
         */
        startgame: function () {
            this.setarcademode();
            this.runningtime = 0;
            this.playingintro = false;
            this.trex.playingintro = false;
            this.containerel.style.webkitanimation = '';
            this.playcount++;

            // handle tabbing off the page. pause the current game.
            document.addeventlistener(runner.events.visibility,
                this.onvisibilitychange.bind(this));

            window.addeventlistener(runner.events.blur,
                this.onvisibilitychange.bind(this));

            window.addeventlistener(runner.events.focus,
                this.onvisibilitychange.bind(this));
        },

        clearcanvas: function () {
            this.canvasctx.clearrect(0, 0, this.dimensions.width,
                this.dimensions.height);
        },

        /**
         * update the game frame and schedules the next one.
         */
        update: function () {
            this.updatepending = false;

            var now = gettimestamp();
            var deltatime = now - (this.time || now);
            this.time = now;

            if (this.playing) {
                this.clearcanvas();

                if (this.trex.jumping) {
                    this.trex.updatejump(deltatime);
                }

                this.runningtime += deltatime;
                var hasobstacles = this.runningtime > this.config.clear_time;

                // first jump triggers the intro.
                if (this.trex.jumpcount == 1 && !this.playingintro) {
                    this.playintro();
                }

                // the horizon doesn't move until the intro is over.
                if (this.playingintro) {
                    this.horizon.update(0, this.currentspeed, hasobstacles);
                } else {
                    deltatime = !this.activated ? 0 : deltatime;
                    this.horizon.update(deltatime, this.currentspeed, hasobstacles,
                        this.inverted);
                }

                // check for collisions.
                var collision = hasobstacles &&
                    checkforcollision(this.horizon.obstacles[0], this.trex);

                if (!collision) {
                    this.distanceran += this.currentspeed * deltatime / this.msperframe;

                    if (this.currentspeed < this.config.max_speed) {
                        this.currentspeed += this.config.acceleration;
                    }
                } else {
                    this.gameover();
                }

                var playachievementsound = this.distancemeter.update(deltatime,
                    math.ceil(this.distanceran));

                if (playachievementsound) {
                    this.playsound(this.soundfx.score);
                }

                // night mode.
                if (this.inverttimer > this.config.invert_fade_duration) {
                    this.inverttimer = 0;
                    this.inverttrigger = false;
                    this.invert();
                } else if (this.inverttimer) {
                    this.inverttimer += deltatime;
                } else {
                    var actualdistance =
                        this.distancemeter.getactualdistance(math.ceil(this.distanceran));

                    if (actualdistance > 0) {
                        this.inverttrigger = !(actualdistance %
                            this.config.invert_distance);

                        if (this.inverttrigger && this.inverttimer === 0) {
                            this.inverttimer += deltatime;
                            this.invert();
                        }
                    }
                }
            }

            if (this.playing || (!this.activated &&
                this.trex.blinkcount < runner.config.max_blink_count)) {
                this.trex.update(deltatime);
                this.schedulenextupdate();
            }
        },

        /**
         * event handler.
         */
        handleevent: function (e) {
            return (function (evttype, events) {
                switch (evttype) {
                    case events.keydown:
                    case events.touchstart:
                    case events.mousedown:
                        this.onkeydown(e);
                        break;
                    case events.keyup:
                    case events.touchend:
                    case events.mouseup:
                        this.onkeyup(e);
                        break;
                }
            }.bind(this))(e.type, runner.events);
        },

        /**
         * bind relevant key / mouse / touch listeners.
         */
        startlistening: function () {
            // keys.
            document.addeventlistener(runner.events.keydown, this);
            document.addeventlistener(runner.events.keyup, this);

            if (is_mobile) {
                // mobile only touch devices.
                this.touchcontroller.addeventlistener(runner.events.touchstart, this);
                this.touchcontroller.addeventlistener(runner.events.touchend, this);
                this.containerel.addeventlistener(runner.events.touchstart, this);
            } else {
                // mouse.
                document.addeventlistener(runner.events.mousedown, this);
                document.addeventlistener(runner.events.mouseup, this);
            }
        },

        /**
         * remove all listeners.
         */
        stoplistening: function () {
            document.removeeventlistener(runner.events.keydown, this);
            document.removeeventlistener(runner.events.keyup, this);

            if (is_mobile) {
                this.touchcontroller.removeeventlistener(runner.events.touchstart, this);
                this.touchcontroller.removeeventlistener(runner.events.touchend, this);
                this.containerel.removeeventlistener(runner.events.touchstart, this);
            } else {
                document.removeeventlistener(runner.events.mousedown, this);
                document.removeeventlistener(runner.events.mouseup, this);
            }
        },

        /**
         * process keydown.
         * @param {event} e
         */
        onkeydown: function (e) {
            // prevent native page scrolling whilst tapping on mobile.
            if (is_mobile && this.playing) {
                e.preventdefault();
            }

            if (e.target != this.detailsbutton) {
                if (!this.crashed && (runner.keycodes.jump[e.keycode] ||
                    e.type == runner.events.touchstart)) {
                    if (!this.playing) {
                        this.loadsounds();
                        this.playing = true;
                        this.update();
                        if (window.errorpagecontroller) {
                            errorpagecontroller.trackeasteregg();
                        }
                    }
                    //  play sound effect and jump on starting the game for the first time.
                    if (!this.trex.jumping && !this.trex.ducking) {
                        this.playsound(this.soundfx.button_press);
                        this.trex.startjump(this.currentspeed);
                    }
                }

                if (this.crashed && e.type == runner.events.touchstart &&
                    e.currenttarget == this.containerel) {
                    this.restart();
                }
            }

            if (this.playing && !this.crashed && runner.keycodes.duck[e.keycode]) {
                e.preventdefault();
                if (this.trex.jumping) {
                    // speed drop, activated only when jump key is not pressed.
                    this.trex.setspeeddrop();
                } else if (!this.trex.jumping && !this.trex.ducking) {
                    // duck.
                    this.trex.setduck(true);
                }
            }
        },


        /**
         * process key up.
         * @param {event} e
         */
        onkeyup: function (e) {
            var keycode = string(e.keycode);
            var isjumpkey = runner.keycodes.jump[keycode] ||
                e.type == runner.events.touchend ||
                e.type == runner.events.mousedown;

            if (this.isrunning() && isjumpkey) {
                this.trex.endjump();
            } else if (runner.keycodes.duck[keycode]) {
                this.trex.speeddrop = false;
                this.trex.setduck(false);
            } else if (this.crashed) {
                // check that enough time has elapsed before allowing jump key to restart.
                var deltatime = gettimestamp() - this.time;

                if (runner.keycodes.restart[keycode] || this.isleftclickoncanvas(e) ||
                    (deltatime >= this.config.gameover_clear_time &&
                        runner.keycodes.jump[keycode])) {
                    this.restart();
                }
            } else if (this.paused && isjumpkey) {
                // reset the jump state
                this.trex.reset();
                this.play();
            }
        },

        /**
         * returns whether the event was a left click on canvas.
         * on windows right click is registered as a click.
         * @param {event} e
         * @return {boolean}
         */
        isleftclickoncanvas: function (e) {
            return e.button != null && e.button < 2 &&
                e.type == runner.events.mouseup && e.target == this.canvas;
        },

        /**
         * requestanimationframe wrapper.
         */
        schedulenextupdate: function () {
            if (!this.updatepending) {
                this.updatepending = true;
                this.raqid = requestanimationframe(this.update.bind(this));
            }
        },

        /**
         * whether the game is running.
         * @return {boolean}
         */
        isrunning: function () {
            return !!this.raqid;
        },

        /**
         * game over state.
         */
        gameover: function () {
            this.playsound(this.soundfx.hit);
            vibrate(200);

            this.stop();
            this.crashed = true;
            this.distancemeter.acheivement = false;

            this.trex.update(100, trex.status.crashed);

            // game over panel.
            if (!this.gameoverpanel) {
                this.gameoverpanel = new gameoverpanel(this.canvas,
                    this.spritedef.text_sprite, this.spritedef.restart,
                    this.dimensions);
            } else {
                this.gameoverpanel.draw();
            }

            // update the high score.
            if (this.distanceran > this.highestscore) {
                this.highestscore = math.ceil(this.distanceran);
                this.distancemeter.sethighscore(this.highestscore);
            }

            // reset the time clock.
            this.time = gettimestamp();
        },

        stop: function () {
            this.playing = false;
            this.paused = true;
            cancelanimationframe(this.raqid);
            this.raqid = 0;
        },

        play: function () {
            if (!this.crashed) {
                this.playing = true;
                this.paused = false;
                this.trex.update(0, trex.status.running);
                this.time = gettimestamp();
                this.update();
            }
        },

        restart: function () {
            if (!this.raqid) {
                this.playcount++;
                this.runningtime = 0;
                this.playing = true;
                this.crashed = false;
                this.distanceran = 0;
                this.setspeed(this.config.speed);
                this.time = gettimestamp();
                this.containerel.classlist.remove(runner.classes.crashed);
                this.clearcanvas();
                this.distancemeter.reset(this.highestscore);
                this.horizon.reset();
                this.trex.reset();
                this.playsound(this.soundfx.button_press);
                this.invert(true);
                this.update();
            }
        },
        
        /**
         * hides offline messaging for a fullscreen game only experience.
         */
        setarcademode() {
            document.body.classlist.add(runner.classes.arcade_mode);
            this.setarcademodecontainerscale();
        },

        /**
         * sets the scaling for arcade mode.
         */
        setarcademodecontainerscale() {
            const windowheight = window.innerheight;
            const scaleheight = windowheight / this.dimensions.height;
            const scalewidth = window.innerwidth / this.dimensions.width;
            const scale = math.max(1, math.min(scaleheight, scalewidth));
            const scaledcanvasheight = this.dimensions.height * scale;
            // positions the game container at 10% of the available vertical window
            // height minus the game container height.
            const translatey = math.ceil(math.max(0, (windowheight - scaledcanvasheight -
                                                      runner.config.arcade_mode_initial_top_position) *
                                                  runner.config.arcade_mode_top_position_percent)) *
                  window.devicepixelratio;

            const cssscale = scale;
            this.containerel.style.transform =
                'scale(' + cssscale + ') translatey(' + translatey + 'px)';
        },
        
        /**
         * pause the game if the tab is not in focus.
         */
        onvisibilitychange: function (e) {
            if (document.hidden || document.webkithidden || e.type == 'blur' ||
                document.visibilitystate != 'visible') {
                this.stop();
            } else if (!this.crashed) {
                this.trex.reset();
                this.play();
            }
        },

        /**
         * play a sound.
         * @param {soundbuffer} soundbuffer
         */
        playsound: function (soundbuffer) {
            if (soundbuffer) {
                var sourcenode = this.audiocontext.createbuffersource();
                sourcenode.buffer = soundbuffer;
                sourcenode.connect(this.audiocontext.destination);
                sourcenode.start(0);
            }
        },

        /**
         * inverts the current page / canvas colors.
         * @param {boolean} whether to reset colors.
         */
        invert: function (reset) {
            if (reset) {
                document.body.classlist.toggle(runner.classes.inverted, false);
                this.inverttimer = 0;
                this.inverted = false;
            } else {
                this.inverted = document.body.classlist.toggle(runner.classes.inverted,
                    this.inverttrigger);
            }
        }
    };


    /**
     * updates the canvas size taking into
     * account the backing store pixel ratio and
     * the device pixel ratio.
     *
     * see article by paul lewis:
     * http://www.html5rocks.com/en/tutorials/canvas/hidpi/
     *
     * @param {htmlcanvaselement} canvas
     * @param {number} opt_width
     * @param {number} opt_height
     * @return {boolean} whether the canvas was scaled.
     */
    runner.updatecanvasscaling = function (canvas, opt_width, opt_height) {
        var context = canvas.getcontext('2d');

        // query the various pixel ratios
        var devicepixelratio = math.floor(window.devicepixelratio) || 1;
        var backingstoreratio = math.floor(context.webkitbackingstorepixelratio) || 1;
        var ratio = devicepixelratio / backingstoreratio;

        // upscale the canvas if the two ratios don't match
        if (devicepixelratio !== backingstoreratio) {
            var oldwidth = opt_width || canvas.width;
            var oldheight = opt_height || canvas.height;

            canvas.width = oldwidth * ratio;
            canvas.height = oldheight * ratio;

            canvas.style.width = oldwidth + 'px';
            canvas.style.height = oldheight + 'px';

            // scale the context to counter the fact that we've manually scaled
            // our canvas element.
            context.scale(ratio, ratio);
            return true;
        } else if (devicepixelratio == 1) {
            // reset the canvas width / height. fixes scaling bug when the page is
            // zoomed and the devicepixelratio changes accordingly.
            canvas.style.width = canvas.width + 'px';
            canvas.style.height = canvas.height + 'px';
        }
        return false;
    };


    /**
     * get random number.
     * @param {number} min
     * @param {number} max
     * @param {number}
     */
    function getrandomnum(min, max) {
        return math.floor(math.random() * (max - min + 1)) + min;
    }


    /**
     * vibrate on mobile devices.
     * @param {number} duration duration of the vibration in milliseconds.
     */
    function vibrate(duration) {
        if (is_mobile && window.navigator.vibrate) {
            window.navigator.vibrate(duration);
        }
    }


    /**
     * create canvas element.
     * @param {htmlelement} container element to append canvas to.
     * @param {number} width
     * @param {number} height
     * @param {string} opt_classname
     * @return {htmlcanvaselement}
     */
    function createcanvas(container, width, height, opt_classname) {
        var canvas = document.createelement('canvas');
        canvas.classname = opt_classname ? runner.classes.canvas + ' ' +
            opt_classname : runner.classes.canvas;
        canvas.width = width;
        canvas.height = height;
        container.appendchild(canvas);

        return canvas;
    }


    /**
     * decodes the base 64 audio to arraybuffer used by web audio.
     * @param {string} base64string
     */
    function decodebase64toarraybuffer(base64string) {
        var len = (base64string.length / 4) * 3;
        var str = atob(base64string);
        var arraybuffer = new arraybuffer(len);
        var bytes = new uint8array(arraybuffer);

        for (var i = 0; i < len; i++) {
            bytes[i] = str.charcodeat(i);
        }
        return bytes.buffer;
    }


    /**
     * return the current timestamp.
     * @return {number}
     */
    function gettimestamp() {
        return is_ios ? new date().gettime() : performance.now();
    }


    //******************************************************************************


    /**
     * game over panel.
     * @param {!htmlcanvaselement} canvas
     * @param {object} textimgpos
     * @param {object} restartimgpos
     * @param {!object} dimensions canvas dimensions.
     * @constructor
     */
    function gameoverpanel(canvas, textimgpos, restartimgpos, dimensions) {
        this.canvas = canvas;
        this.canvasctx = canvas.getcontext('2d');
        this.canvasdimensions = dimensions;
        this.textimgpos = textimgpos;
        this.restartimgpos = restartimgpos;
        this.draw();
    };


    /**
     * dimensions used in the panel.
     * @enum {number}
     */
    gameoverpanel.dimensions = {
        text_x: 0,
        text_y: 13,
        text_width: 191,
        text_height: 11,
        restart_width: 36,
        restart_height: 32
    };


    gameoverpanel.prototype = {
        /**
         * update the panel dimensions.
         * @param {number} width new canvas width.
         * @param {number} opt_height optional new canvas height.
         */
        updatedimensions: function (width, opt_height) {
            this.canvasdimensions.width = width;
            if (opt_height) {
                this.canvasdimensions.height = opt_height;
            }
        },

        /**
         * draw the panel.
         */
        draw: function () {
            var dimensions = gameoverpanel.dimensions;

            var centerx = this.canvasdimensions.width / 2;

            // game over text.
            var textsourcex = dimensions.text_x;
            var textsourcey = dimensions.text_y;
            var textsourcewidth = dimensions.text_width;
            var textsourceheight = dimensions.text_height;

            var texttargetx = math.round(centerx - (dimensions.text_width / 2));
            var texttargety = math.round((this.canvasdimensions.height - 25) / 3);
            var texttargetwidth = dimensions.text_width;
            var texttargetheight = dimensions.text_height;

            var restartsourcewidth = dimensions.restart_width;
            var restartsourceheight = dimensions.restart_height;
            var restarttargetx = centerx - (dimensions.restart_width / 2);
            var restarttargety = this.canvasdimensions.height / 2;

            if (is_hidpi) {
                textsourcey *= 2;
                textsourcex *= 2;
                textsourcewidth *= 2;
                textsourceheight *= 2;
                restartsourcewidth *= 2;
                restartsourceheight *= 2;
            }

            textsourcex += this.textimgpos.x;
            textsourcey += this.textimgpos.y;

            // game over text from sprite.
            this.canvasctx.drawimage(runner.imagesprite,
                textsourcex, textsourcey, textsourcewidth, textsourceheight,
                texttargetx, texttargety, texttargetwidth, texttargetheight);

            // restart button.
            this.canvasctx.drawimage(runner.imagesprite,
                this.restartimgpos.x, this.restartimgpos.y,
                restartsourcewidth, restartsourceheight,
                restarttargetx, restarttargety, dimensions.restart_width,
                dimensions.restart_height);
        }
    };


    //******************************************************************************

    /**
     * check for a collision.
     * @param {!obstacle} obstacle
     * @param {!trex} trex t-rex object.
     * @param {htmlcanvascontext} opt_canvasctx optional canvas context for drawing
     *    collision boxes.
     * @return {array<collisionbox>}
     */
    function checkforcollision(obstacle, trex, opt_canvasctx) {
        var obstacleboxxpos = runner.defaultdimensions.width + obstacle.xpos;

        // adjustments are made to the bounding box as there is a 1 pixel white
        // border around the t-rex and obstacles.
        var trexbox = new collisionbox(
            trex.xpos + 1,
            trex.ypos + 1,
            trex.config.width - 2,
            trex.config.height - 2);

        var obstaclebox = new collisionbox(
            obstacle.xpos + 1,
            obstacle.ypos + 1,
            obstacle.typeconfig.width * obstacle.size - 2,
            obstacle.typeconfig.height - 2);

        // debug outer box
        if (opt_canvasctx) {
            drawcollisionboxes(opt_canvasctx, trexbox, obstaclebox);
        }

        // simple outer bounds check.
        if (boxcompare(trexbox, obstaclebox)) {
            var collisionboxes = obstacle.collisionboxes;
            var trexcollisionboxes = trex.ducking ?
                trex.collisionboxes.ducking : trex.collisionboxes.running;

            // detailed axis aligned box check.
            for (var t = 0; t < trexcollisionboxes.length; t++) {
                for (var i = 0; i < collisionboxes.length; i++) {
                    // adjust the box to actual positions.
                    var adjtrexbox =
                        createadjustedcollisionbox(trexcollisionboxes[t], trexbox);
                    var adjobstaclebox =
                        createadjustedcollisionbox(collisionboxes[i], obstaclebox);
                    var crashed = boxcompare(adjtrexbox, adjobstaclebox);

                    // draw boxes for debug.
                    if (opt_canvasctx) {
                        drawcollisionboxes(opt_canvasctx, adjtrexbox, adjobstaclebox);
                    }

                    if (crashed) {
                        return [adjtrexbox, adjobstaclebox];
                    }
                }
            }
        }
        return false;
    };


    /**
     * adjust the collision box.
     * @param {!collisionbox} box the original box.
     * @param {!collisionbox} adjustment adjustment box.
     * @return {collisionbox} the adjusted collision box object.
     */
    function createadjustedcollisionbox(box, adjustment) {
        return new collisionbox(
            box.x + adjustment.x,
            box.y + adjustment.y,
            box.width,
            box.height);
    };


    /**
     * draw the collision boxes for debug.
     */
    function drawcollisionboxes(canvasctx, trexbox, obstaclebox) {
        canvasctx.save();
        canvasctx.strokestyle = '#f00';
        canvasctx.strokerect(trexbox.x, trexbox.y, trexbox.width, trexbox.height);

        canvasctx.strokestyle = '#0f0';
        canvasctx.strokerect(obstaclebox.x, obstaclebox.y,
            obstaclebox.width, obstaclebox.height);
        canvasctx.restore();
    };


    /**
     * compare two collision boxes for a collision.
     * @param {collisionbox} trexbox
     * @param {collisionbox} obstaclebox
     * @return {boolean} whether the boxes intersected.
     */
    function boxcompare(trexbox, obstaclebox) {
        var crashed = false;
        var trexboxx = trexbox.x;
        var trexboxy = trexbox.y;

        var obstacleboxx = obstaclebox.x;
        var obstacleboxy = obstaclebox.y;

        // axis-aligned bounding box method.
        if (trexbox.x < obstacleboxx + obstaclebox.width &&
            trexbox.x + trexbox.width > obstacleboxx &&
            trexbox.y < obstaclebox.y + obstaclebox.height &&
            trexbox.height + trexbox.y > obstaclebox.y) {
            crashed = true;
        }

        return crashed;
    };


    //******************************************************************************

    /**
     * collision box object.
     * @param {number} x x position.
     * @param {number} y y position.
     * @param {number} w width.
     * @param {number} h height.
     */
    function collisionbox(x, y, w, h) {
        this.x = x;
        this.y = y;
        this.width = w;
        this.height = h;
    };


    //******************************************************************************

    /**
     * obstacle.
     * @param {htmlcanvasctx} canvasctx
     * @param {obstacle.type} type
     * @param {object} spritepos obstacle position in sprite.
     * @param {object} dimensions
     * @param {number} gapcoefficient mutipler in determining the gap.
     * @param {number} speed
     * @param {number} opt_xoffset
     */
    function obstacle(canvasctx, type, spriteimgpos, dimensions,
        gapcoefficient, speed, opt_xoffset) {

        this.canvasctx = canvasctx;
        this.spritepos = spriteimgpos;
        this.typeconfig = type;
        this.gapcoefficient = gapcoefficient;
        this.size = getrandomnum(1, obstacle.max_obstacle_length);
        this.dimensions = dimensions;
        this.remove = false;
        this.xpos = dimensions.width + (opt_xoffset || 0);
        this.ypos = 0;
        this.width = 0;
        this.collisionboxes = [];
        this.gap = 0;
        this.speedoffset = 0;

        // for animated obstacles.
        this.currentframe = 0;
        this.timer = 0;

        this.init(speed);
    };

    /**
     * coefficient for calculating the maximum gap.
     * @const
     */
    obstacle.max_gap_coefficient = 1.5;

    /**
     * maximum obstacle grouping count.
     * @const
     */
    obstacle.max_obstacle_length = 3,


        obstacle.prototype = {
            /**
             * initialise the dom for the obstacle.
             * @param {number} speed
             */
            init: function (speed) {
                this.clonecollisionboxes();

                // only allow sizing if we're at the right speed.
                if (this.size > 1 && this.typeconfig.multiplespeed > speed) {
                    this.size = 1;
                }

                this.width = this.typeconfig.width * this.size;

                // check if obstacle can be positioned at various heights.
                if (array.isarray(this.typeconfig.ypos)) {
                    var yposconfig = is_mobile ? this.typeconfig.yposmobile :
                        this.typeconfig.ypos;
                    this.ypos = yposconfig[getrandomnum(0, yposconfig.length - 1)];
                } else {
                    this.ypos = this.typeconfig.ypos;
                }

                this.draw();

                // make collision box adjustments,
                // central box is adjusted to the size as one box.
                //      ____        ______        ________
                //    _|   |-|    _|     |-|    _|       |-|
                //   | |<->| |   | |<--->| |   | |<----->| |
                //   | | 1 | |   | |  2  | |   | |   3   | |
                //   |_|___|_|   |_|_____|_|   |_|_______|_|
                //
                if (this.size > 1) {
                    this.collisionboxes[1].width = this.width - this.collisionboxes[0].width -
                        this.collisionboxes[2].width;
                    this.collisionboxes[2].x = this.width - this.collisionboxes[2].width;
                }

                // for obstacles that go at a different speed from the horizon.
                if (this.typeconfig.speedoffset) {
                    this.speedoffset = math.random() > 0.5 ? this.typeconfig.speedoffset :
                        -this.typeconfig.speedoffset;
                }

                this.gap = this.getgap(this.gapcoefficient, speed);
            },

            /**
             * draw and crop based on size.
             */
            draw: function () {
                var sourcewidth = this.typeconfig.width;
                var sourceheight = this.typeconfig.height;

                if (is_hidpi) {
                    sourcewidth = sourcewidth * 2;
                    sourceheight = sourceheight * 2;
                }

                // x position in sprite.
                var sourcex = (sourcewidth * this.size) * (0.5 * (this.size - 1)) +
                    this.spritepos.x;

                // animation frames.
                if (this.currentframe > 0) {
                    sourcex += sourcewidth * this.currentframe;
                }

                this.canvasctx.drawimage(runner.imagesprite,
                    sourcex, this.spritepos.y,
                    sourcewidth * this.size, sourceheight,
                    this.xpos, this.ypos,
                    this.typeconfig.width * this.size, this.typeconfig.height);
            },

            /**
             * obstacle frame update.
             * @param {number} deltatime
             * @param {number} speed
             */
            update: function (deltatime, speed) {
                if (!this.remove) {
                    if (this.typeconfig.speedoffset) {
                        speed += this.speedoffset;
                    }
                    this.xpos -= math.floor((speed * fps / 1000) * deltatime);

                    // update frame
                    if (this.typeconfig.numframes) {
                        this.timer += deltatime;
                        if (this.timer >= this.typeconfig.framerate) {
                            this.currentframe =
                                this.currentframe == this.typeconfig.numframes - 1 ?
                                    0 : this.currentframe + 1;
                            this.timer = 0;
                        }
                    }
                    this.draw();

                    if (!this.isvisible()) {
                        this.remove = true;
                    }
                }
            },

            /**
             * calculate a random gap size.
             * - minimum gap gets wider as speed increses
             * @param {number} gapcoefficient
             * @param {number} speed
             * @return {number} the gap size.
             */
            getgap: function (gapcoefficient, speed) {
                var mingap = math.round(this.width * speed +
                    this.typeconfig.mingap * gapcoefficient);
                var maxgap = math.round(mingap * obstacle.max_gap_coefficient);
                return getrandomnum(mingap, maxgap);
            },

            /**
             * check if obstacle is visible.
             * @return {boolean} whether the obstacle is in the game area.
             */
            isvisible: function () {
                return this.xpos + this.width > 0;
            },

            /**
             * make a copy of the collision boxes, since these will change based on
             * obstacle type and size.
             */
            clonecollisionboxes: function () {
                var collisionboxes = this.typeconfig.collisionboxes;

                for (var i = collisionboxes.length - 1; i >= 0; i--) {
                    this.collisionboxes[i] = new collisionbox(collisionboxes[i].x,
                        collisionboxes[i].y, collisionboxes[i].width,
                        collisionboxes[i].height);
                }
            }
        };


    /**
     * obstacle definitions.
     * mingap: minimum pixel space betweeen obstacles.
     * multiplespeed: speed at which multiples are allowed.
     * speedoffset: speed faster / slower than the horizon.
     * minspeed: minimum speed which the obstacle can make an appearance.
     */
    obstacle.types = [
        {
            type: 'cactus_small',
            width: 17,
            height: 35,
            ypos: 105,
            multiplespeed: 4,
            mingap: 120,
            minspeed: 0,
            collisionboxes: [
                new collisionbox(0, 7, 5, 27),
                new collisionbox(4, 0, 6, 34),
                new collisionbox(10, 4, 7, 14)
            ]
        },
        {
            type: 'cactus_large',
            width: 25,
            height: 50,
            ypos: 90,
            multiplespeed: 7,
            mingap: 120,
            minspeed: 0,
            collisionboxes: [
                new collisionbox(0, 12, 7, 38),
                new collisionbox(8, 0, 7, 49),
                new collisionbox(13, 10, 10, 38)
            ]
        },
        {
            type: 'pterodactyl',
            width: 46,
            height: 40,
            ypos: [100, 75, 50], // variable height.
            yposmobile: [100, 50], // variable height mobile.
            multiplespeed: 999,
            minspeed: 8.5,
            mingap: 150,
            collisionboxes: [
                new collisionbox(15, 15, 16, 5),
                new collisionbox(18, 21, 24, 6),
                new collisionbox(2, 14, 4, 3),
                new collisionbox(6, 10, 4, 7),
                new collisionbox(10, 8, 6, 9)
            ],
            numframes: 2,
            framerate: 1000 / 6,
            speedoffset: .8
        }
    ];


    //******************************************************************************
    /**
     * t-rex game character.
     * @param {htmlcanvas} canvas
     * @param {object} spritepos positioning within image sprite.
     * @constructor
     */
    function trex(canvas, spritepos) {
        this.canvas = canvas;
        this.canvasctx = canvas.getcontext('2d');
        this.spritepos = spritepos;
        this.xpos = 0;
        this.ypos = 0;
        // position when on the ground.
        this.groundypos = 0;
        this.currentframe = 0;
        this.currentanimframes = [];
        this.blinkdelay = 0;
        this.blinkcount = 0;
        this.animstarttime = 0;
        this.timer = 0;
        this.msperframe = 1000 / fps;
        this.config = trex.config;
        // current status.
        this.status = trex.status.waiting;

        this.jumping = false;
        this.ducking = false;
        this.jumpvelocity = 0;
        this.reachedminheight = false;
        this.speeddrop = false;
        this.jumpcount = 0;
        this.jumpspotx = 0;

        this.init();
    };


    /**
     * t-rex player config.
     * @enum {number}
     */
    trex.config = {
        drop_velocity: -5,
        gravity: 0.6,
        height: 47,
        height_duck: 25,
        iniital_jump_velocity: -10,
        intro_duration: 1500,
        max_jump_height: 30,
        min_jump_height: 30,
        speed_drop_coefficient: 3,
        sprite_width: 262,
        start_x_pos: 50,
        width: 44,
        width_duck: 59
    };


    /**
     * used in collision detection.
     * @type {array<collisionbox>}
     */
    trex.collisionboxes = {
        ducking: [
            new collisionbox(1, 18, 55, 25)
        ],
        running: [
            new collisionbox(22, 0, 17, 16),
            new collisionbox(1, 18, 30, 9),
            new collisionbox(10, 35, 14, 8),
            new collisionbox(1, 24, 29, 5),
            new collisionbox(5, 30, 21, 4),
            new collisionbox(9, 34, 15, 4)
        ]
    };


    /**
     * animation states.
     * @enum {string}
     */
    trex.status = {
        crashed: 'crashed',
        ducking: 'ducking',
        jumping: 'jumping',
        running: 'running',
        waiting: 'waiting'
    };

    /**
     * blinking coefficient.
     * @const
     */
    trex.blink_timing = 7000;


    /**
     * animation config for different states.
     * @enum {object}
     */
    trex.animframes = {
        waiting: {
            frames: [44, 0],
            msperframe: 1000 / 3
        },
        running: {
            frames: [88, 132],
            msperframe: 1000 / 12
        },
        crashed: {
            frames: [220],
            msperframe: 1000 / 60
        },
        jumping: {
            frames: [0],
            msperframe: 1000 / 60
        },
        ducking: {
            frames: [264, 323],
            msperframe: 1000 / 8
        }
    };


    trex.prototype = {
        /**
         * t-rex player initaliser.
         * sets the t-rex to blink at random intervals.
         */
        init: function () {
            this.groundypos = runner.defaultdimensions.height - this.config.height -
                runner.config.bottom_pad;
            this.ypos = this.groundypos;
            this.minjumpheight = this.groundypos - this.config.min_jump_height;

            this.draw(0, 0);
            this.update(0, trex.status.waiting);
        },

        /**
         * setter for the jump velocity.
         * the approriate drop velocity is also set.
         */
        setjumpvelocity: function (setting) {
            this.config.iniital_jump_velocity = -setting;
            this.config.drop_velocity = -setting / 2;
        },

        /**
         * set the animation status.
         * @param {!number} deltatime
         * @param {trex.status} status optional status to switch to.
         */
        update: function (deltatime, opt_status) {
            this.timer += deltatime;

            // update the status.
            if (opt_status) {
                this.status = opt_status;
                this.currentframe = 0;
                this.msperframe = trex.animframes[opt_status].msperframe;
                this.currentanimframes = trex.animframes[opt_status].frames;

                if (opt_status == trex.status.waiting) {
                    this.animstarttime = gettimestamp();
                    this.setblinkdelay();
                }
            }

            // game intro animation, t-rex moves in from the left.
            if (this.playingintro && this.xpos < this.config.start_x_pos) {
                this.xpos += math.round((this.config.start_x_pos /
                    this.config.intro_duration) * deltatime);
            }

            if (this.status == trex.status.waiting) {
                this.blink(gettimestamp());
            } else {
                this.draw(this.currentanimframes[this.currentframe], 0);
            }

            // update the frame position.
            if (this.timer >= this.msperframe) {
                this.currentframe = this.currentframe ==
                    this.currentanimframes.length - 1 ? 0 : this.currentframe + 1;
                this.timer = 0;
            }

            // speed drop becomes duck if the down key is still being pressed.
            if (this.speeddrop && this.ypos == this.groundypos) {
                this.speeddrop = false;
                this.setduck(true);
            }
        },

        /**
         * draw the t-rex to a particular position.
         * @param {number} x
         * @param {number} y
         */
        draw: function (x, y) {
            var sourcex = x;
            var sourcey = y;
            var sourcewidth = this.ducking && this.status != trex.status.crashed ?
                this.config.width_duck : this.config.width;
            var sourceheight = this.config.height;

            if (is_hidpi) {
                sourcex *= 2;
                sourcey *= 2;
                sourcewidth *= 2;
                sourceheight *= 2;
            }

            // adjustments for sprite sheet position.
            sourcex += this.spritepos.x;
            sourcey += this.spritepos.y;

            // ducking.
            if (this.ducking && this.status != trex.status.crashed) {
                this.canvasctx.drawimage(runner.imagesprite, sourcex, sourcey,
                    sourcewidth, sourceheight,
                    this.xpos, this.ypos,
                    this.config.width_duck, this.config.height);
            } else {
                // crashed whilst ducking. trex is standing up so needs adjustment.
                if (this.ducking && this.status == trex.status.crashed) {
                    this.xpos++;
                }
                // standing / running
                this.canvasctx.drawimage(runner.imagesprite, sourcex, sourcey,
                    sourcewidth, sourceheight,
                    this.xpos, this.ypos,
                    this.config.width, this.config.height);
            }
        },

        /**
         * sets a random time for the blink to happen.
         */
        setblinkdelay: function () {
            this.blinkdelay = math.ceil(math.random() * trex.blink_timing);
        },

        /**
         * make t-rex blink at random intervals.
         * @param {number} time current time in milliseconds.
         */
        blink: function (time) {
            var deltatime = time - this.animstarttime;

            if (deltatime >= this.blinkdelay) {
                this.draw(this.currentanimframes[this.currentframe], 0);

                if (this.currentframe == 1) {
                    // set new random delay to blink.
                    this.setblinkdelay();
                    this.animstarttime = time;
                    this.blinkcount++;
                }
            }
        },

        /**
         * initialise a jump.
         * @param {number} speed
         */
        startjump: function (speed) {
            if (!this.jumping) {
                this.update(0, trex.status.jumping);
                // tweak the jump velocity based on the speed.
                this.jumpvelocity = this.config.iniital_jump_velocity - (speed / 10);
                this.jumping = true;
                this.reachedminheight = false;
                this.speeddrop = false;
            }
        },

        /**
         * jump is complete, falling down.
         */
        endjump: function () {
            if (this.reachedminheight &&
                this.jumpvelocity < this.config.drop_velocity) {
                this.jumpvelocity = this.config.drop_velocity;
            }
        },

        /**
         * update frame for a jump.
         * @param {number} deltatime
         * @param {number} speed
         */
        updatejump: function (deltatime, speed) {
            var msperframe = trex.animframes[this.status].msperframe;
            var frameselapsed = deltatime / msperframe;

            // speed drop makes trex fall faster.
            if (this.speeddrop) {
                this.ypos += math.round(this.jumpvelocity *
                    this.config.speed_drop_coefficient * frameselapsed);
            } else {
                this.ypos += math.round(this.jumpvelocity * frameselapsed);
            }

            this.jumpvelocity += this.config.gravity * frameselapsed;

            // minimum height has been reached.
            if (this.ypos < this.minjumpheight || this.speeddrop) {
                this.reachedminheight = true;
            }

            // reached max height
            if (this.ypos < this.config.max_jump_height || this.speeddrop) {
                this.endjump();
            }

            // back down at ground level. jump completed.
            if (this.ypos > this.groundypos) {
                this.reset();
                this.jumpcount++;
            }

            this.update(deltatime);
        },

        /**
         * set the speed drop. immediately cancels the current jump.
         */
        setspeeddrop: function () {
            this.speeddrop = true;
            this.jumpvelocity = 1;
        },

        /**
         * @param {boolean} isducking.
         */
        setduck: function (isducking) {
            if (isducking && this.status != trex.status.ducking) {
                this.update(0, trex.status.ducking);
                this.ducking = true;
            } else if (this.status == trex.status.ducking) {
                this.update(0, trex.status.running);
                this.ducking = false;
            }
        },

        /**
         * reset the t-rex to running at start of game.
         */
        reset: function () {
            this.ypos = this.groundypos;
            this.jumpvelocity = 0;
            this.jumping = false;
            this.ducking = false;
            this.update(0, trex.status.running);
            this.midair = false;
            this.speeddrop = false;
            this.jumpcount = 0;
        }
    };


    //******************************************************************************

    /**
     * handles displaying the distance meter.
     * @param {!htmlcanvaselement} canvas
     * @param {object} spritepos image position in sprite.
     * @param {number} canvaswidth
     * @constructor
     */
    function distancemeter(canvas, spritepos, canvaswidth) {
        this.canvas = canvas;
        this.canvasctx = canvas.getcontext('2d');
        this.image = runner.imagesprite;
        this.spritepos = spritepos;
        this.x = 0;
        this.y = 5;

        this.currentdistance = 0;
        this.maxscore = 0;
        this.highscore = 0;
        this.container = null;

        this.digits = [];
        this.acheivement = false;
        this.defaultstring = '';
        this.flashtimer = 0;
        this.flashiterations = 0;
        this.inverttrigger = false;

        this.config = distancemeter.config;
        this.maxscoreunits = this.config.max_distance_units;
        this.init(canvaswidth);
    };


    /**
     * @enum {number}
     */
    distancemeter.dimensions = {
        width: 10,
        height: 13,
        dest_width: 11
    };


    /**
     * y positioning of the digits in the sprite sheet.
     * x position is always 0.
     * @type {array<number>}
     */
    distancemeter.ypos = [0, 13, 27, 40, 53, 67, 80, 93, 107, 120];


    /**
     * distance meter config.
     * @enum {number}
     */
    distancemeter.config = {
        // number of digits.
        max_distance_units: 5,

        // distance that causes achievement animation.
        achievement_distance: 100,

        // used for conversion from pixel distance to a scaled unit.
        coefficient: 0.025,

        // flash duration in milliseconds.
        flash_duration: 1000 / 4,

        // flash iterations for achievement animation.
        flash_iterations: 3
    };


    distancemeter.prototype = {
        /**
         * initialise the distance meter to '00000'.
         * @param {number} width canvas width in px.
         */
        init: function (width) {
            var maxdistancestr = '';

            this.calcxpos(width);
            this.maxscore = this.maxscoreunits;
            for (var i = 0; i < this.maxscoreunits; i++) {
                this.draw(i, 0);
                this.defaultstring += '0';
                maxdistancestr += '9';
            }

            this.maxscore = parseint(maxdistancestr);
        },

        /**
         * calculate the xpos in the canvas.
         * @param {number} canvaswidth
         */
        calcxpos: function (canvaswidth) {
            this.x = canvaswidth - (distancemeter.dimensions.dest_width *
                (this.maxscoreunits + 1));
        },

        /**
         * draw a digit to canvas.
         * @param {number} digitpos position of the digit.
         * @param {number} value digit value 0-9.
         * @param {boolean} opt_highscore whether drawing the high score.
         */
        draw: function (digitpos, value, opt_highscore) {
            var sourcewidth = distancemeter.dimensions.width;
            var sourceheight = distancemeter.dimensions.height;
            var sourcex = distancemeter.dimensions.width * value;
            var sourcey = 0;

            var targetx = digitpos * distancemeter.dimensions.dest_width;
            var targety = this.y;
            var targetwidth = distancemeter.dimensions.width;
            var targetheight = distancemeter.dimensions.height;

            // for high dpi we 2x source values.
            if (is_hidpi) {
                sourcewidth *= 2;
                sourceheight *= 2;
                sourcex *= 2;
            }

            sourcex += this.spritepos.x;
            sourcey += this.spritepos.y;

            this.canvasctx.save();

            if (opt_highscore) {
                // left of the current score.
                var highscorex = this.x - (this.maxscoreunits * 2) *
                    distancemeter.dimensions.width;
                this.canvasctx.translate(highscorex, this.y);
            } else {
                this.canvasctx.translate(this.x, this.y);
            }

            this.canvasctx.drawimage(this.image, sourcex, sourcey,
                sourcewidth, sourceheight,
                targetx, targety,
                targetwidth, targetheight
            );

            this.canvasctx.restore();
        },

        /**
         * covert pixel distance to a 'real' distance.
         * @param {number} distance pixel distance ran.
         * @return {number} the 'real' distance ran.
         */
        getactualdistance: function (distance) {
            return distance ? math.round(distance * this.config.coefficient) : 0;
        },

        /**
         * update the distance meter.
         * @param {number} distance
         * @param {number} deltatime
         * @return {boolean} whether the acheivement sound fx should be played.
         */
        update: function (deltatime, distance) {
            var paint = true;
            var playsound = false;

            if (!this.acheivement) {
                distance = this.getactualdistance(distance);
                // score has gone beyond the initial digit count.
                if (distance > this.maxscore && this.maxscoreunits ==
                    this.config.max_distance_units) {
                    this.maxscoreunits++;
                    this.maxscore = parseint(this.maxscore + '9');
                } else {
                    this.distance = 0;
                }

                if (distance > 0) {
                    // acheivement unlocked
                    if (distance % this.config.achievement_distance == 0) {
                        // flash score and play sound.
                        this.acheivement = true;
                        this.flashtimer = 0;
                        playsound = true;
                    }

                    // create a string representation of the distance with leading 0.
                    var distancestr = (this.defaultstring +
                        distance).substr(-this.maxscoreunits);
                    this.digits = distancestr.split('');
                } else {
                    this.digits = this.defaultstring.split('');
                }
            } else {
                // control flashing of the score on reaching acheivement.
                if (this.flashiterations <= this.config.flash_iterations) {
                    this.flashtimer += deltatime;

                    if (this.flashtimer < this.config.flash_duration) {
                        paint = false;
                    } else if (this.flashtimer >
                        this.config.flash_duration * 2) {
                        this.flashtimer = 0;
                        this.flashiterations++;
                    }
                } else {
                    this.acheivement = false;
                    this.flashiterations = 0;
                    this.flashtimer = 0;
                }
            }

            // draw the digits if not flashing.
            if (paint) {
                for (var i = this.digits.length - 1; i >= 0; i--) {
                    this.draw(i, parseint(this.digits[i]));
                }
            }

            this.drawhighscore();
            return playsound;
        },

        /**
         * draw the high score.
         */
        drawhighscore: function () {
            this.canvasctx.save();
            this.canvasctx.globalalpha = .8;
            for (var i = this.highscore.length - 1; i >= 0; i--) {
                this.draw(i, parseint(this.highscore[i], 10), true);
            }
            this.canvasctx.restore();
        },

        /**
         * set the highscore as a array string.
         * position of char in the sprite: h - 10, i - 11.
         * @param {number} distance distance ran in pixels.
         */
        sethighscore: function (distance) {
            distance = this.getactualdistance(distance);
            var highscorestr = (this.defaultstring +
                distance).substr(-this.maxscoreunits);

            this.highscore = ['10', '11', ''].concat(highscorestr.split(''));
        },

        /**
         * reset the distance meter back to '00000'.
         */
        reset: function () {
            this.update(0);
            this.acheivement = false;
        }
    };


    //******************************************************************************

    /**
     * cloud background item.
     * similar to an obstacle object but without collision boxes.
     * @param {htmlcanvaselement} canvas canvas element.
     * @param {object} spritepos position of image in sprite.
     * @param {number} containerwidth
     */
    function cloud(canvas, spritepos, containerwidth) {
        this.canvas = canvas;
        this.canvasctx = this.canvas.getcontext('2d');
        this.spritepos = spritepos;
        this.containerwidth = containerwidth;
        this.xpos = containerwidth;
        this.ypos = 0;
        this.remove = false;
        this.cloudgap = getrandomnum(cloud.config.min_cloud_gap,
            cloud.config.max_cloud_gap);

        this.init();
    };


    /**
     * cloud object config.
     * @enum {number}
     */
    cloud.config = {
        height: 14,
        max_cloud_gap: 400,
        max_sky_level: 30,
        min_cloud_gap: 100,
        min_sky_level: 71,
        width: 46
    };


    cloud.prototype = {
        /**
         * initialise the cloud. sets the cloud height.
         */
        init: function () {
            this.ypos = getrandomnum(cloud.config.max_sky_level,
                cloud.config.min_sky_level);
            this.draw();
        },

        /**
         * draw the cloud.
         */
        draw: function () {
            this.canvasctx.save();
            var sourcewidth = cloud.config.width;
            var sourceheight = cloud.config.height;

            if (is_hidpi) {
                sourcewidth = sourcewidth * 2;
                sourceheight = sourceheight * 2;
            }

            this.canvasctx.drawimage(runner.imagesprite, this.spritepos.x,
                this.spritepos.y,
                sourcewidth, sourceheight,
                this.xpos, this.ypos,
                cloud.config.width, cloud.config.height);

            this.canvasctx.restore();
        },

        /**
         * update the cloud position.
         * @param {number} speed
         */
        update: function (speed) {
            if (!this.remove) {
                this.xpos -= math.ceil(speed);
                this.draw();

                // mark as removeable if no longer in the canvas.
                if (!this.isvisible()) {
                    this.remove = true;
                }
            }
        },

        /**
         * check if the cloud is visible on the stage.
         * @return {boolean}
         */
        isvisible: function () {
            return this.xpos + cloud.config.width > 0;
        }
    };


    //******************************************************************************

    /**
     * nightmode shows a moon and stars on the horizon.
     */
    function nightmode(canvas, spritepos, containerwidth) {
        this.spritepos = spritepos;
        this.canvas = canvas;
        this.canvasctx = canvas.getcontext('2d');
        this.xpos = containerwidth - 50;
        this.ypos = 30;
        this.currentphase = 0;
        this.opacity = 0;
        this.containerwidth = containerwidth;
        this.stars = [];
        this.drawstars = false;
        this.placestars();
    };

    /**
     * @enum {number}
     */
    nightmode.config = {
        fade_speed: 0.035,
        height: 40,
        moon_speed: 0.25,
        num_stars: 2,
        star_size: 9,
        star_speed: 0.3,
        star_max_y: 70,
        width: 20
    };

    nightmode.phases = [140, 120, 100, 60, 40, 20, 0];

    nightmode.prototype = {
        /**
         * update moving moon, changing phases.
         * @param {boolean} activated whether night mode is activated.
         * @param {number} delta
         */
        update: function (activated, delta) {
            // moon phase.
            if (activated && this.opacity == 0) {
                this.currentphase++;

                if (this.currentphase >= nightmode.phases.length) {
                    this.currentphase = 0;
                }
            }

            // fade in / out.
            if (activated && (this.opacity < 1 || this.opacity == 0)) {
                this.opacity += nightmode.config.fade_speed;
            } else if (this.opacity > 0) {
                this.opacity -= nightmode.config.fade_speed;
            }

            // set moon positioning.
            if (this.opacity > 0) {
                this.xpos = this.updatexpos(this.xpos, nightmode.config.moon_speed);

                // update stars.
                if (this.drawstars) {
                    for (var i = 0; i < nightmode.config.num_stars; i++) {
                        this.stars[i].x = this.updatexpos(this.stars[i].x,
                            nightmode.config.star_speed);
                    }
                }
                this.draw();
            } else {
                this.opacity = 0;
                this.placestars();
            }
            this.drawstars = true;
        },

        updatexpos: function (currentpos, speed) {
            if (currentpos < -nightmode.config.width) {
                currentpos = this.containerwidth;
            } else {
                currentpos -= speed;
            }
            return currentpos;
        },

        draw: function () {
            var moonsourcewidth = this.currentphase == 3 ? nightmode.config.width * 2 :
                nightmode.config.width;
            var moonsourceheight = nightmode.config.height;
            var moonsourcex = this.spritepos.x + nightmode.phases[this.currentphase];
            var moonoutputwidth = moonsourcewidth;
            var starsize = nightmode.config.star_size;
            var starsourcex = runner.spritedefinition.ldpi.star.x;

            if (is_hidpi) {
                moonsourcewidth *= 2;
                moonsourceheight *= 2;
                moonsourcex = this.spritepos.x +
                    (nightmode.phases[this.currentphase] * 2);
                starsize *= 2;
                starsourcex = runner.spritedefinition.hdpi.star.x;
            }

            this.canvasctx.save();
            this.canvasctx.globalalpha = this.opacity;

            // stars.
            if (this.drawstars) {
                for (var i = 0; i < nightmode.config.num_stars; i++) {
                    this.canvasctx.drawimage(runner.imagesprite,
                        starsourcex, this.stars[i].sourcey, starsize, starsize,
                        math.round(this.stars[i].x), this.stars[i].y,
                        nightmode.config.star_size, nightmode.config.star_size);
                }
            }

            // moon.
            this.canvasctx.drawimage(runner.imagesprite, moonsourcex,
                this.spritepos.y, moonsourcewidth, moonsourceheight,
                math.round(this.xpos), this.ypos,
                moonoutputwidth, nightmode.config.height);

            this.canvasctx.globalalpha = 1;
            this.canvasctx.restore();
        },

        // do star placement.
        placestars: function () {
            var segmentsize = math.round(this.containerwidth /
                nightmode.config.num_stars);

            for (var i = 0; i < nightmode.config.num_stars; i++) {
                this.stars[i] = {};
                this.stars[i].x = getrandomnum(segmentsize * i, segmentsize * (i + 1));
                this.stars[i].y = getrandomnum(0, nightmode.config.star_max_y);

                if (is_hidpi) {
                    this.stars[i].sourcey = runner.spritedefinition.hdpi.star.y +
                        nightmode.config.star_size * 2 * i;
                } else {
                    this.stars[i].sourcey = runner.spritedefinition.ldpi.star.y +
                        nightmode.config.star_size * i;
                }
            }
        },

        reset: function () {
            this.currentphase = 0;
            this.opacity = 0;
            this.update(false);
        }

    };


    //******************************************************************************

    /**
     * horizon line.
     * consists of two connecting lines. randomly assigns a flat / bumpy horizon.
     * @param {htmlcanvaselement} canvas
     * @param {object} spritepos horizon position in sprite.
     * @constructor
     */
    function horizonline(canvas, spritepos) {
        this.spritepos = spritepos;
        this.canvas = canvas;
        this.canvasctx = canvas.getcontext('2d');
        this.sourcedimensions = {};
        this.dimensions = horizonline.dimensions;
        this.sourcexpos = [this.spritepos.x, this.spritepos.x +
            this.dimensions.width];
        this.xpos = [];
        this.ypos = 0;
        this.bumpthreshold = 0.5;

        this.setsourcedimensions();
        this.draw();
    };


    /**
     * horizon line dimensions.
     * @enum {number}
     */
    horizonline.dimensions = {
        width: 600,
        height: 12,
        ypos: 127
    };


    horizonline.prototype = {
        /**
         * set the source dimensions of the horizon line.
         */
        setsourcedimensions: function () {

            for (var dimension in horizonline.dimensions) {
                if (is_hidpi) {
                    if (dimension != 'ypos') {
                        this.sourcedimensions[dimension] =
                            horizonline.dimensions[dimension] * 2;
                    }
                } else {
                    this.sourcedimensions[dimension] =
                        horizonline.dimensions[dimension];
                }
                this.dimensions[dimension] = horizonline.dimensions[dimension];
            }

            this.xpos = [0, horizonline.dimensions.width];
            this.ypos = horizonline.dimensions.ypos;
        },

        /**
         * return the crop x position of a type.
         */
        getrandomtype: function () {
            return math.random() > this.bumpthreshold ? this.dimensions.width : 0;
        },

        /**
         * draw the horizon line.
         */
        draw: function () {
            this.canvasctx.drawimage(runner.imagesprite, this.sourcexpos[0],
                this.spritepos.y,
                this.sourcedimensions.width, this.sourcedimensions.height,
                this.xpos[0], this.ypos,
                this.dimensions.width, this.dimensions.height);

            this.canvasctx.drawimage(runner.imagesprite, this.sourcexpos[1],
                this.spritepos.y,
                this.sourcedimensions.width, this.sourcedimensions.height,
                this.xpos[1], this.ypos,
                this.dimensions.width, this.dimensions.height);
        },

        /**
         * update the x position of an indivdual piece of the line.
         * @param {number} pos line position.
         * @param {number} increment
         */
        updatexpos: function (pos, increment) {
            var line1 = pos;
            var line2 = pos == 0 ? 1 : 0;

            this.xpos[line1] -= increment;
            this.xpos[line2] = this.xpos[line1] + this.dimensions.width;

            if (this.xpos[line1] <= -this.dimensions.width) {
                this.xpos[line1] += this.dimensions.width * 2;
                this.xpos[line2] = this.xpos[line1] - this.dimensions.width;
                this.sourcexpos[line1] = this.getrandomtype() + this.spritepos.x;
            }
        },

        /**
         * update the horizon line.
         * @param {number} deltatime
         * @param {number} speed
         */
        update: function (deltatime, speed) {
            var increment = math.floor(speed * (fps / 1000) * deltatime);

            if (this.xpos[0] <= 0) {
                this.updatexpos(0, increment);
            } else {
                this.updatexpos(1, increment);
            }
            this.draw();
        },

        /**
         * reset horizon to the starting position.
         */
        reset: function () {
            this.xpos[0] = 0;
            this.xpos[1] = horizonline.dimensions.width;
        }
    };


    //******************************************************************************

    /**
     * horizon background class.
     * @param {htmlcanvaselement} canvas
     * @param {object} spritepos sprite positioning.
     * @param {object} dimensions canvas dimensions.
     * @param {number} gapcoefficient
     * @constructor
     */
    function horizon(canvas, spritepos, dimensions, gapcoefficient) {
        this.canvas = canvas;
        this.canvasctx = this.canvas.getcontext('2d');
        this.config = horizon.config;
        this.dimensions = dimensions;
        this.gapcoefficient = gapcoefficient;
        this.obstacles = [];
        this.obstaclehistory = [];
        this.horizonoffsets = [0, 0];
        this.cloudfrequency = this.config.cloud_frequency;
        this.spritepos = spritepos;
        this.nightmode = null;

        // cloud
        this.clouds = [];
        this.cloudspeed = this.config.bg_cloud_speed;

        // horizon
        this.horizonline = null;
        this.init();
    };


    /**
     * horizon config.
     * @enum {number}
     */
    horizon.config = {
        bg_cloud_speed: 0.2,
        bumpy_threshold: .3,
        cloud_frequency: .5,
        horizon_height: 16,
        max_clouds: 6
    };


    horizon.prototype = {
        /**
         * initialise the horizon. just add the line and a cloud. no obstacles.
         */
        init: function () {
            this.addcloud();
            this.horizonline = new horizonline(this.canvas, this.spritepos.horizon);
            this.nightmode = new nightmode(this.canvas, this.spritepos.moon,
                this.dimensions.width);
        },

        /**
         * @param {number} deltatime
         * @param {number} currentspeed
         * @param {boolean} updateobstacles used as an override to prevent
         *     the obstacles from being updated / added. this happens in the
         *     ease in section.
         * @param {boolean} shownightmode night mode activated.
         */
        update: function (deltatime, currentspeed, updateobstacles, shownightmode) {
            this.runningtime += deltatime;
            this.horizonline.update(deltatime, currentspeed);
            this.nightmode.update(shownightmode);
            this.updateclouds(deltatime, currentspeed);

            if (updateobstacles) {
                this.updateobstacles(deltatime, currentspeed);
            }
        },

        /**
         * update the cloud positions.
         * @param {number} deltatime
         * @param {number} currentspeed
         */
        updateclouds: function (deltatime, speed) {
            var cloudspeed = this.cloudspeed / 1000 * deltatime * speed;
            var numclouds = this.clouds.length;

            if (numclouds) {
                for (var i = numclouds - 1; i >= 0; i--) {
                    this.clouds[i].update(cloudspeed);
                }

                var lastcloud = this.clouds[numclouds - 1];

                // check for adding a new cloud.
                if (numclouds < this.config.max_clouds &&
                    (this.dimensions.width - lastcloud.xpos) > lastcloud.cloudgap &&
                    this.cloudfrequency > math.random()) {
                    this.addcloud();
                }

                // remove expired clouds.
                this.clouds = this.clouds.filter(function (obj) {
                    return !obj.remove;
                });
            } else {
                this.addcloud();
            }
        },

        /**
         * update the obstacle positions.
         * @param {number} deltatime
         * @param {number} currentspeed
         */
        updateobstacles: function (deltatime, currentspeed) {
            // obstacles, move to horizon layer.
            var updatedobstacles = this.obstacles.slice(0);

            for (var i = 0; i < this.obstacles.length; i++) {
                var obstacle = this.obstacles[i];
                obstacle.update(deltatime, currentspeed);

                // clean up existing obstacles.
                if (obstacle.remove) {
                    updatedobstacles.shift();
                }
            }
            this.obstacles = updatedobstacles;

            if (this.obstacles.length > 0) {
                var lastobstacle = this.obstacles[this.obstacles.length - 1];

                if (lastobstacle && !lastobstacle.followingobstaclecreated &&
                    lastobstacle.isvisible() &&
                    (lastobstacle.xpos + lastobstacle.width + lastobstacle.gap) <
                    this.dimensions.width) {
                    this.addnewobstacle(currentspeed);
                    lastobstacle.followingobstaclecreated = true;
                }
            } else {
                // create new obstacles.
                this.addnewobstacle(currentspeed);
            }
        },

        removefirstobstacle: function () {
            this.obstacles.shift();
        },

        /**
         * add a new obstacle.
         * @param {number} currentspeed
         */
        addnewobstacle: function (currentspeed) {
            var obstacletypeindex = getrandomnum(0, obstacle.types.length - 1);
            var obstacletype = obstacle.types[obstacletypeindex];

            // check for multiples of the same type of obstacle.
            // also check obstacle is available at current speed.
            if (this.duplicateobstaclecheck(obstacletype.type) ||
                currentspeed < obstacletype.minspeed) {
                this.addnewobstacle(currentspeed);
            } else {
                var obstaclespritepos = this.spritepos[obstacletype.type];

                this.obstacles.push(new obstacle(this.canvasctx, obstacletype,
                    obstaclespritepos, this.dimensions,
                    this.gapcoefficient, currentspeed, obstacletype.width));

                this.obstaclehistory.unshift(obstacletype.type);

                if (this.obstaclehistory.length > 1) {
                    this.obstaclehistory.splice(runner.config.max_obstacle_duplication);
                }
            }
        },

        /**
         * returns whether the previous two obstacles are the same as the next one.
         * maximum duplication is set in config value max_obstacle_duplication.
         * @return {boolean}
         */
        duplicateobstaclecheck: function (nextobstacletype) {
            var duplicatecount = 0;

            for (var i = 0; i < this.obstaclehistory.length; i++) {
                duplicatecount = this.obstaclehistory[i] == nextobstacletype ?
                    duplicatecount + 1 : 0;
            }
            return duplicatecount >= runner.config.max_obstacle_duplication;
        },

        /**
         * reset the horizon layer.
         * remove existing obstacles and reposition the horizon line.
         */
        reset: function () {
            this.obstacles = [];
            this.horizonline.reset();
            this.nightmode.reset();
        },

        /**
         * update the canvas width and scaling.
         * @param {number} width canvas width.
         * @param {number} height canvas height.
         */
        resize: function (width, height) {
            this.canvas.width = width;
            this.canvas.height = height;
        },

        /**
         * add a new cloud to the horizon.
         */
        addcloud: function () {
            this.clouds.push(new cloud(this.canvas, this.spritepos.cloud,
                this.dimensions.width));
        }
    };
})();


function ondocumentload() {
    new runner('.interstitial-wrapper');
}

document.addeventlistener('domcontentloaded', ondocumentload);
