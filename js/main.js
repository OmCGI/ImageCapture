"use strict";

var constraints;
var imageCapture;
var mediaStream;
var isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;

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
navigator.mediaDevices
  .enumerateDevices()
  .then(gotDevices)
  .catch((error) => {
    console.log("enumerateDevices() error: ", error);
  })
  .then(getStream);

function gotDevices(deviceInfos) {
  for (var i = 0; i !== deviceInfos.length; ++i) {
    var deviceInfo = deviceInfos[i];
    if (deviceInfo.kind === "videoinput") {
      var option = document.createElement("option");
      option.value = deviceInfo.deviceId;
      option.text = deviceInfo.label || "Camera " + (videoSelect.length + 1);
      videoSelect.appendChild(option);
    }
  }
}

function getStream() {
  if (mediaStream) {
    mediaStream.getTracks().forEach((track) => track.stop());
  }
  var videoSource = videoSelect.value;

  if (isIOS) {
    // Lower resolution constraints for iOS
    constraints = {
      video: {
        deviceId: videoSource ? { exact: videoSource } : undefined,
        width: { ideal: 1280 },
        height: { ideal: 720 },
        facingMode: 'user',
      },
    };
  } else {
    constraints = {
      video: {
        deviceId: videoSource ? { exact: videoSource } : undefined,
        width: { ideal: 1920 },
        height: { ideal: 1080 },
      },
    };
  }

  navigator.mediaDevices
    .getUserMedia(constraints)
    .then(gotStream)
    .catch((error) => {
      if (error.name === 'NotAllowedError') {
        alert('Camera access is blocked. Please allow camera permissions.');
      } else {
        console.log("getUserMedia error: ", error);
      }
    });
}

function gotStream(stream) {
  mediaStream = stream;

  video.width = window.innerWidth;
  video.height = window.innerHeight * 0.6; 
  video.srcObject = stream;
  video.classList.remove("hidden");

  imageCapture = new ImageCapture(stream.getVideoTracks()[0]);
  getCapabilities();
}

function adjustSizeForDevice(imageWidth, imageHeight) {
  const deviceWidth = window.innerWidth;
  const deviceHeight = window.innerHeight * 0.6; 

  const imageAspectRatio = imageWidth / imageHeight;
  const deviceAspectRatio = deviceWidth / deviceHeight;

  let adjustedWidth, adjustedHeight;

  if (imageAspectRatio > deviceAspectRatio) {
    adjustedWidth = deviceWidth;
    adjustedHeight = deviceWidth / imageAspectRatio;
  } else {
    adjustedHeight = deviceHeight;
    adjustedWidth = deviceHeight * imageAspectRatio;
  }

  return { width: adjustedWidth, height: adjustedHeight };
}

function grabFrame() {
  if (imageCapture && imageCapture.grabFrame) {
    imageCapture
      .grabFrame()
      .then(function (imageBitmap) {
        const { width, height } = adjustSizeForDevice(imageBitmap.width, imageBitmap.height);
        canvas.width = width;
        canvas.height = height;
        canvas.getContext("2d").drawImage(imageBitmap, 0, 0, canvas.width, canvas.height);
        canvas.classList.remove("hidden");
      })
      .catch((error) => {
        console.log("grabFrame() error: ", error);
      });
  } else {
    alert("ImageCapture API is not supported on this device.");
  }
}

function takePhoto() {
  if (imageCapture && imageCapture.takePhoto) {
    imageCapture
      .takePhoto()
      .then(handlePhoto)
      .catch((error) => {
        console.log("takePhoto() error: ", error);
      });
  } else {
    let canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);
    canvas.toBlob(handlePhoto);
  }
}

function handlePhoto(blob) {
  const imgURL = URL.createObjectURL(blob);
  img.src = imgURL;
  const downloadLink = document.getElementById('downloadLink');
  downloadLink.href = imgURL; 
  downloadLink.classList.remove("hidden"); 
  img.classList.remove("hidden");
}

function getCapabilities() {
  if (imageCapture && imageCapture.getPhotoCapabilities) {
    imageCapture.getPhotoCapabilities().then(function (capabilities) {
      console.log("Camera capabilities: ", capabilities);
    });
  }
}

function toggleFullscreen() {
  const fullscreenElement = document.fullscreenElement || document.webkitFullscreenElement;
  if (!fullscreenElement) {
    const docEl = document.documentElement;
    if (docEl.requestFullscreen) {
      docEl.requestFullscreen();
    } else if (docEl.webkitRequestFullscreen) { 
      docEl.webkitRequestFullscreen();
    }
  } else {
    if (document.exitFullscreen) {
      document.exitFullscreen();
    } else if (document.webkitExitFullscreen) { 
      document.webkitExitFullscreen();
    }
  }
}

function toggleFullscreenClose() {
  toggleFullscreen();
  document.getElementById("fullscreen_main").classList.add("hidden");
}