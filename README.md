The Artifact
================

This repository contains the complete code for the generative art collection ["The Artifact"](https://www.fxhash.xyz/generative/24278) released on fx(hash) in January 2023. For explanations and insight into how this works and how it came to be, please read [this article.](https://www.fxhash.xyz/article/discovering-the-artifact)

![](./output_array.jpg)

## Installation and usage

The project is built on top of the [fx(hash) webpack boilerplate,](https://github.com/fxhash/fxhash-webpack-boilerplate) and installation and usage instructions are the same as described there. In brief, to run the project locally, you first need to have [nodejs](https://nodejs.org/) installed, and then you need to run the following command once in the root of the project folder to install dependencies:

```sh
npm i
```

After everything is installed correctly, you can start the project with:

```sh
npm start
```

This will start a local web server and now you can look at outputs at  [http://localhost:8080](http://localhost:8080) in your browser.

If you want to rebuild the WASM code (this will not normally be necessary), you can run:

```sh
./_compile_asc.sh
```

## Licensing

The code to The Artifact is in the public domain, licensed as CC0 (https://creativecommons.org/share-your-work/public-domain/cc0/). This means you can do anything you want with this code, adapt it for your own purposes, sell NFTs based on this code, use it to build a multi-billion-dollar business, whatever you want. However, if you find this code useful, it would be polite if you acknowledged where you got it from.

Note that a small portion of the code was copied from the fx(hash) [webpack boilerplate](https://github.com/fxhash/fxhash-webpack-boilerplate) and is licensed under the MIT license. The affected parts are the entire file `./public/index.html`, the webpack config (i.e., everything in the `config` folder), and the function `setSeed()` in `./src/fxrandom.js`.

This project does not use any external libraries (not even p5.js). Any dependencies listed in `package.json` are build-time dependencies only and are not strictly necessary.
