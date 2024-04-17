// android control support
// works with mouse too
// drag to move player
function ondragstart(event) {

    // store a reference to the data
    // the reason for this is because of multitouch
    // we want to track the movement of this particular touch
    this.data = event.data;
    // this.alpha = 0.5;
    this.dragging = true;

}

function ondragend() {

    // set player rotation to none
    player.rotation = 0;
    // this.alpha = 1;
    this.dragging = false;
    // set the interaction data to null
    this.data = null;

}

function ondragmove() {

    if (this.dragging) {

        var newposition = this.data.getlocalposition(this.parent);
        var delta = 1;
        var dt = playermovespeed;
        var dt = 1.0 - math.exp(1.0 - dt, delta);
        var objectposition = this.data.getlocalposition(this);

        // use lerp to create distance between the pointer and the sprite
        if (math.abs(this.x - newposition.x) + math.abs(this.y - newposition.y) < 1) {
            this.x = newposition.x;
            this.y = newposition.y;
        } else {
            this.x = this.x + (newposition.x - this.x) * dt;
            this.y = this.y + (newposition.y - this.y) * dt;
        }

        // checks if the pointer is going left or right then
        // animate the player sprite going left or right
        if (objectposition.x < 0) player.rotation += -0.1;
        else if (objectposition.x > 0) player.rotation += 0.1;

    }

}