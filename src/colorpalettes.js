class ColorPalettes {
  static availablePalettes() {
    let out = []
    for (let key in palettes) {
      out.push(key)
    }
    return out
  }
  
  // likelihood of picking each palette
  static paletteWeights() {
    let pals = this.availablePalettes()
    let weights = []
    for (let p of pals) {
      weights.push(palettes[p].weight)
    }
    return weights
  }
  
  static getPaletteName(palette) {
    return palettes[palette].name
  }
  
  static getPalette(palette) {
    return palettes[palette].palette
  }
}

let palettes = {
  sanantonio: {
    name: "San Antonio",
    weight: 1,
    palette: {
      bg: '#F4F4F4',
      border: '#E2E2E2',
      fg: ["#7F1415", "#0A4B00", "#002366", "#907E01", "#700072", "#057586"],
      fg_secondary: ['#CE2425', '#33792C', '#093994', '#FADD34', '#AF1CB1', '#28CAE4'], 
      sec_alpha: 'A0',
      pagebg: '#000000'
    }
  },
  sanjacinto: {
    name: "San Jacinto",
    weight: 0.15,
    palette: {
      bg: '#1D121D',
      border: '#F67C10',
      fg: ['#000000', '#000000', '#050505', '#050505', '#101010', '#101010', '#F3F0F3'],
      fg_secondary: ['#000000', '#050505', '#101010'], 
      sec_alpha: '60',
      pagebg: '#FFFFFF'
    }
  },
  redriver: {
    name: "Red River",
    weight: 0.7,
    palette: {
      bg: '#231314',
      border: '#530915',
      fg: ['#F6F3EF', '#FCD833', '#C73310', '#6D79B2', '#E68F23'],
      fg_secondary: ['#FCD833', '#FDF3DD', '#6C982F', '#E03D19', '#3F59AF'], 
      sec_alpha: '60',
      pagebg: '#FFFFFF'
    }
  },
  lavaca: {
    name: "Lavaca",
    weight: 0.25,
    palette: {
      bg: '#ECF3E7',
      border: '#CBE5AE',
      fg: ['#020401', '#080C04', '#0B1005', '#34451A', '#1A2800'],
      fg_secondary: ['#151515', '#050505', '#162106', '#233307'], 
      sec_alpha: '60',
      pagebg: '#000000'
    }
  },
  saltfork: {
    name: "Salt Fork",
    weight: 1,
    palette: {
      bg: '#ECF1FC',
      border: '#FBE0D4',
      fg: ['#FAB43D', '#891444', '#2C4472', '#11213F', '#FBD126'],
      fg_secondary: ['#FBD126', '#FDF3DD', '#6C982F', '#CD5F57', '#8BA6C3'], 
      sec_alpha: 'A0',
      pagebg: '#000000'
    }
  },
  pecos: {
    name: "Pecos",
    weight: 1,
    palette: {
      bg: '#1D1106',
      border: '#52270D',
      fg: ['#C9AD17', '#FBD91C', '#F0F9BD', '#FBF3DF'],
      fg_secondary: ['#6DBED9', '#CB3326', '#5F1A8E', '#742515', '#2C8FA9'],
      sec_alpha: '90',
      pagebg: '#FFFFFF'
    }
  },
  brazos: {
    name: "Brazos",
    weight: 0.3,
    palette: {
      bg: '#050505',
      border: '#101010',
      fg: ['#f8e8e8', '#f4fefe', '#a0a0a0', '#d8d8d0', '#e0e0e5'],
      fg_secondary: ['#404359', '#5A3C47', '#234A4E', '#4F432E', '#ADB0C1', '#AD999F'],
      sec_alpha: 'A0',
      pagebg: '#FFFFFF'
    }
  },
  sabine: {
    name: "Sabine",
    weight: 0.3,
    palette: {
      bg: '#fefefe',
      border: '#e8e8e8',
      fg: ["#BB0408", '#303040', '#606060', '#a0a0a0', '#DCE4E7', '#5F6A86'],
      fg_secondary: ["#BB0408", "#D57071", "#2D3043", "#4B3E49", "#7F848E", "#D5D6E3"],
      sec_alpha: '90',
      pagebg: '#000000'
    }
  },
  nueces: {
    name: "Nueces",
    weight: 0.25,
    palette: {
      bg: '#fefefe',
      border: '#e8e8e8',
      fg: ["#144FA7", '#123066', '#606060', '#DCE4E7'],
      fg_secondary: ["#144FA7", "#80A5DF", "#2D3043", "#364355", "#7F848E", "#D5D6E3"],
      sec_alpha: '90',
      pagebg: '#000000'
    }
  },
  guadalupe: {
    name: "Guadalupe",
    weight: 1,
    palette: {
      bg: '#0C1020',
      border: '#172552',
      fg: ['#E3793C', '#AA5A2D', '#FCBF36', '#FDF5ED', '#6C3205'],
      fg_secondary: ['#172552', '#4C0842', '#5B6077', '#795D72', '#ECE6EB'],
      sec_alpha: '60',
      pagebg: '#FFFFFF'
    }
  },
  colorado: {
    name: "Colorado",
    weight: 0.75,
    palette: {
      bg: '#040730',
      border: '#381851',
      fg: ['#C5C5F6', '#EEB60D', '#FADD2E', '#F6F6FD', '#FFF8C8'],
      fg_secondary: ['#F9AA6C', '#2D6CC3', '#FEE34A', '#71A2FE', '#D0EEC5', '#BB393A'],
      sec_alpha: '80',
      pagebg: '#FFFFFF'
    }
  },
  forest: {
    name: "San Marcos",
    weight: 1,
    palette: {
      bg: '#0A0E1A',
      border: '#12380E',
      fg: ['#FADD2E', '#ABDBF3', '#F5CCB5', '#CCDD83', '#E8E7F4'],
      fg_secondary: ['#A01E1F', '#707EA1', '#E0CC6E', '#8D9DC7', '#4F9F49', '#909D3E'],
      sec_alpha: '50',
      pagebg: '#FFFFFF'
    }
  },
  trinity: {
    name: "Trinity",
    weight: 1,
    palette: {
      bg: '#EEF4FD',
      border: '#FFEFCE',
      fg: ['#E2BE3E', '#7F2B04', '#0E488F', '#0B3469', '#11213F'],
      fg_secondary: ['#FBDF50', '#FBF3DB', '#BB4D27', '#6C982F', '#8D98B7'],
      sec_alpha: 'A0',
      pagebg: '#000000'
    }
  },
  riogrande: {
    name: "Rio Grande",
    weight: 0.5,
    palette: {
      bg: '#F2F3FB', 
      border: '#EAEAF4',
      fg: ['#FBD761', '#22216B', '#0F0F3C', '#4B4AA1', '#4E4E68'],
      fg_secondary: ['#F0F0F8', '#D6D6E2', '#B9BACB', '#989AB0', '#B44B50'],
      sec_alpha: 'A0',
      pagebg: '#000000'
    }
  }
}

module.exports = ColorPalettes
