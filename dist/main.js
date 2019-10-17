!function(t){var e={};function i(r){if(e[r])return e[r].exports;var a=e[r]={i:r,l:!1,exports:{}};return t[r].call(a.exports,a,a.exports,i),a.l=!0,a.exports}i.m=t,i.c=e,i.d=function(t,e,r){i.o(t,e)||Object.defineProperty(t,e,{enumerable:!0,get:r})},i.r=function(t){"undefined"!=typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(t,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(t,"__esModule",{value:!0})},i.t=function(t,e){if(1&e&&(t=i(t)),8&e)return t;if(4&e&&"object"==typeof t&&t&&t.__esModule)return t;var r=Object.create(null);if(i.r(r),Object.defineProperty(r,"default",{enumerable:!0,value:t}),2&e&&"string"!=typeof t)for(var a in t)i.d(r,a,function(e){return t[e]}.bind(null,a));return r},i.n=function(t){var e=t&&t.__esModule?function(){return t.default}:function(){return t};return i.d(e,"a",e),e},i.o=function(t,e){return Object.prototype.hasOwnProperty.call(t,e)},i.p="/dist/",i(i.s=0)}([function(t,e,i){"use strict";i.r(e);const r="\nprecision lowp float;\nuniform sampler2D u_texture;\nvarying vec2 v_texcoord;\nvarying vec3 instanceColors;\n\nvoid main() {\n    float a = texture2D(u_texture, v_texcoord).a;\n    gl_FragColor = vec4(instanceColors, a);\n}\n",a="\nprecision lowp float;\n\nattribute vec2 a_pos;\nattribute vec2 a_texcoord;\nattribute vec2 a_center;\n\nuniform sampler2D u_image;\n\nuniform vec2 u_texsize;\nuniform float u_texStep;\nuniform float u_asciiCount;\nuniform bool u_hasColor;\nvarying vec3 instanceColors;\nvarying vec2 v_texcoord;\n\nfloat bitColor(float x, int levels) {\n  float f_levels = float(levels);\n  return floor(x * (f_levels - 1.0) + 1.0) / f_levels;\n}\n\nvoid main() {\n    vec2 clipSpace = a_pos * 2.0 - 1.0;\n    gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);\n    vec4 pixel = texture2D(u_image, a_center);\n    float luminance = 0.2126 * pixel.r + 0.7152 * pixel.g + 0.0722 * pixel.b;\n\n    if (u_hasColor == true) {\n      instanceColors = vec3(\n        bitColor(pixel.r, 8),\n        bitColor(pixel.g, 8),\n        bitColor(pixel.b, 8)\n      );\n    } else {\n      instanceColors = vec3(0, 0, 0);\n    }\n\n\n    float offset = floor(luminance * u_asciiCount)*u_texStep;\n    v_texcoord = (vec2(offset, 0) + a_texcoord) / u_texsize;\n}\n";function s(t,e,i){const r=t.createShader(e);return t.shaderSource(r,i),t.compileShader(r),t.getShaderParameter(r,t.COMPILE_STATUS)?r:(alert(`An error occurred compiling the ${e} shaders: `+t.getShaderInfoLog(r)),t.deleteShader(r),null)}class o{constructor(t,e){this.textCanvas=t,this.glCanvas=e,this.chars=new Array(300).fill(0).map((t,e)=>String.fromCharCode(32+e)),this.gl=e.getContext("webgl"),this.hasColor=!0,this.videoReady=!1,this.setViewport(),this.createTextData(40),this.initProgram(),this.initImageTexture()}setViewport(){this.gl.viewport(0,0,this.glCanvas.width,this.glCanvas.height)}setSize(t){this.createTextData(t),this.setAsciiTexture(),this.createPositionBuffer(),this.setUniforms()}setHasColor(t){this.hasColor=t,this.setUniforms()}createTextData(t){const e=this.textCanvas.getContext("2d"),i=t,r=t*this.chars.length+1;this.textCanvas.width=r,this.textCanvas.height=i;const{atlasMap:a,textureData:s}=this.drawTextToCanvas(this.chars,r,i,t),o=this.getCharsInfo(a,t,r,s),n=this.sortChars(o),c=n.reduce((t,e)=>Math.max(t,o[e].boxHeight),0),h=n.reduce((t,e)=>Math.max(t,o[e].boxWidth),0);this.count=n.length+1,e.clearRect(0,0,r,i),this.textureData=this.drawTextToCanvas(n,r,i,t).textureData,this.boxWidth=h,this.boxHeight=c,this.textureStepSize=t,this.textureHeight=i,this.textureWidth=r}getCharsInfo(t,e,i,r){return Object.keys(t).reduce((a,s)=>{const o=t[s],n=this.getDarkPixelCount(o.x,o.y,e,e,i,r),{boxWidth:c,boxHeight:h}=this.getBoxSize(o.x,o.y,e,e,i,r);return{...a,[s]:{darkness:n,boxWidth:c,boxHeight:h,char:s}}},{})}drawTextToCanvas(t,e,i,r){const a=this.textCanvas.getContext("2d"),s={};var o=0;for(a.fillStyle="black",a.font=`${r}px monospace`,a.textAlign="left",a.textBaseline="top";o<t.length;)for(var n=0;n+r<=i&&o<t.length;n+=r)for(var c=0;c+r<=e&&o<t.length;c+=r)a.fillText(t[o],c,n),s[t[o]]={x:c,y:n},o++;return{atlasMap:s,textureData:new Uint8Array(a.getImageData(0,0,e,i).data)}}sortChars(t){const e=Object.values(t),i=e.map(t=>t.boxWidth),r=e.map(t=>t.boxHeight),a=this.getPercentile(i,75),s=this.getPercentile(r,75);return e.filter(t=>t.boxWidth<=a&&t.boxHeight<=s&&t.darkness>0).sort((t,e)=>e.darkness-t.darkness).map(t=>t.char)}getPercentile(t,e){return t.sort((t,e)=>t-e)[Math.floor(e/100*t.length)]}getDarkPixelCount(t,e,i,r,a,s){var o=0;const n=4*t;for(var c=0;c<r;c++){const t=(e+c)*a*4;for(var h=0;h<i;h++){s[4*h+t+3+n]>0&&o++}}return o}getBoxSize(t,e,i,r,a,s){let o=0,n=0;const c=4*t;for(var h=0;h<r;h++){const t=(e+h)*a*4;for(var u=0;u<i;u++){s[4*u+t+3+c]>0&&(n=Math.max(n,h),o=Math.max(o,u))}}return{boxWidth:o,boxHeight:n}}loadImage(t){var e=new Image;e.src=t,e.onload=()=>this.draw(e)}initImageTexture(){const t=this.gl;t.activeTexture(t.TEXTURE0+1),t.bindTexture(t.TEXTURE_2D,this.textures.image),t.texParameteri(t.TEXTURE_2D,t.TEXTURE_WRAP_S,t.CLAMP_TO_EDGE),t.texParameteri(t.TEXTURE_2D,t.TEXTURE_WRAP_T,t.CLAMP_TO_EDGE),t.texParameteri(t.TEXTURE_2D,t.TEXTURE_MIN_FILTER,t.NEAREST),t.texParameteri(t.TEXTURE_2D,t.TEXTURE_MAG_FILTER,t.NEAREST);const e=t.RGBA,i=t.RGBA,r=t.UNSIGNED_BYTE,a=new Uint8Array([0,0,0,255]);t.texImage2D(t.TEXTURE_2D,0,e,1,1,0,i,r,a)}loadFrameToTexture(t){const e=this.gl,i=e.RGBA,r=e.RGBA,a=e.UNSIGNED_BYTE;e.activeTexture(e.TEXTURE0+1),e.bindTexture(e.TEXTURE_2D,this.textures.image),e.texImage2D(e.TEXTURE_2D,0,i,r,a,t)}initProgram(){const t=function(t,e,i){const r=s(t,t.VERTEX_SHADER,e),a=s(t,t.FRAGMENT_SHADER,i),o=t.createProgram();return t.attachShader(o,r),t.attachShader(o,a),t.linkProgram(o),t.getProgramParameter(o,t.LINK_STATUS)?o:(alert("Unable to initialize the shader program: "+t.getProgramInfoLog(o)),null)}(this.gl,a,r);this.shaderProgram=t,this.textures={ascii:this.gl.createTexture(),image:this.gl.createTexture()},this.buffers={vertex:this.gl.createBuffer(),texture:this.gl.createBuffer(),center:this.gl.createBuffer()},this.attribLocations={a_pos:this.gl.getAttribLocation(t,"a_pos"),a_center:this.gl.getAttribLocation(t,"a_center"),a_texcoord:this.gl.getAttribLocation(t,"a_texcoord")},this.uniformLocations={u_texsize:this.gl.getUniformLocation(t,"u_texsize"),u_asciiCount:this.gl.getUniformLocation(t,"u_asciiCount"),u_texture:this.gl.getUniformLocation(t,"u_texture"),u_image:this.gl.getUniformLocation(t,"u_image"),u_texStep:this.gl.getUniformLocation(t,"u_texStep"),u_hasColor:this.gl.getUniformLocation(t,"u_hasColor")}}createPositionBuffer(){const t=this.boxWidth,e=this.boxHeight,i=Math.floor(this.glCanvas.height/e),r=Math.floor(this.glCanvas.width/t),a=this.buffers.vertex,s=this.buffers.texture,o=this.buffers.center,n=[];var c=[],h=[],u={x:0,y:0};const l=1/r,d=1/i;if(i>1e4||r>1e4)return void console.log("issue with too many counts");for(var g=0;g<i;g++){for(var f=0;f<r;f++){n.push(u.x,u.y,u.x+l,u.y,u.x,u.y+d,u.x+l,u.y,u.x,u.y+d,u.x+l,u.y+d);const i=u.x+l/2,r=u.y+d/2;h.push(i,r,i,r,i,r,i,r,i,r,i,r),c.push(0,0,0+t,0,0,0+e,0+t,0,0,0+e,0+t,0+e),u.x+=l}u.x=0,u.y+=d}const x=this.gl;x.bindBuffer(x.ARRAY_BUFFER,a),x.bufferData(x.ARRAY_BUFFER,new Float32Array(n),x.STATIC_DRAW),a.numItems=n.length/2,x.bindBuffer(x.ARRAY_BUFFER,s),x.bufferData(x.ARRAY_BUFFER,new Float32Array(c),x.STATIC_DRAW),s.numItems=c.length/2,x.bindBuffer(x.ARRAY_BUFFER,o),x.bufferData(x.ARRAY_BUFFER,new Float32Array(h),x.STATIC_DRAW),o.numItems=c.length/2}bindBuffers(){const t=this.gl;t.bindBuffer(t.ARRAY_BUFFER,this.buffers.vertex),t.vertexAttribPointer(this.attribLocations.a_pos,2,t.FLOAT,!1,0,0),t.bindBuffer(t.ARRAY_BUFFER,this.buffers.texture),t.vertexAttribPointer(this.attribLocations.a_texcoord,2,t.FLOAT,!1,0,0),t.bindBuffer(t.ARRAY_BUFFER,this.buffers.center),t.vertexAttribPointer(this.attribLocations.a_center,2,t.FLOAT,!1,0,0),this.gl.enableVertexAttribArray(this.attribLocations.a_pos),this.gl.enableVertexAttribArray(this.attribLocations.a_texcoord),this.gl.enableVertexAttribArray(this.attribLocations.a_center)}setAsciiTexture(){const t=this.gl;t.activeTexture(t.TEXTURE0),t.bindTexture(t.TEXTURE_2D,this.textures.ascii),t.uniform1i(this.uniformLocations.u_texture,0),t.texImage2D(t.TEXTURE_2D,0,t.RGBA,this.textureWidth,this.textureHeight,0,t.RGBA,t.UNSIGNED_BYTE,this.textureData),t.texParameteri(t.TEXTURE_2D,t.TEXTURE_MAG_FILTER,t.NEAREST),t.texParameteri(t.TEXTURE_2D,t.TEXTURE_MIN_FILTER,t.NEAREST),t.texParameteri(t.TEXTURE_2D,t.TEXTURE_WRAP_S,t.CLAMP_TO_EDGE),t.texParameteri(t.TEXTURE_2D,t.TEXTURE_WRAP_T,t.CLAMP_TO_EDGE)}setUniforms(){this.gl.uniform2f(this.uniformLocations.u_texsize,this.textureWidth,this.textureHeight),this.gl.uniform1f(this.uniformLocations.u_asciiCount,this.count),this.gl.uniform1i(this.uniformLocations.u_image,1),this.gl.uniform1f(this.uniformLocations.u_texStep,this.textureStepSize),this.gl.uniform1i(this.uniformLocations.u_hasColor,this.hasColor)}draw(t){this.gl.useProgram(this.shaderProgram),this.drawToCanvas(t),this.loadFrameToTexture(t),this.createPositionBuffer(),this.bindBuffers(),this.setAsciiTexture(),this.setUniforms(),this.drawScene()}pauseVideo(){this.currentPlaybackCallbackId&&(cancelAnimationFrame(this.currentPlaybackCallbackId),console.log("pausing video "),this.currentPlaybackCallbackId=null)}playVideo(t){this.pauseVideo(),this.gl.useProgram(this.shaderProgram),this.createPositionBuffer(),this.bindBuffers(),this.setAsciiTexture(),this.setUniforms(),this.renderVideo(t)}renderVideo(t){this.loadFrameToTexture(t),this.drawScene(),this.currentPlaybackCallbackId=requestAnimationFrame(()=>this.renderVideo(t))}drawScene(){this.gl.drawArrays(this.gl.TRIANGLES,0,this.buffers.vertex.numItems)}}const n="simpsons",c="webcam",h="simpsons.mp4";class u{constructor(){const t=document.querySelector("#glCanvas");if(this.canvas=t,null===t.getContext("webgl"))return void alert("Unable to initialize WebGL. Your browser or machine may not support it.");const e=document.getElementById("canvas");this.asciiBoard=new o(e,t),this.video=document.createElement("video"),this.isMuted=!0,this.setCanvasSize(640,640),this.attachButtonListeners(),this.startSimpsons()}attachButtonListeners(){document.getElementById("sizeSlider").addEventListener("change",t=>{this.asciiBoard.setSize(+t.target.value)}),document.getElementById("colorCheckbox").addEventListener("change",t=>{this.asciiBoard.setHasColor(t.target.checked)}),document.getElementById("muteCheckbox").addEventListener("change",t=>{this.isMuted=t.target.checked,this.video.muted=this.isMuted}),document.getElementById("videoSourceSimpsons").addEventListener("change",t=>{t.target.checked&&this.startSimpsons()}),document.getElementById("videoSourceWebcam").addEventListener("change",t=>{t.target.checked&&this.startWebcam()})}startSimpsons(){this.currentSource=n,this.setUpVideo(h)}startWebcam(){navigator.mediaDevices.getUserMedia({audio:!1,video:!0}).then(t=>{var e=t.getVideoTracks();this.currentSource=c,this.setUpVideo(t,!0),console.log("Using video device: "+e[0].label),t.onremovetrack=function(){console.log("Stream ended")}}).catch((function(t){window.alert("Issue with webcam"),console.log(t)}))}setCanvasSize(t,e){const i=window.devicePixelRatio||1;this.canvas.width=t*i,this.canvas.height=e*i,this.canvas.style.height=`${e}px`,this.canvas.style.width=`${t}px`,this.asciiBoard.setViewport()}setUpVideo(t,e=!1){const i=this.video;this.cleanUpVideo&&this.cleanUpVideo();var r=!1;let a=!1,s=!1;i.autoplay=!0,i.loop=!0,i.muted=!0,e?i.srcObject=t:i.src=t;const o=()=>{r&&a&&!s&&(s=!0,i.muted=this.isMuted,this.setCanvasSize(i.videoWidth,i.videoHeight),this.asciiBoard.playVideo(i,e))},n=()=>{r=!0,o()},c=()=>{a=!0,o()};i.addEventListener("playing",n,!0),i.addEventListener("timeupdate",c,!0),this.cleanUpVideo=()=>{this.asciiBoard.pauseVideo(),i.pause(),i.src=null,i.srcObject=null,i.removeEventListener("playing",n,!0),i.removeEventListener("timeupdate",c,!0)},i.play().then(()=>console.log("video playing")).catch(t=>console.log("error with video ",t))}}new u}]);