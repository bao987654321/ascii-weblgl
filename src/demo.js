import ASCIIBoard from './ascii';

const SIMSPONS = 'simpsons';
const WEBCAM = 'webcam';
const SIMSPONS_URL = 'simpsons.mp4'

export default class Demo  {
  constructor() {
    // const canvas = document.getElementById("glCanvas");
    const canvas = document.querySelector("#glCanvas");
    this.canvas = canvas;
    if (canvas.getContext("webgl") === null) {
      alert("Unable to initialize WebGL. Your browser or machine may not support it.");
      return;
    }

    const tempCanvas = document.getElementById('canvas');
    this.asciiBoard = new ASCIIBoard(tempCanvas, canvas);
    this.video = document.createElement('video');
    this.isMuted = true;

    this.setCanvasSize(640, 640)
    this.attachButtonListeners();
    this.startSimpsons();
  }

  attachButtonListeners() {
    document.getElementById('sizeSlider').addEventListener('change', e => {
      this.asciiBoard.setSize(+e.target.value);
    })

    document.getElementById('colorCheckbox').addEventListener('change', e => {
      this.asciiBoard.setHasColor(e.target.checked);
    })

    document.getElementById('muteCheckbox').addEventListener('change', e => {
      this.isMuted = e.target.checked;
      this.video.muted = this.isMuted;
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
  }

  startSimpsons() {
    this.currentSource = SIMSPONS;
    this.setUpVideo(SIMSPONS_URL);
  }

  startWebcam() {
    const constraints = {audio: false, video: true};
    navigator.mediaDevices.getUserMedia(constraints)
    .then(stream => {
      var videoTracks = stream.getVideoTracks();
      this.currentSource = WEBCAM;
      this.setUpVideo(stream, true)
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
    // TODO: Fill window
    const devicePixelRatio = window.devicePixelRatio || 1;
    this.canvas.width = width  * devicePixelRatio;
    this.canvas.height = height * devicePixelRatio;
    this.canvas.style.height = `${height}px`;
    this.canvas.style.width = `${width}px`;
    this.asciiBoard.setViewport();
  }


  setUpVideo(src, isWebcam = false) {
    const video = this.video;
    if (this.cleanUpVideo) {
      this.cleanUpVideo();
    }

    var playing = false;
    let timeupdate = false;
    let started = false;
    video.autoplay = true;
    video.loop = true;
    video.muted = true;

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
        this.setCanvasSize(video.videoWidth, video.videoHeight)
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
      this.asciiBoard.pauseVideo();
      video.pause();
      video.src = null;
      video.srcObject = null;
      video.removeEventListener('playing', _playingCb, true,)
      video.removeEventListener('timeupdate', _timeUpdateCb, true,)
    }

    video.play()
      .then(() => console.log('video playing'))
      .catch(e => console.log('error with video ', e))
  }

}
