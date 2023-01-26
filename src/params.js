const ColorPalettes = require('./colorpalettes.js')

class Params {
  static generate(rnd, data_factory, density, resolution, show_params, hide_rendering_popup) {
    // width and height multiplier for image sizing
    let [wmult, hmult] = rnd.chooseOne([[1, 1], [1.5, 1], [1.33, 1], [1, 1.33], [1, 1.5]])

    // conversion factor from tSNE coords (-1 to 1) to pixel coords (-scale to scale)
    let scale = resolution * 1200
    
    // image width and height (in pixels)
    let width = 2 * wmult * scale
    let height = 2 * hmult * scale
    
    // number of iterations of gradient descent
    let max_iter = 400
    
    // number of data groups
    let groups = rnd.chooseOne(
      [ 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10, 12, 14, 16,
       20, 22, 24, 28, 30, 34, 36, 40]
    )
    
    // number of points per data group
    let n = Math.floor(
      rnd.chooseOne(
        [300, 350, 400, 450, 500, 600, 800, 1000, 1200, 1500, 1700, 2000]
      ) / groups
    )
    
    // total numer of points
    let N = groups * n
    if (N > 1300) { // reduce number of iterations for large data sets
      max_iter = 300
    }
    
    // perplexity parameter
    let perplexity = rnd.chooseOne(
      [3, 4, 5, 8, 12, 14, 16, 18, 20, 25, 30]
    )
    // adjust perplexity for total number of points
    perplexity *= 1 + Math.floor(N / 700)
    
    // type of input data
    let input_type = rnd.chooseOneWeighted(
      ["lines", "waves", "rings", "spirals", "grid", "crossed rings"],
      [1.5, 0.75, 1.0, 0.35, 0.25, 0.75]
    )
    
    // other input data settings
    let data_params = data_factory.createDataParams(input_type)


    // geometry type (affects stippling pattern)
    let geometry = rnd.chooseOne(['fractured', 'connected'])
    
    // overall scale of artifact in image (amount of margin left)
    let image_scale = .85 + 0.1 * rnd.rUnif()

    // background stippling direction    
    let theta = 2 * Math.PI * rnd.rUnif()
    let bg_x0 = Math.cos(theta)
    let bg_y0 = Math.sin(theta)
    
    // color palette
    let palette_id = rnd.chooseOneWeighted(
      ColorPalettes.availablePalettes(),
      ColorPalettes.paletteWeights()
    )
    let palette_name = ColorPalettes.getPaletteName(palette_id)
    let palette = ColorPalettes.getPalette(palette_id)
    // assign foreground colors to groups, do this last because
    // number of random numbers used depends on prior choices
    palette.fg_by_group = Array(groups).fill(0).map(() => rnd.chooseOne(palette.fg_secondary) + palette.sec_alpha)
    
    return {
      wmult, hmult, scale, width, height, resolution, density,
      max_iter, groups, n, N, perplexity, geometry,
      input_type, data_params, image_scale,
      bg_x0, bg_y0, show_params, hide_rendering_popup,
      palette_id, palette_name, palette
    }
  }
  
  static setFXFeatures(params) {
    let groupbin = `${params.groups}`
    if (params.groups >= 10 && params.groups < 20) {
      groupbin = "10-20"
    } else if (params.groups >= 20 && params.groups < 30) {
      groupbin = "20-30"
    } if (params.groups >= 30) {
      groupbin = "30-40"
    }

    let pointbin
    if (params.N < 800) {
      pointbin = "<800"
    } else if (params.N < 1200) {
      pointbin = "800-1200"
    } else if (params.N < 1600) {
      pointbin = "1200-1600"
    } else {
      pointbin = "1600-2000"
    }
  
    let perplexbin = `${params.perplexity}`
    if (params.perplexity >= 10 && params.perplexity < 15) {
      perplexbin = "10-15"
    } else if (params.perplexity >= 15 && params.perplexity < 20) {
      perplexbin = "15-20"
    } else if (params.perplexity >= 20 && params.perplexity < 30) {
      perplexbin = "20-30"
    } else if (params.perplexity >= 30 && params.perplexity < 40) {
      perplexbin = "30-40"
    } else if (params.perplexity >= 40){
      perplexbin = "40+"
    }
  
    let noisebin = "none"
    if (params.data_params.noise > 0 && params.data_params.noise < 0.01) {
      noisebin = "little"
    } else if (params.data_params.noise >= 0.01 && params.data_params.noise < 0.03) {
      noisebin = "moderate"
    } else if (params.data_params.noise >= 0.03) {
      noisebin = "extreme"
    }
   
    window.$fxhashFeatures = {
      "Input data": params.input_type,
      "Data groups": groupbin,
      "Total points": pointbin,
      "Perplexity": perplexbin,
      "Noise": noisebin,
      "Format": `${params.wmult}:${params.hmult}`,
      "Palette": params.palette_name,
      "Geometry": params.geometry
    }
  }
}


module.exports = Params