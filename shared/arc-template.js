// ======================================================
// Detect character folder from /A1/p/
// ======================================================

const pathParts =
    window.location.pathname
        .split("/")
        .filter(Boolean);

const characterID =
    pathParts[pathParts.length - 2];


// ======================================================
// Check whether a value exists
// ======================================================

function exists(value) {
    return (
        value !== undefined &&
        value !== null &&
        value !== ""
    );
}


// ======================================================
// Add page styling
// ======================================================

function addStyles() {
    const style = document.createElement("style");

    style.innerHTML = `

        body {
            background-color:#bcc8cc;
            color:#0007E6;
            font-family:Arial,sans-serif;
            text-align:center;
            margin:0;
            padding:30px 15px;
        }

        h1,
        p {
            color:#0007E6;
        }

        .arc-description {
            width:90%;
            max-width:700px;
            margin:0 auto 30px;
        }

        .arc-image {
            width:70%;
            max-width:420px;
            height:auto;
            display:block;
            margin:20px auto;
        }

        .back-button {
            display:inline-block;
            margin:30px auto;
            padding:14px 24px;
            background:white;
            color:#0007E6;
            text-decoration:none;
            border-radius:25px;
        }

        .back-button:hover {
            transform:scale(1.05);
        }

    `;

    document.head.appendChild(style);
}

addStyles();


// ======================================================
// Load arc information
// ======================================================

async function loadArc() {
    try {
        const response =
            await fetch("../../shared/arcinfo.json");

        if (!response.ok) {
            throw new Error("Could not load arcinfo.json");
        }

        const arcData =
            await response.json();

        const arc =
            arcData[characterID] || {};

        buildPage(arc);
    } catch (error) {
        console.error(error);

        document.body.innerHTML = `
            <h1>Arc page unavailable</h1>
            <p>The arc information could not be loaded.</p>
        `;
    }
}

loadArc();


// ======================================================
// Build page
// ======================================================

function buildPage(arc) {
    document.title =
        exists(arc.title)
            ? arc.title
            : `${characterID} Arc`;

    const images =
        Array.isArray(arc.images)
            ? arc.images.filter(exists)
            : [];

    document.body.innerHTML = `

        ${exists(arc.title) ? `
            <h1>${arc.title}</h1>
        ` : ""}

        ${exists(arc.description) ? `
            <p class="arc-description">
                ${arc.description}
            </p>
        ` : ""}

        <section class="arc-images">

            ${images.map(image => `
                <img
                    class="arc-image"
                    src="./ARCIMAGE/${image}"
                    alt="${exists(arc.title) ? arc.title : characterID}"
                >
            `).join("")}

        </section>

        <a
            class="back-button"
            href="../"
        >
            Back to Character
        </a>

    `;
}