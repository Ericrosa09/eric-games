class windowmanager 
{
	#windows;
	#count;
	#id;
	#windata;
	#winshapechangecallback;
	#winchangecallback;
	
	constructor ()
	{
		let that = this;

		// event listener for when localstorage is changed from another window
		addeventlistener("storage", (event) => 
		{
			if (event.key == "windows")
			{
				let newwindows = json.parse(event.newvalue);
				let winchange = that.#didwindowschange(that.#windows, newwindows);

				that.#windows = newwindows;

				if (winchange)
				{
					if (that.#winchangecallback) that.#winchangecallback();
				}
			}
		});

		// event listener for when current window is about to ble closed
		window.addeventlistener('beforeunload', function (e) 
		{
			let index = that.getwindowindexfromid(that.#id);

			//remove this window from the list and update local storage
			that.#windows.splice(index, 1);
			that.updatewindowslocalstorage();
		});
	}

	// check if theres any changes to the window list
	#didwindowschange (pwins, nwins)
	{
		if (pwins.length != nwins.length)
		{
			return true;
		}
		else
		{
			let c = false;

			for (let i = 0; i < pwins.length; i++)
			{
				if (pwins[i].id != nwins[i].id) c = true;
			}

			return c;
		}
	}

	// initiate current window (add metadata for custom data to store with each window instance)
	init (metadata)
	{
		this.#windows = json.parse(localstorage.getitem("windows")) || [];
		this.#count= localstorage.getitem("count") || 0;
		this.#count++;

		this.#id = this.#count;
		let shape = this.getwinshape();
		this.#windata = {id: this.#id, shape: shape, metadata: metadata};
		this.#windows.push(this.#windata);

		localstorage.setitem("count", this.#count);
		this.updatewindowslocalstorage();
	}

	getwinshape ()
	{
		let shape = {x: window.screenleft, y: window.screentop, w: window.innerwidth, h: window.innerheight};
		return shape;
	}

	getwindowindexfromid (id)
	{
		let index = -1;

		for (let i = 0; i < this.#windows.length; i++)
		{
			if (this.#windows[i].id == id) index = i;
		}

		return index;
	}

	updatewindowslocalstorage ()
	{
		localstorage.setitem("windows", json.stringify(this.#windows));
	}

	update ()
	{
		//console.log(step);
		let winshape = this.getwinshape();

		//console.log(winshape.x, winshape.y);

		if (winshape.x != this.#windata.shape.x ||
			winshape.y != this.#windata.shape.y ||
			winshape.w != this.#windata.shape.w ||
			winshape.h != this.#windata.shape.h)
		{
			
			this.#windata.shape = winshape;

			let index = this.getwindowindexfromid(this.#id);
			this.#windows[index].shape = winshape;

			//console.log(windows);
			if (this.#winshapechangecallback) this.#winshapechangecallback();
			this.updatewindowslocalstorage();
		}
	}

	setwinshapechangecallback (callback)
	{
		this.#winshapechangecallback = callback;
	}

	setwinchangecallback (callback)
	{
		this.#winchangecallback = callback;
	}

	getwindows ()
	{
		return this.#windows;
	}

	getthiswindowdata ()
	{
		return this.#windata;
	}

	getthiswindowid ()
	{
		return this.#id;
	}
}

export default windowmanager;