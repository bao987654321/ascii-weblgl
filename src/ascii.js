import {asciiFrag, asciiVert} from './shaders';
import {initShaderProgram} from './webgl-utils';



export default class ASCIIBoard {
  constructor(textCanvas, glCanvas) {
    const startASCII = 32;
    const defaultSize = 20;
    this.textCanvas = textCanvas;
    this.glCanvas = glCanvas;
    this.charsPerRow = 20;
    this.chars = (new Array(300)).fill(0).map((_, i) => String.fromCharCode(startASCII+i));
    this.gl = glCanvas.getContext("webgl");
    this.hasColor = true;
    this.videoReady = false;

    console.log('max permetner ', this.gl.getParameter(this.gl.MAX_TEXTURE_SIZE));


    this.setViewport();
    this.createTextData(defaultSize);
    this.initProgram();
    this.initImageTexture();
  }

  setViewport() {
    this.gl.viewport(0, 0, this.glCanvas.width, this.glCanvas.height);
  }

  setSize(size) {
    this.createTextData(size);
    this.setAsciiTexture();
    this.createPositionBuffer();
    this.setUniforms();
  }

  setHasColor(value) {
    this.hasColor = value;
    this.setUniforms();
  }

  createTextData(size) {

    const ctx = this.textCanvas.getContext('2d');

     // add one to the length for the `" "` we will add later
    const height = size * Math.ceil((this.chars.length + 1) / this.charsPerRow);
    const width = size * this.charsPerRow;
    this.textCanvas.width = width;
    this.textCanvas.height = height;
    const {atlasMap, textureData: firstTextureData} = this.drawTextToCanvas(this.chars, width, height, size);
    const charsInfo = this.getCharsInfo(atlasMap, size, width, firstTextureData);
    const sortedChars =this.sortChars(charsInfo);

    const boxHeight = sortedChars.reduce((memo, a) =>  Math.max(memo, charsInfo[a].boxHeight), 0);
    const boxWidth = sortedChars.reduce((memo, a) =>  Math.max(memo, charsInfo[a].boxWidth), 0);

    this.count = sortedChars.length + 1;

    ctx.clearRect(0, 0, width, height);
    this.textureData = this.drawTextToCanvas(sortedChars, width, height, size).textureData
    this.boxWidth = boxWidth;
    this.boxHeight = boxHeight;
    this.textureStepSize  = size;
    this.textureHeight = height;
    this.textureWidth = width;
  }

  getCharsInfo(atlasMap, size, imageWidth, data) {
    return Object.keys(atlasMap).reduce((memo,char) => {
      const info = atlasMap[char];
      const pixelCount = this.getDarkPixelCount(info.x, info.y, size, size, imageWidth, data)
      const {boxWidth, boxHeight} = this.getBoxSize(info.x, info.y, size, size, imageWidth, data)
      return { ...memo, [char]: {darkness: pixelCount, boxWidth, boxHeight, char}}
    }, {});
  }

  drawTextToCanvas(chars, width, height, blockSize) {
    const ctx = this.textCanvas.getContext('2d');
    const atlasMap = {};
    var i = 0;
    ctx.fillStyle = "black";
    ctx.font = `${blockSize}px monospace`;
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    while (i < chars.length) {
      for(var y = 0; y + blockSize <= height && i < chars.length; y += blockSize) {
        for (var x = 0; x + blockSize <= width && i < chars.length; x += blockSize) {
          ctx.fillText(chars[i], x, y);
          atlasMap[chars[i]] = {x, y};
          i++;
        }
      }
    }
    const textureData = new Uint8Array(ctx.getImageData(0, 0, width, height).data);
    return {
      atlasMap,
      textureData,
    }
  }

  sortChars(darkPixelCounts) {
    const data = Object.values(darkPixelCounts);
    const widths = data.map(d => d.boxWidth);
    const heights = data.map(d => d.boxHeight);

    const widthThreshold = this.getPercentile(widths, 90);
    const heightThreshold = this.getPercentile(heights, 75);
    console.log('width threshold: ', widthThreshold)
    console.log('height threshold: ', heightThreshold)

    const filtered = data.filter(d => {
      return (
       d.boxWidth <= widthThreshold &&
       d.boxHeight <= heightThreshold &&
       d.darkness > 0
      );
    })
    return filtered.sort((a, b) => b.darkness - a.darkness).map(d => d.char);
  }

  getPercentile(numbers, p) {
    const sorted = numbers.sort((a, b) => a - b);
    const indexToPull = Math.floor(p/100 * numbers.length);
    return sorted[indexToPull];
  }

