
class DataFactory {
  constructor (rnd) {
    this.rnd = rnd
  }
  
  createDataParams(type) {
    // these choices may have to depend on the data type chosen
    let speed = this.rnd.rUnif()
    let phase = this.rnd.rUnif()
    let amp = this.rnd.rUnif()
    let noise = this.rnd.chooseOneWeighted([0, 0.002, 0.005, 0.01, 0.02, 0.2], [4, 3, 2, 0.5, 0.2, 0.02])
    
    if (type === "lines") {
      speed = 1 + 9 * speed * speed * speed
      phase = 0
      amp = 0
    } else if (type === "waves") {
      speed = 0.5 + 1.0 * speed
      phase = 1.5 + 1.0 * phase
      amp = 0.5 + 0.5 * amp
    } else if (type === "rings") {
      speed = 2.5 * speed * speed
      phase = 2 + 4 * phase
      amp = 0
    } else if (type === "spirals") {
      speed = 2 + 2.0 * speed
      phase = 0
      amp = 0
    } else if (type === "grid") {
      amp = 0
      speed = 0
      phase = 0
    } else { // crossed rings
      speed = 3 * speed * speed
      phase = 2 + 4 * phase
      amp = 0
    }
    
    return { type, amp, speed, phase, noise }
  }
  
  
  setupData(params, groups = 5, n = 100) {
    if (params.type === "lines") { // lines
      return this.setupLines(groups, n, params.speed, params.noise)
    } else if (params.type === "waves") { // waves
      return this.setupWaves(groups, n, params.amp, params.speed, params.phase, params.noise)
    } else if (params.type === "rings") {
      return this.setupRings(groups, n, params.speed, params.phase, params.noise)
    } else if (params.type === "spirals") {
      return this.setupSpirals(groups, n, params.speed, params.noise)
    } else if (params.type === "grid") {
      return this.setupGrid(groups, n, params.noise)
    }
  
    return this.setupCrossedRings(groups, n, params.speed, params.phase, params.noise)
  }

  setupLines(groups = 5, n = 100, speed = 1, noise = 0) {
    let points = []
  
    for (let i = 0; i < groups; i++) {
      for (let j = 0; j < n; j++) {
        points.push({
          x: 1.4 * ((i + .5) / groups + noise * (this.rnd.rUnif() - 0.5) - 0.5),
          y: speed * 1.4 * (Math.pow((j + .5) / n, 1.6) + noise * (this.rnd.rUnif() - 0.5) - 0.5)
        })
      }
    }
    return points
  }


  setupWaves(groups = 5, n = 100, amp = 3, speed = 1, phase = 5, noise = 0) {
    let points = []
  
    for (let i = 0; i < groups; i++) {
      for (let j = 0; j < n; j++) {
        points.push({
          x: 1.4 * ((i + .5) / groups + noise * (this.rnd.rUnif() - 0.5) - 0.5 +
                (amp / groups) * Math.sin(speed * Math.PI * (j + phase * i) / n)),
          y: 1.4 * ((j + .5) / n + noise * (this.rnd.rUnif() - 0.5) - 0.5)
        })
      }
    }
    return points
  }

  setupRings(groups = 5, n = 100, speed = 1, phase = 5, noise = 0) {
    let points = []
  
    for (let i = groups - 1; i >= 0; i--) { // go largest to smallest ring, important!
      for (let j = 0; j < n; j++) {
        points.push({
          x: 1.4 * (i + .5) / groups * (Math.sin(2 * Math.PI * (j + phase * i) / n) + .5 * speed + 1.*noise * (this.rnd.rUnif() - 0.5)),
          y: 1.4 * (i + .5) / groups * (Math.cos(2 * Math.PI * (j + phase * i) / n) + 1.*noise * (this.rnd.rUnif() - 0.5))
        })
      }
    }
    return points
  }

  setupSpirals(groups = 5, n = 100, speed = 1, noise = 0) {
    let from = 4
    let to = 5
    let alpha = speed // misuse speed variable here for simplicity
    let points = []
  
    for (let i = 0; i < groups; i++) {
      for (let j = 0; j < n; j++) {
        let t = Math.PI * (from + (j / (n-1))*(to - from))
        let angle = 2 * Math.PI * (i / groups)
        let C = Math.pow(Math.PI * to, alpha) // max(t^alpha)
        points.push({
          x: Math.pow(t, alpha) * Math.sin(t + angle) / C + noise * this.rnd.rUnif(),
          y: Math.pow(t, alpha) * Math.cos(t + angle) / C + noise * this.rnd.rUnif()
        })
      }
    }
    return points
  }

  setupGrid(groups = 5, n = 100, noise = 0) {
    let points = []
  
    for (let i = 0; i < groups; i++) {
      for (let j = 0; j < n; j++) {
        let x = 1.4 * ((i + .5) / groups + noise * (this.rnd.rUnif() - 0.5) - 0.5)
        let y = 1.4 * ((j + .5) / n + noise * (this.rnd.rUnif() - 0.5) - 0.5)
        if (i % 2 === 0) {
          let temp = x
          x = y
          y = temp
        }
        points.push({x: x, y: y})
      }
    }
    return points
  }

  setupCrossedRings(groups = 5, n = 100, speed = 1, phase = 5, noise = 0) {
    let points = Array(groups * n)
  
    // even groups: rings
    for (let i = 0; i < groups; i+=2) {
      for (let j = 0; j < n; j++) {
        let k = i * n + j
        points[k] = {
          x: 1.4 * (i + .5) / groups * (Math.sin(2 * Math.PI * (j + phase * i) / n) + .5 * speed + noise * (this.rnd.rUnif() - 0.5)),
          y: 1.4 * (i + .5) / groups * (Math.cos(2 * Math.PI * (j + phase * i) / n) + noise * (this.rnd.rUnif() - 0.5))
        }
      }
    }
  
    // odd groups: lines
    let m = Math.floor(groups / 2) // number of odd groups (starting from 0)
    for (let i = 1; i < groups; i+=2) {
      for (let j = 0; j < n; j++) {
        let k = i * n + j
        let y = 1.4 * ((i + .5) / (2 * m + 1) + noise * (this.rnd.rUnif() - 0.5) - 0.5)
        let x = 1.4 * ((j + .5) / n + noise * (this.rnd.rUnif() - 0.5) - 0.5)
        points[k] = {x: x, y: y}
      }
    }

    return points
  }
}

module.exports = DataFactory
