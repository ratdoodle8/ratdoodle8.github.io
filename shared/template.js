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
// Apply styling
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


    h1, h2, h3, p, li {

        color:#0007E6;

    }


    .character-image {

        width:95%;
        max-width:600px;
        height:600px;

        display:block;

        margin:15px auto;

        object-fit:cover;

        object-position:center;

    }


    .extra-images .character-image {

        height:400px;

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


    const game =
        await fetch("../shared/destinyswapinfo.json")
            .then(response => response.json());



    const character = rdw[characterID] || {};

    const card = game[characterID] || {};



    buildPage(character, card);


}


loadCharacter();




// ======================================================
// Image Section
// ======================================================

function createImageSection() {


    return `


<section id="images">


<img

src="./CHARIMAGE/1.png"

class="character-image">





<details>


<summary>

Show More Images

</summary>





<div class="extra-images">


<img

src="./CHARIMAGE/2.png"

class="character-image">



<img

src="./CHARIMAGE/3.png"

class="character-image">



<img

src="./CHARIMAGE/4.png"

class="character-image">



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
character.name || "Character";



document.body.innerHTML = `



<header>



<img

src="./CHARICON/icon.png"

class="icon"

onerror="this.onerror=null; this.src='../shared/defaulticon.png';">






${character.name ? `

<h1>

${character.name}

</h1>

` : ""}







${character.subname ? `

<h3>

${character.subname}

</h3>

` : ""}



</header>








<section id="rdw">


${createImageSection()}








${character.number || character.name ? `

<p>

<strong>

${character.number || ""}

${character.number && character.name ? " - " : ""}

${character.name || ""}

</strong>

</p>

` : ""}








${character.description ? `

<p>

${character.description}

</p>

` : ""}





</section>









<section id="destinyswap">



<h2>

Destiny Swap Rules

</h2>






${character.name ? `

<h3>

${character.name}

</h3>

` : ""}









${card.cardType || card.cost ? `

<p>

${card.cardType ? `<strong>${card.cardType}</strong>` : ""}

${card.cardType && card.cost ? " | " : ""}

${card.cost ? `<strong>Cost:</strong> ${card.cost}` : ""}

</p>

` : ""}









${card.coreType || card.power || card.endurance ? `

<p>

${card.coreType ? `<strong>${card.coreType}</strong>` : ""}

${card.coreType && card.power ? " | " : ""}

${card.power ? `<strong>Power:</strong> ${card.power}` : ""}

${card.power && card.endurance ? " | " : ""}

${card.endurance ? `<strong>Endurance:</strong> ${card.endurance}` : ""}

</p>

` : ""}









${card.health || card.initiative ? `

<p>

${card.health ? `<strong>Health:</strong> ${card.health}` : ""}

${card.health && card.initiative ? " | " : ""}

${card.initiative ? `<strong>Initiative:</strong> ${card.initiative}` : ""}

</p>

` : ""}










${card.abilities && card.abilities.length ? `

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









${card.spells && card.spells.length ? `

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










${card.coreType ? `

<img

src="../shared/RDWIMAGE/CHARSHEET/${card.coreType}.png"

class="character-image"

>

` : ""}






</section>



`;

}