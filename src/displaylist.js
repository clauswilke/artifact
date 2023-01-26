// exponend for scaling dot size with number of dots
const SIZEEXP = 0.5


class DisplayListItem {
  constructor() {
  }
  
  // draw the current item
  // returns `true` if the item is fully drawn, `false`
  // if render() needs to be called again.
  render () {
    return true
  }
}

// Setup canvas stack for rendering
class SetupItem extends DisplayListItem {
  constructor (canvas_stack, bg, xoff, yoff) {
    super()
    
    this.canvas_stack = canvas_stack
    this.bg = bg
    this.xoff = xoff
    this.yoff = yoff
  }

  render () {
    this.canvas_stack.setBackground(this.bg)
    this.canvas_stack.clearLayers()
  
    // draw scene
    this.canvas_stack.resetTransformLayers()
    this.canvas_stack.translateLayers(this.xoff, this.yoff)
    return true
  }
}


// Draw filled polygons
class FilledPath2DItem extends DisplayListItem {
  constructor (ctx, color, path) {
    super()
    
    this.ctx = ctx
    this.color = color
    this.path = path
  }

  render () {
    this.ctx.fillStyle = this.color
    this.ctx.fill(this.path, "evenodd")
    return true
  }
}

// Generate dot gradient across canvas
class GradientDotsItem extends DisplayListItem {
  // ctx: canvas drawing context
  // rnd: random number generator
  // color: color of the dots drawn
  // xmin, xmax, ymin, ymax: bounding box of area covered
  // n, m: number of columns/rows drawn
  // k: sqrt of number of rounds of points drawn, will do k offsets per row/column
  // sd: standard deviation of noise applied to points
  // bg_x0, bg_y0: coordinates of points defining gradient
  // scale: sale parameter of drawing (converts logical coords to pixels)
  constructor (ctx, rnd, color, xmin, xmax, ymin, ymax, n, m, k, sd, bg_x0, bg_y0, scale) {
    super()
    
    this.ctx = ctx
    this.rnd = rnd
    this.color = color
    this.xmin = xmin
    this.xmax = xmax
    this.ymin = ymin
    this.ymax = ymax
    this.n = n
    this.m = m
    this.k = k
    this.sd = sd
    this.bg_x0 = bg_x0
    this.bg_y0 = bg_y0
    this.scale = scale

    this.dx = (xmax - xmin) / n
    this.xoff = this.dx / k
    this.dy = (ymax - ymin) / m
    this.yoff = this.dy / k

    // scale dot size with number of point iterations drawn
    this.dotsize = 49 / (k * k)
    // make dotsize decline slower than linear in # of dots
    this.dotsize = Math.pow(this.dotsize, SIZEEXP)
    // final size also depends on the resolution as given by `scale`
    this.size = this.dotsize * scale / 350
    
    // adjust amount of noise by dot size
    this.sd = this.dotsize * this.sd

    this.count = 0 // counts the number of rounds 
  }

  render () {
    for (let i = 0; i < this.n; i++) {
      for (let j = 0; j < this.m; j++) {
        let x = this.xmin + i * this.dx + (this.count % this.k) * this.xoff + this.rnd.rNorm(0, this.sd)
        let y = this.ymin + j * this.dy + (Math.floor(this.count / this.k)) * this.yoff + this.rnd.rNorm(0, this.sd)
        if (this.rnd.rUnif() < this.gradient_prob(x, y, this.bg_x0, this.bg_y0)) {
          this.makeDot(x, y)
        }
      }
    }
        
    this.count += 1
    if (this.count < this.k * this.k) {
      return false
    }
    return true
  }
  
  makeDot (x, y) {
    this.ctx.fillStyle = this.color
    let dot = new Path2D()
    dot.moveTo(x, y - this.size / 2)
    dot.lineTo(x - this.size / 2, y)
    dot.lineTo(x, y + this.size / 2)
    dot.lineTo(x + this.size / 2, y)
    dot.closePath()
    this.ctx.fill(dot)
  }
  
  // perpendicular dot product, https://en.wikipedia.org/wiki/Vector_projection
  perpdot (x0, y0, x1, y1, x2, y2) {
    let dx2 = x2 - x1
    let dx0 = x0 - x1
    let dy2 = y2 - y1
    let dy0 = y0 - y1
  
    return (dx0 * dy2 - dy0 * dx2) / Math.sqrt(dx2 * dx2 + dy2 * dy2)
  }
  
  gradient_prob (x, y, x0 = 1, y0 = 1) {
    let d = this.perpdot(x, y, 0, 0, x0, y0) / this.scale
    //return 0.7 + 0.5*d // original choice, not perfect
    return 0.5 + 0.35 * d
  }
}

