function alertfnc() {
  var alertdiv = document.createelement('div')
  alertdiv.setattribute('class', 'toast-container p-3 bottom-0')
  alertdiv.setattribute('style', 'position: fixed;')
alertdiv.innerhtml = `
<div class="toast fade show" role="alert" aria-live="assertive" aria-atomic="true">
<div class="toast-header">
  
  <strong class="me-auto">full screen</strong>
  <button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="close"></button>
</div>
<div style="color: black;"class="toast-body">
  press ctrl-shift-f to go full screen
</div>
</div>`
document.body.prepend(alertdiv);
}
if (document.getelementsbyclassname('fa-expand') !== null) {
  console.log('not button')
  document.onkeyup = function(e) {
    if ( e.key == 'f' && e.ctrlkey && e.shiftkey) {
     console.log('full screen')
     ifullscreen();
    }
 }
const bootstrapjs = document.createelement("script");
bootstrapjs.setattribute(
  "src",
  "https://cdn.jsdelivr.net/npm/bootstrap@5.2.3/dist/js/bootstrap.bundle.min.js"
);
const bootstrapcss = document.createelement("link");
bootstrapcss.setattribute(
  "rel",
  "stylesheet"
);
bootstrapcss.setattribute(
  "href",
  "https://cdn.jsdelivr.net/npm/bootstrap@5.2.3/dist/css/bootstrap.min.css"
);
  alertfnc()
document.body.append(bootstrapjs, bootstrapcss);

}
let url = window.location.pathname; //get path
let host = window.location.host
/*let urlsub = "";
if (urlstring.indexof("html") > -1) {
  //check of html string in url.
  urlsub = urlstring.substring(1, urlstring.lastindexof("."));
}*/
let pageurl = "";

if (url.indexof("html") > -1) {
  pageurl = url.match(/([^\/]+)(?=\.\w+$)/)[0];
} else {
  pageurl = url.substring(url.lastindexof("/") + 1, url.length);
}

//if we find a match for the element, create the info


const buildogdiv = (games) => {
  const $divwrap = document.createelement("div");
  $divwrap.classlist.add("og-item");
  const $imgcontainer = buildimgcontainer(games);
  const $gridcardtext = buildgridcardtext(games);

  $divwrap.appendchild($imgcontainer);
  $divwrap.appendchild($gridcardtext);
  return $divwrap;
};

const buildimgcontainer = (games) => {
  const $imgcontainer = document.createelement("div"); //create div imagecontainer
  $imgcontainer.classlist.add("img-container");

  const $anchor = document.createelement("a"); //create anchor tag inside that
  $anchor.href = "/" + games.link + ".html";

  const $imgtag = document.createelement("img"); //create the img tag
  $imgtag.classlist.add("hover-center");
  $imgtag.src = "/assets/img/games/" + games.imgsrc;
  $imgtag.alt = games.name; //alt is the same as the game's name

  $anchor.appendchild($imgtag);
  $imgcontainer.appendchild($anchor);

  return $imgcontainer;
};

const buildgridcardtext = (games) => {
  const $gridcardtext = document.createelement("div"); //create div gridcardtext
  $gridcardtext.classlist.add("grid-card-text");

  const $p = document.createelement("p"); //create the p tag
  $p.classlist.add("game-name");
  $p.innertext = games.name; //set the title

  const $h1 = document.createelement("h1"); //create h1 tag inside that
  $h1.classlist.add("game-developer");
  $h1.innertext = "by " + games.developer;

  $gridcardtext.appendchild($p);
  $gridcardtext.appendchild($h1);

  return $gridcardtext;
};

//# of elements for other games

const randomgame = () => {
  settimeout(() => {
    let elemcount = 2;

    if (document.getelementsbyclassname("adsbygoogle")[0]){
      if (document.getelementsbyclassname("adsbygoogle")[0].dataset.adstatus == 'filled'){
        elemcount = 1;
      }
    }
    const set = new set();
    while (set.size < elemcount) {
      set.add(math.floor(math.random() * gamesarr.length)); //add 5 random numbers to the set
    }

    const ogwrap = document.queryselector(".og-wrap");

    let ind = set.values(); //set of 5 random numbers w/o dupes
    for (let i = 0; i < elemcount; i++) {
      let randind = ind.next().value; //get each value from the set
      let $item = buildogdiv(gamesarr[randind]);
      ogwrap.appendchild($item);
    }
  }, 2000)
};

randomgame();

//fullscreen function
const reqfs = (elem) => {
  if (elem.requestfullscreen) {
    elem.requestfullscreen();
  } else if (elem.mozrequestfullscreen) {
    elem.mozrequestfullscreen();
  } else if (elem.webkitrequestfullscreen) {
    elem.webkitrequestfullscreen();
  } else if (elem.msrequestfullscreen) {
    elem.msrequestfullscreen();
  }
};

//iframe fullscreen
const ifullscreen = () => {
  const elem = document.getelementsbytagname("iframe")[0];
  reqfs(elem);
};

//canvas fullscreen
const cfullscreen = () => {
  const elem = document.getelementbyid("canvas");
  reqfs(elem);
};

//ruffle fullscreen
const rfullscreen = () => {
  const elem = document.getelementbyid("player");
  reqfs(elem);
};

//emulator fullscreen
const efullscreen = () => {
  const elem = document.getelementbyid("game");
  reqfs(elem);
};
