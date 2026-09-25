export const defaultRig = {
  cpu: {
    id: 'cpu-7800x3d',
    name: 'AMD Ryzen 7 7800X3D',
    brand: 'AMD',
    category: 'CPU',
    price: 34999,
    specs: { socket: 'AM5', powerDraw: 120, cores: '8C / 16T', clock: '5.0 GHz Max Boost' }
  },
  mobo: {
    id: 'mobo-b650-tomahawk',
    name: 'MSI MAG B650 TOMAHAWK WIFI',
    brand: 'MSI',
    category: 'Motherboard',
    price: 19999,
    specs: { socket: 'AM5', chipset: 'B650', ramType: 'DDR5', formFactor: 'ATX' }
  },
  gpu: {
    id: 'gpu-rtx4090',
    name: 'NVIDIA GeForce RTX 4090 24GB',
    brand: 'NVIDIA',
    category: 'GPU',
    price: 159999,
    specs: { powerDraw: 450, gpuLength: 336, vram: '24GB GDDR6X' }
  },
  ram: {
    id: 'ram-corsair-32gb',
    name: 'Corsair Vengeance 32GB DDR5 6000MHz',
    brand: 'Corsair',
    category: 'RAM',
    price: 9999,
    specs: { ramType: 'DDR5', capacity: '32GB (2x16GB)', speed: '6000MHz' }
  },
  ssd: {
    id: 'ssd-samsung-990pro',
    name: 'Samsung 990 PRO 2TB PCIe 4.0 NVMe',
    brand: 'Samsung',
    category: 'SSD',
    price: 15499,
    specs: { storageInterface: 'M.2 NVMe', capacity: '2TB', speed: '7450 MB/s' }
  },
  psu: {
    id: 'psu-corsair-rm850x',
    name: 'Corsair RM850x 850W Gold Fully Modular',
    brand: 'Corsair',
    category: 'PSU',
    price: 12499,
    specs: { wattage: 850, efficiency: '80+ Gold', modular: 'Fully Modular' }
  },
  cabinet: {
    id: 'case-nzxt-h7',
    name: 'NZXT H7 Flow RGB Tempered Glass',
    brand: 'NZXT',
    category: 'Cabinet',
    price: 10999,
    specs: { formFactor: 'ATX', maxGpuLength: 400, type: 'Mid Tower' }
  },
  cooler: {
    id: 'cooler-ak620',
    name: 'DeepCool AK620 Digital Dual Tower',
    brand: 'DeepCool',
    category: 'Cooler',
    price: 5999,
    specs: { coolerSocketSupport: ['AM5', 'LGA1700'], type: 'Dual Tower Air' }
  }
};