// Make a scatter plot of points (circles) in given color
class ScatterPlotItem extends DisplayListItem {
  // ctx: canvas drawing context
  // points: vector of points to draw (should contain components x, y, color)
  // scale: sale parameter of drawing (converts logical coords to pixels)
  constructor (ctx, points, scale) {
    super()
    
    this.ctx = ctx
    this.points = points
    this.scale = scale

    // size of dots depends on the resolution as given by `scale`
    this.size = 15 * scale / 1200
    this.linewidth = 1 * scale / 1200
  }

  render () {
    for (let p of this.points) {
      this.makePoint(p)
    }
    return true
  }
  
  makePoint (p) {
    let strokecol = p.color.length > 7 ? p.color.slice(0, -2) : p.color
    let fillcol = strokecol + '80'
    this.ctx.strokeStyle = strokecol  
    this.ctx.lineWidth = this.linewidth
    this.ctx.fillStyle = fillcol
    this.ctx.beginPath()
    this.ctx.arc(p.x, p.y, this.size, 0, 2 * Math.PI)
    this.ctx.fill()
    this.ctx.stroke()
  }
}

// Fill polygons with dots
class StippledPathItem extends DisplayListItem {
  // ctx: canvas drawing context
  // path: Path2D object to determine whether dots are drawn or not
  // rnd: random number generator
  // colors: vector of three colors coloring the dots drawn
  // n: number of dots drawn per round divided by three (3*n dots are drawn)
  // rounds: number of rounds
  // scale: sale parameter of drawing (converts logical coords to pixels)
  constructor (ctx, path, rnd, colors, n, rounds, scale) {
    super()
    
    this.ctx = ctx
    this.path = path
    this.rnd = rnd
    this.colors = colors
    this.n = n
    this.rounds = rounds
    this.scale = scale
    
    // scale dot size with number of point iterations drawn
    this.dotsize = 100 / rounds
    // make dotsize decline slower than linear in # of dots
    this.dotsize = Math.pow(this.dotsize, SIZEEXP)
    // final size also depends on the resolution as given by `scale`
    this.size = this.dotsize * scale / 500
    this.count = 0 // counts the number of rounds 
  }

  render () {
    let sd = 0.4 * this.scale
    for (let i = 0; i < this.n; i++) {
      // dot 1
      let x = this.rnd.rNorm(-0.2 * this.scale, sd)
      let y = this.rnd.rNorm(0.4 * this.scale, sd)
      if (this.isInPath(x, y)) {
        this.makeDot(x, y, this.colors[0])
      }
      // dot 2
      x = this.rnd.rNorm(0.2 * this.scale, sd)
      y = this.rnd.rNorm(-0.3 * this.scale, sd)
      if (this.isInPath(x, y)) {
        this.makeDot(x, y, this.colors[1])
      }
      // dot 3
      x = this.rnd.rNorm(0.5 * this.scale, sd)
      y = this.rnd.rNorm(0.1 * this.scale, sd)
      if (this.isInPath(x, y)) {
        this.makeDot(x, y, this.colors[2])
      }
    }
        
    this.count += 1
    if (this.count < this.rounds) {
      return false
    }
    return true
  }
  
  makeDot (x, y, color) {
    this.ctx.fillStyle = color
    let dot = new Path2D()
    dot.moveTo(x, y - this.size / 2)
    dot.lineTo(x - this.size / 2, y)
    dot.lineTo(x, y + this.size / 2)
    dot.lineTo(x + this.size / 2, y)
    dot.closePath()
    this.ctx.fill(dot)
  }
  
  isInPath (x, y) {
    this.ctx.save()
    this.ctx.resetTransform() // isPointInPath doesn't work with translated coords
    let result = this.ctx.isPointInPath(this.path, x, y, "evenodd")
    this.ctx.restore()
    return result
  }
}

class DisplayList {
  constructor () {
    this.items = []
    this.idx = 0
  }
  
  addItem (item) {
    this.items.push(item)
  }
  
  // returns `true` if the display list has been fully
  // rendered, `false` otherwise
  renderItem () {
    let item = this.items[this.idx]
    if (typeof item === 'undefined') { return true }
    
    let done = item.render()
    if (done) {
      this.idx += 1
    }
    
    return done && this.idx >= this.items.length
  }
}

module.exports = { DisplayList, DisplayListItem, SetupItem, GradientDotsItem, ScatterPlotItem, StippledPathItem, FilledPath2DItem }