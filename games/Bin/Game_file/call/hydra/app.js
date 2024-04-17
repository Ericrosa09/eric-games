//aliases
const application = pixi.application,
      container = pixi.container,
      text = pixi.text,
      textstyle = pixi.textstyle,
      loader = pixi.loader,
      resources = pixi.loader.resources,
      texture = pixi.texture;
      texturecache = pixi.utils.texturecache,
      sprite = pixi.sprite,
      rectangle = pixi.rectangle;

//variable declaration
// misc.
var maxwidth, maxheight, loadingcontainer, loadinglabel, textstyle;
let state, halfofrendererwidth, menutitley, menufirstbtny, menusecondbtny,
    ingametitlex, scoremultiplierx, scorex, toplabely, pausebtnlabelx, pausebtnlabely, pausebtnx, pausebtny,
    mmbtny, minboundx, maxboundx, minboundy, maxboundy, cloudposy;
// sound
var bgm, crashsfx, buttonpresssfx, earnpointsfx, planesfx;
// in-game screen
var gamescene, pausemenu, score, scoremultiplier, enemy, enemyisalive, enemysize, minspawnx, maxspawnx, spawny;
let title, scorelabel, scoremultiplierlabel, player, playermovespeed, pausebuttoncontainer, pausebutton,
    pausebuttonlabel, pausemenubtncontainer, pausemenulabel, continuebtn, continuebtnlabel, mmbtn_2, mmlabel_2;
// game over screen
let gameoverscene, gameoverlabel, endtitle, endscorelabel, endscoremultiplierlabel, restartbuttoncontainerrestartbutton, restartlabel;
// main menu screen
var mainmenuscene, aboutscene;
let mmtitle, mmbtncontainer, mmbtnplay, mmplaylabel, mmbtnabout, mmaboutlabel, mmbtn, mmlabel,
    aboutparagraph, aboutbtncontainer, btnback, btnbacklabel;

// get browser's width and height
let w = window.innerwidth;
let h = window.innerheight;

//create a pixi application
const app = new application({
    width: w, 
    height: h,
    autoresize: true,
    resolution: 1
    }
);

//add the canvas that pixi automatically created for you to the html document
// center app by making its parent the div container
let container = document.getelementbyid("container");
container.appendchild(app.view);

// load texture and sound
loadstuff();

