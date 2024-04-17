    function getcookie(name) {
        const cookiename = name + "=";
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            let cookie = cookies[i];
            while (cookie.charat(0) === ' ') {
                cookie = cookie.substring(1);
            }
            if (cookie.indexof(cookiename) === 0) {
                return cookie.substring(cookiename.length, cookie.length);
            }
        }
        return '';
    }


     
    
    //alert('hi')
    let setting14b = getcookie("pageprevent");

    function checkpageclose(event) {
      
        
            event.returnvalue = "prevent page close is active, you can click off of this";
      
       
     
    }
    function checkpageclose2() {
        if(setting14b==="true") {
        
            window.onbeforeunload = function(event) {
                // return a string to prevent the page from closing
                event.preventdefault();
                return "prevent page close is active, you can click off of this";
            };
            window.addeventlistener("beforeunload", checkpageclose);

        } 
        if(setting14b==="false") {
        
        }
    }
    console.log('cookiepage value: ' + setting14b + "szgames-scripts loaded")
    checkpageclose2()


    //cloak

    let tabdata = {};
const tab = localstorage.getitem("tab");

if (tab) {
  try {
    tabdata = json.parse(tab);
  } catch (e) {
    console.log("error parsing tab data from localstorage", e);
  }
} else {

}

const settingsdefaulttab = {
  title: "settings - UTC Games",
  icon: "https://github.com/sz-games/home/blob/main/g.png?raw=true",
};

const settitle = (title = "") => {
  document.title = title || settingsdefaulttab.title;
  if (title) {
    tabdata.title = title;
  } else {
    delete tabdata.title;
  }
  localstorage.setitem("tab", json.stringify(tabdata));
};

const setfavicon = (url) => {
  const faviconlink = document.queryselector("link[rel='icon']");
  
  // try to load the url as an image
  const img = new image();
  img.src = url;
  img.onload = () => {
    faviconlink.href = url;
    if (url) {
      tabdata.icon = url;
    } else {
      delete tabdata.icon;
    }
    localstorage.setitem("tab", json.stringify(tabdata));
  };

  img.onerror = () => {
    // if the url is not an image, use google's favicon api
    const faviconurl = `https://www.google.com/s2/favicons?sz=64&domain=${url}`;
    faviconlink.href = faviconurl || settingsdefaulttab.icon;
    if (url) {
      tabdata.icon = faviconurl;
    } else {
      delete tabdata.icon;
    }
    localstorage.setitem("tab", json.stringify(tabdata));
  };
};


const resettab = () => {
  settitle();
  setfavicon();

  localstorage.setitem("tab", json.stringify({}));
};


if (tabdata.title) {
  document.title = tabdata.title;
}

if (tabdata.icon) {
  const faviconlink = document.queryselector("link[rel='icon']");
  faviconlink.href = tabdata.icon;
}

//panic
let panic = localstorage.getitem('panic')

if(panic) {
    document.addeventlistener('keydown', function(event) {
        if (event.key === '\\') {
            // backslash key was pressed
            console.log("panic");
            window.location = panic;
        }
    });
    
} else {
    console.log('clear')
}

function panicurl() {
    let url3 = document.getelementbyid('url-target2').value

    if(url3.includes("https://")) {
    

        localstorage.setitem('panic', url3)

        panic = localstorage.getitem('panic')
    } else {
        

        localstorage.setitem('panic', 'https://' + url3)

        panic = localstorage.getitem('panic')
    }
}

function clearpanic() {

    localstorage.clear('panic')

    console.log('clear')
    panic = localstorage.getitem('panic')

}