  getDarkPixelCount(x, y, width, height, imageWidth, data) {
    var count = 0;
    const xOffset = x * 4
    for(var j = 0; j < height; j++) {
      const offset = (y + j) * imageWidth * 4;
      for(var i = 0; i < width; i++) {
        const value = data[i*4 + offset + 3 + xOffset];
        if (value > 0) {
          count++;
        }
      }
    }
    return count;
  }

  getBoxSize(x, y, width, height, imageWidth, data) {
    let boxWidth = 0;
    let boxHeight = 0;
    const xOffset = x * 4
    for(var j = 0; j < height; j++) {
      const offset = (y + j) * imageWidth * 4;
      for(var i = 0; i < width; i++) {
        const value = data[i*4 + offset + 3 + xOffset];
        if (value > 0) {
          boxHeight = Math.max(boxHeight, j);
          boxWidth = Math.max(boxWidth, i);
        }
      }
    }
    return {
      boxWidth,
      boxHeight,
    };
  }


  loadImage(src) {
    var image = new Image();
    image.src = src;
    image.onload = () => this.draw(image);
  }

  initImageTexture() {
    const gl = this.gl;
    gl.activeTexture(gl.TEXTURE0 + 1);
    gl.bindTexture(gl.TEXTURE_2D, this.textures.image);

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

    const level = 0;
    const internalFormat = gl.RGBA;
    const width = 1;
    const height = 1;
    const border = 0;
    const srcFormat = gl.RGBA;
    const srcType = gl.UNSIGNED_BYTE;
    const pixel = new Uint8Array([0, 0, 0, 255]);
    gl.texImage2D(gl.TEXTURE_2D, level, internalFormat,
                  width, height, border, srcFormat, srcType,
                  pixel);
  }

  loadFrameToTexture(data) {
    // Create a texture.
    const gl = this.gl;
    const level = 0;
    const internalFormat = gl.RGBA;
    const srcFormat = gl.RGBA;
    const srcType = gl.UNSIGNED_BYTE;
    gl.activeTexture(gl.TEXTURE0 + 1);
    gl.bindTexture(gl.TEXTURE_2D, this.textures.image);
    gl.texImage2D(gl.TEXTURE_2D, level, internalFormat,
                  srcFormat, srcType, data);
  }

  initProgram() {
    const shaderProgram = initShaderProgram(this.gl, asciiVert, asciiFrag);
    this.shaderProgram = shaderProgram;
    this.textures = {
      ascii: this.gl.createTexture(),
      image: this.gl.createTexture(),
    }
    this.buffers = {
      vertex: this.gl.createBuffer(),
      texture: this.gl.createBuffer(),
      center: this.gl.createBuffer(),
    }
    this.attribLocations = {
     a_pos: this.gl.getAttribLocation(shaderProgram, 'a_pos'),
     a_center: this.gl.getAttribLocation(shaderProgram, 'a_center'),
     a_texcoord: this.gl.getAttribLocation(shaderProgram, 'a_texcoord'),
    };
    this.uniformLocations = {
      u_texsize: this.gl.getUniformLocation(shaderProgram, 'u_texsize'),
      u_asciiCount: this.gl.getUniformLocation(shaderProgram, 'u_asciiCount'),
      u_texture: this.gl.getUniformLocation(shaderProgram, 'u_texture'),
      u_image: this.gl.getUniformLocation(shaderProgram, 'u_image'),
      u_texStep: this.gl.getUniformLocation(shaderProgram, 'u_texStep'),
      u_hasColor: this.gl.getUniformLocation(shaderProgram, 'u_hasColor'),
      u_charsPerRow: this.gl.getUniformLocation(shaderProgram, 'u_charsPerRow'),
    };
  }

