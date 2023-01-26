// ############################
// A stack of layered canvases.

class CanvasStack {
  constructor (layern = 1, width = 1024, height = 1024, id = "imgcanvas", bg = "#000000") {
    this.layern = layern
    this.width = width
    this.height = height
    this.bg = bg
    
    this.out_canvas = document.createElement("canvas")
    this.out_canvas.id = id
    this.out_canvas.width = width
    this.out_canvas.height = height
    this.out_ctx = this.out_canvas.getContext("2d")
    
    this.canvas_layers = Array(layern)
    this.ctx_layers = Array(layern)
    for (let i = 0; i < layern; i++) {
      this.canvas_layers[i] = document.createElement("canvas")
      this.canvas_layers[i].width = width
      this.canvas_layers[i].height = height
      this.ctx_layers[i] = this.canvas_layers[i].getContext("2d")
    }
  }
  
  // fill all layers with transparency
  clearLayers () {
    for (let ctx of this.ctx_layers) {
      ctx.save()
      ctx.resetTransform()
      ctx.clearRect(0, 0, this.width, this.height)
      ctx.restore()
    }
  }
  
  // set a translation on all layers
  translateLayers (dx, dy) {
    for (let ctx of this.ctx_layers) {
      ctx.translate(dx, dy)
    }
  }
  
  // save state for all layers
  saveLayers () {
    for (let ctx of this.ctx_layers) {
      ctx.save()
    }
  }

  // restore state for all layers
  restoreLayers () {
    for (let ctx of this.ctx_layers) {
      ctx.restore()
    }
  }

  // restore state for all layers
  resetTransformLayers () {
    for (let ctx of this.ctx_layers) {
      ctx.resetTransform()
    }
  }
  
  setBackground (bg) {
    this.bg = bg
  }
  
  render () {
    // clear canvas
    this.out_ctx.fillStyle = this.bg
    this.out_ctx.fillRect(0, 0, this.width, this.height)
    
    // copy layers over
    for (let layer of this.canvas_layers) {
      this.out_ctx.drawImage(layer, 0, 0)
    }
  }
  
  // get drawing context for layer i
  getContext (i) {
    return this.ctx_layers[i]
  }
}

module.exports = CanvasStack
