// game mechanics

// spawn the enemy within the container
function spawnx(min, max) {

    return math.floor(math.random() * (max - min)) + min;

}

// collision detection from pixijs tutorial
function hittestrectangle(r1, r2) {

    //define the variables we'll need to calculate
    let hit, combinedhalfwidths, combinedhalfheights, vx, vy;
  
    //hit will determine whether there's a collision
    hit = false;
  
    //find the center points of each sprite
    r1.centerx = r1.x + r1.width / 2;
    r1.centery = r1.y + r1.height / 2;
    r2.centerx = r2.x + r2.width / 2;
    r2.centery = r2.y + r2.height / 2;
  
    //find the half-widths and half-heights of each sprite
    r1.halfwidth = r1.width / 2;
    r1.halfheight = r1.height / 2;
    r2.halfwidth = r2.width / 10;
    r2.halfheight = r2.height / 10;
  
    //calculate the distance vector between the sprites
    vx = r1.centerx - r2.centerx;
    vy = r1.centery - r2.centery;
  
    //figure out the combined half-widths and half-heights
    combinedhalfwidths = r1.halfwidth + r2.halfwidth;
    combinedhalfheights = r1.halfheight + r2.halfheight;
  
    //check for a collision on the x axis
    if (math.abs(vx) < combinedhalfwidths) {
  
      //a collision might be occurring. check for a collision on the y axis
      if (math.abs(vy) < combinedhalfheights) {
  
        //there's definitely a collision happening
        hit = true;
      } else {
  
        //there's no collision on the y axis
        hit = false;
      }
    } else {
  
      //there's no collision on the x axis
      hit = false;
    }
  
    //`hit` will be either `true` or `false`
    return hit;
}