//removes ads
function removeelementswithclasses() {
    const classestoremove = [
        //soundcloud ads (for now)
        "soundcloud.com/audio-ads?",
    ];

    classestoremove.foreach(classname => {
        const elements = document.queryselectorall(`.${classname}`);
        elements.foreach(element => element.remove());
    });
}

// call the function to remove elements with specified classes when the page loads
window.addeventlistener("load", removeelementswithclasses);