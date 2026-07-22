// ======================================================
// Find current character folder
// Example:
// website.com/A1/
// returns "A1"
// ======================================================

const characterID =
    window.location.pathname
        .split("/")
        .filter(Boolean)
        .pop();


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
// Image section
// ======================================================

function createImageSection() {

    return `

    <section id="images">


        <img
            src="./CHARIMAGE/1.png"
            class="main-image">


        <details>


            <summary>
                Show More Images
            </summary>


            <div class="extra-images">


                <img
                    src="./CHARIMAGE/2.png">


                <img
                    src="./CHARIMAGE/3.png">


                <img
                    src="./CHARIMAGE/4.png">


            </div>


        </details>


    </section>

    `;

}



// ======================================================
// Build entire page
// ======================================================

function buildPage(character, card) {


    document.title =
        `${character.number} - ${character.name}`;


    document.body.innerHTML = `



<header>


    <img

        src="./CHARICON/icon.png"

        class="icon">
	onerror="this.onerror=null; this.src='../shared/defaulticon.png';">

    <h1>
        ${character.name}
    </h1>


    <h3>
        ${character.subname}
    </h3>


</header>





<section id="rdw">


    ${createImageSection()}


    <h2>

        ${character.number}
        -
        ${character.name}

    </h2>



    <p>

        ${character.description}

    </p>


</section>






<section id="destinyswap">


<h2>
    Destiny Swap
</h2>




<p>
<strong>
Card Type:
</strong>

${card.cardType}

</p>




<p>
<strong>
Core Type:
</strong>

${card.coreType}

</p>




<p>
<strong>
Cost:
</strong>

${card.cost}

</p>




<p>
<strong>
Power:
</strong>

${card.power}

</p>




<p>
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

</p>




<p>
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
        ability =>
        `<li>${ability}</li>`
    )
    .join("")}

</ul>






<h3>
Spells
</h3>




<ul>

${card.spells
    .map(
        spell =>
        `<li>${spell}</li>`
    )
    .join("")}

</ul>







<img

src="../shared/RDWIMAGE/CHARSHEET/${card.coreType}.png"

class="charsheet">


</section>



`;

}