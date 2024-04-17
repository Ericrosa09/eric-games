
// retrieves a file via xmlhttprequest, calls fnccallback when done or fncerror on error.

function xhr(strurl, fnccallback /*, argumenttopass1, argumenttopass2, etc. */) {
	var ohttp, argsarr = array.prototype.slice.call(arguments, 2);
	if (window.xmlhttprequest) { ohttp = new xmlhttprequest(); }
	else if (window.activexobject) { ohttp = new activexobject("microsoft.xmlhttp"); }
	if (ohttp) {
		if (fnccallback) {
			if (typeof(ohttp.onload) !== "undefined")
				ohttp.onload = function() {
					fnccallback.apply(ohttp, argsarr);
					ohttp = null;
				};
			else {
				ohttp.onreadystatechange = function() {
					if (ohttp.readystate === 4) {
						fnccallback.apply(ohttp, argsarr);
						ohttp = null;
					}
				};
			}
		}
		ohttp.open("get", strurl, true);
  		ohttp.setrequestheader("content-type", "text/plain");
		ohttp.setrequestheader("if-modified-since", "sat, 1 jan 2000 00:00:00 gmt");
		ohttp.send(null);
	}
}

function setattribs() { for (var iattr = 0; iattr < arguments.length; iattr++) { this[arguments[iattr][0]] = arguments[iattr][1]; } return(this); }
function setstyles() { for (var ipropr = 0; ipropr < arguments.length; ipropr++) { this.style[arguments[ipropr][0]] = arguments[ipropr][1]; } return(this); }
