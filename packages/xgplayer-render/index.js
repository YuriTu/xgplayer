/* eslint-disable no-undef */
const width = 1194;
const height = 668;
/*
let lut = new LutFilter({
  lut: 'https://sf6-ttcdn-tos.pstatp.com/obj/ttfe/media/lut/lut_119.png',
  opacity: 0.5
});
*/
function fetchdata (file, cb) {
  fetch(file).then(res => {
    return res.arrayBuffer()
  }).then(data => {
    cb(new Uint8Array(data));
  })
}

fetchdata(`data/yuyv422.yuv`, function (data) {
  let r = new Render({
    format: 'YUY2',
    canvas: document.querySelector('#c1')
  });
  r.render([data], width, height);
})

fetchdata(`data/rgb32.yuv`, function (data) {
  let r = new Render({
    format: 'RGB32',
    canvas: document.querySelector('#c2')
  });
  r.render([data], width, height);
});

fetchdata(`data/rgb24.yuv`, function (data) {
  let r = new Render({
    format: 'RGB',
    canvas: document.querySelector('#c3')
  });
  r.render([data], width, height);
})

fetchdata(`data/nv12.yuv`, function (data) {
  window.r = new Render({
    format: 'NV12',
    canvas: document.querySelector('#c4')
  });
  let ydata = data.slice(0, width * height);
  let uvdata = data.slice(width * height, 1.5 * width * height);
  r.render([ydata, uvdata], width, height);
})

fetchdata(`data/yuv420p.yuv`, function (data) {
  let r = new Render({
    format: 'YUV420',
    canvas: document.querySelector('#c5')
  });
  let ydata = data.slice(0, 1194 * 668);
  let udata = data.slice(1194 * 668, 1.25 * 1194 * 668);
  let vdata = data.slice(1.25 * 1194 * 668, 1.5 * 1194 * 668);
  r.render([ydata, udata, vdata], 1194, 668);
})

function rendervideo () {   
  let { r, data, frameCount, lastRenderTime } = window.vdata;
  if (new Date().getTime() - lastRenderTime < 33) {
    requestAnimationFrame(rendervideo);
  } else {
    let width = 1280;
    let height = 704;
    let start = frameCount * width * height * 1.5;
    let ydata = data.slice(start, start + (width * height));
    let udata = data.slice(start + (width * height), start + (1.25 * width * height));
    let vdata = data.slice(start + (1.25 * width * height), start + (1.5 * width * height));

    r.render([ydata, udata, vdata], 1280, 704);
    // window.vdata.lastRenderTime = new Date().getTime();
    window.vdata.frameCount++;
    requestAnimationFrame(rendervideo);
  }
}

fetchdata(`data/I420-1.yuv`, function (data) {
  window.vdata = {
    r: new Render({
      format: 'YUV420',
      canvas: document.querySelector('#c6')
    }),
    data,
    frameCount: 0,
    lastRenderTime: 0
  };
  requestAnimationFrame(rendervideo)
});
