/**
 * The Artifact - t-SNE based JavaScript generative art
 * 
 * Copyright (c) 2023, Claus O. Wilke
 * 
 * This code and its outputs are released under CC0:
 * https://creativecommons.org/share-your-work/public-domain/cc0/
 * @preserve
 **/

import FXRandom from './fxrandom.js'
import CanvasStack from './canvasstack.js'
import DataFactory from './datafactory.js'
import Params from './params.js'
import RenderHelper from './renderhelper.js'
import TSNEWrapper from './tsnewrapper.js'
import {DisplayList, SetupItem, GradientDotsItem, ScatterPlotItem, StippledPathItem, FilledPath2DItem} from './displaylist.js'

//fxhash = 'ooaRaEbAqA5hQpf8Kh8z2mnaoBZdRZ7iDLdSihtbdKczUrA2VHn'
console.log('Hash:', fxhash)
// random number generator
let rnd = new FXRandom(fxhash, true)

// ############################
// URL parameters

let urlparams = (new URL(document.location)).searchParams
// density of stippling, should be small multiples of 1; note that the number of dots increases quadratically with increase in density setting
let density = Number(urlparams.get('d')) || 1
// multiplier for image resolution
let resolution = Number(urlparams.get('r')) || (isFxpreview ? 0.5 : 1)
// draw overlay with generator parameters?
let show_params = urlparams.has('p') || false
let hide_rendering_popup = urlparams.has('h') || (isFxpreview ? true : false)

// ############################
// Global parameters

let data_factory = new DataFactory(rnd)
let params = Params.generate(rnd, data_factory, density, resolution, show_params, hide_rendering_popup)
// generate fx(hash) feature object
Params.setFXFeatures(params)
console.log(window.$fxhashFeatures)
if (params.show_params) {
  console.log(params)
}

let displ = new DisplayList()

// generate input data
let input_data = data_factory.setupData(params.data_params, params.groups, params.n) 

// layered canvas for rendering
let canvas_stack = new CanvasStack(3, params.width, params.height)
let wrapper = document.getElementById('wrapper')
wrapper.appendChild(canvas_stack.out_canvas)

let tSNE // t-SNE wrapper
let tSNE_completed = false // has t-SNE gradient descent completed?
let rendering_interval // interval object for animation

// ############################
// Window resizing and keyboard commands

window.addEventListener('resize', resizeWindow)
resizeWindow() // call once to make sure image is sized correctly

document.addEventListener('keyup', function (event) {
  // 's' saves to png
  if (event.key === 's') {
    savePNG()
  }
})

// ############################
// Initialize t-SNE and start rendering

new TSNEWrapper(new FXRandom(fxhash, true), input_data, params.perplexity)
  .then((resolve) => {
    tSNE = resolve
  })
  .then((resolve) => {
    rendering_interval = setInterval(updateTSNE, 0)
  })

async function updateTSNE() {
  // are we done with iterating?
  if (tSNE.current_step >= params.max_iter) {
    tSNE_completed = true
  }

  // are we done with tSNE?
  if (tSNE_completed) {
    clearInterval(rendering_interval)
    prepareScene(displ) // set up the final scene to render
    rendering_interval = setInterval(render, 0) // start rendering loop
    if (!params.hide_rendering_popup) {
      showRenderingMessage()
    }
    // adjust page background to image background
    document.body.style.backgroundColor = params.palette.pagebg
    wrapper.style.backgroundColor = params.palette.bg + "E8"
    return
  }
  
  // take tSNE steps
  if (tSNE.initialized) {
    for (let i = 0; i < 5; i++) {
      tSNE.takeStep()
    }
    let progress = (tSNE.current_step + 1)/(params.max_iter + 1)
    RenderHelper.renderProgress(canvas_stack, params, progress)
  }
}

// progressive render
function render () {
  let done = displ.renderItem() // render one item
  canvas_stack.render()
  if (params.show_params) {
    RenderHelper.renderParams(canvas_stack, params) // add debug params
  }

  // are we done with everything?
  if (done) {
    clearInterval(rendering_interval)
    canvas_stack.render()
    if (params.show_params) {
      RenderHelper.renderParams(canvas_stack, params) // add debug params
    }
    hideRenderingMessage()
    fxpreview() // trigger preview capture
  }
}

