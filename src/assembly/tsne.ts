import { consoleLog, runif } from "./env";

export const F64_SIZE: i32 = sizeof<f64>();
const PI: f64 = 3.141593;
const N_MAX: i32 = 10000; // maximum size of input array we can handle

export const INPUT_BUF: usize = memory.data(2 * F64_SIZE * N_MAX);
export const OUTPUT_BUF: usize = memory.data(2 * F64_SIZE * N_MAX);

// constants used by the algorithm
let perplexity: f64 = 10.0;
let early_exaggeration: f64 = 4.0;
let late_exaggeration: f64 = 1.0;
let learning_rate: f64 = 10.0;
let neighborhood_multiplier: f64 = 3;
let nneighbors: i32 = 0;
let H_target: f64 = 0;  // target entropy
let N: i32 = 0;         // number of data points
// array storing input data
let input_data_x = new StaticArray<f64>(N_MAX);
let input_data_y = new StaticArray<f64>(N_MAX);
// array storing current solution
let solution_x = new StaticArray<f64>(N_MAX);
let solution_y = new StaticArray<f64>(N_MAX);
// array storing previous step in gradient descent
let previous_step_x = new StaticArray<f64>(N_MAX);
let previous_step_y = new StaticArray<f64>(N_MAX);
// array storing current gain for gradient descent
let gain_x = new StaticArray<f64>(N_MAX);
let gain_y = new StaticArray<f64>(N_MAX);
// array storing current attractive forces
let Fattr_x = new StaticArray<f64>(N_MAX);
let Fattr_y = new StaticArray<f64>(N_MAX);
// array storing current repulsive forces
let Frep_x = new StaticArray<f64>(N_MAX);
let Frep_y = new StaticArray<f64>(N_MAX);
// array storing current gradient
let gradient_x = new StaticArray<f64>(N_MAX);
let gradient_y = new StaticArray<f64>(N_MAX);
let current_iter: f64 = 0;
let input_distances = new StaticArray<Array<DistRecord> >(N_MAX);
let pj_given_i = new StaticArray<Array<DistRecord> >(N_MAX);

// setup new t-SNE run given input data in input array
export function setup(_N: i32, _perplexity: f64): void {
  N = _N;
  perplexity = _perplexity;
  // number of nearest neighbors in the input data space
  nneighbors = floor<f64>(neighborhood_multiplier * perplexity) as i32;
  // target entropy given by perplexity parameter
  H_target = Math.log(perplexity);
  
  // copy over input data
  for (let i: i32 = 0; i < N; i++) {
    let x = load<f64>(INPUT_BUF + 2 * i * F64_SIZE);
    let y = load<f64>(INPUT_BUF + (2 * i + 1) * F64_SIZE);
    unchecked(input_data_x[i] = x);
    unchecked(input_data_y[i] = y);
  }
  
  // calculate distances to nearest neighbors
  calcNearestNeighborsDistances();

  // now calculate conditional probabilities and store for later
  // they will never change
  for (let i: i32 = 0; i < N; i++) {
    unchecked(pj_given_i[i] = pJGivenI(unchecked(input_distances[i]), H_target));
  }

  // set up the solution
  for (let i: i32 = 0; i < N; i++) {
    unchecked(solution_x[i] = 1e-4 * (runif() - 0.5));
    unchecked(solution_y[i] = 1e-4 * (runif() - 0.5));
    unchecked(previous_step_x[i] = 0);
    unchecked(previous_step_y[i] = 0);
    unchecked(gain_x[i] = 1);
    unchecked(gain_y[i] = 1);
  } 
  
  // we're at time step 0
  current_iter = 0;
}


