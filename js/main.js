"use strict";

var constraints;
var imageCapture;
var mediaStream;
var canvasView;
var grabFrameButton = document.querySelector("button#grabFrame");
var takePhotoButton = document.querySelector("button#takePhoto");

var canvas = document.querySelector("canvas");
var img = document.getElementById("img");
var video = document.querySelector("video");
var videoSelect = document.querySelector("select#videoSource");

grabFrameButton.onclick = grabFrame;
takePhotoButton.onclick = takePhoto;
videoSelect.onchange = getStream;

// Get a list of available media input (and output) devices
// then get a MediaStream for the currently selected input device
navigator.mediaDevices
  .enumerateDevices()
  .then(gotDevices)
  .catch((error) => {
    console.log("enumerateDevices() error: ", error);
  })
  .then(getStream);

// From the list of media devices available, set up the camera source <select>,
// then get a video stream from the default camera source.
function gotDevices(deviceInfos) {
  for (var i = 0; i !== deviceInfos.length; ++i) {
    var deviceInfo = deviceInfos[i];
    console.log("Found media input or output device: ", deviceInfo);
    var option = document.createElement("option");
    option.value = deviceInfo.deviceId;
    if (deviceInfo.kind === "videoinput") {
      option.text = deviceInfo.label || "Camera " + (videoSelect.length + 1);
      videoSelect.appendChild(option);
    }
  }
}

// Get a video stream from the currently selected camera source.
function getStream() {
  if (mediaStream) {
    mediaStream.getTracks().forEach((track) => {
      track.stop();
    });
  }
  var videoSource = videoSelect.value;
  constraints = {
    video: {
      deviceId: videoSource ? { exact: videoSource } : undefined,
      width: { ideal: 1920 }, // Set ideal video width for high quality
      height: { ideal: 1080 }, // Set ideal video height for high quality
    },
  };
  navigator.mediaDevices
    .getUserMedia(constraints)
    .then(gotStream)
    .catch((error) => {
      console.log("getUserMedia error: ", error);
    });
}

// Display the stream from the currently selected camera source, and then
// create an ImageCapture object, using the video from the stream.
function gotStream(stream) {
  console.log("getUserMedia() got stream: ", stream);
  mediaStream = stream;
  // Adjust video element size based on device dimensions
  video.width = window.innerWidth;
  video.height = window.innerHeight * 1; // Set to 90% of the screen height
  video.srcObject = stream;
  video.classList.remove("hidden");

  // Set up ImageCapture for high-quality capture
  imageCapture = new ImageCapture(stream.getVideoTracks()[0]);
  getCapabilities();
}

// Adjust based on device size while maintaining the image aspect ratio
function adjustSizeForDevice(imageWidth, imageHeight) {
  const deviceWidth = window.innerWidth;
  const deviceHeight = window.innerHeight * 1; // Limit height to 60% of screen height

  const imageAspectRatio = imageWidth / imageHeight;
  const deviceAspectRatio = deviceWidth / deviceHeight;

  let adjustedWidth, adjustedHeight;

  // Compare aspect ratios to determine scaling dimensions
  if (imageAspectRatio > deviceAspectRatio) {
    // Image is wider than device, scale width to fit
    adjustedWidth = deviceWidth;
    adjustedHeight = deviceWidth / imageAspectRatio;
  } else {
    // Image is taller than or equal to device, scale height to fit
    adjustedHeight = deviceHeight;
    adjustedWidth = deviceHeight * imageAspectRatio;
  }

  return { width: adjustedWidth, height: adjustedHeight };
}

// Get an ImageBitmap from the currently selected camera source and
// display this with a canvas element.
const downloadButton = document.getElementById("downloadButton");

function grabFrame() {
  imageCapture
    .grabFrame()
    .then(function (imageBitmap) {
      console.log("Grabbed frame:", imageBitmap);

      const { width, height } = adjustSizeForDevice(
        imageBitmap.width,
        imageBitmap.height
      );

      // Adjust canvas size based on the calculated width and height
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      ctx.drawImage(imageBitmap, 0, 0, canvas.width, canvas.height);

      canvasView = canvas.toDataURL("image/jpeg", 0.9); // 0.9 indicates 90% quality

      const imgLikcanvassrc = document.getElementById("imagCanvaslink");
      imgLikcanvassrc.src = canvasView;

      const canvasDiv = document.getElementById("canvas_div");
      canvasDiv.classList.remove("hidden");

      // Show the canvas and download button after the frame is captured
      canvas.classList.remove("hidden");
      downloadButton.classList.remove("hidden");
    })
    .catch(function (error) {
      console.log("grabFrame() error: ", error);
    });
}

// Simulate device-specific size adjustment
function adjustSizeForDevice(width, height) {
  // Add logic to adjust based on device, for now return the same size
  return { width, height };
}

// Function to download the canvas content as an image
function downloadImage() {
  const link = document.createElement("a");
  link.href = canvas.toDataURL("image/jpeg", 0.9); // Convert canvas to image data URL
  link.download = "captured-image.jpeg"; // Name of the image file
  link.click(); // Simulate a click to download the image
}

// Add event listeners to buttons
downloadButton.onclick = downloadImage;

// Get a Blob from the currently selected camera source and
// display this with an img element.
function takePhoto() {
  imageCapture
    .takePhoto() // No need to pass options as takePhoto() automatically takes high-quality image based on camera
    .then(function (blob) {
      console.log("Took photo:", blob);

      const imgElement = new Image();
      imgElement.onload = function () {
        const { width, height } = adjustSizeForDevice(
          imgElement.width,
          imgElement.height
        );

        // Adjust image element size based on the calculated width and height
        img.width = width;
        img.height = height;
        img.src = URL.createObjectURL(blob);
        const downloadLink = document.getElementById("downloadLink");
        const imgLinksrc = document.getElementById("imaglink");
        downloadLink.href = img.src; // Set the href to the image's URL
        imgLinksrc.src = img.src;
        imgLinksrc.classList.remove("hidden"); // Show the download link
        downloadLink.classList.remove("hidden"); // Show the download link
        img.classList.remove("hidden");
        const photoDiv = document.getElementById("Image_div");
        photoDiv.classList.remove("hidden");
      };
      imgElement.src = URL.createObjectURL(blob);
    })
    .catch(function (error) {
      console.log("takePhoto() error: ", error);
    });
}

// Get image capture capabilities (e.g., photo resolution)
function getCapabilities() {
  imageCapture.getPhotoCapabilities().then(function (capabilities) {
    console.log("Camera capabilities: ", capabilities);
  });
}

// Fullscreen functionality
function toggleFullscreen() {
  document.getElementById("fullscreen_main").classList.remove("hidden");

  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen();
  } else {
    if (document.exitFullscreen) {
      document.exitFullscreen();
    }
  }
}

function toggleFullscreenClose() {
  toggleFullscreen();
  document.getElementById("fullscreen_main").classList.add("hidden");
}
