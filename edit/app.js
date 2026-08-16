// Change this only if Cloudflare gives the new Worker
// a different address.

const CHARACTER_EDIT_URL =
    "https://ratdoodle-edit-worker.ratdoodle8.workers.dev";


const editForm =
    document.getElementById(
        "edit-form"
    );


const characterEdits =
    document.getElementById(
        "character-edits"
    );


const characterTemplate =
    document.getElementById(
        "character-template"
    );


const addCharacterButton =
    document.getElementById(
        "add-character-button"
    );


const updateButton =
    document.getElementById(
        "update-button"
    );


const statusMessage =
    document.getElementById(
        "status-message"
    );


// ======================================================
// Status message
// ======================================================

function showStatus(
    message,
    type = ""
) {

    statusMessage.textContent =
        message;


    statusMessage.dataset.type =
        type;

}


// ======================================================
// Admin key
// ======================================================

function getAdminKey() {

    let adminKey =
        sessionStorage.getItem(
            "ratdoodle-admin-key"
        );


    if (!adminKey) {

        adminKey =
            window.prompt(
                "Enter your Ratdoodle admin key:"
            );


        if (adminKey) {

            sessionStorage.setItem(
                "ratdoodle-admin-key",
                adminKey
            );

        }

    }


    return adminKey
        ? adminKey.trim()
        : "";

}


// ======================================================
// Update character section labels
// ======================================================

function updateCharacterLabels() {

    const sections = [
        ...characterEdits.querySelectorAll(
            ".character-edit"
        )
    ];


    sections.forEach(
        (section, index) => {

            section
                .querySelector("legend")
                .textContent =
                    `Character ${index + 1}`;


            section
                .querySelector(
                    ".remove-character-button"
                )
                .hidden =
                    sections.length === 1;

        }
    );

}


// ======================================================
// Add character section
// ======================================================

function addCharacterSection() {

    const section =
        characterTemplate
            .content
            .firstElementChild
            .cloneNode(true);


    section
        .querySelector(
            ".remove-character-button"
        )
        .addEventListener(
            "click",
            () => {

                section.remove();

                updateCharacterLabels();

            }
        );


    characterEdits.appendChild(
        section
    );


    updateCharacterLabels();

}


// ======================================================
// Read optional field
// ======================================================

function optionalValue(
    section,
    selector
) {

    const value =
        section
            .querySelector(selector)
            .value
            .trim();


    return value === ""
        ? undefined
        : value;

}


// ======================================================
// Read one character edit
// ======================================================

function readCharacterEdit(section) {

    const characterNumber =
        section
            .querySelector(
                ".character-number"
            )
            .value
            .trim();


    const coreLoreText =
        section
            .querySelector(
                ".stat-core-lore"
            )
            .value
            .trim();


    const fields = {

        number:
            optionalValue(
                section,
                ".stat-number"
            ),

        name:
            optionalValue(
                section,
                ".stat-name"
            ),

        subname:
            optionalValue(
                section,
                ".stat-subname"
            ),

        description:
            optionalValue(
                section,
                ".stat-description"
            ),

        editdate:
            optionalValue(
                section,
                ".stat-editdate"
            )

    };


    if (coreLoreText) {

        let coreLore;


        try {

            coreLore =
                JSON.parse(
                    coreLoreText
                );

        } catch {

            throw new Error(

                `${
                    characterNumber ||
                    "A character"
                }: Core Lore is not valid JSON.`

            );

        }


        if (
            !coreLore ||
            typeof coreLore !== "object" ||
            Array.isArray(coreLore)
        ) {

            throw new Error(

                `${
                    characterNumber ||
                    "A character"
                }: Core Lore must be a JSON object.`

            );

        }


        fields.coreLore =
            coreLore;

    }


    Object.keys(fields)
        .forEach(
            key => {

                if (
                    fields[key] ===
                    undefined
                ) {

                    delete fields[key];

                }

            }
        );


    return {

        characterNumber,

        fields

    };

}


// ======================================================
// Add another character button
// ======================================================

addCharacterButton.addEventListener(
    "click",
    () => {

        addCharacterSection();


        characterEdits
            .lastElementChild
            .querySelector(
                ".character-number"
            )
            .focus();

    }
);


// ======================================================
// Submit edits
// ======================================================

editForm.addEventListener(
    "submit",

    async event => {

        event.preventDefault();


        const adminKey =
            getAdminKey();


        if (!adminKey) {

            showStatus(
                "The admin key is required.",
                "error"
            );

            return;

        }


        let characters;


        try {

            characters = [

                ...characterEdits
                    .querySelectorAll(
                        ".character-edit"
                    )

            ].map(
                readCharacterEdit
            );

        } catch (error) {

            showStatus(
                error.message,
                "error"
            );

            return;

        }


        const normalizedNumbers =
            characters.map(
                character =>
                    character
                        .characterNumber
                        .toUpperCase()
            );


        if (
            normalizedNumbers.some(
                number => !number
            )
        ) {

            showStatus(
                "Enter a character number for every character section.",
                "error"
            );

            return;

        }


        if (
            new Set(
                normalizedNumbers
            ).size !==
            normalizedNumbers.length
        ) {

            showStatus(
                "Each character number can only be included once.",
                "error"
            );

            return;

        }


        updateButton.disabled =
            true;


        addCharacterButton.disabled =
            true;


        updateButton.textContent =
            "Updating...";


        showStatus(
            "Updating character information...",
            "loading"
        );


        try {

            const response =
                await fetch(

                    CHARACTER_EDIT_URL,

                    {
                        method:
                            "POST",

                        headers: {

                            "Content-Type":
                                "application/json",

                            "X-Admin-Key":
                                adminKey

                        },

                        body:
                            JSON.stringify({
                                characters
                            })
                    }

                );


            let result = {};


            try {

                result =
                    await response.json();

            } catch {

                // Worker did not return JSON.

            }


            if (!response.ok) {

                if (
                    response.status === 401 ||
                    response.status === 403
                ) {

                    sessionStorage.removeItem(
                        "ratdoodle-admin-key"
                    );

                }


                throw new Error(

                    result.error ||

                    result.message ||

                    `Update failed with status ${response.status}.`

                );

            }


            const count =
                Array.isArray(
                    result.characters
                )

                    ? result.characters.length

                    : characters.length;


            showStatus(

                `Successfully updated ${count} character${
                    count === 1
                        ? ""
                        : "s"
                }.`,

                "success"

            );


            editForm.reset();


            characterEdits.innerHTML =
                "";


            addCharacterSection();

        } catch (error) {

            console.error(error);


            showStatus(

                error.message ||
                "The character update failed.",

                "error"

            );

        } finally {

            updateButton.disabled =
                false;


            addCharacterButton.disabled =
                false;


            updateButton.textContent =
                "Update Characters";

        }

    }
);


// ======================================================
// Add first character section
// ======================================================

addCharacterSection();