export const componentCatalog = {
  CPU: [
    { id: 'cpu-7800x3d', name: 'AMD Ryzen 7 7800X3D', brand: 'AMD', price: 34999, specs: { socket: 'AM5', powerDraw: 120, cores: '8C / 16T', clock: '5.0 GHz' } },
    { id: 'cpu-14900k', name: 'Intel Core i9-14900K', brand: 'Intel', price: 49999, specs: { socket: 'LGA1700', powerDraw: 253, cores: '24C / 32T', clock: '6.0 GHz' } },
    { id: 'cpu-7950x', name: 'AMD Ryzen 9 7950X', brand: 'AMD', price: 46999, specs: { socket: 'AM5', powerDraw: 170, cores: '16C / 32T', clock: '5.7 GHz' } },
    { id: 'cpu-7600x', name: 'AMD Ryzen 5 7600X', brand: 'AMD', price: 19499, specs: { socket: 'AM5', powerDraw: 105, cores: '6C / 12T', clock: '5.3 GHz' } },
    { id: 'cpu-14700k', name: 'Intel Core i7-14700K', brand: 'Intel', price: 37999, specs: { socket: 'LGA1700', powerDraw: 253, cores: '20C / 28T', clock: '5.6 GHz' } }
  ],
  Motherboard: [
    { id: 'mobo-b650-tomahawk', name: 'MSI B650 TOMAHAWK WIFI', brand: 'MSI', price: 19999, specs: { socket: 'AM5', chipset: 'B650', ramType: 'DDR5', formFactor: 'ATX' } },
    { id: 'mobo-z790-hero', name: 'ASUS ROG MAXIMUS Z790 HERO', brand: 'ASUS', price: 54999, specs: { socket: 'LGA1700', chipset: 'Z790', ramType: 'DDR5', formFactor: 'ATX' } },
    { id: 'mobo-x670e-master', name: 'Gigabyte X670E AORUS MASTER', brand: 'Gigabyte', price: 42999, specs: { socket: 'AM5', chipset: 'X670E', ramType: 'DDR5', formFactor: 'E-ATX' } },
    { id: 'mobo-b650-tuf', name: 'ASUS TUF GAMING B650-PLUS WIFI', brand: 'ASUS', price: 18499, specs: { socket: 'AM5', chipset: 'B650', ramType: 'DDR5', formFactor: 'ATX' } },
    { id: 'mobo-z790-aorus', name: 'Gigabyte Z790 AORUS ELITE AX', brand: 'Gigabyte', price: 23999, specs: { socket: 'LGA1700', chipset: 'Z790', ramType: 'DDR5', formFactor: 'ATX' } }
  ],
  GPU: [
    { id: 'gpu-rtx4090', name: 'NVIDIA GeForce RTX 4090 24GB', brand: 'NVIDIA', price: 159999, specs: { powerDraw: 450, gpuLength: 336, vram: '24GB GDDR6X' } },
    { id: 'gpu-rtx4080s', name: 'NVIDIA GeForce RTX 4080 SUPER 16GB', brand: 'NVIDIA', price: 89999, specs: { powerDraw: 320, gpuLength: 310, vram: '16GB GDDR6X' } },
    { id: 'gpu-rtx4070tis', name: 'NVIDIA GeForce RTX 4070 Ti SUPER 16GB', brand: 'NVIDIA', price: 74999, specs: { powerDraw: 285, gpuLength: 300, vram: '16GB GDDR6X' } },
    { id: 'gpu-rx7900xtx', name: 'AMD Radeon RX 7900 XTX 24GB', brand: 'AMD', price: 84999, specs: { powerDraw: 355, gpuLength: 287, vram: '24GB GDDR6' } },
    { id: 'gpu-rtx4060', name: 'NVIDIA GeForce RTX 4060 8GB', brand: 'NVIDIA', price: 27999, specs: { powerDraw: 115, gpuLength: 242, vram: '8GB GDDR6' } }
  ],
  RAM: [
    { id: 'ram-corsair-32gb', name: 'Corsair Vengeance 32GB DDR5 6000MHz', brand: 'Corsair', price: 9999, specs: { ramType: 'DDR5', capacity: '32GB (2x16GB)', speed: '6000MHz' } },
    { id: 'ram-gskill-64gb', name: 'G.Skill Trident Z5 RGB 64GB DDR5 6000MHz', brand: 'G.Skill', price: 19499, specs: { ramType: 'DDR5', capacity: '64GB (2x32GB)', speed: '6000MHz' } },
    { id: 'ram-fury-16gb', name: 'Kingston Fury Beast 16GB DDR5 5600MHz', brand: 'Kingston', price: 5499, specs: { ramType: 'DDR5', capacity: '16GB (1x16GB)', speed: '5600MHz' } },
    { id: 'ram-corsair-ddr4-32gb', name: 'Corsair Vengeance 32GB DDR4 3600MHz', brand: 'Corsair', price: 7499, specs: { ramType: 'DDR4', capacity: '32GB (2x16GB)', speed: '3600MHz' } }
  ],
  SSD: [
    { id: 'ssd-samsung-990pro', name: 'Samsung 990 PRO 2TB PCIe 4.0 NVMe', brand: 'Samsung', price: 15499, specs: { storageInterface: 'M.2 NVMe', capacity: '2TB', speed: '7450 MB/s' } },
    { id: 'ssd-wd-sn850x', name: 'WD Black SN850X 2TB Heatsink', brand: 'Western Digital', price: 14999, specs: { storageInterface: 'M.2 NVMe', capacity: '2TB', speed: '7300 MB/s' } },
    { id: 'ssd-crucial-t700', name: 'Crucial T700 1TB PCIe 5.0', brand: 'Crucial', price: 16999, specs: { storageInterface: 'PCIe 5.0 NVMe', capacity: '1TB', speed: '11700 MB/s' } },
    { id: 'ssd-kingston-1tb', name: 'Kingston NV2 1TB PCIe 4.0', brand: 'Kingston', price: 5499, specs: { storageInterface: 'M.2 NVMe', capacity: '1TB', speed: '3500 MB/s' } }
  ],
  PSU: [
    { id: 'psu-corsair-rm850x', name: 'Corsair RM850x 850W Gold Fully Modular', brand: 'Corsair', price: 12499, specs: { wattage: 850, efficiency: '80+ Gold', modular: 'Fully Modular' } },
    { id: 'psu-corsair-rm1000x', name: 'Corsair RM1000x 1000W Shift ATX 3.0', brand: 'Corsair', price: 17999, specs: { wattage: 1000, efficiency: '80+ Gold', modular: 'Fully Modular' } },
    { id: 'psu-seasonic-750', name: 'Seasonic Focus GX-750 750W Gold', brand: 'Seasonic', price: 9999, specs: { wattage: 750, efficiency: '80+ Gold', modular: 'Fully Modular' } },
    { id: 'psu-corsair-1200', name: 'Corsair HX1200 1200W Platinum', brand: 'Corsair', price: 23999, specs: { wattage: 1200, efficiency: '80+ Platinum', modular: 'Fully Modular' } }
  ],
  Cabinet: [
    { id: 'case-nzxt-h7', name: 'NZXT H7 Flow RGB Tempered Glass', brand: 'NZXT', price: 10999, specs: { formFactor: 'ATX', maxGpuLength: 400, type: 'Mid Tower' } },
    { id: 'case-lianli-o11', name: 'Lian Li O11 Dynamic EVO', brand: 'Lian Li', price: 13999, specs: { formFactor: 'ATX', maxGpuLength: 422, type: 'Dual Chamber' } },
    { id: 'case-fractal-north', name: 'Fractal Design North (Walnut Wood)', brand: 'Fractal', price: 14499, specs: { formFactor: 'ATX', maxGpuLength: 355, type: 'Nordic Wood' } },
    { id: 'case-corsair-4000d', name: 'Corsair 4000D Airflow', brand: 'Corsair', price: 6999, specs: { formFactor: 'ATX', maxGpuLength: 360, type: 'Mid Tower' } }
  ],
  Cooler: [
    { id: 'cooler-ak620', name: 'DeepCool AK620 Digital Dual Tower', brand: 'DeepCool', price: 5999, specs: { coolerSocketSupport: ['AM5', 'LGA1700'], type: 'Dual Tower Air' } },
    { id: 'cooler-kraken360', name: 'NZXT Kraken Elite 360 RGB LCD', brand: 'NZXT', price: 24999, specs: { coolerSocketSupport: ['AM5', 'LGA1700'], type: '360mm AIO Liquid' } },
    { id: 'cooler-h150i', name: 'Corsair iCUE LINK H150i RGB 360mm', brand: 'Corsair', price: 19999, specs: { coolerSocketSupport: ['AM5', 'LGA1700'], type: '360mm AIO Liquid' } },
    { id: 'cooler-nh-d15', name: 'Noctua NH-D15 chromax.black', brand: 'Noctua', price: 10999, specs: { coolerSocketSupport: ['AM5', 'LGA1700'], type: 'Premium Air Cooler' } }
  ]
};

