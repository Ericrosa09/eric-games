var debugmode = false;

var states = object.freeze({
   splashscreen: 0,
   gamescreen: 1,
   scorescreen: 2
});

var currentstate;

var gravity = 0.25;
var velocity = 0;
var position = 180;
var rotation = 0;
var jump = -4.6;
var flyarea = $("#flyarea").height();

var score = 0;
var highscore = 0;

var pipeheight = 90;
var pipewidth = 52;
var pipes = new array();

var replayclickable = false;

//sounds
var volume = 30;
var soundjump = new buzz.sound("assets/sounds/sfx_wing.ogg");
var soundscore = new buzz.sound("assets/sounds/sfx_point.ogg");
var soundhit = new buzz.sound("assets/sounds/sfx_hit.ogg");
var sounddie = new buzz.sound("assets/sounds/sfx_die.ogg");
var soundswoosh = new buzz.sound("assets/sounds/sfx_swooshing.ogg");
buzz.all().setvolume(volume);

//loops
var loopgameloop;
var looppipeloop;

$(document).ready(function() {
   if(window.location.search == "?debug")
      debugmode = true;
   if(window.location.search == "?easy")
      pipeheight = 200;

   //get the highscore
   var savedscore = getcookie("highscore");
   if(savedscore != "")
      highscore = parseint(savedscore);

   //start with the splash screen
   showsplash();
});

function getcookie(cname)
{
   var name = cname + "=";
   var ca = document.cookie.split(';');
   for(var i=0; i<ca.length; i++)
   {
      var c = ca[i].trim();
      if (c.indexof(name)==0) return c.substring(name.length,c.length);
   }
   return "";
}

function setcookie(cname,cvalue,exdays)
{
   var d = new date();
   d.settime(d.gettime()+(exdays*24*60*60*1000));
   var expires = "expires="+d.togmtstring();
   document.cookie = cname + "=" + cvalue + "; " + expires;
}

function showsplash()
{
   currentstate = states.splashscreen;

   //set the defaults (again)
   velocity = 0;
   position = 180;
   rotation = 0;
   score = 0;

   //update the player in preparation for the next game
   $("#player").css({ y: 0, x: 0 });
   updateplayer($("#player"));

   soundswoosh.stop();
   soundswoosh.play();

   //clear out all the pipes if there are any
   $(".pipe").remove();
   pipes = new array();

   //make everything animated again
   $(".animated").css('animation-play-state', 'running');
   $(".animated").css('-webkit-animation-play-state', 'running');

   //fade in the splash
   $("#splash").transition({ opacity: 1 }, 2000, 'ease');
}

function startgame()
{
   currentstate = states.gamescreen;

   //fade out the splash
   $("#splash").stop();
   $("#splash").transition({ opacity: 0 }, 500, 'ease');

   //update the big score
   setbigscore();

   //debug mode?
   if(debugmode)
   {
      //show the bounding boxes
      $(".boundingbox").show();
   }

   //start up our loops
   var updaterate = 1000.0 / 60.0 ; //60 times a second
   loopgameloop = setinterval(gameloop, updaterate);
   looppipeloop = setinterval(updatepipes, 1400);

   //jump from the start!
   playerjump();
}

function updateplayer(player)
{
   //rotation
   rotation = math.min((velocity / 10) * 90, 90);

   //apply rotation and position
   $(player).css({ rotate: rotation, top: position });
}