function prepareScene(dl) {
  // We always need to add a SetupItem first, to get to a defined state
  dl.addItem(new SetupItem(canvas_stack, params.palette.bg, params.width / 2, params.height / 2))
  
  // convenience functions to map points to groups
  const groupIdx = (i) => (Math.floor(i / params.n))
  const withinGroupIdx = (i) => (i % params.n)
  
  // Now obtain tSNE data and construct remainder of the scene
  let tsne_data = tSNE.getOutput()
  let xmin = 10000, xmax = -10000, ymin = 10000, ymax = -10000
  let xcenter = 0, ycenter = 0
  for (let i = 0; i < params.N; i++) {
    xmin = Math.min(xmin, tsne_data[i].x)
    xmax = Math.max(xmax, tsne_data[i].x)
    ymin = Math.min(ymin, tsne_data[i].y)
    ymax = Math.max(ymax, tsne_data[i].y)
  }
  xcenter = 0.5 * (xmin + xmax)
  ycenter = 0.5 * (ymin + ymax)
  let scaleconst = 2 * params.image_scale * params.scale / Math.max(xmax - xmin, ymax - ymin)

  // retrieve coordinates
  let draw_info = Array(params.N)
  for (let i = 0; i < params.N; i++) {
    let g = groupIdx(i)
    let info = {
      x: scaleconst * (tsne_data[i].x - xcenter),
      y: scaleconst * (tsne_data[i].y - ycenter),
      g: g,
      color: params.palette.fg_by_group[g]
    }
    draw_info[i] = info
  }
  
  // calculate subgroups
  let dmax = scaleconst * 0.1 // maximum distance within a group (originally 0.1)
  dmax *= dmax // square to avoid one square root
  let sg = 0
  let g = draw_info[0].g
  draw_info[0].sg = sg
  for (let i = 1; i < params.N; i++) {
    let dx = draw_info[i].x - draw_info[i - 1].x
    let dy = draw_info[i].y - draw_info[i - 1].y
    let d = dx * dx + dy * dy
    // we start a new subgroup if either distance is too large or new group is reached
    if (d > dmax || g !== draw_info[i].g) {
      sg += 1
      g = draw_info[i].g
    }
    draw_info[i].sg = sg
  }

  let ctx0 = canvas_stack.getContext(0)
  let ctx1 = canvas_stack.getContext(1)
  let ctx2 = canvas_stack.getContext(2)

  let region = new Path2D()
  let complete = new Path2D()
  region.moveTo(draw_info[0].x, draw_info[0].y)
  complete.moveTo(draw_info[0].x, draw_info[0].y)
  sg = draw_info[0].sg
  g = draw_info[0].g
  for (let i = 0; i < params.N; i++) {
    // first the logic for individual regions
    if (draw_info[i].sg === sg) { // same group, add a point to the path
      region.lineTo(draw_info[i].x, draw_info[i].y)
    } else { // new group, close path and fill
      region.closePath()
      let fgcol = params.palette.fg_by_group[g]
      dl.addItem(new FilledPath2DItem(ctx1, fgcol, region))
      // start new region
      region = new Path2D()
      region.moveTo(draw_info[i].x, draw_info[i].y)
      sg = draw_info[i].sg
    }
    // then the logic for the complete polygon
    if (draw_info[i].g !== g && params.geometry === "fractured") {
      complete.closePath() // close current sub-path
      complete.moveTo(draw_info[i].x, draw_info[i].y)
    } else {
      complete.lineTo(draw_info[i].x, draw_info[i].y)
    }
    g = draw_info[i].g
  }
  // close final region and fill
  region.closePath()
  complete.closePath()
  let fgcol = params.palette.fg_by_group[g]
  dl.addItem(new FilledPath2DItem(ctx1, fgcol, region))
  
  // background stippling
  let n = 75
  let m = Math.floor(params.height/params.width * n + 0.4)
  let k = 10 * params.density
  let sd = 0.001 * params.scale
  dl.addItem(new GradientDotsItem(ctx0, rnd, params.palette.border, -params.width / 2, params.width / 2, -params.height / 2, params.height / 2, n, m, k, sd, params.bg_x0, params.bg_y0, params.scale))
  
  // forground stippling
  let cols = rnd.chooseManyUnique(params.palette.fg, 3)
  let rounds = 80 * params.density * params.density
  dl.addItem(new StippledPathItem(ctx2, complete, rnd, cols, 10000, rounds, params.scale)) 
  
  // foreground polygon (for debugging)
  //dl.addItem(new FilledPath2DItem(ctx2, params.palette.fg_by_group[0], complete))
  // raw data points (for debugging)
  //dl.addItem(new ScatterPlotItem(ctx2, draw_info, params.scale))
}

// save the current image as a png
function savePNG() {
  canvas_stack.out_canvas.toBlob((blob) => {
    let el = document.createElement("a")
    let url = URL.createObjectURL(blob)
    el.setAttribute("href", url)
	  el.setAttribute("download", `artifact_${fxhash}.png`)
	  document.body.appendChild(el)
 	  el.click()
	  el.remove()
  })
}

function resizeWindow() {
  let outwidth = window.innerWidth
  let marginTop = 0
  let asp = params.width/params.height
  if (asp * window.innerHeight < window.innerWidth) {
    outwidth = asp * window.innerHeight
  } else {
    marginTop = (window.innerHeight - window.innerWidth / asp) / 2
  }
  
  canvas_stack.out_canvas.style.width = `${outwidth}px`
  canvas_stack.out_canvas.style.marginTop = `${marginTop}px`
}

function showRenderingMessage() {
  let collection = document.getElementsByClassName("rendering")
  for (let e of collection) {
    e.style.display = "block"
  }
}

function hideRenderingMessage() {
  let collection = document.getElementsByClassName("rendering")
  for (let e of collection) {
    e.style.display = "none"
  }
}
