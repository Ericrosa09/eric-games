var maxparticlecount = 200; //set max confetti count
var particlespeed = -4; //set the particle animation speed
var startconfetti; //call to start confetti animation
var stopconfetti; //call to stop adding confetti
var toggleconfetti; //call to start or stop the confetti animation depending on whether it's already running
var removeconfetti; //call to stop the confetti animation and remove all confetti immediately

(function() {
	startconfetti = startconfettiinner;
	stopconfetti = stopconfettiinner;
	toggleconfetti = toggleconfettiinner;
	removeconfetti = removeconfettiinner;
	var colors = ["dodgerblue", "olivedrab", "gold", "pink", "slateblue", "lightblue", "violet", "palegreen", "steelblue", "sandybrown", "chocolate", "crimson"]
	var streamingconfetti = false;
	var animationtimer = null;
	var particles = [];
	var waveangle = 0;
	
	function resetparticle(particle, width, height) {
		particle.color = colors[(math.random() * colors.length) | 0];
		particle.x = math.random() * width;
		particle.y = math.random() * height - height;
		particle.diameter = math.random() * 10 + 5;
		particle.tilt = math.random() * 10 - 10;
		particle.tiltangleincrement = math.random() * 0.07 + 0.05;
		particle.tiltangle = 0;
		return particle;
	}

	function startconfettiinner() {
		var width = window.innerwidth;
		var height = window.innerheight;
		window.requestanimframe = (function() {
			return window.requestanimationframe ||
				window.webkitrequestanimationframe ||
				window.mozrequestanimationframe ||
				window.orequestanimationframe ||
				window.msrequestanimationframe ||
				function (callback) {
					return window.settimeout(callback, 16.6666667);
				};
		})();
		var canvas = document.getelementbyid("confetti-canvas");
		if (canvas === null) {
			canvas = document.createelement("canvas");
			canvas.setattribute("id", "confetti-canvas");
			canvas.setattribute("style", " display:block;z-index:-1;pointer-events:none");
			document.getelementbyid('overlay').appendchild(canvas);
			canvas.width = width;
			canvas.height = height;
			window.addeventlistener("resize", function() {
				canvas.width = window.innerwidth;
				canvas.height = window.innerheight;
			}, true);
		}
		var context = canvas.getcontext("2d");
		while (particles.length < maxparticlecount)
			particles.push(resetparticle({}, width, height));
		streamingconfetti = true;
		if (animationtimer === null) {
			(function runanimation() {
				context.clearrect(0, 0, window.innerwidth, window.innerheight);
				if (particles.length === 0)
					animationtimer = null;
				else {
					updateparticles();
					drawparticles(context);
					animationtimer = requestanimframe(runanimation);
				}
			})();
		}
	}

	function stopconfettiinner() {
		streamingconfetti = false;
	}

	function removeconfettiinner() {
		stopconfetti();
		particles = [];
	}

	function toggleconfettiinner() {
		if (streamingconfetti)
			stopconfettiinner();
		else
			startconfettiinner();
	}

	function drawparticles(context) {
		var particle;
		var x;
		for (var i = 0; i < particles.length; i++) {
			particle = particles[i];
			context.beginpath();
			context.linewidth = particle.diameter;
			context.strokestyle = particle.color;
			x = particle.x + particle.tilt;
			context.moveto(x + particle.diameter / 2, particle.y);
			context.lineto(x, particle.y + particle.tilt + particle.diameter / 2);
			context.stroke();
		}
	}

	function updateparticles() {
		var width = window.innerwidth;
		var height = window.innerheight;
		var particle;
		waveangle += 0.01;
		for (var i = 0; i < particles.length; i++) {
			particle = particles[i];
			if (!streamingconfetti && particle.y < -15)
				particle.y = height + 100;
			else {
				particle.tiltangle += particle.tiltangleincrement;
				particle.x += math.sin(waveangle);
				particle.y += (math.cos(waveangle) + particle.diameter + particlespeed) * 0.5;
				particle.tilt = math.sin(particle.tiltangle) * 15;
			}
			if (particle.x > width + 20 || particle.x < -20 || particle.y > height) {
				if (streamingconfetti && particles.length <= maxparticlecount)
					resetparticle(particle, width, height);
				else {
					particles.splice(i, 1);
					i--;
				}
			}
		}
	}
})();
var start = false
if(start===true) {
startconfetti();
}


