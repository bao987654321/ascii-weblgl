import ASCIIBoard from './ascii';
import './style.css';

const SIMSPONS = 'simpsons';
const WEBCAM = 'webcam';
const SIMSPONS_URL = 'simpsons.mp4'
const SHOW_CONTROLS_TIME_MS = 2000;
export default class Demo  {
  constructor() {
    const canvas = document.querySelector("#glCanvas");
    this.canvas = canvas;
    if (canvas.getContext("webgl") === null) {
      alert("Unable to initialize WebGL. Your browser or machine may not support it.");
      return;
    }

    this.controlBoxElm = document.getElementById("controlBox");
    this.isControlsHidden = true;

    const tempCanvas = document.getElementById('canvas');
    this.asciiBoard = new ASCIIBoard(tempCanvas, canvas);

    this.isMuted = true;

    this.attachEventListeners();
    this.startSimpsons();
  }

  createVideoElement() {
    const elm = document.createElement('video');
    elm.muted = true;
    elm.loop = true;
    elm.autoplay = true;
    elm.setAttribute('playsinline', true)
    elm.setAttribute('muted', true)
    elm.setAttribute('style', "width: 1px; height: 1px; position: absolute");
    document.body.appendChild(elm);
    return elm;
  }

  attachEventListeners() {
    document.getElementById('sizeSlider').addEventListener('change', e => {
      this.asciiBoard.setSize(+e.target.value);
    })

    document.addEventListener('scroll', () => {
      this.moveVideo(window.pageXOffset, window.pageYOffset);
    })

    document.getElementById('colorCheckbox').addEventListener('change', e => {
      this.asciiBoard.setHasColor(e.target.checked);
    })

    document.getElementById('muteCheckbox').addEventListener('change', e => {
      this.mute(!e.target.checked);
    })

    document.getElementById('videoSourceSimpsons').addEventListener('change', e => {
      if (e.target.checked) {
        this.startSimpsons();
      }
    })

    document.getElementById('videoSourceWebcam').addEventListener('change', e => {
      if (e.target.checked) {
        this.startWebcam();
      }
    })

    document.addEventListener('mousemove', () => {
      this.showControlsBriefly();
    });

    document.addEventListener('touchstart', () => {
      this.showControlsBriefly();
    });

  }

  resizeScreen() {
    // Set height using window.innerHeight instead of 'vh' includes the address bar on mobile
    const elm = document.getElementById('glCanvasContainer');
    elm.style.height = `${window.innerHeight}px`;

    if (this.video.videoHeight && this.video.videoWidth) {
      this.setCanvasSize(this.video.videoWidth, this.video.videoHeight)
    }
  }

  moveVideo(x, y) {
    const offset = 10;
    this.video.style.top = `${y + offset}px`;
    this.video.style.left = `${x + offset}px`;
  }

  startSimpsons() {
    this.currentSource = SIMSPONS;
    this.setUpVideo(SIMSPONS_URL);
  }

  startWebcam() {
    const constraints = {audio: false, video: {facingMode: "environment" }};
    navigator.mediaDevices.getUserMedia(constraints)
    .then(stream => {
      var videoTracks = stream.getVideoTracks();
      this.currentSource = WEBCAM;
      this.setUpVideo(stream, true)
      console.log('video devices: ',  videoTracks);
      console.log('Using video device: ' + videoTracks[0].label);
      stream.onremovetrack = function() {
        console.log('Stream ended');
      };
    })
    .catch(function(err) {
      window.alert('Issue with webcam');
      console.log(err)
    });
  }

  setCanvasSize(width, height){
    const aspectRatio = width/height;
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    const devicePixelRatio = window.devicePixelRatio || 1;
    const useHeightAsMax = windowHeight * aspectRatio < windowWidth
    const widthToUse = Math.floor(useHeightAsMax ? windowHeight * aspectRatio : windowWidth);
    const heightToUse = Math.floor(useHeightAsMax ? windowHeight : windowWidth / aspectRatio) ;

    this.canvas.width = widthToUse  * devicePixelRatio;
    this.canvas.height = heightToUse * devicePixelRatio;
    this.canvas.style.height = `${heightToUse}px`;
    this.canvas.style.width = `${widthToUse}px`;
    this.asciiBoard.setViewport();
  }

  mute(isMuted) {
    this.isMuted = isMuted;
    this.video.muted = isMuted;
  }

  showControlsBriefly() {
    if (this.isControlsHidden) {
      this.showControls();
      this.hideControlsEvent = window.setTimeout(() => {
        this.hideControls();
      }, SHOW_CONTROLS_TIME_MS);
      return;
    }
    if(this.hideControlsEvent) {
      window.clearTimeout(this.hideControlsEvent);
    }
    this.hideControlsEvent = window.setTimeout(() => {
        this.hideControls();
    }, SHOW_CONTROLS_TIME_MS);
  }

  showControls() {
    this.isControlsHidden = false;
    this.controlBoxElm.classList.remove('hide');
  }

  hideControls() {
    this.isControlsHidden = true;
    this.controlBoxElm.classList.add('hide');
  }

  setUpVideo(src, isWebcam = false) {
    const video = this.createVideoElement();
    this.video = video;
    this.moveVideo(window.pageXOffset, window.pageYOffset);
    if (this.cleanUpVideo) {
      this.cleanUpVideo();
    }

    var playing = false;
    let timeupdate = false;
    let started = false;

    if (isWebcam) {
      video.srcObject = src;
    }
    else {
      video.src = src;
    }

    const _checkReady = () => {
      if (playing && timeupdate && !started) {
        started = true;
        video.muted = this.isMuted;
        this.resizeScreen();
        this.asciiBoard.playVideo(video, isWebcam);
      }
    }

    const _playingCb = () => {
      playing = true;
      _checkReady();
    };

    const _timeUpdateCb = () => {
      timeupdate = true;
      _checkReady();
    };

    video.addEventListener('playing', _playingCb, true);
    video.addEventListener('timeupdate', _timeUpdateCb, true);

    this.cleanUpVideo = () => {
      const oldVideo = video;
      console.log("cleaning up video")
      this.asciiBoard.pauseVideo();
      oldVideo.pause();
      oldVideo.removeEventListener('playing', _playingCb, true,)
      oldVideo.removeEventListener('timeupdate', _timeUpdateCb, true,)
      document.body.removeChild(oldVideo);
    }

    video.play()
      .then(() => console.log('video playing'))
      .catch(e => console.log('error with video ', e))
  }

}
