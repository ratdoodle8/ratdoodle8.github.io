const WORKER_URL =
    "https://ratdoodle-worker.ratdoodle8.workers.dev";

const uploadForm = document.getElementById("upload-form");
const imageInput = document.getElementById("image");
const imagePreview = document.getElementById("image-preview");
const previewContainer = document.getElementById("preview-container");
const titleInput = document.getElementById("title");
const paragraphInput = document.getElementById("paragraph");
const tagsInput = document.getElementById("tags");
const uploadButton = document.getElementById("upload-button");
const statusMessage = document.getElementById("status-message");

let previewURL = null;

function showStatus(message, type = "") {
    statusMessage.textContent = message;
    statusMessage.dataset.type = type;
}

function parseTags(value) {
    return [
        ...new Set(
            value
                .split(",")
                .map(tag => tag.trim())
                .filter(Boolean)
        )
    ];
}

function resetPreview() {
    if (previewURL) {
        URL.revokeObjectURL(previewURL);
        previewURL = null;
    }

    imagePreview.removeAttribute("src");
    previewContainer.hidden = true;
}

function getAdminKey() {
    let adminKey = sessionStorage.getItem("ratdoodle-admin-key");

    if (!adminKey) {
        adminKey = window.prompt(
            "Enter your Ratdoodle admin key:"
        );

        if (adminKey) {
            sessionStorage.setItem(
                "ratdoodle-admin-key",
                adminKey
            );
        }
    }

    return adminKey ? adminKey.trim() : "";
}

function loadImage(file) {
    return new Promise((resolve, reject) => {
        const image = new Image();
        const objectURL = URL.createObjectURL(file);

        image.onload = () => {
            URL.revokeObjectURL(objectURL);
            resolve(image);
        };

        image.onerror = () => {
            URL.revokeObjectURL(objectURL);
            reject(
                new Error(
                    "This image format could not be opened. Try saving it as JPG or PNG first."
                )
            );
        };

        image.src = objectURL;
    });
}

async function convertImageToPNG(file) {
    if (file.type === "image/png") {
        return file;
    }

    const image = await loadImage(file);

    const canvas = document.createElement("canvas");
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;

    const context = canvas.getContext("2d");

    if (!context) {
        throw new Error("Could not prepare the image.");
    }

    context.drawImage(image, 0, 0);

    const blob = await new Promise((resolve, reject) => {
        canvas.toBlob(result => {
            if (result) {
                resolve(result);
            } else {
                reject(
                    new Error(
                        "The image could not be converted to PNG."
                    )
                );
            }
        }, "image/png");
    });

    return new File(
        [blob],
        "upload.png",
        {
            type: "image/png"
        }
    );
}

imageInput.addEventListener("change", () => {
    resetPreview();

    const file = imageInput.files[0];

    if (!file) {
        return;
    }

    previewURL = URL.createObjectURL(file);
    imagePreview.src = previewURL;
    previewContainer.hidden = false;
});

uploadForm.addEventListener("submit", async event => {
    event.preventDefault();

    const imageFile = imageInput.files[0];
    const tags = parseTags(tagsInput.value);
    const adminKey = getAdminKey();

    if (!imageFile) {
        showStatus("Choose an image first.", "error");
        return;
    }

    if (tags.length === 0) {
        showStatus("Enter at least one tag.", "error");
        return;
    }

    if (!adminKey) {
        showStatus("The admin key is required.", "error");
        return;
    }

    uploadButton.disabled = true;
    uploadButton.textContent = "Uploading...";

    showStatus(
        "Preparing and uploading image...",
        "loading"
    );

    try {
        const pngFile =
            await convertImageToPNG(imageFile);

        const formData = new FormData();

        formData.append("image", pngFile, "upload.png");
        formData.append(
            "title",
            titleInput.value.trim()
        );
        formData.append(
            "paragraph",
            paragraphInput.value.trim()
        );
        formData.append(
            "tags",
            JSON.stringify(tags)
        );

        const response = await fetch(WORKER_URL, {
            method: "POST",

            headers: {
                "X-Admin-Key": adminKey
            },

            body: formData
        });

        let result = {};

        try {
            result = await response.json();
        } catch {
            // The Worker did not return JSON.
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
                `Upload failed with status ${response.status}.`
            );
        }

        showStatus(
            `Uploaded successfully as ${
                result.filename ||
                "a new archive image"
            }.`,
            "success"
        );

        uploadForm.reset();
        resetPreview();
    } catch (error) {
        console.error(error);

        showStatus(
            error.message || "The upload failed.",
            "error"
        );
    } finally {
        uploadButton.disabled = false;
        uploadButton.textContent = "Upload Image";
    }
});