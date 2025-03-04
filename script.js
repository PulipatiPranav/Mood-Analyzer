const uploadBtn = document.getElementById("uploadBtn");
const imageInput = document.getElementById("imageUpload");
const imagePreview = document.getElementById("imagePreview");
const analyzeBtn = document.getElementById("btnsuccess");
const resultDiv = document.getElementById("result");

const captureBtn = document.getElementById("captureBtn");
const video = document.getElementById("video");
const canvas = document.getElementById("canvas");

const API_URL = "https://api-inference.huggingface.co/models/trpakov/vit-face-expression";
const API_TOKEN = "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";

let capturedImageBlob = null;
let videoStream = null;

// Handle Upload
uploadBtn.addEventListener("click", () => imageInput.click());

imageInput.addEventListener("change", function () {
    const file = imageInput.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            imagePreview.src = e.target.result;
            imagePreview.style.display = "block";
        };
        reader.readAsDataURL(file);
        capturedImageBlob = file;
    }
});

// Start Webcam
captureBtn.addEventListener("click", async function () {
    try {
        if (!videoStream) {
            videoStream = await navigator.mediaDevices.getUserMedia({ video: true });
            video.srcObject = videoStream;
            video.style.display = "block";
        }
    } catch (error) {
        console.error("Error accessing webcam:", error);
        alert("Could not access webcam");
    }
});

// Capture Image from Video
captureBtn.addEventListener("dblclick", function () {
    if (!videoStream) {
        alert("Webcam is not active!");
        return;
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convert to Blob and store in capturedImageBlob
    canvas.toBlob((blob) => {
        if (blob) {
            capturedImageBlob = new File([blob], "captured.jpg", { type: "image/jpeg" });

            // Display captured image
            imagePreview.src = URL.createObjectURL(blob);
            imagePreview.style.display = "block";
            video.style.display = "none";

            // Stop the webcam
            let tracks = videoStream.getTracks();
            tracks.forEach((track) => track.stop());
            video.srcObject = null;
            videoStream = null;
        }
    }, "image/jpeg");
});

// Analyze Image
analyzeBtn.addEventListener("click", async function () {
    if (!capturedImageBlob && (!imageInput.files || !imageInput.files[0])) {
        alert("Please upload or capture an image");
        return;
    }

    resultDiv.innerHTML = "Analyzing...⏳";
    let file = capturedImageBlob || imageInput.files[0];

    const reader = new FileReader();
    reader.onload = async function (e) {
        const base64Image = e.target.result.split(",")[1];
        try {
            const response = await fetch(API_URL, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${API_TOKEN}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ "inputs": {"image":  base64Image} }),
            });

            const data = await response.json();
            if (data && Array.isArray(data) && data.length > 0) {
                const mood = data[0].label;
                resultDiv.innerHTML = `<span class="text-primary">${mood}</span>`;
            } else {
                resultDiv.innerHTML = `<span class="text-danger">Error analyzing Mood</span>`;
            }
        } catch (error) {
            console.error("Error: ", error);
            resultDiv.innerHTML = `<span class="text-danger">Failed to analyze Mood</span>`;
        }
    };
    reader.readAsDataURL(file);
});
