// render splash screen/progress bar, parameter info, etc.

// logo, saved as a path
const logo = new Path2D(require('./logo-path.txt'))

class RenderHelper {
  static renderProgress(canvas_stack, params, progress) {
    let fg_color = "#201030"
    // clear frame
    canvas_stack.setBackground("#FFFDF8")
    canvas_stack.clearLayers()

    // render to layer 0
    let ctx = canvas_stack.getContext(0)
  
    let w = params.width, h = params.height
  
    // progress bar
    ctx.fillStyle = '#808080'
    ctx.fillRect(0.25 * w, 0.7 * h, 0.5 * progress * w, 0.018 * h)
    ctx.strokeStyle = fg_color
    ctx.lineWidth = params.scale / 300
    ctx.strokeRect(0.25 * w, 0.7 * h, 0.5 * w, 0.018 * h)
    // label under progress bar
    ctx.fillStyle = fg_color
    let label = 'performing gradient descent'
    ctx.textAlign = "center"
    ctx.font = `${0.018 * h}px sans-serif`
    ctx.fillText(label, 0.5 * w, 0.69 * h)
  
    label = 'The Artifact'
    ctx.textAlign = "center"
    ctx.font = `${0.06 * h}px sans-serif`
    ctx.fillText(label, 0.5 * w, 0.25 * h)

    label = 'Claus O. Wilke, 2023'
    ctx.textAlign = "center"
    ctx.font = `${0.03 * h}px sans-serif`
    ctx.fillText(label, 0.5 * w, 0.45 * h)

    // logo
    ctx.save()
    ctx.translate(0.5 * w, 0.34 * h)
    let logoscale = 0.2 * params.resolution * h / params.scale
    ctx.scale(logoscale, logoscale)
    ctx.fillStyle = 'fg_color'
    ctx.fill(logo, "evenodd")
    ctx.restore()
    canvas_stack.render()
  }
  
  // output parameters
  static renderParams(canvas_stack, params) {
    // write directly to the output canvas, has to happen after render()
    let ctx = canvas_stack.out_ctx
    let scale = params.scale
    ctx.fillStyle = '#FFFFFFE0'
    ctx.fillRect(0.05 * scale, 0.05 * scale, 0.47 * scale, 0.53 * scale)
    ctx.textAlign = "left"
    ctx.font = `${0.04 * scale}px sans-serif`
    ctx.fillStyle = "#000000"
    ctx.fillText(`Palette: ${params.palette_name}`, 0.06 * scale, 0.1 * scale)
    ctx.fillText(`Input data: ${params.input_type}`, 0.06 * scale, 0.15 * scale)
    ctx.fillText(`Data groups: ${params.groups}`, 0.06 * scale, 0.2 * scale)
    ctx.fillText(`Total points: ${params.N}`, 0.06 * scale, 0.25 * scale)
    ctx.fillText(`Perplexity: ${params.perplexity}`, 0.06 * scale, 0.3 * scale)
    ctx.fillText(`Noise: ${params.data_params.noise}`, 0.06 * scale, 0.35 * scale)
    ctx.fillText(`Geometry: ${params.geometry}`, 0.06 * scale, 0.4 * scale)
    ctx.fillText(`Speed: ${round(params.data_params.speed)}`, 0.06 * scale, 0.45 * scale)
    ctx.fillText(`Phase: ${round(params.data_params.phase)}`, 0.06 * scale, 0.5 * scale)
    ctx.fillText(`Amplitude: ${round(params.data_params.amp)}`, 0.06 * scale, 0.55 * scale)
  }
}

function round(x) {
  return Math.round(x*100)/100
} 

module.exports = RenderHelper