import GLUtil from './glutil';
import Basic from './filter/basic';

import Yuyv422 from './fmt/yuyv422';
import Rgb32 from './fmt/rgb32';
import Rgb24 from './fmt/rgb24';
import Nv12 from './fmt/nv12';
import Yuv420 from './fmt/yuv420';
import I420 from "./fmt/i420";
import Rgba from './fmt/rgba';
import Rgb from './fmt/rgb';

class Render {
  constructor (config) {
    this.canvas = config.canvas;
    // input
    if (config.video) {
      this.video = config.video;
      config.flip = 'y';
    } else if (config.image) {
      this.image = config.image;
    } else {
      this._initFmt(config)
    }

    this.filters = [];

    this.basicFilter = new Basic({
      opacity: config.opacity !== undefined ? config.opacity : 1,
      flip: config.flip || undefined
    });

    if (config.filters) {
      for (let i = 0; i < config.filters.length; i++) {
        this.filters.push(config.filters[i]);
      }
    }
    this._init();
  }

  _initFmt (config) {
    switch (config.format) {
      case 'YUY2':
        this.fmt = new Yuyv422(this);
        break;
      case 'RGBA':
        this.fmt = new Rgba(this);
        break;
      case 'RGB':
        this.fmt = new Rgb(this);
        break;
      case 'RGB32':
        this.fmt = new Rgb32(this);
        break;
      case 'RGB24':
        this.fmt = new Rgb24(this);
        break;
      case 'NV12':
        this.fmt = new Nv12(this);
        break;
      case 'YUV420':
        this.fmt = new Yuv420(this);
        break;
      case 'I420':
        this.fmt = new I420(this);
        break;
      default:
        console.error('format illegal')
        break;
    }
  }

  _initImage () {

  }

  _init () {
    this._initContextGL();

    if (!this.gl) {
      throw new Error(`fail to init gl`)
    }

    let gl = this.gl;
    this.fb = gl.createFramebuffer();

    if (this.fmt) {
      this.fmt.init(this);
    } else if (this.video) {
      const width = this.video.videoWidth;
      const height = this.video.videoHeight;
      let emptyPixels = new Uint8Array(width * height * 4);
      this.videoTexture = GLUtil.createTexture(gl, gl.LINEAR, emptyPixels, width, height);
    }
    this.basicFilter.init(this)

    for (let i = 0; i < this.filters.length; i++) {
      let filter = this.filters[i];
      filter.init(this);
    }
  }

  _initContextGL () {
    let canvas = this.canvas;
    let gl = null;

    let validContextNames = ['webgl', 'experimental-webgl', 'moz-webgl', 'webkit-3d'];
    let nameIndex = 0;

    while (!gl && nameIndex < validContextNames.length) {
      let contextName = validContextNames[nameIndex];

      try {
        gl = canvas.getContext(contextName);
      } catch (e) {
        gl = null;
      }

      if (!gl || typeof gl.getParameter !== 'function') {
        gl = null;
      }

      ++nameIndex;
    };

    this.gl = gl;
  };

  _drawPicture (data, iWidth, iHeight) {
    let { texture, width, height } = this.fmt.render(data, iWidth, iHeight);
    this._applyFilters(texture, width, height);
  }

  _drawVideo () {
    let gl = this.gl;
    gl.bindTexture(gl.TEXTURE_2D, this.videoTexture);
    // gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this.video);
    this._applyFilters(this.videoTexture, this.video.videoWidth, this.video.videoHeight)
  }

  _applyFilters (texture, width, height) {
    let gl = this.gl;

    for (let i = 0; i < this.filters.length; i++) {
      let filter = this.filters[i];
      let data = filter.render(texture, width, height);
      texture = data.texture;
      width = data.width;
      height = data.height;
    }

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    if (this.width !== width || this.height !== height) {
      this.width = this.canvas.width = width;
      this.height = this.canvas.height = height;
    }
    this.basicFilter.render(texture, width, height);
  }

  render (data, width, height) {
    if(!this.width || !this.height || this.width !==width || this.height !== height) {
      this.width = width;
      this.height = height;
      this.canvas.width = width;
      this.canvas.height = height;
    }

    if (this.fmt) {
      this._drawPicture(data, width, height)
    } else if (this.video) {
      this._drawVideo();
    }
  }
}

export default Render;
