const buildfilterdiv = (games) => {
    const $divwrap = document.createelement("div");
    $divwrap.classlist.add("filter-item");
    for (var i = 0; i < games.filter.length; i++){
        $divwrap.classlist.add(games.filter[i]);
    }

    const $imgcontainer = buildimgcontainer(games);
    const $gridcardtext = buildgridcardtext(games);

    const $filtermask = document.createelement("div");
    $filtermask.classlist.add("hover-div");

    const $back = document.createelement("div");
    $back.classlist.add("back");

    $divwrap.appendchild($back);
    $divwrap.appendchild($imgcontainer);
    $divwrap.appendchild($gridcardtext);
    $divwrap.appendchild($filtermask);
    
    return $divwrap;
  };

  const buildimgcontainer = (games) => {
    const $imgcontainer = document.createelement("div"); //create div imagecontainer
    $imgcontainer.classlist.add("img-container");

    const $anchor = document.createelement("a"); //create anchor tag inside that
    $anchor.href = "/" + games.link + ".html";

    const $imgtag = document.createelement("img"); //create the img tag
    $imgtag.setattribute("decoding", "true")
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
    $h1.classlist.add("text-lg text-white md:text-xl 2xl:text-2xl font-extrabold tracking-tight");
    $h1.innertext = "by " + games.developer;

    $gridcardtext.appendchild($p);
    $gridcardtext.appendchild($h1);

    return $gridcardtext;
  };

  const filterwrap = document.queryselector(".filter-wrap");

  for (let i = 0; i < gamesarr.length; i++) {
    let $item = buildfilterdiv(gamesarr[i]);
    filterwrap.appendchild($item);
  }

//create element for no filter matched
const $noitem = document.createelement("div");
$noitem.classlist.add("filter-no-item");
$noitem.innertext = "sorry, no games match your filter selections";
document.queryselector(".filter-wrap").appendchild($noitem);

//random game
const randgame = () => {
  for (let i = 0; i < gamesarr.length; i++){
    let randind = math.floor(math.random() * gamesarr.length);
    window.location = "/" + gamesarr[randind].link + ".html";
  }
}