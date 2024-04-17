import windowmanager from './windowmanager.js'



const t = three;
let camera, scene, renderer, world;
let near, far;
let pixr = window.devicepixelratio ? window.devicepixelratio : 1;
let cubes = [];
let sceneoffsettarget = {x: 0, y: 0};
let sceneoffset = {x: 0, y: 0};

let today = new date();
today.sethours(0);
today.setminutes(0);
today.setseconds(0);
today.setmilliseconds(0);
today = today.gettime();

let internaltime = gettime();
let windowmanager;
let initialized = false;

// get time in seconds since beginning of the day (so that all windows use the same time)
function gettime ()
{
	return (new date().gettime() - today) / 1000.0;
}


if (new urlsearchparams(window.location.search).get("clear"))
{
	localstorage.clear();
}
else
{	
	// this code is essential to circumvent that some browsers preload the content of some pages before you actually hit the url
	document.addeventlistener("visibilitychange", () => 
	{
		if (document.visibilitystate != 'hidden' && !initialized)
		{
			init();
		}
	});

	window.onload = () => {
		if (document.visibilitystate != 'hidden')
		{
			init();
		}
	};

	function init ()
	{
		initialized = true;

		// add a short timeout because window.offsetx reports wrong values before a short period 
		settimeout(() => {
			setupscene();
			setupwindowmanager();
			resize();
			updatewindowshape(false);
			render();
			window.addeventlistener('resize', resize);
		}, 500)	
	}

	function setupscene ()
	{
		camera = new t.orthographiccamera(0, 0, window.innerwidth, window.innerheight, -10000, 10000);
		
		camera.position.z = 2.5;
		near = camera.position.z - .5;
		far = camera.position.z + 0.5;

		scene = new t.scene();
		scene.background = new t.color(0.0);
		scene.add( camera );

		renderer = new t.webglrenderer({antialias: true, depthbuffer: true});
		renderer.setpixelratio(pixr);
	    
	  	world = new t.object3d();
		scene.add(world);

		renderer.domelement.setattribute("id", "scene");
		document.body.appendchild( renderer.domelement );
	}

	function setupwindowmanager ()
	{
		windowmanager = new windowmanager();
		windowmanager.setwinshapechangecallback(updatewindowshape);
		windowmanager.setwinchangecallback(windowsupdated);

		// here you can add your custom metadata to each windows instance
		let metadata = {foo: "bar"};

		// this will init the windowmanager and add this window to the centralised pool of windows
		windowmanager.init(metadata);

		// call update windows initially (it will later be called by the win change callback)
		windowsupdated();
	}

	function windowsupdated ()
	{
		updatenumberofcubes();
	}

	function updatenumberofcubes ()
	{
		let wins = windowmanager.getwindows();

		// remove all cubes
		cubes.foreach((c) => {
			world.remove(c);
		})

		cubes = [];

		// add new cubes based on the current window setup
		for (let i = 0; i < wins.length; i++)
		{
			let win = wins[i];

			let c = new t.color();
			c.sethsl(i * .1, 1.0, .5);

			let s = 100 + i * 50;
			let cube = new t.mesh(new t.boxgeometry(s, s, s), new t.meshbasicmaterial({color: c , wireframe: true}));
			cube.position.x = win.shape.x + (win.shape.w * .5);
			cube.position.y = win.shape.y + (win.shape.h * .5);

			world.add(cube);
			cubes.push(cube);
		}
	}

	function updatewindowshape (easing = true)
	{
		// storing the actual offset in a proxy that we update against in the render function
		sceneoffsettarget = {x: -window.screenx, y: -window.screeny};
		if (!easing) sceneoffset = sceneoffsettarget;
	}


	function render ()
	{
		let t = gettime();

		windowmanager.update();


		// calculate the new position based on the delta between current offset and new offset times a falloff value (to create the nice smoothing effect)
		let falloff = .05;
		sceneoffset.x = sceneoffset.x + ((sceneoffsettarget.x - sceneoffset.x) * falloff);
		sceneoffset.y = sceneoffset.y + ((sceneoffsettarget.y - sceneoffset.y) * falloff);

		// set the world position to the offset
		world.position.x = sceneoffset.x;
		world.position.y = sceneoffset.y;

		let wins = windowmanager.getwindows();


		// loop through all our cubes and update their positions based on current window positions
		for (let i = 0; i < cubes.length; i++)
		{
			let cube = cubes[i];
			let win = wins[i];
			let _t = t;// + i * .2;

			let postarget = {x: win.shape.x + (win.shape.w * .5), y: win.shape.y + (win.shape.h * .5)}

			cube.position.x = cube.position.x + (postarget.x - cube.position.x) * falloff;
			cube.position.y = cube.position.y + (postarget.y - cube.position.y) * falloff;
			cube.rotation.x = _t * .5;
			cube.rotation.y = _t * .3;
		};

		renderer.render(scene, camera);
		requestanimationframe(render);
	}


	// resize the renderer to fit the window size
	function resize ()
	{
		let width = window.innerwidth;
		let height = window.innerheight
		
		camera = new t.orthographiccamera(0, width, 0, height, -10000, 10000);
		camera.updateprojectionmatrix();
		renderer.setsize( width, height );
	}
}