// Take one optimization step
export function takeStep(): void {
  let exaggeration: f64 = (current_iter < 100 ? early_exaggeration : late_exaggeration);
  let alpha: f64 = (current_iter < 250 ? 0.5 : 0.8);
  let sum_x: f64 = 0; // to calculate mean
  let sum_y: f64 = 0;
  current_iter += 1;

  // calculate the gradient
  calculateGradient(exaggeration);

  // update solution
  for (let i: i32 = 0; i < N; i++) {
    let newgain_x: f64 = (sign(unchecked(gradient_x[i])) == sign(unchecked(previous_step_x[i])) ? unchecked(gain_x[i]) * 0.8 : unchecked(gain_x[i]) + 0.2);
    if (newgain_x < 0.01) {
      newgain_x = 0.01; // clamp so we never run gain to zero
    }
    
    let newgain_y: f64 = (sign(unchecked(gradient_y[i])) == sign(unchecked(previous_step_y[i])) ? unchecked(gain_y[i]) * 0.8 : unchecked(gain_y[i]) + 0.2);
    if (newgain_y < 0.01) {
      newgain_y = 0.01; // clamp so we never run gain to zero
    }
    
    // store updated gain
    unchecked(gain_x[i] = newgain_x);
    unchecked(gain_y[i] = newgain_y);

    // first contribution: gradient times learning rate
    let step_x: f64 = unchecked(gradient_x[i]) * (-1) * learning_rate;
    let step_y: f64 = unchecked(gradient_y[i]) * (-1) * learning_rate;
    // apply gain
    step_x *= newgain_x;
    step_y *= newgain_y;

    // second contribution: momentum
    step_x += unchecked(previous_step_x[i]) * alpha;
    step_y += unchecked(previous_step_y[i]) * alpha;

    // take step
    unchecked(solution_x[i] += step_x);
    unchecked(solution_y[i] += step_y);
    // record last step taken
    unchecked(previous_step_x[i] = step_x);
    unchecked(previous_step_y[i] = step_y);
    // calculate point sum for centering
    sum_x += unchecked(solution_x[i]);
    sum_y += unchecked(solution_y[i]);
  }
  
  // center solution
  for (let i: i32 = 0; i < N; i++) {
    unchecked(solution_x[i] -= sum_x / N);
    unchecked(solution_y[i] -= sum_y / N);
  }
}


// return the current solution in the output buffer
export function getSolution(): void {
  let d: f64 = enclosingExtent();
  
  for (let i: i32 = 0; i < N; i++) {
    store<f64>(
      OUTPUT_BUF + 2 * i * F64_SIZE,
      unchecked(solution_x[i]) / d
    );
    store<f64>(
      OUTPUT_BUF + (2 * i + 1) * F64_SIZE,
      unchecked(solution_y[i]) / d
    );
    //consoleLog(unchecked(solution_x[i]) / d)
    //consoleLog(unchecked(solution_y[i]) / d)
  }
}

// Calculate the gradient
// all relevant variables are global for simplicity
function calculateGradient (exaggeration: f64 = 1): void {
  // attractive forces
  calcFattr();
  
  // repulsive forces
  calcFrepQuadratic();
  
  // combine attractive and repulsive forces into gradient
  for (let i: i32 = 0; i < N; i++) {
    unchecked(gradient_x[i] = 4 * (unchecked(Fattr_x[i]) * exaggeration + unchecked(Frep_x[i])));
    unchecked(gradient_y[i] = 4 * (unchecked(Fattr_y[i]) * exaggeration + unchecked(Frep_y[i])));
  }
}

// calculate all the attractive forces
function calcFattr(): void {
  // zero out the current force setting
  for (let i: i32 = 0; i < N; i++) {
    unchecked(Fattr_x[i] = 0);
    unchecked(Fattr_y[i] = 0);
  }

  // we multiply p_j|i with q_ij Z and then accumulate
  for (let i: i32 = 0; i < N; i++) {
    for (let k: i32 = 0; k < nneighbors; k++) {
      let j: i32 = unchecked(pj_given_i[i][k]).index;
      let v: f64 = unchecked(pj_given_i[i][k]).distance;

      let dy_x: f64 = unchecked(solution_x[i]) - unchecked(solution_x[j]);
      let dy_y: f64 = unchecked(solution_y[i]) - unchecked(solution_y[j]);
      let d: f64 = dy_x * dy_x + dy_y * dy_y;
      let qijZ: f64 = 1/(1 + d);

      // scalar component
      let x: f64 = v * qijZ / (2 * N);
      // now we need to calculate (y_i - y_j) and multiply with x
      let f_ij_x: f64 = x * dy_x;
      let f_ij_y: f64 = x * dy_y;

      unchecked(Fattr_x[i] += f_ij_x);
      unchecked(Fattr_y[i] += f_ij_y);
      // symmetrize, Eq. (7) of van der Maaten 2014
      unchecked(Fattr_x[j] -= f_ij_x);
      unchecked(Fattr_y[j] -= f_ij_y);
    }
  }
}

  
// calculate all the repulsive forces, quadratic (slow) implementation
function calcFrepQuadratic(): void {
  let Z: f64 = 0;

  for (let i: i32 = 0; i < N; i++) {
    unchecked(Frep_x[i] = 0);
    unchecked(Frep_y[i] = 0);
    for (let j: i32 = 0; j < N; j++) {
      let dy_x = unchecked(solution_x[i]) - unchecked(solution_x[j]);
      let dy_y = unchecked(solution_y[i]) - unchecked(solution_y[j]);
      let d = dy_x * dy_x + dy_y * dy_y;
      if (d > 0) {
        Z += 1/(1 + d);
        dy_x /= (1 + d) * (1 + d);
        dy_y /= (1 + d) * (1 + d);
        unchecked(Frep_x[i] -= dy_x);
        unchecked(Frep_y[i] -= dy_y);
      }
    }
  }
  
  // normalize
  for (let i: i32 = 0; i < N; i++) {
    unchecked(Frep_x[i] /= Z);
    unchecked(Frep_y[i] /= Z);
  }
}


