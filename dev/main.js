// create an array to store blocked patterns
var blockedpatterns = [];

// load the text file containing blocked patterns
fetch('https://sz-games.github.io/dev/.txt')
  .then(response => response.text())
  .then(data => {
    // split the text file content into an array of patterns
    blockedpatterns = data.split('\n');

    // remove elements matching blocked patterns
    blockedpatterns.foreach(pattern => {
      var elements = document.queryselectorall('*');
      elements.foreach(element => {
        if (element.id.includes(pattern) || element.classname.includes(pattern)) {
          element.remove();
        }
      });
    });
  })
  .catch(error => console.error('error loading the text file: ' + error));