  createPositionBuffer() {
    const texileWidth = this.boxWidth;
    const texileHeight = this.boxHeight;

    const yCount = Math.floor(this.glCanvas.height / texileHeight);
    const xCount = Math.floor(this.glCanvas.width / texileWidth);

    const vertexBuffer = this.buffers.vertex;
    const textureBuffer = this.buffers.texture;
    const centerBuffer = this.buffers.center;

    const vertexElements= [];
    var textureElements = [];
    var centerElements = [];
    var pen = { x: 0, y: 0};
    const zeroX  = 0;
    const zeroY =  0;
    const widthStep = 1/xCount;
    const heightStep = 1/yCount;

    if (yCount > 10000 || xCount > 10000) {
      console.log("issue with too many counts")
      return;
    }
    // Need to assert yCount xCount to prevent freezing
    for (var j = 0; j < yCount; j++) {
      for (var i = 0; i < xCount; i++) {

        vertexElements.push(
          pen.x, pen.y,
          pen.x + widthStep, pen.y,
          pen.x, pen.y + heightStep,

          pen.x + widthStep, pen.y,
          pen.x, pen.y + heightStep,
          pen.x+ widthStep, pen.y + heightStep,
        );

        const centerX = pen.x + widthStep/2;
        const centerY = pen.y + heightStep/2;
        centerElements.push(
          centerX, centerY,
          centerX, centerY,
          centerX, centerY,

          centerX, centerY,
          centerX, centerY,
          centerX, centerY
        )

        textureElements.push(
          zeroX, zeroY,
          zeroX + texileWidth, zeroY,
          zeroX, zeroY + texileHeight,

          zeroX + texileWidth, zeroY,
          zeroX, zeroY +texileHeight,
          zeroX + texileWidth, zeroY + texileHeight
        );
        pen.x += widthStep;
      }
      pen.x = 0;
      pen.y += heightStep;
    }
    const gl = this.gl;
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertexElements), gl.STATIC_DRAW);
    vertexBuffer.numItems = vertexElements.length / 2;

    gl.bindBuffer(gl.ARRAY_BUFFER, textureBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(textureElements), gl.STATIC_DRAW);
    textureBuffer.numItems = textureElements.length / 2;

    gl.bindBuffer(gl.ARRAY_BUFFER, centerBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(centerElements), gl.STATIC_DRAW);
    centerBuffer.numItems = textureElements.length / 2;
  }

  bindBuffers() {
    const gl = this.gl;
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.vertex);
    gl.vertexAttribPointer(this.attribLocations.a_pos, 2, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.texture);
    gl.vertexAttribPointer(this.attribLocations.a_texcoord, 2, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.center);
    gl.vertexAttribPointer(this.attribLocations.a_center, 2, gl.FLOAT, false, 0, 0);
    this.gl.enableVertexAttribArray(this.attribLocations.a_pos);
    this.gl.enableVertexAttribArray(this.attribLocations.a_texcoord);
    this.gl.enableVertexAttribArray(this.attribLocations.a_center);
  }

  setAsciiTexture() {
    const gl = this.gl;
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.textures.ascii);
    gl.uniform1i(this.uniformLocations.u_texture, 0);
    console.log('textureWidth ', this.textureWidth);
    console.log('textureHeight ', this.textureHeight);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, this.textureWidth, this.textureHeight, 0, gl.RGBA, gl.UNSIGNED_BYTE, this.textureData);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  }

  setUniforms() {
    this.gl.uniform2f(this.uniformLocations.u_texsize, this.textureWidth, this.textureHeight);
    this.gl.uniform1f(this.uniformLocations.u_asciiCount, this.count);
    this.gl.uniform1i(this.uniformLocations.u_image, 1);
    this.gl.uniform1f(this.uniformLocations.u_texStep, this.textureStepSize);
    this.gl.uniform1i(this.uniformLocations.u_hasColor, this.hasColor);
    this.gl.uniform1f(this.uniformLocations.u_charsPerRow, this.charsPerRow);
  }

  draw(image) {
    const gl = this.gl;
    gl.useProgram(this.shaderProgram);
    this.drawToCanvas(image)
    this.loadFrameToTexture(image)
    this.createPositionBuffer();
    this.bindBuffers();
    this.setAsciiTexture();
    this.setUniforms();
    this.drawScene();
  }

  pauseVideo() {
    if (this.currentPlaybackCallbackId) {
      cancelAnimationFrame(this.currentPlaybackCallbackId);
      console.log("pausing video ")
      this.currentPlaybackCallbackId = null;
    }
  }

  playVideo(video) {
    this.pauseVideo();
    this.gl.useProgram(this.shaderProgram);
    this.createPositionBuffer();
    this.bindBuffers();
    this.setAsciiTexture();
    this.setUniforms();
    this.renderVideo(video);
  }

  renderVideo(video) {
    this.loadFrameToTexture(video)
    this.drawScene();
    this.currentPlaybackCallbackId = requestAnimationFrame(() => this.renderVideo(video));
  }

  drawScene() {
    this.gl.clear(this.gl.COLOR_BUFFER_BIT)
    this.gl.drawArrays(this.gl.TRIANGLES, 0, this.buffers.vertex.numItems);
  }
}
