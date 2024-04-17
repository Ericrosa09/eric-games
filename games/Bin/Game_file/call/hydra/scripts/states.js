// game states
// main menu state
function menu() {
    
    //show the menu screen
    mainmenuscene.visible = true;
    gamescene.visible = false;
    gameoverscene.visible = false;
    restartbuttoncontainer.visible = false;

}

// play state
function play(delta) {

    let rotationvalue = 0.2;
    let enemyvy = enemy.vy + enemymovespeed;
    let enemyy = enemy.y;
    let despawnpoint = h;

    //use the player's velocity to make it move
    player.x += player.vx;
    player.y += player.vy;

    // min x = 70px | max x = 430px
    // min y = 100px | max y = 400px
    minboundx = math.round(app.renderer.width / 7.14);
    maxboundx = math.round(app.renderer.width / 1.162);
    minboundy = math.round(app.renderer.height / 5);
    maxboundy = math.round(app.renderer.height / 1.25);

    // stop player from going out of bounds
    // horizontal axis
    if (player.x <= minboundx) {
        player.vx = 0;
        player.x = minboundx;
    } else if (player.x >= maxboundx) {
        player.vx = 0;
        player.x = maxboundx;
    }
    
    // stop player from going out of bounds
    // vertical axis
    if (player.y <= minboundy) {
        player.vy = 0;
        player.y = minboundy;
    } else if (player.y >= maxboundy) {
        player.vy = 0;
        player.y = maxboundy;
    }

    enemy.rotation += 0.1;

    //move the enemy along the y axis and increase its size
    //to create the 3d effect of a object getting closer
    //despawn when enemy is too close
    if (enemyy >= despawnpoint && enemyisalive === true) {

        earnpointsfx.play();
        scoremultiplier += 0.5;
        score += 100 * scoremultiplier;
        enemyisalive = false;
        enemysize = 0.3;
        enemy.scale.set(enemysize, enemysize);
        enemy.x = spawnx(minspawnx, maxspawnx);
        enemy.y = spawny;
        enemy.anchor.set(0.5, 0.4);
        gamescene.removechild(enemy);

    } else if (enemyy < despawnpoint && enemyisalive === true) {
        
        enemy.y += enemyvy;
        enemy.scale.set(enemysize += 0.003, enemysize += 0.003);

    } else {

        enemyisalive = true;
        gamescene.addchildat(enemy, 2);

    }

    scoremultiplierlabel.text = "x" + scoremultiplier;
    scorelabel.text = score;
    endscoremultiplierlabel.text = "x" + scoremultiplier;
    endscorelabel.text = score;
    
    //check for collision between player and enemy
    if (hittestrectangle(player, enemy)) {

        bgm.pause();
        // planesfx.pause();
        crashsfx.play();

        //if there's collision do these
        player.rotation += rotationvalue;
        state = end;

    }

}

// game paused state
function pause() {

    app.stop();

}

// game over state
function end() {

    //launch the gameover scene
    score = -100;
    endscore = -100;
    scoremultiplier = 0.5;
    endscoremultiplier = 0.5;
    player.x = halfofrendererwidth;
    player.y = halfofrendererwidth;
    enemy.y = 500;
    enemyisalive = true;
    gamescene.visible = false;
    gameoverscene.visible = true;
    restartbuttoncontainer.visible = true;

}