export const presets = {
  apex4k: {
    name: 'Apex 4K Gaming Flagship',
    price: 279999,
    slots: {
      cpu: 'cpu-7800x3d',
      mobo: 'mobo-b650-tomahawk',
      gpu: 'gpu-rtx4090',
      ram: 'ram-corsair-32gb',
      ssd: 'ssd-samsung-990pro',
      psu: 'psu-corsair-rm850x',
      cabinet: 'case-nzxt-h7',
      cooler: 'cooler-ak620'
    }
  },
  workstation: {
    name: 'AI & 3D Render Studio Pro',
    price: 379999,
    slots: {
      cpu: 'cpu-14900k',
      mobo: 'mobo-z790-hero',
      gpu: 'gpu-rtx4090',
      ram: 'ram-gskill-64gb',
      ssd: 'ssd-crucial-t700',
      psu: 'psu-corsair-rm1000x',
      cabinet: 'case-lianli-o11',
      cooler: 'cooler-kraken360'
    }
  },
  competitor: {
    name: 'Competitive Esports Battlestation',
    price: 119999,
    slots: {
      cpu: 'cpu-7600x',
      mobo: 'mobo-b650-tuf',
      gpu: 'gpu-rtx4070tis',
      ram: 'ram-corsair-32gb',
      ssd: 'ssd-kingston-1tb',
      psu: 'psu-seasonic-750',
      cabinet: 'case-corsair-4000d',
      cooler: 'cooler-ak620'
    }
  }
};
