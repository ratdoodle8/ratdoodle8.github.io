// ======================================================
// Find current character folder
// ======================================================

const pathParts =
    window.location.pathname
        .split("/")
        .filter(Boolean);

let characterID =
    pathParts[pathParts.length - 1];

if (
    characterID.toLowerCase() === "index.html"
) {
    characterID =
        pathParts[pathParts.length - 2];
}

characterID =
    characterID.toUpperCase();

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
    favicon.href = "/shared/RDWIMAGE/defaulticon.png";
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
    --character-core-color:#0007E6;
    isolation:isolate;
    background-color:#bcc8cc;
    text-align:center;
    font-family:Arial,sans-serif;
    color:var(--character-core-color, #0007E6);
}

a, h1, h2, h3, h4, p, li {
    color:var(--character-core-color, #0007E6);
}

#character-silhouette {
    position:fixed;
    top:50%;left:50%;
    width:min(130vw, 1400px);height:125vh;
    z-index:-1;pointer-events:none;opacity:.15;
    background:var(--silhouette-color, #888);
    mask-repeat:no-repeat;mask-position:center;mask-size:contain;
    -webkit-mask-repeat:no-repeat;-webkit-mask-position:center;-webkit-mask-size:contain;
    transform:translate(-50%, -50%);
}
header {
    width:95%;
    max-width:400px;
    margin-left:auto;
    margin-right:auto;
}

.corner {
    margin-left:auto;
    margin-right:15px;
}

.corner td {
    padding:5px;
}

.back-button {
    display:inline-block;
    background-color:white;
    color:var(--character-core-color, #0007E6);
    text-decoration:none;
    padding:14px 24px;
    margin:30px auto;
    border-radius:25px;
}

.back-button:hover {
    transform:scale(1.05);
}

.image-crop {
    width:min(425px, calc(100vw - 30px));
    overflow:hidden;
    margin:15px auto;
    line-height:0;
    position:relative;
    left:50%;
    transform:translateX(-50%);
}

.character-image {
    width:100%;
    height:auto;
    display:block;
    margin:0;
}

.icon {
    width:120px;
    height:auto;
    display:block;
    margin:15px auto;
}

section {
    width:95%;
    max-width:400px;
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
    try {
        const rdwResponse =
            await fetch("/shared/rdwinfo.json");

        if (!rdwResponse.ok) {
            throw new Error("Could not load /shared/rdwinfo.json");
        }

        const rdw =
            await rdwResponse.json();

        let destiny = {};

        try {
            const destinyResponse =
                await fetch("/shared/destinyswapinfo.json");

            if (destinyResponse.ok) {
                destiny =
                    await destinyResponse.json();
            }
        } catch (error) {
            console.error(error);
        }

        const character =
            rdw[characterID] || {};

        const card =
            destiny[characterID] || {};

        let cores = [];
        try {
            const coreResponse = await fetch('/shared/core-types.json');
            if (coreResponse.ok) cores = (await coreResponse.json()).coreTypes || [];
        } catch (error) { console.error('Core types unavailable:', error); }
        const core = cores.find(c => c.number === Number(character.characterCoreType));
        buildPage(character, card, core);
    } catch (error) {
        console.error(error);

        document.body.innerHTML = `
            <p style="max-width:400px; margin:40px auto;">
                Character information could not be loaded.
            </p>
        `;
    }
}

loadCharacter();


// ======================================================
// Images
// ======================================================

function createImageSection() {
    return `

<section id="images">

<div class="image-crop">
    <img
        src="./CHARIMAGE/1.png"
        class="character-image"
    >
</div>

<details>

<summary>
    Show More Images
</summary>

<div class="extra-images">

    <div class="image-crop">
        <img
            src="./CHARIMAGE/2.png"
            class="character-image"
        >
    </div>

    <div class="image-crop">
        <img
            src="./CHARIMAGE/3.png"
            class="character-image"
        >
    </div>

    <div class="image-crop">
        <img
            src="./CHARIMAGE/4.png"
            class="character-image"
        >
    </div>

</div>

</details>

</section>

`;
}


// ======================================================
// Image cropping
// ======================================================

// CHANGE THIS NUMBER to crop more or less from BOTH the top and bottom.
const IMAGE_CROP_PERCENT = 20;

function sizeImageCrops() {
    const visiblePercent = 100 - (IMAGE_CROP_PERCENT * 2);

    document.querySelectorAll(".image-crop").forEach(crop => {
        const image = crop.querySelector(".character-image");

        const applyCrop = () => {
            if (!image.naturalWidth || !image.naturalHeight) {
                return;
            }

            const displayedWidth =
                Math.min(425, window.innerWidth - 30);

            const displayedHeight =
                image.naturalHeight *
                (displayedWidth / image.naturalWidth);

            image.style.transform =
                `translateY(-${IMAGE_CROP_PERCENT}%)`;

            crop.style.height =
                (displayedHeight *
                (visiblePercent / 100)) + "px";
        };

        if (image.complete) {
            applyCrop();
        } else {
            image.addEventListener("load", applyCrop, { once:true });
        }
    });
}


// ======================================================
// Special hyperlinks
// ======================================================

function formatListItem(item) {
    if (item === "Glitter Burst") {
        return `<a href="/ds/glitterburst">Glitter Burst</a>`;
    }

    return item;
}


// ======================================================
// Build Page
// ======================================================

function buildPage(character, card, core) {
    const accent = core?.primaryColor?.hex;
    document.body.style.setProperty('--character-core-color', /^#[0-9a-f]{6}$/i.test(accent || '') ? accent : '#0007E6');
    document.title =
        exists(character.name)
        ? character.name
        : "Character";

    document.body.innerHTML = `

<table class="corner">
    <tr>
        <td><a href="/characters">All Characters</a></td>
        <td><a href="/">Home</a></td>
    </tr>
</table>

<header>

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
${core ? `<p class="character-core-stat">Core Type: ${core.number} — ${core.name}</p>` : ""}

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
            ability => `<li>${formatListItem(ability)}</li>`
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
            spell => `<li>${formatListItem(spell)}</li>`
        )
        .join("")}
</ul>

` : ""}

<a class="back-button" href="./p/">
    Archive
</a>

${exists(card.coreType) ? `

<div class="image-crop">
    <img
        src="../shared/RDWIMAGE/CHARSHEET/${card.coreType}.png"
        class="character-image"
    >
</div>

` : ""}

</section>

`;

    setupCharacterSilhouette();
    sizeImageCrops();

    document.querySelectorAll("details").forEach(dropdown => {
        dropdown.addEventListener("toggle", sizeImageCrops);
    });

    window.addEventListener("resize", sizeImageCrops);
}
// Preserve the PNG alpha shape; sample visible pixels for an alpha-weighted average.
function averageVisibleColor(data) {
    let r=0,g=0,b=0,weight=0;
    for(let i=0;i<data.length;i+=4) {
        const alpha=data[i+3]/255;
        r+=data[i]*alpha;g+=data[i+1]*alpha;b+=data[i+2]*alpha;weight+=alpha;
    }
    if(!weight)return null;
    return 'rgb('+[r,g,b].map(v=>Math.round(v/weight)).join(', ')+')';
}
function setupCharacterSilhouette() {
    const source=new Image();
    source.onload=()=>{
        const canvas=document.createElement('canvas');
        const ratio=Math.min(1,128/Math.max(source.naturalWidth,source.naturalHeight));
        canvas.width=Math.max(1,Math.round(source.naturalWidth*ratio));
        canvas.height=Math.max(1,Math.round(source.naturalHeight*ratio));
        const context=canvas.getContext('2d',{willReadFrequently:true});
        if(!context)return;
        try {
            context.drawImage(source,0,0,canvas.width,canvas.height);
            const color=averageVisibleColor(context.getImageData(0,0,canvas.width,canvas.height).data);
            if(!color)return;
            const layer=document.createElement('div');
            layer.id='character-silhouette';layer.setAttribute('aria-hidden','true');
            layer.style.setProperty('--silhouette-color',color);
            layer.style.maskImage='url("'+source.src+'")';
            layer.style.webkitMaskImage='url("'+source.src+'")';
            document.body.prepend(layer);
            const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
            let pending=false;
            const draw=()=>{
                pending=false;
                const fraction=window.scrollY/Math.max(1,document.documentElement.scrollHeight-window.innerHeight);
                const offset=reduced.matches?0:(fraction-.5)*window.innerHeight*.3;
                const rotation=reduced.matches?0:(fraction-.5)*8;
                layer.style.transform='translate(-50%, calc(-50% + '+offset+'px)) rotate('+rotation+'deg)';
            };
            const schedule=()=>{if(!pending){pending=true;requestAnimationFrame(draw);}};
            window.addEventListener('scroll',schedule,{passive:true});
            window.addEventListener('resize',schedule);
            reduced.addEventListener?.('change',schedule);
            draw();
        } catch(error) { console.error('Character silhouette unavailable:',error); }
    };
    source.src='/'+encodeURIComponent(characterID)+'/CHARIMAGE/1.png';
}
