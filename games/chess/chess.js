/**
* @package html chess
* @version 1.0 revision #8
* @author stefano gioffre', see readme.txt
* @copyleft 2010 stefano gioffre'
* see copyright.txt for copyright notices and details.
* @license gnu/gpl version 3, see license.txt
* html chess is free software; you can redistribute it and/or
* modify it under the terms of the gnu general public license
* as published by the free software foundation; version 3 of the license.
*
* http://htmlchess.sourceforge.net/
*
* the chess engine is written by oscar toledo (http://nanochess.110mb.com/),
* the 3d canvas pieces and the 3d canvas renderer are written by jacob
* seidelin (http://www.nihilogic.dk/).
*/

var chess = (function() {
	// 3d
	var osolidboard, busekeyboard = false, graphicsstatus = 0,

	// 2d
	oboardtable = null, acoords, aflatsquares, slstsqcolr,

	// both visualizations
	oboardsbox, bhumanside = true,

	// resizing vars
	ndeskwidth = 512, ndeskheight = 512, nflatbvmargin = 12, // theese values are modificable
	nflatboardside = ndeskheight - nflatbvmargin, npagex, npagey, iboardsboxx, iboardsboxy, ndscrsx, ndscrsy, ofilm, nminwidth = nminheight = 512,

	// history motion picture
	nmotionid, bmotion = false, bboundlock = false, nframerate = 1000,

	// dom
	opgnbtn, omovesselect, oinfobox, octrlform, ontfarea = null, ontfclsall = null, binfobox = false, aclosecalls = [], intfs = 0, rdeniedtagchrs = /(^\d)|\w/g, salgboxempty = "digit your move...", bctrlisdown = false,

	// system
	smoveslist, spgnheader, flaghumanblack, bready = true, bai = true, bcheck = false, bgamenotover = true, laststart = 0, lastend = 0, ihistpointr = -1, ahistory = [], kings = [0, 0], iround = 1,
	ogameinfo = {}, onewinfo = {}, etc = { // do not change theese values!!
		aboard: [],
		athreats: [],
		npromotion: 0,
		bflatview: false,
		bsolidview: false,
		bblackside: false,
		oflatvwarea: null,
		osolidvwarea: null,
		apieceslab: null,
		bkeyctrl: true,
		i3dwidth: ndeskwidth,
		i3dheight: ndeskheight,
		lookat: function(ngetposx, ngetposy) { return(this.aboard[ngetposy * 10 + ngetposx + 21]); },
		isvalidmove: function(nposx, nposy, ntargetx, ntargety) {
			var startsq = nposy * 10 + nposx + 21, npiece = this.aboard[startsq];
			if (npiece === 0) { return(true); }
			var endsq = ntargety * 10 + ntargetx + 21, ntarget = this.aboard[endsq], npiecetype = npiece & 7, flagpccolor = npiece & 8, bhasmoved = boolean(npiece & 16 ^ 16), flagtgcolor = ntarget & 8, nway = 4 - flagpccolor >> 2, ndiffx = ntargetx - nposx, ndiffy = ntargety - nposy;
			switch (npiecetype) {
				case 1: // pawn
					if (((ndiffy | 7) - 3) >> 2 !== nway) { return(false); }
					if (ndiffx === 0) {
						if ((ndiffy + 1 | 2) !== 2 && (ndiffy + 2 | 4) !== 4) { return(false); }
						if (ntarget > 0) { return(false); }
						if (ntargety === nposy + (2 * nway)) {
							if (bhasmoved) { return(false); }
							if (this.lookat(ntargetx, ntargety - nway) > 0) { return(false); }
						}
					} else if ((ndiffx + 1 | 2) === 2) {
						if (ndiffy !== nway) { return(false); }
						if ((ntarget < 1 || flagtgcolor === flagpccolor) && (/* not en passant: */ nposy !== 7 + nway >> 1 || /* if our pawn is not on the opening, or if it is but... */ npawnstride % 10 - 1 !== ntargetx /* ...not near him another pawn has moved for first time. */)) { return(false); }
					} else { return(false); }
					break;
				case 3: // knight
					if (((ndiffy + 1 | 2) - 2 | (ndiffx + 2 | 4) - 2) !== 2 && ((ndiffy + 2 | 4) - 2 | (ndiffx + 1 | 2) - 2) !== 2) { return(false); }
					if (ntarget > 0 && flagtgcolor === flagpccolor) { return(false); }
					break;
				case 6: // queen
					if (ntargety !== nposy && ntargetx !== nposx && math.abs(ndiffx) !== math.abs(ndiffy)) { return(false); }
					break;
				case 5: // rook
					if (ntargety !== nposy && ntargetx !== nposx) { return(false); }
					break;
				case 4: // bishop
					if (math.abs(ndiffx) !== math.abs(ndiffy)) { return(false); }
					break;
				case 2: // king
					var ourrook;
					if ((ndiffy === 0 || (ndiffy + 1 | 2) === 2) && (ndiffx === 0 || (ndiffx + 1 | 2) === 2)) {
						if (ntarget > 0 && flagtgcolor === flagpccolor) { return(false); }
					} else if (ourrook = this.lookat(30 - ndiffx >> 2 & 7, ntargety), (ndiffx + 2 | 4) === 4 && ndiffy === 0 && !bcheck && !bhasmoved && ourrook > 0 && boolean(ourrook & 16)) { // castling
						for (var passx = ndiffx * 3 + 14 >> 2; passx < ndiffx * 3 + 22 >> 2; passx++) { if (this.lookat(passx, ntargety) > 0 || isthreatened(passx, ntargety, ntargety / 7 << 3 ^ 1)) { return(false); } }
						if (ndiffx + 2 === 0 && this.aboard[ntargety * 10 + 22] > 0) { return(false); }
					} else { return(false); }
					break;
			}
			if (npiecetype === 5 || npiecetype === 6) {
				if (ntargety === nposy) {
					if (nposx < ntargetx) {
						for (var iorthogx = nposx + 1; iorthogx < ntargetx; iorthogx++) { if (this.lookat(iorthogx, ntargety) > 0) { return(false); } }
					} else {
						for (var iorthogx = nposx - 1; iorthogx > ntargetx; iorthogx--) { if (this.lookat(iorthogx, ntargety) > 0) { return(false); } }
					}
				}
				if (ntargetx === nposx) {
					if (nposy < ntargety) {
						for (var iorthogy = nposy + 1; iorthogy < ntargety; iorthogy++) { if (this.lookat(ntargetx, iorthogy) > 0) { return(false); } }
					} else {
						for (var iorthogy = nposy - 1; iorthogy > ntargety; iorthogy--) { if (this.lookat(ntargetx, iorthogy) > 0) { return(false); } }
					}
				}
				if (ntarget > 0 && flagtgcolor === flagpccolor) { return(false); }
			}
			if (npiecetype === 4 || npiecetype === 6) {
				if (ntargety > nposy) {
					var iobliquey = nposy + 1;
					if (nposx < ntargetx) {
						for (var iobliquex = nposx + 1; iobliquex < ntargetx; iobliquex++) {
							if (this.lookat(iobliquex, iobliquey) > 0) { return(false); }
							iobliquey++;
						}
					} else {
						for (var iobliquex = nposx - 1; iobliquex > ntargetx; iobliquex--) {
							if (this.lookat(iobliquex, iobliquey) > 0) { return(false); }
							iobliquey++;
						}
					}
				}
				if (ntargety < nposy) {
					var iobliquey = nposy - 1;
					if (nposx < ntargetx) {
						for (var iobliquex = nposx + 1; iobliquex < ntargetx; iobliquex++) {
							if (this.lookat(iobliquex, iobliquey) > 0) { return(false); }
							iobliquey--;
						}
					} else {
						for (var iobliquex = nposx - 1; iobliquex > ntargetx; iobliquex--) {
							if (this.lookat(iobliquex, iobliquey) > 0) { return(false); }
							iobliquey--;
						}
					}
				}
				if (ntarget > 0 && flagtgcolor === flagpccolor) { return(false); }
			}
			/* although it might seem impossible that the target is the opponent's king, this condition is needed for certain hypothesis. */
			if (ntarget + 6 & 7) {
				var bkingincheck = false, oking = npiecetype === 2 ? endsq : kings[flagpccolor >> 3];
				this.aboard[startsq] = 0;
				this.aboard[endsq] = npiece;
				if (isthreatened(oking % 10 - 1, (oking - oking % 10) / 10 - 2, flagpccolor ^ 8)) { bkingincheck = true; }
				this.aboard[startsq] = npiece;
				this.aboard[endsq] = ntarget;
				if (bkingincheck) { return(false); }
			}
			return(true);
		},
		makeselection: function(nsquareid, bfromsolid) {
			if (!bready) { return; }
			fourbtslastpc = (etc.aboard[nsquareid] ^ flagwhomoved) & 15;
			if (fourbtslastpc > 8) {
				if (etc.bsolidview) { osolidboard.selectpiece(nsquareid, true, bfromsolid); }
				if (etc.bflatview) {
					if (nfrstfocus) { squarefocus(nfrstfocus, false); }
					if (!bfromsolid) { squarefocus(nsquareid, true); }
				}
				nfrstfocus = nsquareid;
			}
			else if (nfrstfocus && fourbtslastpc < 9) {
				if (ihistpointr + 1 < ahistory.length && etc.isvalidmove(nfrstfocus % 10 - 1, (nfrstfocus - nfrstfocus % 10) / 10 - 2, nsquareid % 10 - 1, (nsquareid - nsquareid % 10) / 10 - 2)) {
					if (confirm("moving now all subsequent moves will be lost. are you sure?")) { trimhistory(); }
					else { return; }
				}
				nscndfocus = nsquareid;
				fourbtslastpc = etc.aboard[nfrstfocus] & 15;
				if ((fourbtslastpc & 7) === 1 & (nscndfocus < 29 | nscndfocus > 90)) { fourbtslastpc = 14 - etc.npromotion ^ flagwhomoved; }
				consider(0, 0, 0, 21, npawnstride, 1);
				if (etc.bsolidview) { osolidboard.selectpiece(nsquareid, false, bfromsolid); }
				if (etc.bflatview) {
					squarefocus(nfrstfocus, false);
					writeflatpieces();
				}
				if (bai && flagwhomoved === flaghumanblack && fourbtslastpc - flaghumanblack < 9) {
					bready = false;
					window.settimeout(enginemove, 250);
				}
			}
		}
	};

	function newpgnheader() {
		var sopp = bai ? "htmlchess" : "?";
		for (var ioldkey in ogameinfo) { delete ogameinfo[ioldkey]; }
		ogameinfo.event = "no name match";
		ogameinfo.site = document.domain || "?";
		ogameinfo.date = (new date()).tolocaledatestring();
		ogameinfo.round = bai ? string(iround++) : "1";
		if (flaghumanblack) { ogameinfo.white = sopp; ogameinfo.black = "human"; }
		else { ogameinfo.white = "human"; ogameinfo.black = sopp; }
		ogameinfo.result = "*";
		updatepgnheader();
	}

	function isthreatened(npiecex, npiecey, flagfromcolor) {
		var imenacing, bisthrtnd = false;
		for (var imenacey = 0; imenacey < 8; imenacey++) {
			for (var imenacex = 0; imenacex < 8; imenacex++) {
				imenacing = etc.aboard[imenacey * 10 + imenacex + 21];
				if (imenacing > 0 && (imenacing & 8) === flagfromcolor && etc.isvalidmove(imenacex, imenacey, npiecex, npiecey)) { bisthrtnd = true; break; }
			}
			if (bisthrtnd) { break; }
		}
		return(bisthrtnd);
	}

	function getincheckpieces() {
		var iexamx, iexamy, iexampc, bnomoremoves = true, myking = kings[flagwhomoved >> 3 ^ 1];
		bcheck = isthreatened(myking % 10 - 1, (myking - myking % 10) / 10 - 2, flagwhomoved);
		etc.athreats.splice(0);
		for (var iexamsq = 21; iexamsq < 99; iexamsq += iexamsq % 10 < 8 ? 1 : 3) {
			iexamx = iexamsq % 10 - 1;
			iexamy = (iexamsq - iexamsq % 10) / 10 - 2;
			iexampc = etc.aboard[iexamsq];
			if (bnomoremoves && iexampc > 0 && (iexampc & 8 ^ 8) === flagwhomoved) {
				for (var iwaysq = 21; iwaysq < 99; iwaysq += iwaysq % 10 < 8 ? 1 : 3) {
					if (etc.isvalidmove(iexamx, iexamy, iwaysq % 10 - 1, (iwaysq - iwaysq % 10) / 10 - 2)) { bnomoremoves = false; break; }
				}
			}
			if ((!bcheck || (iexampc & 7) === 2) && iexampc > 0 && (iexampc & 8 ^ 8) === flagwhomoved && isthreatened(iexamx, iexamy, flagwhomoved)) { etc.athreats.push(iexamsq); }
		}
		if (bnomoremoves) {
			if (bcheck) {
				var swinner = flagwhomoved ? "black" : "white";
				ogameinfo.result = flagwhomoved ? "0-1" : "1-0";
				sendmsg((ogameinfo.hasownproperty(swinner) ? ogameinfo[swinner] : swinner) + " wins.", "the king is threatened and can not move (<em>checkmate<\/em>).", 10000);
				smoveslist = smoveslist.replace(/\+$/, "#");
			} else {
				ogameinfo.result = "1/2-1/2";
				sendmsg("drawn game", "the opponent can not move (<em>draw<\/em>).", 10000);
			}
			bgamenotover = false;
		} else if (ogameinfo.hasownproperty("result") && ogameinfo.result.search(/^(\d+\-\d+)$/) > -1 && ihistpointr === ahistory.length - 1) {
			var swinner = ogameinfo.result.valueof() === "1-0" ? "white" : "black";
			sendmsg((ogameinfo.hasownproperty(swinner) ? ogameinfo[swinner] : swinner) + " wins.", "the opponent has withdrawn.", 10000);
			bgamenotover = false;
		} else { ogameinfo.result = "*"; bgamenotover = true; }
	}

	function getpcbyparams(nparamid, nwhere) {
		var npieceid = aparams[nparamid];
		if ((npieceid & 7) === 2) { kings[nparamid >> 3 & 1] = nwhere; }
		return(npieceid);
	}

	function resetboard() {
		var iparamid = 0;
		nfrstfocus = fourbtslastpc = npawnstride = laststart = lastend = 0; flagwhomoved = 8; ihistpointr = -1;
		ahistory.splice(0);
		etc.athreats.splice(0);
		for (var iposition = 1; iposition < 121; iposition++) { etc.aboard[iposition - 1] = iposition % 10 ? iposition / 10 % 10 < 2 | iposition % 10 < 2 ? 7 : iposition / 10 & 4 ? 0 : getpcbyparams(iparamid++, iposition - 1) | 16 : 7; }
		smoveslist = new string();
		omovesselect.innerhtml = "<option>game start<\/option>";
		omovesselect.selectedindex = 0;
	}

	function trimhistory() {
		smoveslist = smoveslist.substr(0, smoveslist.search(new regexp((ihistpointr & 1 ^ 1 ? " \\w+(\\=\\w+)?" : "â¶" + string(ihistpointr + 4 >> 1) + "\\.\\s.*") + (ihistpointr === ahistory.length - 2 ? "$" : ""))));
		ahistory.splice(ihistpointr + 1);
		ogameinfo.result = "*";
	}

	/*
	* signednumber is a 29 bits number.
	* 		01010			01010			01010			0101010			0101010			
	*		promotion (5 bits)	target (5 bits)		piece (5 bits)		end point (7 bits)	start point (7 bits)
	*		[bits 25 to 29]		[bits 20 to 24]		[bits 15 to 19]		[bits 8 to 14]		[bits 1 to 7]
	*/
	function writehistory(bgraphrendrng, nstartpt, nendpt, npieceid, ntarget, npromo) {
		var nmoves = ahistory.length >> 1, spromoalg = new string(), nendposx = nendpt % 10 - 1, nendposy = (nendpt - nendpt % 10) / 10 - 2, nstartposx = nstartpt % 10 - 1, nstartposy = (nstartpt - nstartpt % 10) / 10 - 2, iverifyx, iverifyy, disambiguatex = false, disambiguatey = false, signednumber = nstartpt | nendpt << 7 | npieceid << 14 | ntarget << 19, vpromo = false, bwritecapture = ((npieceid & 7) === 1 && (nstartpt + nendpt & 1) && ntarget === 0 /* en passant */) || ntarget > 0, colorflag = npieceid & 8;
		laststart = nstartpt;
		lastend = nendpt;
		if ((nendposy + 1 | 9) === 9 /* true in case of nendposy === -1! */ && (npieceid & 7) === 1) {
			vpromo = npromo || (22 - etc.npromotion ^ colorflag);
			signednumber |= vpromo << 24;
			spromoalg = "=" + "nbrq".charat(vpromo - 3 & 7);
		}
		ahistory.push(signednumber);
		if ((npieceid & 7) === 2) { kings[colorflag >> 3] = nendpt; }
		for (var iverifysq = 21; iverifysq < 99; iverifysq += iverifysq % 10 < 8 ? 1 : 3) {
			var iverifypc = etc.aboard[iverifysq];
			if ((iverifypc & 15) === (npieceid & 15) && iverifysq !== nendpt) {
				etc.aboard[nendpt] = 0;
				iverifyx = iverifysq % 10 - 1;
				iverifyy = (iverifysq - iverifysq % 10) / 10 - 2;
				if (etc.isvalidmove(iverifyx, iverifyy, nendposx, nendposy)) {
					if (iverifyx === nstartposx) { disambiguatey = true; }
					else if (iverifyy === nstartposy) { disambiguatex = true; }
					else { disambiguatex = true; }
				}
				etc.aboard[nendpt] = vpromo || npieceid & 15;
			}
		}
		smoveslist += (colorflag ? " " : (nmoves ? "â¶" : "") + string(nmoves + 1) + ". ");
		if ((npieceid & 7) === 2 && (nendpt - nstartpt + 2 | 4) === 4) { smoveslist += "o-o" + (nstartpt - nendpt === 2 ? "-o" : ""); }
		else { smoveslist += ((npieceid & 7) !== 1 ? "knbrq".charat(npieceid - 2 & 7) : "") + (((npieceid & 7) === 1 && bwritecapture) || disambiguatex ? string.fromcharcode(96 + nstartpt % 10) : "") + (disambiguatey ? string(nstartposy + 1) : "") + (bwritecapture ? "x" : "") + string.fromcharcode(96 + nendpt % 10) + string(nendposy + 1) + spromoalg + (bcheck ? "+" : ""); }

		omovesselect.innerhtml = "<option>game start<\/option><option>" + smoveslist.replace(/â¶/g,"<\/option><option>") + "<\/option>";
		omovesselect.selectedindex = omovesselect.length - 1;
		updatepgnlink();
		if (bgraphrendrng) {
			getincheckpieces();
			if (etc.bsolidview) { osolidboard.move(false, nstartpt, nendpt, ntarget, vpromo); }
		}
		ihistpointr++;
	}

	// toledo chess engine (see http://nanochess.110mb.com/)
	var fourbtslastpc, flagwhomoved, npawnstride, nfrstfocus, nscndfocus, nplydepth = 2, isquare = 120, thnku = [53,47,61,51,47,47], aparams = [5,3,4,6,2,4,3,5,1,1,1,1,1,1,1,1,9,9,9,9,9,9,9,9,13,11,12,14,10,12,11,13,0,99,0,306,297,495,846,-1,0,1,2,2,1,0,-1,-1,1,-10,10,-11,-9,9,11,10,20,-9,-11,-10,-20,-21,-19,-12,-8,8,12,19,21];
	function consider(thnka, thnkb, thnkh, thnkf, thnkpawnstride, thnkdepth) {
		var ithnkpiece, thnksigndpiece, thnkpiece, thnkl, thnke, thnkd, thnkstartpt = thnkf, thnkn = -1e8, thnkk = 78 - thnkh << 10, thnkendpt, thnkg, thnkm, thnky, thnkq, thnktarget, thnkc, thnkj, thnkz = flagwhomoved ? -10 : 10;
		flagwhomoved ^= 8;
		isquare++;
		thnkd = thnka || thnkdepth && thnkdepth >= thnkh && consider(0,0,0,21,0,0) > 1e4;
		do {
			if (thnksigndpiece = etc.aboard[thnkendpt = thnkstartpt]) {
				thnkq = thnksigndpiece & 15 ^ flagwhomoved;
				if (thnkq < 7) {
					thnky = thnkq-- & 2 ? 8 : 4;
					thnkc = thnksigndpiece - 9 & 15 ? thnku[thnkq] : 57;
					do {
						thnktarget = etc.aboard[thnkendpt += aparams[thnkc]];
						if (!thnka | thnkendpt === thnka) {
							thnkg = thnkq | thnkendpt + thnkz - thnkpawnstride ? 0 : thnkpawnstride;
							if (!thnktarget & (!!thnkq | thnky < 3 || !!thnkg) || (thnktarget + 1 & 15 ^ flagwhomoved) > 9 && thnkq | thnky > 2) {
								if (thnkm = !(thnktarget - 2 & 7)) {
									flagwhomoved ^= 8;
									etc.aboard[isquare--] = thnkstartpt;
									return(thnkk);
								}
								thnkj = ithnkpiece = thnksigndpiece & 15;
								thnke = etc.aboard[thnkendpt - thnkz] & 15;
								thnkpiece = thnkq | thnke - 7 ? ithnkpiece : (ithnkpiece += 2, 6 ^ flagwhomoved);
								while (ithnkpiece <= thnkpiece) {
									thnkl = thnktarget ? aparams[thnktarget & 7 | 32] - thnkh - thnkq : 0;
									if (thnkdepth) { thnkl += (1 - thnkq ? aparams[(thnkendpt - thnkendpt % 10) / 10 + 37] - aparams[(thnkstartpt - thnkstartpt % 10) / 10 + 37] + aparams[thnkendpt % 10 + 38] * (thnkq ? 1 : 2) - aparams[thnkstartpt % 10 + 38] + (thnksigndpiece & 16) / 2 : !!thnkm * 9) + (!thnkq ? !(etc.aboard[thnkendpt - 1] ^ ithnkpiece) + !(etc.aboard[thnkendpt + 1] ^ ithnkpiece) + aparams[ithnkpiece & 7 | 32] - 99 + !!thnkg * 99 + (thnky < 2) : 0) + !(thnke ^ flagwhomoved ^ 9); }
									if (thnkdepth > thnkh || 1 < thnkdepth & thnkdepth === thnkh && thnkl > 15 | thnkd) {
										etc.aboard[thnkendpt] = ithnkpiece, etc.aboard[thnkstartpt] = thnkm ? (etc.aboard[thnkg] = etc.aboard[thnkm], etc.aboard[thnkm] = 0) : thnkg ? etc.aboard[thnkg] = 0 : 0;
										thnkl -= consider(thnkdepth > thnkh | thnkd ? 0 : thnkendpt, thnkl - thnkn, thnkh + 1, etc.aboard[isquare + 1], thnkj = thnkq | thnky > 1 ? 0 : thnkendpt, thnkdepth);
										if (!(thnkh || thnkdepth - 1 | nfrstfocus - thnkstartpt | fourbtslastpc - ithnkpiece | thnkendpt - nscndfocus | thnkl < -1e4)) {
											isquare--;
											writehistory(true, thnkstartpt, thnkendpt, thnksigndpiece, thnktarget);
											return(npawnstride = thnkj);
										}
										thnkj = thnkq - 1 | thnky < 7 || thnkm || !thnkdepth | thnkd | thnktarget | thnksigndpiece < 15 || consider(0,0,0,21,0,0) > 1e4;
										etc.aboard[thnkstartpt] = thnksigndpiece;
										etc.aboard[thnkendpt] = thnktarget;
										thnkm ? (etc.aboard[thnkm] = etc.aboard[thnkg], etc.aboard[thnkg] = 0) : thnkg ? etc.aboard[thnkg] = 9 ^ flagwhomoved : 0;
									}
									if (thnkl > thnkn || thnkdepth > 1 && thnkl == thnkn && !thnkh && math.random() < 0.5) {
										etc.aboard[isquare] = thnkstartpt;
										if (thnkdepth > 1) {
											if (thnkh && thnkb - thnkl < 0) {
												flagwhomoved ^= 8; isquare--;
												return(thnkl);
											}
											if (!thnkh) { fourbtslastpc = ithnkpiece, nfrstfocus = thnkstartpt, nscndfocus = thnkendpt; }
										}
										thnkn = thnkl;
									}
									ithnkpiece += thnkj || (thnkg = thnkendpt, thnkm = thnkendpt < thnkstartpt ? thnkg - 3 : thnkg + 2, etc.aboard[thnkm] < 15 | etc.aboard[thnkm + thnkstartpt - thnkendpt] || etc.aboard[thnkendpt += thnkendpt - thnkstartpt]) ? 1 : 0;
								}
							}
						}
					} while (!thnktarget & thnkq > 2 || (thnkendpt = thnkstartpt, thnkq | thnky > 2 | thnksigndpiece > 15 & !thnktarget && thnkc++ * --thnky));
				}
			}
		}
		while (thnkstartpt++ > 98 ? thnkstartpt = 20 : thnkf - thnkstartpt);
		flagwhomoved ^= 8;
		isquare--;
		return(thnkn + 1e8 && thnkn >- thnkk + 1924 | thnkd ? thnkn : 0);
	}
	// end toledo chess engine

	function enginemove() {
		consider(0,0,0,21,npawnstride,nplydepth);
		consider(0,0,0,21,npawnstride,1);
		if (etc.bflatview) { writeflatpieces(); }
		bready = true;
	}

	// flat chessboard functions
	function writeflatpieces() {
		var ssqrcontent, osquarecell, nsquareid, nmenacedsq, nconst;
		for (var icell = 0; icell < 64; icell++) {
			nsquareid = (icell >> 3) * 10 - (icell & 7) + 28;
			osquarecell = aflatsquares[etc.bblackside ? icell : 63 - icell];
			ssqrcontent = etc.aboard[nsquareid]; osquarecell.innerhtml = ssqrcontent === 0 ? "" : "<span>&#98" + "171216151413231822212019".substr((((ssqrcontent & 15) * 3 + (ssqrcontent & 7)) >> 1) - 2, 2) + ";<\/span>";
			if (nsquareid === laststart || nsquareid === lastend) { osquarecell.style.backgroundcolor = (nsquareid * 11 - nsquareid % 10) / 10 & 1 ? "#c0a1a1" : "#e8c9c9"; } else { osquarecell.style.backgroundcolor = ""; }
		}
		if (!bai || flaghumanblack !== flagwhomoved) {
			for (var ithreat = 0; ithreat < etc.athreats.length; ithreat++) {
				nmenacedsq = etc.athreats[ithreat];
				nconst = (nmenacedsq * 4 - (nmenacedsq % 10) * 9) / 5;
				aflatsquares[etc.bblackside ? nconst - 8 : 71 - nconst].style.backgroundcolor = (nmenacedsq * 11 - nmenacedsq % 10) / 10 & 1 ? "#adafce" : "#dadcfb";
			}
		}
		nfrstfocus = 0;
	}

	function squarefocus(npieceid, bmakeactive) {
		var oselcell = aflatsquares[etc.bblackside ? ((npieceid - npieceid % 10) / 10 - 1 << 3) - npieceid % 10 : (9 - (npieceid - npieceid % 10) / 10 << 3) - 1 + npieceid % 10];
		if (bmakeactive) { slstsqcolr = oselcell.style.backgroundcolor; }
		oselcell.style.backgroundcolor = bmakeactive ? "#4cff4c" : slstsqcolr;
	}

	function createflatcoord(nnewheaderid, bvertori) {
		var onewcoord = document.createelement("th");
		onewcoord.classname = bvertori ? "vertcoords" : "horizcoords";
		onewcoord.innerhtml = bvertori ? nnewheaderid : string.fromcharcode(97 + nnewheaderid);
		return(onewcoord);
	}

	function updateflatcoords() {
		for (var icoord = 0; icoord < 8; icoord++) {
			acoords[icoord].innerhtml = acoords[icoord | 16].innerhtml = string.fromcharcode(etc.bblackside ? 104 - icoord : 97 + icoord);
			acoords[icoord | 8].innerhtml = acoords[icoord | 24].innerhtml = string(etc.bblackside ? icoord + 1: 8 - icoord);
		}
	}

	function showflatboard() {
		if (oboardtable) {
		// flat chessboard will be updated
			updateflatcoords();
			if (!etc.bflatview) {
				etc.oflatvwarea.appendchild(oboardtable);
				etc.bflatview = true;
			}
		} else {
		// flat chessboard will be created
			acoords = [], aflatsquares = [], oboardtable = document.createelement("table");
			var igridrow, iflatsquare, ihorheadr, iverheadr, newsquareid, newsquarecell, gridbody = document.createelement("tbody"), gridangle = document.createelement("td");

			igridrow = document.createelement("tr");
			gridangle.classname = "boardangle";
			igridrow.appendchild(gridangle);

			for (var inewcoordx = 0; inewcoordx < 8; inewcoordx++) {
				ihorheadr = createflatcoord(etc.bblackside ? 7 - inewcoordx : inewcoordx, false);
				acoords.push(ihorheadr);
				igridrow.appendchild(ihorheadr);
			}
			igridrow.appendchild(gridangle.clonenode(false));
			gridbody.appendchild(igridrow);
			for (var inewcoordy = 0; inewcoordy < 8; inewcoordy++) {
				igridrow = document.createelement("tr");
				iverheadr = createflatcoord(etc.bblackside ? inewcoordy + 1: 8 - inewcoordy, true);
				acoords[inewcoordy | 8] = iverheadr;
				igridrow.appendchild(iverheadr);
				for (var inewrowx = 0; inewrowx < 8; inewrowx++) {
					newsquareid = 91 - inewcoordy * 10 + inewrowx;
					newsquarecell = document.createelement("td");
					newsquarecell.classname = (newsquareid + (newsquareid - newsquareid % 10) / 10) & 1 ? "blacksquares" : "whitesquares";
					newsquarecell.id = "flatsq" + newsquareid;
					newsquarecell.onclick = getsqfnc;
					aflatsquares.push(newsquarecell);
					igridrow.appendchild(newsquarecell);
				}
				iverheadr = createflatcoord(etc.bblackside ? inewcoordy + 1: 8 - inewcoordy, true);
				acoords[inewcoordy | 24] = iverheadr;
				igridrow.appendchild(iverheadr);
				gridbody.appendchild(igridrow);
			}
			igridrow = document.createelement("tr");
			igridrow.appendchild(gridangle.clonenode(false));
			for (var inewcoordx = 0; inewcoordx < 8; inewcoordx++) {
				ihorheadr = createflatcoord(etc.bblackside ? 7 - inewcoordx : inewcoordx, false);
				acoords[inewcoordx | 16] = ihorheadr;
				igridrow.appendchild(ihorheadr);
			}

			igridrow.appendchild(gridangle.clonenode(false));
			gridbody.appendchild(igridrow);
			oboardtable.appendchild(gridbody);

			oboardtable.id = "flatchessboard";
			oboardtable.style.width = string(nflatboardside) + "px";
			oboardtable.style.height = string(nflatboardside) + "px";
			etc.oflatvwarea.appendchild(oboardtable);
			etc.bflatview = true;
		}
		writeflatpieces();
	}

	// solid chessboard functions
	function runcomponents() {
		graphicsstatus++;
		if (graphicsstatus === 15) {
			try {
				etc.apieceslab = (new function("return [function() {" + etc.afncbodies.slice(0, 6).join("}, function() {") + "}];"))();
				(new function(etc.afncbodies.slice(6, 12).join("\n")))();
				updateviewsize(true, false);
				osolidboard = (new function(etc.afncbodies[12])).call(etc);
			} catch (oerr2) { alert("sorry, but your browser does not support 3d canvas."); }
			etc.afncbodies.splice(0);
			document.body.removechild(etc.ocurtain);
			delete etc.afncbodies;
			delete etc.ocurtain;
			oboardsbox.style.width = ndeskwidth + "px";
		}
	}

	function loadcom(nindex) {
		if (graphicsstatus === 0) { return; }
		etc.afncbodies[nindex] = this.responsetext;
		runcomponents();
	}

	function showsolidboard() {
		if (graphicsstatus === 0) {
			graphicsstatus = 1;
			etc.ocurtain = document.createelement("div");
			etc.ocurtain.id = "chesscurtain";
			etc.ocurtain.innerhtml = "<div id=\"chessloading\">loading&hellip;<\/div>";
			document.body.appendchild(etc.ocurtain);
			etc.afncbodies = [null, null, null, null, null, null, null, null, null, null, null, null, null];
			xhr("meshes/board.json", function() {
				if (graphicsstatus === 0) { return; }
				etc.tmp3dboard = eval("(" + this.responsetext + ")");
				runcomponents();
			});
			xhr("meshes/pawn.jscn", loadcom, 0);
			xhr("meshes/king.jscn", loadcom, 1);
			xhr("meshes/knight.jscn", loadcom, 2);
			xhr("meshes/bishop.jscn", loadcom, 3);
			xhr("meshes/rook.jscn", loadcom, 4);
			xhr("meshes/queen.jscn", loadcom, 5);
			xhr("canvas3dengine/scene.jsfb", loadcom, 6);
			xhr("canvas3dengine/vec3.jsfb", loadcom, 7);
			xhr("canvas3dengine/matrix3.jsfb", loadcom, 8);
			xhr("canvas3dengine/camera.jsfb", loadcom, 9);
			xhr("canvas3dengine/mesh.jsfb", loadcom, 10);
			xhr("canvas3dengine/light.jsfb", loadcom, 11);
			xhr("solidview.jsfb", loadcom, 12);
		} else {
			updateviewsize(true, true);
			osolidboard.show();
		}
	}

	function updatepgnheader() {
		spgnheader = new string();
		for (var iheadkey in ogameinfo) { spgnheader += "[" + iheadkey + " \"" + ogameinfo[iheadkey] + "\"]\n"; }
	}

	function updatepgnlink() { opgnbtn.setattribute("href", "data:application/x-chess-pgn;us-ascii," + escape(spgnheader + "\n" + smoveslist.replace(/â¶/g," ") + (ahistory.length > 0 ? " " : "") + ogameinfo.result)); }

	function runalgebraic(salgmove, ncolorflag, bgraphrendrng) {
		try {
			var nalgstartsq = 0, nalgendsq, nalgpromo, nalgpiece, nalgtarget;
			if (salgmove === "o-o" || salgmove === "o-o-o") {
				ncastltype = salgmove === "o-o" ? 1 : -1;
				nalgstartsq = kings[ncolorflag >> 3];
				nalgpromo = ncolorflag + 2;
				nalgpiece = nalgpromo | 16;
				nalgtarget = 0;
				nalgendsq = nalgstartsq + ncastltype * 2;
				etc.aboard[nalgstartsq + 3 + (ncastltype - 1) * 7 / 2] = 0;
				etc.aboard[nalgstartsq + ncastltype] = ncolorflag + 5;
				kings[ncolorflag >> 3] = nalgendsq;
			} else {
				var nalgpctype, nalgstartx = nalgstarty = 8, rpromo = /(\=.+)/, nalgpcindex = salgmove.replace(rpromo, "").search(/[a-z]/), aycoords = salgmove.match(/\d/g), axcoords = salgmove.replace(/x/g, "").match(/[a-z]/g), nalgendx = axcoords[axcoords.length - 1].charcodeat(0) - 97, nalgendy = aycoords[aycoords.length - 1] - 1;
				if (axcoords.length > 1) { nalgstartx = axcoords[0].charcodeat(0) - 97; }
				if (aycoords.length > 1) { nalgstarty = aycoords[0] - 1; }
				if (nalgpcindex > -1) { nalgpctype = "pknbrq".indexof(salgmove.substr(nalgpcindex, 1)) + 1; } else { nalgpctype = 1; }
				var nalg4btspiece = nalgpctype | ncolorflag, nalgpromoindex = salgmove.search(rpromo);
				nalgendsq = nalgendy * 10 + nalgendx + 21;
				if (nalgstartx < 8) {
					if (nalgstarty < 8) {
						if (etc.lookat(nalgstartx, nalgstarty) && etc.isvalidmove(nalgstartx, nalgstarty, nalgendx, nalgendy)) {
							nalgstartsq = nalgstarty * 10 + nalgstartx + 21;
							nalgpiece = etc.aboard[nalgstartsq];
						}
						else { return(false); } // piece not found!!!
					} else {
						for (var ifoundy = 0; ifoundy < 8; ifoundy++) {
							ifoundpc = etc.lookat(nalgstartx, ifoundy);
							if ((ifoundpc & 15) === nalg4btspiece && etc.isvalidmove(nalgstartx, ifoundy, nalgendx, nalgendy)) {
								nalgstarty = ifoundy;
								nalgstartsq = ifoundy * 10 + nalgstartx + 21;
								nalgpiece = ifoundpc;
								break;
							}
						}
					}
				} else {
					if (nalgstarty < 8) {
						for (var ifoundx = 0; ifoundx < 8; ifoundx++) {
							ifoundpc = etc.aboard[nalgstarty * 10 + ifoundx + 21];
							if ((ifoundpc & 15) === nalg4btspiece && etc.isvalidmove(ifoundx, nalgstarty, nalgendx, nalgendy)) {
								nalgstartx = ifoundx;
								nalgstartsq = nalgstarty * 10 + ifoundx + 21;
								nalgpiece = ifoundpc;
								break;
							}

						}
					} else {
						for (var ifoundsq = 21; ifoundsq < 99; ifoundsq += ifoundsq % 10 < 8 ? 1 : 3) {
							ifoundpc = etc.aboard[ifoundsq];
							if ((ifoundpc & 15) === nalg4btspiece && etc.isvalidmove(ifoundsq % 10 - 1, (ifoundsq - ifoundsq % 10) / 10 - 2, nalgendx, nalgendy)) {
								nalgstartx = ifoundsq % 10 - 1;
								nalgstarty = (ifoundsq - ifoundsq % 10) / 10 - 2;
								nalgstartsq = ifoundsq;
								nalgpiece = ifoundpc;
								break;
							}
						}
					}
				}
				if ((nalgpiece & 7) === 1 && (nalgendy + 1 | 9) === 9) {
					if (nalgpromoindex === -1) { nalgpromo = 22 - etc.npromotion ^ ncolorflag; }
					else { nalgpromo = "knbrq".indexof(salgmove.substr(nalgpromoindex + 1, 1)) + ncolorflag + 18; }
				}
				else { nalgpromo = nalgpiece; }
				nalgtarget = etc.aboard[nalgendsq];
			}
			if (nalgstartsq === 0) { return(false); } // piece not found!!!
			var hisking = kings[ncolorflag >> 3 ^ 1];
			if ((nalgpiece & 7) === 1 && (nalgstartsq + nalgendsq & 1) && nalgtarget === 0) { etc.aboard[nalgstartsq - nalgstartsq % 10 + nalgendsq % 10] = 0; } // en passant
			etc.aboard[nalgstartsq] = 0;
			etc.aboard[nalgendsq] = nalgpromo;
			if ((nalgpiece & 7) === 2) { kings[ncolorflag >> 3] = nalgendsq; }
			bcheck = isthreatened(hisking % 10 - 1, (hisking - hisking % 10) / 10 - 2, ncolorflag);
			nfrstfocus = nalgstartsq;
			nscndfocus = nalgendsq;
			npawnstride = (nalgpiece & 7) === 1 && (nalgstarty - nalgendy + 2 | 4) === 4 ? nalgendsq : 0;
			fourbtslastpc = nalgpiece & 15;
			writehistory(bgraphrendrng, nalgstartsq, nalgendsq, nalgpiece, nalgtarget, nalgpromo);
			return(true);
		}
		catch (oerr1) { return(false); }
	}

	function readhistory(nrelpt, bsynchrlist) {
		var isigned, nexprs1, nexprs2, ihistpiece, ihisttarg, ihistpromo, bitbackward = 0, nmvsdiff = math.abs(nrelpt), ihistpts = [null, null];
		if (nrelpt < 0) { bitbackward = 1; }
		nfrstfocus = nscndfocus = 0;
		flagwhomoved ^= nmvsdiff << 3 & 8;
		for (var inav = 0; inav < nmvsdiff; inav++) {
			isigned = ahistory[ihistpointr + 1 - bitbackward];
			ihistpts[0] = isigned & 127;
			ihistpts[1] = isigned >> 7 & 127;
			ihistpiece = isigned >> 14;
			ihisttarg = isigned >> 19 & 31;
			ihistpromo = ihistpiece > 1023 ? (bitbackward ? 9 - (ihistpts[1] - ihistpts[1] % 10 & 8) : isigned >> 24) : false;
			if ((ihistpiece & 7) === 2) {
				if ((ihistpts[1] - ihistpts[0] + 2 | 4) === 4) { // castling
					nexprs1 = ihistpts[1] - ihistpts[1] % 10 + (ihistpts[1] - ihistpts[0] > 0 ? 8 : 1);
					nexprs2 = ihistpts[1] - ihistpts[1] % 10 + (ihistpts[1] - ihistpts[0] > 0 ? 6 : 4);
					etc.aboard[bitbackward ? nexprs1 : nexprs2] = 5 + (ihistpts[1] - ihistpts[1] % 10 & 8) + (bitbackward << 4);
					etc.aboard[bitbackward ? nexprs2 : nexprs1] = 0;
				}
				kings[ihistpointr + 1 + bitbackward & 1] = ihistpts[bitbackward ^ 1];
			}
			etc.aboard[ihistpts[bitbackward ^ 1]] = ihistpromo || (ihistpiece & (15 + (bitbackward << 4)));
			etc.aboard[ihistpts[bitbackward]] = bitbackward === 1 ? ihisttarg : 0;
			if ((ihistpiece & 7) === 1 && (ihistpts[1] - ihistpts[0] & 1) && ihisttarg === 0) { etc.aboard[ihistpts[0] - ihistpts[0] % 10 + ihistpts[1] % 10] = bitbackward ? 1 | (ihistpiece & 8 ^ 8) : 0; } // en passant
			ihistpointr += 1 - (bitbackward << 1);
			if (inav === nmvsdiff - 1) { getincheckpieces(); }
			if (etc.bsolidview) { osolidboard.move(bitbackward, ihistpts[0], ihistpts[1], ihisttarg, ihistpromo); }

		}
		if (ihistpointr === -1) {
			fourbtslastpc = npawnstride = laststart = lastend = 0;
		} else {
			if (bitbackward) {
				isigned = ahistory[ihistpointr];
				ihistpts[0] = isigned & 127;
				ihistpts[1] = isigned >> 7 & 127;
				ihistpiece = isigned >> 14;
			}
			npawnstride = (ihistpiece & 7) === 1 && ((ihistpts[0] - ihistpts[1] - ihistpts[0] % 10 + ihistpts[1] % 10) / 10 + 2 | 4) === 4 ? ihistpts[1] : 0;
			laststart = ihistpts[0];
			lastend = ihistpts[1];
			fourbtslastpc = ihistpiece & 15;
		}
		if (etc.bflatview) { writeflatpieces(); }
		if (bsynchrlist) { omovesselect.selectedindex = ihistpointr + 2 >> 1; }
	}

	function histcleariter() {
		if (!bmotion) { return; }
		window.clearinterval(nmotionid);
		omovesselect.disabled = bmotion = false; 
		if (bboundlock) { bready = true; }
	}

	function sendalgebraic(smove) {
		if (!bready) { return(false); }
		if (ihistpointr + 1 < ahistory.length) {
			if (confirm("moving now all subsequent moves will be lost. do you want try to move?")) { trimhistory(); } else { return(false); }
		}
		if (!runalgebraic(smove, flagwhomoved ^ 8, true)) { return(false); }
		if ((fourbtslastpc & 7) === 1 & (nscndfocus < 29 | nscndfocus > 90)) { fourbtslastpc = 14 - etc.npromotion ^ flagwhomoved; }
		flagwhomoved ^= 8;
		if (etc.bflatview) { writeflatpieces(); }
		if (bai && flagwhomoved === flaghumanblack) { bready = false; window.settimeout(enginemove, 250); }
		return(true);
	}

// dom private apis
	function closemsg(omsgnode, neventid) {
		var iframea1 = 1;
		for (var iframea2 = 1; iframea2 < 5; iframea2++) { window.settimeout(function() { omsgnode.style.opacity = "0." + string(85 - (17 * iframea1)); iframea1++; }, iframea2 * 50); }
		window.settimeout(function() { omsgnode.style.opacity = "0"; ontfarea.removechild(omsgnode); intfs--; if (intfs === 1) { ontfclsall.style.display = "none"; } if (intfs === 0) { document.body.removechild(ontfarea); ontfarea = null; ontfclsall = null; aclosecalls = []; } }, 250);
		aclosecalls[neventid] = false;
	}

	function sendmsg(smsgtitle, smsgtxt, nduration) {
		var onewmsg = document.createelement("div"), omsgclose = document.createelement("div"), omsgtitle = document.createelement("div"), omsgbody = document.createelement("div"), iframeb1 = 1, neventid = aclosecalls.length;
		if (ontfarea === null) {
			ontfclsall = document.createelement("div");
			ontfarea = document.createelement("div");
			setattribs.call(ontfarea, ["classname", "top-right gnotify"], ["id", "gnotify"]);
			setattribs.call(ontfclsall, ["classname", "gnotify-closer"], ["innerhtml", "[ close all ]"], ["onclick", function() {
				var iframec1 = 1;
				for (var ieventid = 0; ieventid < aclosecalls.length; ieventid++) { if (aclosecalls[ieventid] !== false) { window.cleartimeout(aclosecalls[ieventid]); } }
				for (var iframec2 = 1; iframec2 < 5; iframec2++) {
					window.settimeout(function() { ontfarea.style.opacity = "0." + string(85 - (17 * iframec1)); iframec1++; }, iframec2 * 50);

				}
				window.settimeout(function() { ontfarea.style.opacity = "0"; document.body.removechild(ontfarea); ontfarea = null; ontfclsall = null; intfs = 0; aclosecalls = new array(); }, 250);
			}]);
			document.body.appendchild(ontfarea);
			ontfarea.appendchild(ontfclsall);
		}
		if (intfs > 0) { ontfclsall.style.display = "block"; }
		for (var iframeb2 = 1; iframeb2 < 6; iframeb2++) { window.settimeout(function() { onewmsg.style.opacity = "0." + string(17 * iframeb1); iframeb1++; }, iframeb2*50); }
		aclosecalls.push(window.settimeout(function() { closemsg(onewmsg, neventid); onewmsg = null; }, nduration));
		onewmsg.classname = "gnotify-notification default";
		setattribs.call(omsgclose, ["classname", "close"], ["onclick", function() { if (aclosecalls[neventid] !== false) { window.cleartimeout(aclosecalls[neventid]); closemsg(onewmsg,neventid); } }], ["innerhtml", "&times;"]);
		setattribs.call(omsgtitle, ["classname", "header"], ["innerhtml", smsgtitle]);
		setattribs.call(omsgbody, ["classname", "gnotify-message"], ["innerhtml", smsgtxt]);
		onewmsg.appendchild(omsgclose);
		onewmsg.appendchild(omsgtitle);
		onewmsg.appendchild(omsgbody);
		setstyles.call(onewmsg, ["display", "block"], ["opacity", "0"]);
		ontfarea.insertbefore(onewmsg,ontfclsall);
		intfs++;
	}

	function returnfalse() { return(false); }

	function getsqfnc() {
		var getid = parsefloat(this.id.substr(this.id.search(/\d+/)));
		etc.makeselection(etc.bblackside ? 119 - getid : getid, false);
	}

	function synchrmoveslist() {
		var nrelmoves = (this.selectedindex << 1) - ihistpointr - (this.selectedindex > 0 && flaghumanblack ? 2 : 1);
		if (bmotion || nrelmoves === 0) { return; }
		readhistory(nrelmoves, false);
	}

	function resizefilm(omsevnt2) {
		if (!omsevnt2) { omsevnt2 = window.event; }
		var imswidth = omsevnt2.clientx + npagex + ndscrsx - iboardsboxx, imsheight = omsevnt2.clienty + npagey + ndscrsy - iboardsboxy;
		ndeskwidth = imswidth < nminwidth ? nminwidth : ndeskwidth = imswidth - 1 | 1;
		ndeskheight = imsheight < nminheight ? nminheight : imsheight - 1 | 1;
		ofilm.style.width = ndeskwidth + "px";
		ofilm.style.height = ndeskheight + "px";
	}

	function updateviewsize(bcrushflatwidth, bresizesolidb) {
		var eachviewwidth = bcrushflatwidth ? ndeskwidth / 2 : ndeskwidth;
		nflatboardside = (eachviewwidth < ndeskheight ? eachviewwidth : ndeskheight) - nflatbvmargin;
		etc.i3dwidth = etc.bflatview ? ndeskwidth / 2 : ndeskwidth;
		if (etc.bflatview) {
			etc.oflatvwarea.style.width = eachviewwidth + "px";
			etc.oflatvwarea.style.height = ndeskheight + "px";
			oboardtable.style.margintop = oboardtable.style.marginbottom = string((ndeskheight - nflatboardside) / 2) + "px";
			oboardtable.style.width = nflatboardside + "px";
			oboardtable.style.height = nflatboardside + "px";
		}
		if (bcrushflatwidth && bresizesolidb) { osolidboard.updatesize(); }
	}

	function stopresizing() {
		canvas3d.removeevent(document, "mousemove", resizefilm);
		canvas3d.removeevent(document, "mouseup", stopresizing);
		etc.i3dheight = ndeskheight;
		updateviewsize(etc.bsolidview, true);
		oboardsbox.style.width = ndeskwidth + "px";
		oboardsbox.style.height = ndeskheight + "px";
		document.body.removechild(ofilm);
	}

	function startresizing(omsevnt1) {
		var iparent = oboardsbox;
		nminwidth = etc.bflatview && etc.bsolidview ? nminheight << 1 : nminheight;
		if (!omsevnt1) { omsevnt1 = window.event; }
		npagex = document.documentelement.scrollleft || document.body.scrollleft;
		npagey = document.documentelement.scrolltop || document.body.scrolltop;
		iboardsboxx = 0;
		iboardsboxy = 0;
		while (iparent.offsetparent) {
			iboardsboxx += iparent.offsetleft;
			iboardsboxy += iparent.offsettop;
			iparent = iparent.offsetparent;
		}
		setstyles.call(ofilm, ["width", ndeskwidth + "px"], ["height", ndeskheight + "px"], ["left", iboardsboxx + "px"], ["top", iboardsboxy + "px"]);
		document.body.appendchild(ofilm);
		ndscrsx = iboardsboxx - npagex + oboardsbox.offsetwidth - omsevnt1.clientx;
		ndscrsy = iboardsboxy - npagey + oboardsbox.offsetheight - omsevnt1.clienty;
		canvas3d.addevent(document, "mousemove", resizefilm);
		canvas3d.addevent(document, "mouseup", stopresizing);
		return(false);
	}

	function capitalize(stext) { return(stext.touppercase()); }

	function changetagname() {
		var soldname = this.innerhtml;
		if (soldname === "result") { alert("you can not change this key."); return; }
		if (bctrlisdown) {
			bctrlisdown = false;
			if (confirm("do you want to delete this tag?")) {
				delete ogameinfo[this.innerhtml];
				this.parentnode.removechild(this.nextsibling);
				this.parentnode.removechild(this.nextsibling);
				this.parentnode.removechild(this.nextsibling);
				this.parentnode.removechild(this);
			}
		} else {


			var snewname = prompt("write the new name of the key.", soldname);
			if (!snewname) { return; }
			snewname = snewname.replace(/^[a-z]/, capitalize);
			if (snewname === soldname || snewname.search(rdeniedtagchrs) > -1 || ogameinfo.hasownproperty(snewname)) { return; }
			var ocleaninfo;
			for (var iinfokey in ogameinfo) {
				onewinfo[iinfokey === soldname ? snewname : iinfokey] = ogameinfo[iinfokey];
				delete ogameinfo[iinfokey];
			}
			ocleaninfo = ogameinfo;
			ogameinfo = onewinfo;
			onewinfo = ocleaninfo;
			updatepgnheader();
			updatepgnlink();
			this.innerhtml = snewname;
		}
	}

	function changetagval() {
		var sparent = this.previoussibling.previoussibling.innerhtml;
		if (sparent === "result") { alert("you can not change the result of the game!"); return; }
		var snewvalue = prompt("write the new value.", this.innerhtml);
		if (snewvalue === null) { return; }
		ogameinfo[sparent] = this.innerhtml = snewvalue || "?";
		updatepgnheader();
		updatepgnlink();
	}

	function addinfotag() {
		var newtagk = prompt("write the name of the new tag.");
		if (!newtagk || newtagk.search(rdeniedtagchrs) > -1) { return; }
		newtagk = newtagk.replace(/^[a-z]/, capitalize);
		var bexists = false;
		for (var iexisttag in ogameinfo) {
			if (iexisttag.tolowercase() === newtagk.tolowercase()) { bexists = iexisttag; break; }
		}
		if (bexists) { alert(iexisttag + " already exists!"); return; }
		newtagv = prompt("write the value of the new tag.");
		if (!newtagv) { return; }
		ogameinfo[newtagk] = newtagv;
		updatepgnheader();
		updatepgnlink();
		var ofocusnode = this.previoussibling;
		this.parentnode.insertbefore(setattribs.call(document.createelement("span"), ["classname", "infokey"], ["onclick", changetagname], ["innerhtml", newtagk]), ofocusnode);
		this.parentnode.insertbefore(document.createtextnode(": "), ofocusnode);
		this.parentnode.insertbefore(setattribs.call(document.createelement("span"), ["classname", "infoval"], ["onclick", changetagval], ["innerhtml", newtagv]), ofocusnode);
		this.parentnode.insertbefore(document.createelement("br"), ofocusnode);
	}

	function showinfo() {
		if (binfobox) { return; }
		var oinfopar = document.createelement("p"), onewfield = document.createelement("span"), ocloseinfo = document.createelement("span");
		for (var itagtxt in ogameinfo) {
			oinfopar.appendchild(setattribs.call(document.createelement("span"), ["classname", "infokey"], ["onclick", changetagname], ["innerhtml", itagtxt]));
			oinfopar.appendchild(document.createtextnode(": "));
			oinfopar.appendchild(setattribs.call(document.createelement("span"), ["classname", "infoval"], ["onclick", changetagval], ["innerhtml", ogameinfo[itagtxt]]));
			oinfopar.appendchild(document.createelement("br"));
		}
		oinfopar.title = "hold down the ctrl button and click the tag name to remove all its contents.";
		setattribs.call(onewfield, ["classname", "chessctrlbtn"], ["onclick", addinfotag], ["innerhtml", "add tag"]);
		setattribs.call(ocloseinfo, ["classname", "chessctrlbtn"], ["onclick", hideinfo], ["innerhtml", "close"]);
		oinfopar.appendchild(document.createelement("br"));
		oinfopar.appendchild(onewfield);
		oinfopar.appendchild(document.createtextnode(" "));
		oinfopar.appendchild(ocloseinfo);
		oinfobox.appendchild(oinfopar);
		binfobox = true;
	}

	function hideinfo() {
		oinfobox.innerhtml = "";
		binfobox = false;
	}

	function algboxlistener(okeyevnt1) {
		if (okeyevnt1.keycode === 13 && sendalgebraic(this.value)) { this.value = ""; }
	}

	function algboxfocus() {
		this.style.bordercolor = "#ffff00";
		if (this.value === salgboxempty) { this.value = ""; }
		if (busekeyboard) { etc.bkeyctrl = false; }
	}

	function algboxblur() {
		this.style.bordercolor = "";
		this.value = this.value || salgboxempty;
		if (busekeyboard) { etc.bkeyctrl = true; }
	}

	function minmaxctrl() {
		if (octrlform.style.display) {
			octrlform.style.display = "";
			this.innerhtml = "&ndash;";
		} else {
			octrlform.style.display = "none";
			this.innerhtml = "+";
		}
	}

	function getctrldown(okeyevnt2) { if (okeyevnt2.keycode === 17) { bctrlisdown = true; } }

	function getctrlup(okeyevnt3) { if (okeyevnt3.ctrlkey) { bctrlisdown = false; } }

// public apis
	return {
		help: function() {
			if (!bready) { return; }
			enginemove();
			bready = false;
			window.settimeout(enginemove, 250);
			if (etc.bflatview && nfrstfocus) { squarefocus(nfrstfocus, false); }
		},
		organize: function(bhb) {
			resetboard();
			flaghumanblack = bhb ? 8 : 0;
			newpgnheader();
			if (bhumanside) { etc.bblackside = bhb; }
			if (binfobox) { hideinfo(); }
			if (etc.bsolidview) { osolidboard.update(true); }
			if (etc.bflatview) { updateflatcoords(); writeflatpieces(); }
			updatepgnlink();
			if (bhb && bai) { bready = false; window.settimeout(enginemove, 250); }
		},
		place: function(owhere) {
			if (oboardsbox) { oboardsbox.parentnode.removechild(oboardsbox); }
			else {
				var osizehandle = document.createelement("div"), octrlpanel = document.createelement("div"), omnmxctrl = document.createelement("div"), oalgbox = document.createelement("input"), omovespar = document.createelement("p"), opgnpar = document.createelement("p"), oinfobtn = document.createelement("span");
				etc.oflatvwarea = document.createelement("div");
				etc.osolidvwarea = document.createelement("div");
				oboardsbox = document.createelement("div");
				opgnbtn = document.createelement("a");
				oinfobox = document.createelement("div");
				octrlform = document.createelement("form");
				omovesselect = document.createelement("select");
				ofilm = document.createelement("div");

				setattribs.call(oalgbox, ["type", "text"], ["id", "chessalgebraic"], ["value", salgboxempty], ["onkeypress", algboxlistener], ["onfocus", algboxfocus], ["onblur", algboxblur]);
				setattribs.call(oinfobtn, ["classname", "chessctrlbtn"], ["onclick", showinfo], ["innerhtml", "game info"]);
				oinfobox.id = "chessinfo";
				oboardsbox.id = "chessboardsbox";
				oboardsbox.onmousedown = returnfalse;
				oboardsbox.style.width = ndeskwidth + "px";
				oboardsbox.style.height = ndeskheight + "px";
				setattribs.call(osizehandle, ["id", "chesssizehandle"], ["innerhtml", "&#9698;"], ["onmousedown", startresizing]);
				setattribs.call(omnmxctrl, ["id", "chessclosepanel"], ["onclick", minmaxctrl], ["onmousedown", returnfalse], ["innerhtml", "&ndash;"]);
				opgnpar.classname = "ctrlbtns";
				etc.oflatvwarea.id = "chess2dbox";
				etc.osolidvwarea.id = "chess3dbox";
				octrlform.onsubmit = returnfalse;
				ofilm.classname = "chessfilmbox";
				setattribs.call(omovesselect, ["id", "chessmoves"], ["size", 10], ["onchange", synchrmoveslist]),
				opgnbtn.classname = "chessctrlbtn";
				opgnbtn.innerhtml = "save as pgn";
				octrlpanel.id = "chessctrlpanel";

				omovespar.appendchild(omovesselect);
				omovespar.appendchild(document.createelement("br"));
				omovespar.appendchild(oalgbox);
				opgnpar.appendchild(opgnbtn);
				opgnpar.appendchild(document.createtextnode(" "));
				opgnpar.appendchild(oinfobtn);
				octrlform.appendchild(omovespar);
				octrlform.appendchild(opgnpar);
				octrlform.appendchild(oinfobox);
				octrlpanel.appendchild(omnmxctrl);
				octrlpanel.appendchild(octrlform);
				oboardsbox.appendchild(etc.osolidvwarea);
				oboardsbox.appendchild(etc.oflatvwarea);
				oboardsbox.appendchild(osizehandle);
				document.body.appendchild(octrlpanel);
				canvas3d.addevent(document, "keydown", getctrldown);
				canvas3d.addevent(document, "keyup", getctrlup);
			}
			owhere.appendchild(oboardsbox);
			this.organize(false);
		},
		setview: function(nview) {
			if (!bready) { return(false); }
			var bupdatesize = false, bshow2d = boolean(nview & 1), bshow3d = boolean(nview & 2), bchanged2d = boolean(nview & 1 ^ etc.bflatview);
			if (bshow2d && bshow3d && ndeskwidth < nminheight << 1) {
				ndeskwidth = nminwidth = nminheight << 1;
				oboardsbox.style.width = ndeskwidth + "px";
			}
			if (bshow2d) {
				if (!etc.bflatview) {
					showflatboard();
					bupdatesize = true;
				}
			} else if (etc.bflatview) {
				etc.oflatvwarea.style.width = "0";
				etc.oflatvwarea.removechild(oboardtable);
				etc.bflatview = false;
				bupdatesize = true;
			}
			if (bshow3d) { if (!etc.bsolidview) { showsolidboard(); bupdatesize = false; } }
			else if (etc.bsolidview) { osolidboard.hide(); bupdatesize = true; }
			if (bupdatesize) { updateviewsize(bshow3d, bchanged2d); }
			return(true);
		},
		showhide2d: function() {
			if (!bready) { return(false); }
			if (etc.bflatview) {
				etc.oflatvwarea.style.width = "0";
				etc.oflatvwarea.removechild(oboardtable);
				etc.bflatview = false;
			}
			else {
				if (etc.bsolidview && ndeskwidth < nminheight << 1) {
					ndeskwidth = nminwidth = nminheight << 1;
					oboardsbox.style.width = ndeskwidth + "px";
				}
				showflatboard();
			}
			updateviewsize(etc.bsolidview, true);
			return(true);
		},
		showhide3d: function() {
			if (!bready) { return(false); }
			if (etc.bsolidview) {
				osolidboard.hide();
				updateviewsize(false, false);
			} else {
				showsolidboard();
				if (etc.bflatview && ndeskwidth < nminheight << 1) {
					ndeskwidth = nminwidth = nminheight << 1;
					oboardsbox.style.width = ndeskwidth + "px";
				}
			}
			return(true);
		},
		lock: function() { if (bmotion) { bboundlock = false; } else { bready = false; } },
		unlock: function() { histcleariter(); bready = true; },
		useai: function(bmachine) { bai = bmachine; },
		placebyid: function(snodeid) { this.place(document.getelementbyid(snodeid)); },
		setplydepth: function(nlevel) {
			var ndepth = new number(nlevel);
			if (isnan(ndepth) || ndepth < 0) { return(false); }
			nplydepth = ndepth + 2;
			return(true);
		},
		setpromotion: function(npromotion) { etc.npromotion = npromotion & 3; },
		navigate: function (nhowmany, biterate, ntmpspeed) {
			var nmovefor = number(nhowmany), bbackward = nmovefor < 0, nhistlen1 = ahistory.length;
			if (bmotion || nmovefor === 0 || nhistlen1 === 0) { return; }
			if (biterate) {
				omovesselect.disabled = bmotion = true;
				if (bready) { bboundlock = true; bready = false; }
				nmotionid = window.setinterval(function() {
					var nhistlen2 = ahistory.length;
					if (ihistpointr + nmovefor < -1 || nmovefor + ihistpointr > nhistlen2 - 1) {
						window.clearinterval(nmotionid);
						omovesselect.disabled = bmotion = false;
						if (bbackward && ihistpointr > -1) { readhistory(~ihistpointr, true); }
						else if (!bbackward && ihistpointr < nhistlen2 - 1) { readhistory(nhistlen2 - ihistpointr - 1, true); }
						if (bboundlock) { bready = true; }
						return;
					}
					readhistory(nmovefor, true);
				}, ntmpspeed || nframerate);
			} else {
				if (ihistpointr + nmovefor < -1 || nmovefor + ihistpointr + 1 > nhistlen1) {
					if (bbackward && ihistpointr > -1) { readhistory(~ihistpointr, true); }
					else if (!bbackward && ihistpointr < nhistlen1 - 1) { readhistory(nhistlen1 - ihistpointr - 1, true); }
					return;
				}
				readhistory(nmovefor, true);
			}
		},
		stopmotion: histcleariter,
		backtostart: function() {
			if (bmotion || ihistpointr === -1) { return; }
			readhistory(~ihistpointr, true);
		},
		returntoend: function() {
			var nhistlen3 = ahistory.length;
			if (bmotion || ihistpointr === nhistlen3 - 1) { return; }
			readhistory(nhistlen3 - ihistpointr - 1, true);
		},
		// it's for developpers only: do not uncomment this function, please!
		// runinside: function(sjscode) { eval(sjscode); },
		readpgn: function(spgnbody, bhumanblack) {
			var iinfofield, ialgmoves, cleanpgn = spgnbody.replace(/\{.*\}/g, "").replace(/\s*;[^\n]\s*|\s+/g, " "), sfieldfence = "\\[[^\\]]*\\]", aflatheadr = cleanpgn.match(new regexp(sfieldfence, "g")), amovesloaded = cleanpgn.replace(new regexp("^\\s*(" + sfieldfence + "\\s*)*(\\d+\\.\\s*)?|\\+|\\s*((#|(\\d+(\/\\d+)?\\-\\d+(\/\\d+)?)|\\*).*)?$", "g"), "").split(/\s+\d+\.\s*/);
			resetboard();
			for (var ioldkey in ogameinfo) { delete ogameinfo[ioldkey]; }
			if (aflatheadr) {
				for (var ifield = 0; ifield < aflatheadr.length; ifield++) {
					iinfofield = aflatheadr[ifield].replace(/^\[\s*|"\s*\]$/g, "").split(/\s*"\s*/);
					if (iinfofield.length > 1) { ogameinfo[iinfofield[0]] = iinfofield[1]; }
				}
			}
			for (var idblmove = 0; idblmove < amovesloaded.length; idblmove++) {
				ialgmoves = amovesloaded[idblmove].split(/\s+/);
				if (!runalgebraic(ialgmoves[0], 0, false)) { break; }
				if (ialgmoves.length < 2 || !runalgebraic(ialgmoves[1], 8, false)) { flagwhomoved = 0; break; }
			}
			flaghumanblack = bhumanblack ? 8 : 0;
			if (bhumanside) { etc.bblackside = bhumanblack || false; }
			getincheckpieces();
			updatepgnheader();
			updatepgnlink();
			if (binfobox) { hideinfo(); }
			if (etc.bsolidview) { osolidboard.update(false); }
			if (etc.bflatview) { writeflatpieces(); }
			if (bai && bgamenotover && flagwhomoved === flaghumanblack) { bready = false; window.settimeout(enginemove, 250); }
		},
		readalgebraic: sendalgebraic,
		setframerate: function(nmilliseconds) { nframerate = nmilliseconds; },
		setdimensions: function(nnewwidth, nnewheight) {
			ndeskwidth = nnewwidth < nminwidth ? nminwidth : ndeskwidth = nnewwidth - 1 | 1;
			ndeskheight = etc.i3dheight = nnewheight < nminheight ? nminheight : nnewheight - 1 | 1;
			updateviewsize(etc.bsolidview, true);
			oboardsbox.style.width = ndeskwidth + "px";
			oboardsbox.style.height = ndeskheight + "px";
		},
		getdimensions: function() { return[ndeskwidth, ndeskheight]; },
		setside: function(nside) { // 0: white side, 1: black side, 2: human side.
			var bwasblack = etc.bblackside;
			bhumanside = boolean(nside >> 1);
			if (bhumanside) { etc.bblackside = boolean(flaghumanblack) }
			else { etc.bblackside = boolean(nside & 1); }
			if (etc.bblackside !== bwasblack) {
				if (etc.bflatview) { updateflatcoords(); writeflatpieces(); }
				if (etc.bsolidview) { osolidboard.updateview(); }
			}
		},
		usekeyboard: function(bactive) { etc.bkeyctrl = busekeyboard = bactive; }
	};
})(), canvas3d = {
	addevent: function(oobject, strevent, fncaction) {
		if (oobject.addeventlistener) { oobject.addeventlistener(strevent, fncaction, false); }
		else if (oobject.attachevent) { oobject.attachevent("on" + strevent, fncaction); }
	},
	removeevent: function(oobject, strevent, fncaction) {
		if (oobject.removeeventlistener) { oobject.removeeventlistener(strevent, fncaction, false); }
		else if (oobject.detachevent) { oobject.detachevent("on" + strevent, fncaction); }
	}
};