var maxsnowflakecount = 200; // set max snowflake count
var snowflakespeed = 2; // set the snowflake fall speed
var startsnowfall; // call to start snowfall animation
var stopsnowfall; // call to stop adding snowflakes
var togglesnowfall; // call to start or stop the snowfall animation depending on whether it's already running
var removesnowfall; // call to stop the snowfall animation and remove all snowflakes immediately

(function() {
  startsnowfall = startsnowfallinner;
  stopsnowfall = stopsnowfallinner;
  togglesnowfall = togglesnowfallinner;
  removesnowfall = removesnowfallinner;

  var colors = ["#ffffff"]; // snowflakes will be white

  var streamingsnowfall = false;
  var animationtimer = null;
  var snowflakes = [];

  function resetsnowflake(snowflake, width, height) {
	snowflake.color = colors[0]; // white snowflake color
	snowflake.x = math.random() * width;
	snowflake.y = math.random() * height - height;
	snowflake.diameter = math.random() * 5 + 2; // adjust size of snowflakes
	return snowflake;
  }

  function startsnowfallinner() {
	var width = window.innerwidth;
	var height = window.innerheight;

	window.requestanimframe = (function() {
	  return window.requestanimationframe ||
		window.webkitrequestanimationframe ||
		window.mozrequestanimationframe ||
		window.orequestanimationframe ||
		window.msrequestanimationframe ||
		function (callback) {
		  return window.settimeout(callback, 16.6666667);
		};
	})();

	var canvas = document.getelementbyid("snow-canvas");

	if (canvas === null) {
	  canvas = document.createelement("canvas");
	  canvas.setattribute("id", "confetti-canvas");
	  canvas.setattribute("style", " display:block;z-index:-1;pointer-events:none");
	  document.getelementbyid('overlay').appendchild(canvas);
	  canvas.width = width;
	  canvas.height = height;

	  window.addeventlistener("resize", function() {
		canvas.width = window.innerwidth;
		canvas.height = window.innerheight;
	  }, true);
	}

	var context = canvas.getcontext("2d");

	while (snowflakes.length < maxsnowflakecount)
	  snowflakes.push(resetsnowflake({}, width, height));

	streamingsnowfall = true;

	if (animationtimer === null) {
	  (function runanimation() {
		context.clearrect(0, 0, window.innerwidth, window.innerheight);

		if (snowflakes.length === 0)
		  animationtimer = null;
		else {
		  updatesnowflakes();
		  drawsnowflakes(context);
		  animationtimer = requestanimframe(runanimation);
		}
	  })();
	}
  }

  function stopsnowfallinner() {
	streamingsnowfall = false;
  }

  function removesnowfallinner() {
	stopsnowfall();
	snowflakes = [];
  }

  function togglesnowfallinner() {
	if (streamingsnowfall)
	  stopsnowfallinner();
	else
	  startsnowfallinner();
  }

  function drawsnowflakes(context) {
	var snowflake;
	for (var i = 0; i < snowflakes.length; i++) {
	  snowflake = snowflakes[i];
	  context.beginpath();
	  context.arc(snowflake.x, snowflake.y, snowflake.diameter, 0, math.pi * 2, false);
	  context.fillstyle = snowflake.color;
	  context.fill();
	}
  }

  function updatesnowflakes() {
	var width = window.innerwidth;
	var height = window.innerheight;
	var snowflake;

	for (var i = 0; i < snowflakes.length; i++) {
	  snowflake = snowflakes[i];

	  if (!streamingsnowfall && snowflake.y < -15)
		snowflake.y = height + 100;
	  else {
		snowflake.y += snowflakespeed;
	  }

	  if (snowflake.x > width || snowflake.x < 0 || snowflake.y > height) {
		if (streamingsnowfall && snowflakes.length <= maxsnowflakecount)
		  resetsnowflake(snowflake, width, height);
		else {
		  snowflakes.splice(i, 1);
		  i--;
		}
	  }
	}
  }
})();

var start2 = true;

if (start2 === true) {
  startsnowfall();
}