// ======================================================
// Find current character folder
// ======================================================

const characterID =
    window.location.pathname
        .split("/")
        .filter(Boolean)
        .pop();


// ======================================================
// Set favicon
// ======================================================

function setFavicon() {
    let favicon = document.querySelector('link[rel="icon"]');

    if (!favicon) {
        favicon = document.createElement("link");
        favicon.rel = "icon";
        document.head.appendChild(favicon);
    }

    favicon.type = "image/png";
    favicon.href = "../shared//RDWIMAGE/defaulticon.png";
}

setFavicon();


// ======================================================
// Check if value exists
// ======================================================

function exists(value) {
    return value !== undefined &&
           value !== null &&
           value !== "";
}


// ======================================================
// Apply styles
// ======================================================

function addStyles() {
    const style = document.createElement("style");

    style.innerHTML = `

body {
    background-color:#bcc8cc;
    text-align:center;
    font-family:Arial,sans-serif;
    color:#0007E6;
}

h1, h2, h3, h4, p, li {
    color:#0007E6;
}

header {
    width:95%;
    max-width:400px;
    margin-left:auto;
    margin-right:auto;
}

.back-button {
    display:inline-block;
    background-color:white;
    color:#0007E6;
    text-decoration:none;
    padding:14px 24px;
    margin:30px auto;
    border-radius:25px;
}

.back-button:hover {
    transform:scale(1.05);
}

.image-crop {
   