function gameloop() {
   var player = $("#player");

   //update the player speed/position
   velocity += gravity;
   position += velocity;

   //update the player
   updateplayer(player);

   //create the bounding box
   var box = document.getelementbyid('player').getboundingclientrect();
   var origwidth = 34.0;
   var origheight = 24.0;

   var boxwidth = origwidth - (math.sin(math.abs(rotation) / 90) * 8);
   var boxheight = (origheight + box.height) / 2;
   var boxleft = ((box.width - boxwidth) / 2) + box.left;
   var boxtop = ((box.height - boxheight) / 2) + box.top;
   var boxright = boxleft + boxwidth;
   var boxbottom = boxtop + boxheight;

   //if we're in debug mode, draw the bounding box
   if(debugmode)
   {
      var boundingbox = $("#playerbox");
      boundingbox.css('left', boxleft);
      boundingbox.css('top', boxtop);
      boundingbox.css('height', boxheight);
      boundingbox.css('width', boxwidth);
   }

   //did we hit the ground?
   if(box.bottom >= $("#land").offset().top)
   {
      playerdead();
      return;
   }

   //have they tried to escape through the ceiling? :o
   var ceiling = $("#ceiling");
   if(boxtop <= (ceiling.offset().top + ceiling.height()))
      position = 0;

   //we can't go any further without a pipe
   if(pipes[0] == null)
      return;

   //determine the bounding box of the next pipes inner area
   var nextpipe = pipes[0];
   var nextpipeupper = nextpipe.children(".pipe_upper");

   var pipetop = nextpipeupper.offset().top + nextpipeupper.height();
   var pipeleft = nextpipeupper.offset().left - 2; // for some reason it starts at the inner pipes offset, not the outer pipes.
   var piperight = pipeleft + pipewidth;
   var pipebottom = pipetop + pipeheight;

   if(debugmode)
   {
      var boundingbox = $("#pipebox");
      boundingbox.css('left', pipeleft);
      boundingbox.css('top', pipetop);
      boundingbox.css('height', pipeheight);
      boundingbox.css('width', pipewidth);
   }

   //have we gotten inside the pipe yet?
   if(boxright > pipeleft)
   {
      //we're within the pipe, have we passed between upper and lower pipes?
      if(boxtop > pipetop && boxbottom < pipebottom)
      {
         //yeah! we're within bounds

      }
      else
      {
         //no! we touched the pipe
         playerdead();
         return;
      }
   }


   //have we passed the imminent danger?
   if(boxleft > piperight)
   {
      //yes, remove it
      pipes.splice(0, 1);

      //and score a point
      playerscore();
   }
}

//handle space bar
$(document).keydown(function(e){
   //space bar!
   if(e.keycode == 32)
   {
      //in scorescreen, hitting space should click the "replay" button. else it's just a regular spacebar hit
      if(currentstate == states.scorescreen)
         $("#replay").click();
      else
         screenclick();
   }
});

//handle mouse down or touch start
if("ontouchstart" in window)
   $(document).on("touchstart", screenclick);
else
   $(document).on("mousedown", screenclick);

function screenclick()
{
   if(currentstate == states.gamescreen)
   {
      playerjump();
   }
   else if(currentstate == states.splashscreen)
   {
      startgame();
   }
}

function playerjump()
{
   velocity = jump;
   //play jump sound
   soundjump.stop();
   soundjump.play();
}

function setbigscore(erase)
{
   var elemscore = $("#bigscore");
   elemscore.empty();

   if(erase)
      return;

   var digits = score.tostring().split('');
   for(var i = 0; i < digits.length; i++)
      elemscore.append("<img src='assets/font_big_" + digits[i] + ".png' alt='" + digits[i] + "'>");
}

function setsmallscore()
{
   var elemscore = $("#currentscore");
   elemscore.empty();

   var digits = score.tostring().split('');
   for(var i = 0; i < digits.length; i++)
      elemscore.append("<img src='assets/font_small_" + digits[i] + ".png' alt='" + digits[i] + "'>");
}

function sethighscore()
{
   var elemscore = $("#highscore");
   elemscore.empty();

   var digits = highscore.tostring().split('');
   for(var i = 0; i < digits.length; i++)
      elemscore.append("<img src='assets/font_small_" + digits[i] + ".png' alt='" + digits[i] + "'>");
}

function setmedal()
{
   var elemmedal = $("#medal");
   elemmedal.empty();

   if(score < 10)
      //signal that no medal has been won
      return false;

   if(score >= 10)
      medal = "bronze";
   if(score >= 20)
      medal = "silver";
   if(score >= 30)
      medal = "gold";
   if(score >= 40)
      medal = "platinum";

   elemmedal.append('<img src="assets/medal_' + medal +'.png" alt="' + medal +'">');

   //signal that a medal has been won
   return true;
}