// Helper function that implements Eq. (6) of van der Maaten 2014.
// The default tolerance of 1e-4 is low but likely sufficient
function  pJGivenI(dists_i: Array<DistRecord>, H_target: f64): Array<DistRecord> {
  const tolerance: f64 = 1e-4;
  let l: i32 = nneighbors;
  let H: f64 = 0.0; // entropy
  let beta: f64 = 1.0; // beta = 2/sigma_i^2
  let beta_max: f64 = f64.MAX_VALUE;
  let beta_min: f64 = f64.MIN_VALUE;
  let max_tries: i32 = 50; // limits the number of tries in the binary search
  let count: i32 = 0;
  let pj: Array<f64> = new Array<f64>(l);
  
  // binary search for appropriate beta value
  while (true) {
    // calculate entropy for given value of beta
    let sum: f64 = 0.0;
    for (let k: i32 = 0; k < l; k++) {
      unchecked(pj[k] = Math.exp(-unchecked(dists_i[k].distance) * beta));
      sum += unchecked(pj[k]);
    }
  
    H = 0.0;
    for (let k: i32 = 0; k < l; k++) {
      let ptemp: f64 = 0.;
      if (sum != 0) {
        ptemp = unchecked(pj[k]) / sum;
      }
      unchecked(pj[k] = ptemp);
      if (ptemp > 1e-7) {
        H -= ptemp * Math.log(ptemp);
      }
    }
    
    // stopping condition: sufficient accuracy or too many tries
    count += 1;
    if (abs<f64>(H - H_target) < tolerance || count >= max_tries) {
      break;
    }
    // if we're not stopping yet, adjust beta based on result
    if (H > H_target) {
      // entropy too large, need to increase beta to make it smaller
      beta_min = beta; // this is now the smallest possible beta
      if (beta_max == f64.MAX_VALUE) { 
        // if we have never moved the upper bound we keep increasing beta
        beta *= 2;
      } else { // otherwise we set beta halfway between curent value and known max
        beta = (beta + beta_max) / 2;
      }
    } else {
      // opposite case; now we need to decrease beta
      beta_max = beta;
      if (beta_min == f64.MIN_VALUE) {
        beta /= 2;
      } else { 
        beta = (beta + beta_min) / 2;
      }
    }
  }
//  console.log(beta)
  let pj_final = new Array<DistRecord>(l);
  for (let k: i32 = 0; k < l; k++) {
    pj_final[k] = new DistRecord(
      unchecked(dists_i[k].index),
      unchecked(pj[k])
    );
  }
  return pj_final;
}

// Calculates an enclosing extent centered around (0, 0),
// so really just calculates the half-width of a square
// centered around that point
function enclosingExtent(): f64 {
  let d: f64 = 0;
  
  for (let i: i32 = 0; i < N; i++) {
    let p_x = unchecked(solution_x[i]);
    let p_y = unchecked(solution_y[i]);
    let m: f64 = max<f64>(abs<f64>(p_x), abs<f64>(p_y));
    d = max<f64>(d, m);
  }
  
  return d*1.1; // overinflate a little bit just to be safe
}

@unmanaged class DistRecord {
  index: i32;
  distance: f64;
  
  constructor (index: i32, distance: f64) {
    this.index = index;
    this.distance = distance;
  }
}

function calcNearestNeighborsDistances(): void {
  // first we calculate all by all distances, then we prune
  for (let i: i32 = 0; i < N; i++) {
    let row = new Array<DistRecord>(N);
    for (let j: i32 = 0; j < N; j++) {
      let d: f64 = f64.MAX_VALUE;
      if (i != j) { // we don't care about distance to itself
        let dx: f64 = input_data_x[i] - input_data_x[j];
        let dy: f64 = input_data_y[i] - input_data_y[j];
        d = dx * dx + dy * dy;
      }
      row[j] = new DistRecord(j, d);
    }
    row.sort((x, y) => sign(x.distance - y.distance));
    unchecked(input_distances[i] = row); // we simly assign the entire row, cut down to nearest neighbors later
  }
}

// helper function needed for adaptive learning rate
function sign(x: f64): i32 {
  return (x > 0 ? 1 : (x < 0 ? -1 : 0)) 
}
