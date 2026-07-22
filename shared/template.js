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
// Apply temporary styling with JavaScript
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
// Load JSON data
// ======================================================

async function loadCharacter() {


    const rdw =
        await fetch("../shared/rdwinfo.json")
            .then(response => response.json());


    const game =
        await fetch("../shared/destinyswapinfo.json")
            .then(response => response.json());



    const character = rdw[characterID];

    const card = game[characterID];



    if (!character || !card) {

        document.body.innerHTML =
            "<h1>Character not found.</h1>";

        return;

    }



    buildPage(character, card);

}


loadCharacter();




// ======================================================
// Character Images
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
        `${character.number} - ${character.name}`;



    document.body.innerHTML = `




<header>


<img

src="./CHARICON/icon.png"

class="icon"

onerror="this.onerror=null; this.src='../shared/defaulticon.png';">



<h1>

${character.name}

</h1>



${character.subname ? `

<h3>

${character.subname}

</h3>

` : ""}



</header>







<section id="rdw">


${createImageSection()}




<p>

<strong>

${character.number} - ${character.name}

</strong>

</p>





<p>

${character.description}

</p>



</section>









<section id="destinyswap">


<h2>

Destiny Swap Rules

</h2>




<h3>

${character.name}

</h3>






<p>

<strong>

${card.cardType}

</strong>

&nbsp; | &nbsp;

<strong>

Cost:

</strong>

${card.cost}

</p>







<p>

<strong>

${card.coreType}

</strong>

&nbsp; | &nbsp;

<strong>

Power:

</strong>

${card.power}

&nbsp; | &nbsp;

<strong>

Endurance:

</strong>

${card.endurance}

</p>







<p>

<strong>

Health:

</strong>

${card.health}

&nbsp; | &nbsp;

<strong>

Initiative:

</strong>

${card.initiative}

</p>








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








<img

src="../shared/RDWIMAGE/CHARSHEET/${card.coreType}.png"

class="character-image">





</section>



`;

}