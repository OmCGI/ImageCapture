 
'use strict';

// This code is adapted from
// https://cdn.rawgit.com/Miguelao/demos/master/imagecapture.html

 
var constraints;
var imageCapture;
var mediaStream;

var grabFrameButton = document.querySelector('button#grabFrame');
var takePhotoButton = document.querySelector('button#takePhoto');

var canvas = document.querySelector('canvas');
var img = document.querySelector('img');
var video = document.querySelector('video');
var videoSelect = document.querySelector('select#videoSource');
 

grabFrameButton.onclick = grabFrame;
takePhotoButton.onclick = takePhoto;
videoSelect.onchange = getStream;
 

// Get a list of available media input (and output) devices
// then get a MediaStream for the currently selected input device
navigator.mediaDevices.enumerateDevices()
  .then(gotDevices)
  .catch(error => {
    console.log('enumerateDevices() error: ', error);
  })
  .then(getStream);

// From the list of media devices available, set up the camera source <select>,
// then get a video stream from the default camera source.
function gotDevices(deviceInfos) {
  for (var i = 0; i !== deviceInfos.length; ++i) {
    var deviceInfo = deviceInfos[i];
    console.log('Found media input or output device: ', deviceInfo);
    var option = document.createElement('option');
    option.value = deviceInfo.deviceId;
    if (deviceInfo.kind === 'videoinput') {
      option.text = deviceInfo.label || 'Camera ' + (videoSelect.length + 1);
      videoSelect.appendChild(option);
    }
  }
}

// Get a video stream from the currently selected camera source.
function getStream() {
  if (mediaStream) {
    mediaStream.getTracks().forEach(track => {
      track.stop();
    });
  }
  var videoSource = videoSelect.value;
  constraints = {
    video: {deviceId: videoSource ? {exact: videoSource} : undefined}
  };
  navigator.mediaDevices.getUserMedia(constraints)
    .then(gotStream)
    .catch(error => {
      console.log('getUserMedia error: ', error);
    });
}

// Display the stream from the currently selected camera source, and then
// create an ImageCapture object, using the video from the stream.
function gotStream(stream) {
  console.log('getUserMedia() got stream: ', stream);
  mediaStream = stream;
  video.srcObject = stream;
  video.classList.remove('hidden');
  imageCapture = new ImageCapture(stream.getVideoTracks()[0]);
  getCapabilities();
}

 

// Get an ImageBitmap from the currently selected camera source and
// display this with a canvas element.
function grabFrame() {
  imageCapture.grabFrame().then(function(imageBitmap) {
    console.log('Grabbed frame:', imageBitmap);
    canvas.width = imageBitmap.width;
    canvas.height = imageBitmap.height;
    canvas.getContext('2d').drawImage(imageBitmap, 0, 0);
    canvas.classList.remove('hidden');
  }).catch(function(error) {
    console.log('grabFrame() error: ', error);
  });
}

 

// Get a Blob from the currently selected camera source and
// display this with an img element.
function takePhoto() {
  imageCapture.takePhoto().then(function(blob) {
    console.log('Took photo:', blob);
    img.classList.remove('hidden');
    img.src = URL.createObjectURL(blob);
    console.log(img.src);
  }).catch(function(error) {
    console.log('takePhoto() error: ', error);
  });
}

//fullscreen
 
function toggleFullscreen() {

document.getElementById("fullscreen_main").classList.remove('hidden');

  if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
  } else {
      if (document.exitFullscreen) {
          document.exitFullscreen();
      }
  }
}
 

function toggleFullscreenClose() {

  document.getElementById("fullscreen_main").classList.add('hidden');
  
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen();
    } else {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        }
    }
  }