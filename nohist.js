function openinunblocked(url)
{var mywindow=window.open("","_blank");mywindow.document.write("<title>google</title><link rel=\"icon\" type=\"image/x-icon\" href=\"https://www.google.com/favicon.ico\">")
mywindow.document.write("<iframe onload=\"\" id='iframe' width=\"100%\" height=\"100%\" style=\"border:none;\"></iframe>");mywindow.document.write("<script>settimeout(function() {document.getelementbyid('iframe').src = \""+url+"\"}, 500);</script>")
mywindow.document.write("<style>body { margin:0;}</style>")
mywindow.document.write("<script>function home(){document.getelementbyid('iframe').src = \""+url+"\"}</script>")
mywindow.document.close();mywindow.stop();window.location.replace('https://google.com');}
function check(elem) {
    var platformdiv =  document.getelementbyid('emulatorquestion') 
    var select =  document.getelementbyid('select') 
    var link =  document.getelementbyid('link') 
    if (elem.value == 'emulator') {
        platformdiv.style.display = "block";
        select.setattribute('required', '');
        link.style.display = "none";
    console.log('emulator') 
    } else {
        platformdiv.style.display = "none";
        select.removeattribute('required', '');
        link.style.display = "block";
    }
}
const info = []
const container = document.queryselector('.results');


const buttons = container.getelementsbytagname('button');
for (let i = 0; i < buttons.length; i++) {
    // get the current button element
    const button = buttons[i];
    const img = button.getelementsbytagname('img');
  data = {}

  data["onclick"] = button.getattribute("onclick")
  data["title"] = button.innertext
  data["category"] = button.classname.split(' ')
  data["imgsrc"] = img.getattribute('data-src')

  info.push(data)
}
console.log(info)