//this function sets the appropriate textures, sprites, sound, position, button events, etc.
function setup() {

    // assign appropriate sound
    bgm = sounds["sounds/music.wav"];
    crashsfx = sounds["sounds/explosion.wav"];
    buttonpresssfx = sounds["sounds/bounce.mp3"];
    earnpointsfx = sounds['sounds/shoot.wav'];
    planesfx = sounds["sounds/plane.wav"];

    // loop background music and plane engine sound (currently disabled)
    bgm.loop = true;
    planesfx.loop = true;

    // set the volume
    buttonpresssfx.volume = 0.6;
    planesfx.volume = 0.2;

    //my attempt at making this responsive by converting to their % values
    //center value
    halfofrendererwidth = app.renderer.width / 2;
    //position value of y for label on menus
    menutitley = math.round(app.renderer.height / 3.33);
    //position value of y for the 1st button in a list of buttons on menus
    menufirstbtny = app.renderer.height / 2.5;
    //position value of y for the 2nd button in a list of buttons on menus
    menusecondbtny = (app.renderer.height / 2) - 5;
    //position value of x for score multipliers
    scoremultiplierx = app.renderer.width / 2.127659574468085;
    //position value of x for title ingame screen
    ingametitlex = app.renderer.width / 25;
    //position value of y for labels close to the top of screen
    toplabely = app.renderer.height / 50;
    //position value of x for score
    scorex = app.renderer.width / 1.25;
    //position value of x for pause button label
    pausebtnlabelx = app.renderer.width / 7.142857142857143;
    //position value of y for pause button label
    pausebtnlabely = app.renderer.height / 1.162790697674419;
    //position value of y for main menu button
    mmbtny = app.renderer.height / 1.666666666666667;
    //position value of x for pause button
    pausebtnx = app.renderer.width / 8.333333333333333;
    //position value of y for pause button
    pausebtny = app.renderer.height / 1.162790697674419;
    //position value of y for cloud
    cloudposy = math.round(app.renderer.height / 9);

    // create scene
    mainmenuscene = new container();
    mmbtncontainer = new container();
    aboutscene = new container();
    aboutbtncontainer = new container();
    gamescene = new container();
    pausemenu = new container();
    pausebuttoncontainer = new container();
    pausemenubtncontainer = new container();
    gameoverscene = new container();
    restartbuttoncontainer = new container();

    // hide unnecessary scene
    aboutscene.visible = false;
    pausemenu.visible = false;
    gamescene.visible = false;
    gameoverscene.visible = false;
    restartbuttoncontainer.visible = false;
    
    score = 0;
    scoremultiplier = 1;

    // setup for main menu
    mmtitle = new text("flydra", textstyle);
    mmtitle.position.set(halfofrendererwidth, menutitley);
    mmtitle.anchor.set(0.5, 0.5);
    mmplaylabel = new text("play", textstyle);
    mmplaylabel.position.set(halfofrendererwidth, menufirstbtny);
    mmplaylabel.anchor.set(0.5, 0.5);
    mmaboutlabel = new text("about", textstyle);
    mmaboutlabel.position.set(halfofrendererwidth, menusecondbtny);
    mmaboutlabel.anchor.set(0.5, 0.5);
    aboutparagraph = new text("red planes are out of control!\ndrag the blue plane to avoid crashing.\n\nfly hydra/flydra is a game\nmade by z04p intended\nto develop his skills in pixi js.", textstyle);
    aboutparagraph.position.set(halfofrendererwidth, menutitley);
    aboutparagraph.anchor.set(0.5, 0.5);
    btnbacklabel = new text("back", textstyle);
    btnbacklabel.position.set(halfofrendererwidth, menusecondbtny);
    btnbacklabel.anchor.set(0.5, 0.5);

    // setup for in-game scene
    title = new text("flydra", textstyle);
    title.position.set(ingametitlex, toplabely);
    scoremultiplierlabel = new text("x" + scoremultiplier, textstyle);
    scoremultiplierlabel.position.set(scoremultiplierx, toplabely);
    scorelabel = new text(score, textstyle);
    scorelabel.position.set(scorex ,toplabely);
    pausebuttonlabel = new text("pause", textstyle);
    pausebuttonlabel.position.set(pausebtnlabelx, pausebtnlabely);
    pausebuttonlabel.anchor.set(0.5, 0.5);
    pausemenulabel = new text("game paused", textstyle);
    pausemenulabel.position.set(halfofrendererwidth, menutitley);
    pausemenulabel.anchor.set(0.5, 0.5);
    continuebtnlabel = new text("continue", textstyle);
    continuebtnlabel.position.set(halfofrendererwidth, menufirstbtny);
    continuebtnlabel.anchor.set(0.5, 0.5);
    mmlabel_2 = new text("menu", textstyle);
    mmlabel_2.position.set(halfofrendererwidth, menusecondbtny);
    mmlabel_2.anchor.set(0.5, 0.5);

    // setup for game over scene
    endtitle = new text("flydra", textstyle);
    endtitle.position.set(ingametitlex, toplabely);
    endscoremultiplierlabel = new text("x" + scoremultiplier, textstyle);
    endscoremultiplierlabel.position.set(scoremultiplierx, toplabely);
    endscorelabel = new text(score, textstyle);
    endscorelabel.position.set(scorex ,toplabely);
    gameoverlabel = new text("you crashed your hydra!", textstyle);
    gameoverlabel.position.set(halfofrendererwidth, menufirstbtny);
    gameoverlabel.anchor.set(0.5, 0.5);
    restartlabel = new text("try again", textstyle);
    restartlabel.position.set(halfofrendererwidth, menusecondbtny);
    restartlabel.anchor.set(0.5, 0.5);
    mmlabel = new text("menu", textstyle);
    mmlabel.position.set(halfofrendererwidth, mmbtny);
    mmlabel.anchor.set(0.5, 0.5);

    // assign appropriate texture
    mmbtnplay = new sprite(resources.buttonplay.texture);
    mmbtnabout = new sprite(resources.buttonabout.texture);
    btnback = new sprite(resources.buttonmenu.texture);
    pausebutton = new sprite(resources.buttonpause.texture);
    continuebtn = new sprite(resources.buttonplay.texture);
    mmbtn_2 = new sprite(resources.buttonmenu.texture);
    player = new sprite(resources.player.texture);
    enemy = new sprite(resources.enemy.texture);
    restartbutton = new sprite(resources.buttonrestart.texture);
    mmbtn = new sprite(resources.buttonmenu.texture);

    // setup for buttons in main menu
    mmbtnplay.scale.set(0.8, 0.8);
    mmbtnplay.position.set(halfofrendererwidth, menufirstbtny);
    mmbtnplay.anchor.set(0.5, 0.5);
    mmbtnplay.interactive = true;
    mmbtnplay.buttonmode = true;
    mmbtnabout.scale.set(0.8, 0.8);
    mmbtnabout.position.set(halfofrendererwidth, menusecondbtny);
    mmbtnabout.anchor.set(0.5, 0.5);
    mmbtnabout.interactive = true;
    mmbtnabout.buttonmode = true;
    btnback.scale.set(0.8, 0.8);
    btnback.position.set(halfofrendererwidth, menusecondbtny);
    btnback.anchor.set(0.5, 0.5);
    btnback.interactive = true;
    btnback.buttonmode = true;

    // setup for buttons in pause menu
    pausebutton.scale.set(0.8, 0.8);
    pausebutton.position.set(pausebtnx, pausebtny);
    pausebutton.anchor.set(0.5, 0.5);
    pausebutton.interactive = true;
    pausebutton.buttonmode = true;
    continuebtn.scale.set(0.8, 0.8);
    continuebtn.position.set(halfofrendererwidth, menufirstbtny);
    continuebtn.anchor.set(0.5, 0.5);
    continuebtn.interactive = true;
    continuebtn.buttonmode = true;
    mmbtn_2.scale.set(0.8, 0.8);
    mmbtn_2.position.set(halfofrendererwidth, menusecondbtny);
    mmbtn_2.anchor.set(0.5, 0.5);
    mmbtn_2.interactive = true;
    mmbtn_2.buttonmode = true;

    // setup for the player
    player.scale.set(0.8, 0.8);
    player.x = halfofrendererwidth;
    player.y = halfofrendererwidth;
    player.vx = 0;
    player.vy = 0;
    playermovespeed = 1.053;
    player.anchor.set(0.5, 0.5);
    player.interactive = true;
    player.buttonmode = true;

    // android control support
    // works with mouse too
    // drag the player to move
    player.on('pointerdown', ondragstart)
          .on('pointerup', ondragend)
          .on('pointerupoutside', ondragend)
          .on('pointermove', ondragmove);

    // setup for enemy
    // i set a minspawnx and maxspawnx since the enemy needs to despawn and respawn
    minspawnx = math.round(w / 7.14);
    maxspawnx = math.round(w / 1.163);
    spawny = 0;
    enemysize = 0.3;
    enemy.scale.set(enemysize, enemysize);
    enemy.x = spawnx(minspawnx, maxspawnx);
    enemy.y = spawny;
    enemy.vx = 0;
    enemy.vy = 0;
    enemymovespeed = 3;
    enemy.anchor.set(0.5, 0.5);

    // animating the background
    // create an array of textures from an image path
    var framesroad = [];
    var framescloud = [];

    // get frame from the spritesheet then push into the array
    for (var i = 0; i < 8; i++) {
        var val = i < 10 ? '0' + i : i;

        framescloud.push(pixi.texture.fromframe('cloud0' + val + '.png'));
    }

    // get frame from the spritesheet then push into the array
    for (var i = 0; i < 3; i++) {
        var val = i < 10 ? '0' + i : i;

        framesroad.push(pixi.texture.fromframe('road0' + val + '.png'));
    }

    // create the animation for background
    var animroad = new pixi.extras.animatedsprite(framesroad);
    var animcloud = new pixi.extras.animatedsprite(framescloud);
    animroad.scale.set(1, 1);
    animroad.x = halfofrendererwidth;
    animroad.y = maxheight;
    animroad.anchor.set(0.5, 1);
    animroad.animationspeed = 0.05;
    animroad.play();
    animcloud.scale.set(1, 1);
    animcloud.x = halfofrendererwidth;
    animcloud.y = 0;
    animcloud.anchor.set(0.5, 0);
    animcloud.animationspeed = 0.02;
    animcloud.play();

    // setup for buttons in game over screen
    restartbutton.scale.set(0.8, 0.8);
    restartbutton.position.set(halfofrendererwidth, menusecondbtny);
    restartbutton.anchor.set(0.5, 0.5);
    restartbutton.interactive = true;
    restartbutton.buttonmode = true;
    mmbtn.scale.set(0.8, 0.8);
    mmbtn.position.set(halfofrendererwidth, mmbtny);
    mmbtn.anchor.set(0.5, 0.5);
    mmbtn.interactive = true;
    mmbtn.buttonmode = true;

    // i decided to create a container for buttons since it's easier to hide/show a container 
    // instead of having to hide/show each button
    // i then add them to their respective scene
    mmbtncontainer.addchild(mmbtnplay, mmplaylabel, mmbtnabout, mmaboutlabel);
    mainmenuscene.addchild(mmbtncontainer, mmtitle);
    aboutbtncontainer.addchild(btnback, btnbacklabel);
    aboutscene.addchild(aboutbtncontainer, aboutparagraph);
    pausemenubtncontainer.addchild(continuebtn, continuebtnlabel, mmbtn_2, mmlabel_2);
    pausemenu.addchild(pausemenubtncontainer, pausemenulabel);
    gamescene.addchildat(animcloud, 0);
    gamescene.addchildat(animroad, 0);
    gamescene.addchild(title, scoremultiplierlabel, scorelabel, pausebuttoncontainer, player);
    pausebuttoncontainer.addchild(pausebutton, pausebuttonlabel);
    restartbuttoncontainer.addchild(restartbutton, restartlabel, mmbtn, mmlabel);
    gameoverscene.addchild(endtitle, endscoremultiplierlabel, endscorelabel, gameoverlabel, restartbuttoncontainer);

    // this loads all scene into the stage of our app
    // removing this makes the stage empty which will result an empty screen
    app.stage.addchild(gameoverscene, gamescene, pausemenu, mainmenuscene, aboutscene);

    //start the game upon pressing the play button
    mmbtnplay.on('pointerdown', function(e) {

        bgm.playfrom(0);
        // planesfx.playfrom(0);
        buttonpresssfx.play();

        mainmenuscene.visible = false;
        gamescene.visible = true;

        state = play;
        
    });
    
    //switch to about screen upon pressing the about button
    mmbtnabout.on('pointerdown', function(e) {

        buttonpresssfx.play();

        mainmenuscene.visible = false;
        mmtitle.visible = false;
        mmbtncontainer.visible = false;
        aboutscene.visible = true;
        aboutbtncontainer.visible = true;

    });

    //switch to menu screen upon pressing the back button
    btnback.on('pointerdown', function(e) {

        buttonpresssfx.play();

        aboutscene.visible = false;
        aboutbtncontainer.visible = false;
        mainmenuscene.visible = true;
        mmtitle.visible = true;
        mmbtncontainer.visible = true;

    });

    //pause the game upon pressing the pause button
    pausebutton.on('pointerdown', function(e) {

        bgm.fadeout(1);
        // planesfx.pause();
        buttonpresssfx.play();

        state = pause;
        gamescene.visible = false;
        pausemenu.visible = true;
        pausemenubtncontainer.visible = true;

    });

    //continue the game upon pressing the continue button
    continuebtn.on('pointerdown', function(e) {

        bgm.fadein(1);
        // planesfx.play();
        buttonpresssfx.play();

        state = play;
        pausemenu.visible = false;
        pausemenubtncontainer.visible = false;
        gamescene.visible = true;
        app.start();

    });

    //return to the main menu upon pressing the menu button
    mmbtn_2.on('pointerdown', function(e) {

        bgm.pause();
        buttonpresssfx.play();

        score = -100;
        endscore = -100;
        scoremultiplier = 0.5;
        endscoremultiplier = 0.5;
        player.x = halfofrendererwidth;
        player.y = halfofrendererwidth;
        enemy.y = 500;
        enemyisalive = true;
        
        state = menu;
        gamescene.visible = false;
        pausemenu.visible = false;
        gameoverscene.visible = false;
        restartbuttoncontainer.visible = false;
        gamescene.visible = false;
        mainmenuscene.visible = true;
        app.start();

    });

    //restart the game upon pressing the restart button
    restartbutton.on('pointerdown', function(e) {

        bgm.playfrom(0);
        // planesfx.playfrom(0);
        buttonpresssfx.play();

        gameoverscene.visible = false;
        restartbuttoncontainer.visible = false;
        gamescene.visible = true;

        state = play;

    });

    //return to the main menu upon pressing the menu button
    mmbtn.on('pointerdown', function(e) {
        
        bgm.pause();
        buttonpresssfx.play();

        gameoverscene.visible = false;
        restartbuttoncontainer.visible = false;
        gamescene.visible = false;
        mainmenuscene.visible = true;

        state = menu;

    });

    //set the game state
    state = menu;

    //start the game loop
    app.ticker.add(delta => gameloop(delta));

}

function gameloop(delta) {

    //update the current game state
    state(delta);

}