// ############################
// Web assembly code
const wasm64 = require('./assembly/tsne.wasm64')
const wasm = Uint8Array.from(atob(wasm64), c => c.charCodeAt(0))

// ############################
// t-SNE wrapper class

class TSNEWrapper {
  constructor (rnd, input_data, perplexity) {
    this.rnd = rnd
    this.input_data = input_data
    this.N = input_data.length
    this.perplexity = perplexity
    this.current_step = 0
    this.initialized = false
    
    return this.initialize()
      .then((result) => this)
  }
  
  takeStep() {
    if (this.initialized) {
      this.tSNE.takeStep()
      this.current_step += 1
      return true
    } else {
      return false
    }
  }
  
  initialize() {
    this.current_step = 0
    
    let imports = {
      env: {
        abort: () => undefined,
        consoleLog: value => console.log(value),
        runif: () => this.rnd.rUnif(),
        sum: () => sum
      },
      Math: Math // import JS Math module (for --use Math=JSMath)
    }
  
    // instantiate the module
    return WebAssembly.instantiate(wasm, imports)
      .then((result) => {
        this.wasmModule = result

        // get module exports and input and output bases
        this.tSNE = this.wasmModule.instance.exports
        this.input_base = this.tSNE.INPUT_BUF.valueOf() / this.tSNE.F64_SIZE.valueOf()
        this.output_base = this.tSNE.OUTPUT_BUF.valueOf() / this.tSNE.F64_SIZE.valueOf()

        // set up raw view into the memory
        let tsne_buffer = new Float64Array(this.tSNE.memory.buffer)
        // copy over input data
        for (let i = 0; i < this.N; i++) {
          tsne_buffer[this.input_base + 2 * i] = this.input_data[i].x
          tsne_buffer[this.input_base + 2 * i + 1] = this.input_data[i].y
        }

        // initialize tSNE object
        this.tSNE.setup(this.N, this.perplexity)
        this.initialized = true
      }
    )
  }
  
  // return a copy of the input data
  getInput() {
    return this.input_data
  }
  
  // return a copy of the current output data
  getOutput() {
    if (!this.initialized) {
      return undefined
    }
    
    // prepare tSNE solution
    this.tSNE.getSolution()
  
    // after manipulating the tSNE object the memory may have moved, so need to get the buffer again
    let tsne_buffer = new Float64Array(this.tSNE.memory.buffer)
    
    let out = Array(this.N)
    for (let i = 0; i < this.N; i++) {
      out[i] = { 
        x: tsne_buffer[this.output_base + 2 * i],
        y: tsne_buffer[this.output_base + 2 * i + 1]
      }
    }
    return out
  }
}

module.exports = TSNEWrapper