function playerdead()
{
   //stop animating everything!
   $(".animated").css('animation-play-state', 'paused');
   $(".animated").css('-webkit-animation-play-state', 'paused');

   //drop the bird to the floor
   var playerbottom = $("#player").position().top + $("#player").width(); //we use width because he'll be rotated 90 deg
   var floor = flyarea;
   var movey = math.max(0, floor - playerbottom);
   $("#player").transition({ y: movey + 'px', rotate: 90}, 1000, 'easeinoutcubic');

   //it's time to change states. as of now we're considered scorescreen to disable left click/flying
   currentstate = states.scorescreen;

   //destroy our gameloops
   clearinterval(loopgameloop);
   clearinterval(looppipeloop);
   loopgameloop = null;
   looppipeloop = null;

   //mobile browsers don't support buzz bindonce event
   if(isincompatible.any())
   {
      //skip right to showing score
      showscore();
   }
   else
   {
      //play the hit sound (then the dead sound) and then show score
      soundhit.play().bindonce("ended", function() {
         sounddie.play().bindonce("ended", function() {
            showscore();
         });
      });
   }
}

function showscore()
{
   //unhide us
   $("#scoreboard").css("display", "block");

   //remove the big score
   setbigscore(true);

   //have they beaten their high score?
   if(score > highscore)
   {
      //yeah!
      highscore = score;
      //save it!
      setcookie("highscore", highscore, 999);
   }

   //update the scoreboard
   setsmallscore();
   sethighscore();
   var wonmedal = setmedal();

   //swoosh!
   soundswoosh.stop();
   soundswoosh.play();

   //show the scoreboard
   $("#scoreboard").css({ y: '40px', opacity: 0 }); //move it down so we can slide it up
   $("#replay").css({ y: '40px', opacity: 0 });
   $("#scoreboard").transition({ y: '0px', opacity: 1}, 600, 'ease', function() {
      //when the animation is done, animate in the replay button and swoosh!
      soundswoosh.stop();
      soundswoosh.play();
      $("#replay").transition({ y: '0px', opacity: 1}, 600, 'ease');

      //also animate in the medal! woo!
      if(wonmedal)
      {
         $("#medal").css({ scale: 2, opacity: 0 });
         $("#medal").transition({ opacity: 1, scale: 1 }, 1200, 'ease');
      }
   });

   //make the replay button clickable
   replayclickable = true;
}

$("#replay").click(function() {
   //make sure we can only click once
   if(!replayclickable)
      return;
   else
      replayclickable = false;
   //swoosh!
   soundswoosh.stop();
   soundswoosh.play();

   //fade out the scoreboard
   $("#scoreboard").transition({ y: '-40px', opacity: 0}, 1000, 'ease', function() {
      //when that's done, display us back to nothing
      $("#scoreboard").css("display", "none");

      //start the game over!
      showsplash();
   });
});

function playerscore()
{
   score += 1;
   //play score sound
   soundscore.stop();
   soundscore.play();
   setbigscore();
}

function updatepipes()
{
   //do any pipes need removal?
   $(".pipe").filter(function() { return $(this).position().left <= -100; }).remove()

   //add a new pipe (top height + bottom height  + pipeheight == flyarea) and put it in our tracker
   var padding = 80;
   var constraint = flyarea - pipeheight - (padding * 2); //double padding (for top and bottom)
   var topheight = math.floor((math.random()*constraint) + padding); //add lower padding
   var bottomheight = (flyarea - pipeheight) - topheight;
   var newpipe = $('<div class="pipe animated"><div class="pipe_upper" style="height: ' + topheight + 'px;"></div><div class="pipe_lower" style="height: ' + bottomheight + 'px;"></div></div>');
   $("#flyarea").append(newpipe);
   pipes.push(newpipe);
}

var isincompatible = {
   android: function() {
   return navigator.useragent.match(/android/i);
   },
   blackberry: function() {
   return navigator.useragent.match(/blackberry/i);
   },
   ios: function() {
   return navigator.useragent.match(/iphone|ipad|ipod/i);
   },
   opera: function() {
   return navigator.useragent.match(/opera mini/i);
   },
   safari: function() {
   return (navigator.useragent.match(/os x.*safari/) && ! navigator.useragent.match(/chrome/));
   },
   windows: function() {
   return navigator.useragent.match(/iemobile/i);
   },
   any: function() {
   return (isincompatible.android() || isincompatible.blackberry() || isincompatible.ios() || isincompatible.opera() || isincompatible.safari() || isincompatible.windows());
   }
};