// load everything
function loadstuff() {

    // set the max width/height of your app
    maxwidth = 500;
    maxheight = 500;

    // limits the app's width/height according to maxwidth/maxheight
    if (w <= maxwidth && h <= maxheight) {
        //don't do anything;
    } else {

        // resize to maxwidth/maxheight if the renderer is larger than the one has set
        app.renderer.resize(maxwidth, maxheight);
        w = maxwidth;
        h = maxheight;

    }

    // formats the text (currently all labels are set to this format
    //  so changing this will also change the format for text in main menu, game over, etc.)
    textstyle = new textstyle({

        fontfamily: "arial",
        fontsize: 18,
        fill: "white",
        fontweight: "bold"

    });

    // create the loading screen
    loadingcontainer = new container();
    loadinglabel = new text("game is loading please wait..", textstyle);
    loadinglabel.anchor.set(0.5, 0.5);
    loadinglabel.position.set(w / 2, h / 2);
    loadingcontainer.addchild(loadinglabel);

    // show the loading screen
    app.stage.addchild(loadingcontainer);

    // preload the sounds
    sounds.load([
        "sounds/music.wav",
        "sounds/explosion.wav",
        "sounds/shoot.wav",
        "sounds/plane.wav",
        "sounds/bounce.mp3"
    ]);

    // call function loadsprite after sound has loaded
    sounds.whenloaded = loadsprite;

}

// load textures
function loadsprite() {

    //preload sprite and assign them a name
    loader
        .add("buttonplay", "sprite/play-button.png")
        .add("buttonabout", "sprite/about-button.png")
        .add("buttonpause", "sprite/pause-button.png")
        .add("player", "sprite/player.png")
        .add("enemy", "sprite/enemy.png")
        .add("buttonrestart", "sprite/restart-button.png")
        .add("buttonmenu", "sprite/menu-button.png")
        .add("spritesheet/cloud.json")
        .add("spritesheet/road.json")
        .on("progress", loadprogresshandler)
        .once('complete', function() {
            console.log("all files finished loading");
            app.stage.removechild(loadingcontainer);
            setup();
        })
        .load();

}

// loading progress in console
function loadprogresshandler(loader) {

    // show loading progress in percentage
    console.log("loading sprites.. " + math.round(loader.progress) + "%");

}