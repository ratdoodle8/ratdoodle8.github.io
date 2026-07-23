// ======================================================
// Find current character folder
// ======================================================

const characterID =
    window.location.pathname
        .split("/")
        .filter(Boolean)
        .pop();


// ======================================================
// Styling block (saved for later CSS conversion)
// ======================================================

/*

body {
    background-color:#bcc8cc;
    text-align:center;
    font-family:Arial,sans-serif;
    color:#0007E6;
}


.character-image {

    max-width:100%;
    max-height:600px;
    height:auto;
    display:block;
    margin:auto;

}

*/


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



.character-image {

    width:66%;

    max-width:420px;

    height:420px;

    display:block;

    margin:15px auto;

    object-fit:cover;

    object-position:center;

    clip-path: inset(10% 0 10% 0);

}



.extra-images .character-image {

    height:280px;

}



.icon {

    width:120px;

    height:auto;

    display:block;

    margin:15px auto;

}



section {

    width:95%;

    margin:25px auto;

}



details {

    width:95%;

    margin:auto;

}



summary {

    cursor:pointer;

    margin:15px;

}


`;

    document.head.appendChild(style);

}


addStyles();




// ======================================================
// Load JSON
// ======================================================

async function loadCharacter() {


    const rdw =
        await fetch("../shared/rdwinfo.json")
        .then(response => response.json());



    const destiny =
        await fetch("../shared/destinyswapinfo.json")
        .then(response => response.json());



    const character =
        rdw[characterID] || {};



    const card =
        destiny[characterID] || {};



    buildPage(character, card);


}



loadCharacter();




// ======================================================
// Images
// ======================================================

function createImageSection() {


return `


<section id="images">


<img

src="./CHARIMAGE/1.png"

class="character-image"

>




<details>


<summary>

Show More Images

</summary>




<div class="extra-images">


<img

src="./CHARIMAGE/2.png"

class="character-image"

>



<img

src="./CHARIMAGE/3.png"

class="character-image"

>



<img

src="./CHARIMAGE/4.png"

class="character-image"

>



</div>


</details>


</section>


`;

}




// ======================================================
// Build Page
// ======================================================

function buildPage(character, card) {


document.title =
exists(character.name)
? character.name
: "Character";



document.body.innerHTML = `



<header>



<img

src="./CHARICON/icon.png"

class="icon"

onerror="this.onerror=null; this.src='../shared/RDWIMAGE/defaulticon.png';"

>





${exists(character.name) ? `


<h1>

${character.name}

</h1>



${exists(character.subname) ? `

<h3>

${character.subname}

</h3>

` : ""}


` : ""}



</header>








<section id="rdw">


${createImageSection()}





${exists(character.number) || exists(character.name) ? `

<p>

<strong>

${exists(character.number) ? character.number : ""}

${exists(character.number) && exists(character.name) ? " - " : ""}

${exists(character.name) ? character.name : ""}

${exists(character.subname) ? " - " + character.subname : ""}

</strong>

</p>


` : ""}





${exists(character.description) ? `

<p>

${character.description}

</p>

` : ""}



</section>









<section id="destinyswap">



<h2>

Destiny Swap Rules

</h2>





${exists(character.name) ? `


<h3>

${character.name}

</h3>



${exists(character.subname) ? `

<h4>

${character.subname}

</h4>

` : ""}



` : ""}










${exists(card.cardType) || exists(card.cost) ? `


<p>


${exists(card.cardType)

? card.cardType

: ""}



${exists(card.cardType) && exists(card.cost)

? " | "

: ""}



${exists(card.cost)

? "Cost: " + card.cost + 
(exists(card.costType) ? " " + card.costType : "")

: ""}


</p>


` : ""}









${exists(card.coreType) ||
exists(card.power) ||
exists(card.endurance) ? `


<p>


${exists(card.coreType)

? card.coreType

: ""}



${exists(card.coreType) && exists(card.power)

? " | "

: ""}



${exists(card.power)

? "Power: " + card.power

: ""}



${exists(card.power) && exists(card.endurance)

? " | "

: ""}



${exists(card.endurance)

? "Endurance: " + card.endurance

: ""}



</p>


` : ""}









${exists(card.health) ||
exists(card.initiative) ? `


<p>


${exists(card.health)

? "Health: " + card.health

: ""}



${exists(card.health) && exists(card.initiative)

? " | "

: ""}



${exists(card.initiative)

? "Initiative: " + card.initiative

: ""}



</p>


` : ""}









${card.abilities?.length ? `


<h3>

Abilities

</h3>



<ul>


${card.abilities

.map(

ability => `<li>${ability}</li>`

)

.join("")}


</ul>


` : ""}









${card.spells?.length ? `


<h3>

Spells

</h3>



<ul>


${card.spells

.map(

spell => `<li>${spell}</li>`

)

.join("")}


</ul>


` : ""}









${exists(card.coreType) ? `


<img

src="../shared/RDWIMAGE/CHARSHEET/${card.coreType}.png"

class="character-image"


>


` : ""}




</section>



`;

}