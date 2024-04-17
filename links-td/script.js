document.getelementbyid("search-input").addeventlistener("keydown", function () {
    const searchvalue = document.getelementbyid("search-input").value;
    const resultscontainer = document.getelementbyid("result");

    while (resultscontainer.firstchild) {


        resultscontainer.removechild(resultscontainer.firstchild);

    }
    var breake = document.createelement('br')
    var breake2 = document.createelement('br')
    var breake3 = document.createelement('br')
    var breake4 = document.createelement('br')

    
    resultscontainer.appendchild(breake)
    resultscontainer.appendchild(breake2)
    resultscontainer.appendchild(breake3)
    resultscontainer.appendchild(breake4)
    fetch("lightspeed.txt")
  .then((response) => response.text())
  .then((data) => {
    const links = data.split("\n");
    const resultscontainer = document.getelementbyid("result");

    for (const link of links) {
      const [name, url] = link.split(" ");
      if (name.tolowercase().includes(searchvalue.tolowercase())) {

        const linkelement = document.createelement("a");
        linkelement.href = url;
        linkelement.target = "_blank";
        linkelement.rel = "noopener,noreferrer";

        const listitem = document.createelement("div");
        listitem.classlist.add('itemclass')
      
        const textstuff = document.createelement('h1')
        textstuff.textcontent = name;
        textstuff.classlist.add('fixedtxt')




        listitem.appendchild(textstuff)



       


        linkelement.appendchild(listitem);

        resultscontainer.appendchild(linkelement);
      }
    }

    if (resultscontainer.children.length === 0) {
      resultscontainer.textcontent = "no matching links found.";
    }
  })
  .catch((error) => {
    console.error("error fetching links:", error);
  });

});

const searchvalue = document.getelementbyid("search-input").value;

    fetch("lightspeed.txt")
  .then((response) => response.text())
  .then((data) => {
    const links = data.split("\n");
    const resultscontainer = document.getelementbyid("result");

    for (const link of links) {
      const [name, url] = link.split(" ");
      if (name.tolowercase().includes(searchvalue.tolowercase())) {

        const linkelement = document.createelement("a");
        linkelement.href = url;
        linkelement.target = "_blank";
        linkelement.rel = "noopener,noreferrer";

        const listitem = document.createelement("div");
        listitem.classlist.add('itemclass')
      
        const textstuff = document.createelement('h1')
        textstuff.textcontent = name;
        textstuff.classlist.add('fixedtxt')




        listitem.appendchild(textstuff)



       


        linkelement.appendchild(listitem);

        resultscontainer.appendchild(linkelement);
      }
    }

    if (resultscontainer.children.length === 0) {
      resultscontainer.textcontent = "no matching links found.";
    }
  })
  .catch((error) => {
    console.error("error fetching links:", error);
  });

  console.warn('executed code with help from thatblockboi')
