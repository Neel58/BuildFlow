const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'secret';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'refreshSecret';

const initialComponents = [
  // CPUs
  { _id: 'comp_cpu_7800x3d', name: 'AMD Ryzen 7 7800X3D', category: 'CPU', brand: 'AMD', price: 34999, stock: 24, reservedStock: 3, availableStock: 21, specifications: { socket: 'AM5', powerDraw: 120, cores: '8C / 16T', clock: '5.0 GHz Max Boost' } },
  { _id: 'comp_cpu_14900k', name: 'Intel Core i9-14900K', category: 'CPU', brand: 'Intel', price: 49999, stock: 18, reservedStock: 2, availableStock: 16, specifications: { socket: 'LGA1700', powerDraw: 253, cores: '24C / 32T', clock: '6.0 GHz Thermal Velocity' } },
  { _id: 'comp_cpu_7950x', name: 'AMD Ryzen 9 7950X', category: 'CPU', brand: 'AMD', price: 46999, stock: 12, reservedStock: 1, availableStock: 11, specifications: { socket: 'AM5', powerDraw: 170, cores: '16C / 32T', clock: '5.7 GHz Max Boost' } },
  { _id: 'comp_cpu_7600x', name: 'AMD Ryzen 5 7600X', category: 'CPU', brand: 'AMD', price: 19499, stock: 35, reservedStock: 4, availableStock: 31, specifications: { socket: 'AM5', powerDraw: 105, cores: '6C / 12T', clock: '5.3 GHz Max Boost' } },
  { _id: 'comp_cpu_14700k', name: 'Intel Core i7-14700K', category: 'CPU', brand: 'Intel', price: 37999, stock: 20, reservedStock: 2, availableStock: 18, specifications: { socket: 'LGA1700', powerDraw: 253, cores: '20C / 28T', clock: '5.6 GHz' } },

  // Motherboards
  { _id: 'comp_mobo_b650_tomahawk', name: 'MSI MAG B650 TOMAHAWK WIFI', category: 'Motherboard', brand: 'MSI', price: 19999, stock: 30, reservedStock: 5, availableStock: 25, specifications: { socket: 'AM5', chipset: 'B650', ramType: 'DDR5', formFactor: 'ATX' } },
  { _id: 'comp_mobo_z790_hero', name: 'ASUS ROG MAXIMUS Z790 HERO', category: 'Motherboard', brand: 'ASUS', price: 54999, stock: 8, reservedStock: 1, availableStock: 7, specifications: { socket: 'LGA1700', chipset: 'Z790', ramType: 'DDR5', formFactor: 'ATX' } },
  { _id: 'comp_mobo_x670e_master', name: 'Gigabyte X670E AORUS MASTER', category: 'Motherboard', brand: 'Gigabyte', price: 42999, stock: 10, reservedStock: 2, availableStock: 8, specifications: { socket: 'AM5', chipset: 'X670E', ramType: 'DDR5', formFactor: 'E-ATX' } },
  { _id: 'comp_mobo_b650_tuf', name: 'ASUS TUF GAMING B650-PLUS WIFI', category: 'Motherboard', brand: 'ASUS', price: 18499, stock: 25, reservedStock: 3, availableStock: 22, specifications: { socket: 'AM5', chipset: 'B650', ramType: 'DDR5', formFactor: 'ATX' } },
  { _id: 'comp_mobo_z790_aorus', name: 'Gigabyte Z790 AORUS ELITE AX', category: 'Motherboard', brand: 'Gigabyte', price: 23999, stock: 16, reservedStock: 2, availableStock: 14, specifications: { socket: 'LGA1700', chipset: 'Z790', ramType: 'DDR5', formFactor: 'ATX' } },

  // GPUs
  { _id: 'comp_gpu_rtx4090', name: 'NVIDIA GeForce RTX 4090 24GB', category: 'GPU', brand: 'NVIDIA', price: 159999, stock: 6, reservedStock: 2, availableStock: 4, specifications: { powerDraw: 450, gpuLength: 336, vram: '24GB GDDR6X' } },
  { _id: 'comp_gpu_rtx4080s', name: 'NVIDIA GeForce RTX 4080 SUPER 16GB', category: 'GPU', brand: 'NVIDIA', price: 89999, stock: 14, reservedStock: 3, availableStock: 11, specifications: { powerDraw: 320, gpuLength: 310, vram: '16GB GDDR6X' } },
  { _id: 'comp_gpu_rtx4070tis', name: 'NVIDIA GeForce RTX 4070 Ti SUPER 16GB', category: 'GPU', brand: 'NVIDIA', price: 74999, stock: 22, reservedStock: 4, availableStock: 18, specifications: { powerDraw: 285, gpuLength: 300, vram: '16GB GDDR6X' } },
  { _id: 'comp_gpu_rx7900xtx', name: 'AMD Radeon RX 7900 XTX 24GB', category: 'GPU', brand: 'AMD', price: 84999, stock: 11, reservedStock: 1, availableStock: 10, specifications: { powerDraw: 355, gpuLength: 287, vram: '24GB GDDR6' } },
  { _id: 'comp_gpu_rtx4060', name: 'NVIDIA GeForce RTX 4060 8GB', category: 'GPU', brand: 'NVIDIA', price: 27999, stock: 40, reservedStock: 5, availableStock: 35, specifications: { powerDraw: 115, gpuLength: 242, vram: '8GB GDDR6' } },

  // RAM
  { _id: 'comp_ram_corsair_32gb', name: 'Corsair Vengeance 32GB DDR5 6000MHz', category: 'RAM', brand: 'Corsair', price: 9999, stock: 50, reservedStock: 8, availableStock: 42, specifications: { ramType: 'DDR5', capacity: '32GB (2x16GB)', speed: '6000MHz' } },
  { _id: 'comp_ram_gskill_64gb', name: 'G.Skill Trident Z5 RGB 64GB DDR5 6000MHz', category: 'RAM', brand: 'G.Skill', price: 19499, stock: 25, reservedStock: 4, availableStock: 21, specifications: { ramType: 'DDR5', capacity: '64GB (2x32GB)', speed: '6000MHz' } },
  { _id: 'comp_ram_fury_16gb', name: 'Kingston Fury Beast 16GB DDR5 5600MHz', category: 'RAM', brand: 'Kingston', price: 5499, stock: 45, reservedStock: 3, availableStock: 42, specifications: { ramType: 'DDR5', capacity: '16GB (1x16GB)', speed: '5600MHz' } },
  { _id: 'comp_ram_corsair_ddr4', name: 'Corsair Vengeance 32GB DDR4 3600MHz', category: 'RAM', brand: 'Corsair', price: 7499, stock: 30, reservedStock: 2, availableStock: 28, specifications: { ramType: 'DDR4', capacity: '32GB (2x16GB)', speed: '3600MHz' } },

  // SSDs
  { _id: 'comp_ssd_samsung_990pro', name: 'Samsung 990 PRO 2TB PCIe 4.0 NVMe', category: 'SSD', brand: 'Samsung', price: 15499, stock: 35, reservedStock: 5, availableStock: 30, specifications: { storageInterface: 'M.2 NVMe', capacity: '2TB', speed: '7450 MB/s' } },
  { _id: 'comp_ssd_wd_sn850x', name: 'WD Black SN850X 2TB Heatsink', category: 'SSD', brand: 'Western Digital', price: 14999, stock: 28, reservedStock: 3, availableStock: 25, specifications: { storageInterface: 'M.2 NVMe', capacity: '2TB', speed: '7300 MB/s' } },
  { _id: 'comp_ssd_crucial_t700', name: 'Crucial T700 1TB PCIe 5.0', category: 'SSD', brand: 'Crucial', price: 16999, stock: 15, reservedStock: 2, availableStock: 13, specifications: { storageInterface: 'PCIe 5.0 NVMe', capacity: '1TB', speed: '11700 MB/s' } },
  { _id: 'comp_ssd_kingston_1tb', name: 'Kingston NV2 1TB PCIe 4.0', category: 'SSD', brand: 'Kingston', price: 5499, stock: 60, reservedStock: 6, availableStock: 54, specifications: { storageInterface: 'M.2 NVMe', capacity: '1TB', speed: '3500 MB/s' } },

  // PSUs
  { _id: 'comp_psu_corsair_rm850x', name: 'Corsair RM850x 850W Gold Fully Modular', category: 'PSU', brand: 'Corsair', price: 12499, stock: 30, reservedStock: 4, availableStock: 26, specifications: { wattage: 850, efficiency: '80+ Gold', modular: 'Fully Modular' } },
  { _id: 'comp_psu_corsair_rm1000x', name: 'Corsair RM1000x 1000W Shift ATX 3.0', category: 'PSU', brand: 'Corsair', price: 17999, stock: 20, reservedStock: 3, availableStock: 17, specifications: { wattage: 1000, efficiency: '80+ Gold', modular: 'Fully Modular' } },
  { _id: 'comp_psu_seasonic_750', name: 'Seasonic Focus GX-750 750W Gold', category: 'PSU', brand: 'Seasonic', price: 9999, stock: 25, reservedStock: 2, availableStock: 23, specifications: { wattage: 750, efficiency: '80+ Gold', modular: 'Fully Modular' } },
  { _id: 'comp_psu_corsair_1200', name: 'Corsair HX1200 1200W Platinum', category: 'PSU', brand: 'Corsair', price: 23999, stock: 10, reservedStock: 1, availableStock: 9, specifications: { wattage: 1200, efficiency: '80+ Platinum', modular: 'Fully Modular' } },

  // Cabinets
  { _id: 'comp_case_nzxt_h7', name: 'NZXT H7 Flow RGB Tempered Glass', category: 'Cabinet', brand: 'NZXT', price: 10999, stock: 22, reservedStock: 3, availableStock: 19, specifications: { formFactor: 'ATX', maxGpuLength: 400, type: 'Mid Tower' } },
  { _id: 'comp_case_lianli_o11', name: 'Lian Li O11 Dynamic EVO', category: 'Cabinet', brand: 'Lian Li', price: 13999, stock: 18, reservedStock: 2, availableStock: 16, specifications: { formFactor: 'ATX', maxGpuLength: 422, type: 'Dual Chamber' } },
  { _id: 'comp_case_fractal_north', name: 'Fractal Design North (Walnut Wood)', category: 'Cabinet', brand: 'Fractal', price: 14499, stock: 14, reservedStock: 1, availableStock: 13, specifications: { formFactor: 'ATX', maxGpuLength: 355, type: 'Nordic Wood' } },
  { _id: 'comp_case_corsair_4000d', name: 'Corsair 4000D Airflow', category: 'Cabinet', brand: 'Corsair', price: 6999, stock: 35, reservedStock: 4, availableStock: 31, specifications: { formFactor: 'ATX', maxGpuLength: 360, type: 'Mid Tower' } },

  // Coolers
  { _id: 'comp_cooler_ak620', name: 'DeepCool AK620 Digital Dual Tower', category: 'Cooler', brand: 'DeepCool', price: 5999, stock: 28, reservedStock: 3, availableStock: 25, specifications: { coolerSocketSupport: ['AM5', 'LGA1700'], type: 'Dual Tower Air' } },
  { _id: 'comp_cooler_kraken360', name: 'NZXT Kraken Elite 360 RGB LCD', category: 'Cooler', brand: 'NZXT', price: 24999, stock: 12, reservedStock: 2, availableStock: 10, specifications: { coolerSocketSupport: ['AM5', 'LGA1700'], type: '360mm AIO Liquid' } },
  { _id: 'comp_cooler_h150i', name: 'Corsair iCUE LINK H150i RGB 360mm', category: 'Cooler', brand: 'Corsair', price: 19999, stock: 16, reservedStock: 2, availableStock: 14, specifications: { coolerSocketSupport: ['AM5', 'LGA1700'], type: '360mm AIO Liquid' } },
  { _id: 'comp_cooler_nhd15', name: 'Noctua NH-D15 chromax.black', category: 'Cooler', brand: 'Noctua', price: 10999, stock: 20, reservedStock: 2, availableStock: 18, specifications: { coolerSocketSupport: ['AM5', 'LGA1700'], type: 'Premium Air Cooler' } }
];

let inMemoryCart = [];

let inMemoryOrders = [
  {
    _id: 'ORD-98214',
    customer: { firstName: 'Arjun', lastName: 'Mehta', email: 'arjun.mehta@gmail.com' },
    user: { _id: 'usr_cust1', email: 'arjun.mehta@gmail.com', firstName: 'Arjun', lastName: 'Mehta' },
    totalAmount: 279999,
    totalPrice: 279999,
    status: 'Packaging',
    paymentStatus: 'Completed',
    trackingNumber: 'IND-EXPRESS-98214',
    carrier: 'BlueDart Air Express',
    items: [
      { name: 'Apex 4K Gaming Flagship Rig', title: 'Apex 4K Gaming Flagship Rig', price: 279999, quantity: 1 }
    ],
    notes: 'Requires dual Instapak expanding foam packing inside chassis.',
    createdAt: '2026-09-28T09:15:00.000Z'
  },
  {
    _id: 'ORD-8924',
    customer: { firstName: 'Sarah', lastName: 'Jenkins', email: 'sarah.j@techcorp.io' },
    user: { _id: 'usr_cust2', email: 'sarah.j@techcorp.io', firstName: 'Sarah', lastName: 'Jenkins' },
    totalAmount: 379999,
    totalPrice: 379999,
    status: 'InAssembly',
    paymentStatus: 'Completed',
    trackingNumber: 'IND-EXPRESS-8924',
    carrier: 'Delhivery Insured',
    items: [
      { name: 'AI & 3D Render Studio Pro', title: 'AI & 3D Render Studio Pro', price: 379999, quantity: 1 }
    ],
    notes: 'Dual RTX 4090 orientation with dedicated anti-sag PCIe bracket.',
    createdAt: '2026-09-29T11:20:00.000Z'
  },
  {
    _id: 'ORD-8925',
    customer: { firstName: 'Karan', lastName: 'Kapoor', email: 'karan.k@gaming.in' },
    user: { _id: 'usr_cust1', email: 'karan.k@gaming.in', firstName: 'Karan', lastName: 'Kapoor' },
    totalAmount: 119999,
    totalPrice: 119999,
    status: 'QualityInspection',
    paymentStatus: 'Completed',
    trackingNumber: 'IND-EXPRESS-8925',
    carrier: 'BlueDart Air Express',
    items: [
      { name: 'Competitive Esports Battlestation', title: 'Competitive Esports Battlestation', price: 119999, quantity: 1 }
    ],
    notes: 'Run 12h Cinebench loop with EXPO memory profile verification.',
    createdAt: '2026-09-29T15:05:00.000Z'
  },
  {
    _id: 'ORD-7741',
    customer: { firstName: 'Vikram', lastName: 'Rao', email: 'vikram.rao@vfxlab.com' },
    user: { _id: 'usr_cust2', email: 'vikram.rao@vfxlab.com', firstName: 'Vikram', lastName: 'Rao' },
    totalAmount: 412000,
    totalPrice: 412000,
    status: 'Delivered',
    paymentStatus: 'Completed',
    trackingNumber: 'IND-EXPRESS-7741',
    carrier: 'FedEx Heavy Cargo',
    items: [
      { name: 'Deep Learning Multi-GPU Rig (i9-14900K + 64GB DDR5)', title: 'Deep Learning Rig', price: 412000, quantity: 1 }
    ],
    notes: 'Signed and delivered at Bangalore VFX Studio.',
    createdAt: '2026-09-25T14:00:00.000Z'
  },
  {
    _id: 'ORD-6520',
    customer: { firstName: 'Dev', lastName: 'Patel', email: 'dev.patel@dev.io' },
    user: { _id: 'usr_cust1', email: 'dev.patel@dev.io', firstName: 'Dev', lastName: 'Patel' },
    totalAmount: 145000,
    totalPrice: 145000,
    status: 'PaymentConfirmed',
    paymentStatus: 'Completed',
    trackingNumber: 'PENDING_DISPATCH',
    carrier: 'BlueDart Air Express',
    items: [
      { name: 'CAD & 3D Modeling Battlestation', title: 'CAD Rig', price: 145000, quantity: 1 }
    ],
    notes: 'Payment confirmed. Awaiting cleanroom assembly slot.',
    createdAt: '2026-09-30T02:10:00.000Z'
  }
];

let inMemoryUsers = [
  {
    _id: 'usr_admin',
    firstName: 'Alex',
    lastName: 'Vance',
    email: 'admin@buildflow.dev',
    role: 'Admin',
    isActive: true,
    createdAt: '2026-08-15T09:00:00.000Z'
  },
  {
    _id: 'usr_tech',
    firstName: 'Marcus',
    lastName: 'Chen',
    email: 'technician@buildflow.dev',
    role: 'Technician',
    isActive: true,
    createdAt: '2026-08-20T11:15:00.000Z'
  },
  {
    _id: 'usr_inspector',
    firstName: 'Priya',
    lastName: 'Sharma',
    email: 'inspector@buildflow.dev',
    role: 'Inspector',
    isActive: true,
    createdAt: '2026-08-22T14:30:00.000Z'
  },
  {
    _id: 'usr_warehouse',
    firstName: 'David',
    lastName: 'Miller',
    email: 'warehouse@buildflow.dev',
    role: 'Warehouse',
    isActive: true,
    createdAt: '2026-08-25T08:45:00.000Z'
  },
  {
    _id: 'usr_logistics',
    firstName: 'Rohan',
    lastName: 'Verma',
    email: 'logistics@buildflow.dev',
    role: 'Logistics',
    isActive: true,
    createdAt: '2026-08-28T10:00:00.000Z'
  },
  {
    _id: 'usr_cust1',
    firstName: 'Arjun',
    lastName: 'Mehta',
    email: 'arjun.mehta@gmail.com',
    role: 'Customer',
    isActive: true,
    createdAt: '2026-09-01T16:20:00.000Z'
  },
  {
    _id: 'usr_cust2',
    firstName: 'Sarah',
    lastName: 'Jenkins',
    email: 'sarah.j@techcorp.io',
    role: 'Customer',
    isActive: true,
    createdAt: '2026-09-12T13:40:00.000Z'
  }
];

let inMemoryAuditLogs = [
  {
    _id: 'log_01',
    action: 'USER_ROLE_CHANGE',
    actor: { firstName: 'Alex', lastName: 'Vance', email: 'admin@buildflow.dev', role: 'Admin' },
    entityType: 'User',
    targetId: 'usr_tech',
    changes: { oldRole: 'Customer', newRole: 'Technician' },
    description: 'Promoted Marcus Chen to Cleanroom Technician Lead',
    createdAt: '2026-09-28T10:14:22.000Z'
  },
  {
    _id: 'log_02',
    action: 'INVENTORY_STOCK_ADJUST',
    actor: { firstName: 'David', lastName: 'Miller', email: 'warehouse@buildflow.dev', role: 'Warehouse' },
    entityType: 'Inventory',
    targetId: 'comp_gpu_rtx4090',
    changes: { previousStock: 2, newStock: 6 },
    description: 'Received batch shipment of 4x NVIDIA RTX 4090 24GB GPUs',
    createdAt: '2026-09-29T08:30:10.000Z'
  },
  {
    _id: 'log_03',
    action: 'ORDER_STATE_OVERRIDE',
    actor: { firstName: 'Alex', lastName: 'Vance', email: 'admin@buildflow.dev', role: 'Admin' },
    entityType: 'Order',
    targetId: 'ORD-98214',
    changes: { oldState: 'QualityInspection', newState: 'Packaging' },
    description: 'Approved 48h thermal QA clearance for Apex 4K Gaming Flagship',
    createdAt: '2026-09-29T16:45:00.000Z'
  },
  {
    _id: 'log_04',
    action: 'COMPONENT_PRICE_UPDATE',
    actor: { firstName: 'Alex', lastName: 'Vance', email: 'admin@buildflow.dev', role: 'Admin' },
    entityType: 'Component',
    targetId: 'comp_cpu_7800x3d',
    changes: { oldPrice: 36999, newPrice: 34999 },
    description: 'Updated AMD Ryzen 7 7800X3D pricing to ₹34,999 promotional rate',
    createdAt: '2026-09-30T04:12:00.000Z'
  }
];

let inMemoryAssemblyTasks = [
  {
    _id: 'task_asm_8924',
    orderId: 'ORD-8924',
    order: 'ORD-8924',
    bayNumber: 'Bay 02 - Clean ESD Bench',
    technician: { _id: 'usr_tech', name: 'Marcus Chen', email: 'technician@buildflow.dev', role: 'Technician', badgeId: 'TECH-409' },
    status: 'In Progress',
    priority: 'CRITICAL',
    rigName: 'AI & 3D Render Studio Pro',
    customer: { firstName: 'Sarah', lastName: 'Jenkins', email: 'sarah.j@techcorp.io', company: 'TechCorp Media' },
    startedAt: '2026-09-30T07:15:00.000Z',
    completedAt: null,
    estimatedMinutes: 180,
    elapsedMinutes: 94,
    componentsChecklist: [
      { slot: 'CPU', name: 'AMD Ryzen 9 7950X (16-Core / 32-Thread 5.7GHz)', bin: 'A-01-2', serialNumber: 'SN-CPU-7950X-8821', verified: true, scanned: true },
      { slot: 'Motherboard', name: 'ASUS ROG Crosshair X670E Hero Wi-Fi', bin: 'B-04-1', serialNumber: 'SN-MB-X670E-9102', verified: true, scanned: true },
      { slot: 'GPU', name: 'NVIDIA GeForce RTX 4090 24GB GDDR6X (Dual Setup)', bin: 'G-01-1', serialNumber: 'SN-GPU-4090-4491 / 4492', verified: true, scanned: true },
      { slot: 'RAM', name: 'Corsair Vengeance RGB 64GB (2x32GB) DDR5 6000MHz CL30', bin: 'R-02-3', serialNumber: 'SN-RAM-DDR5-6000-8812', verified: true, scanned: true },
      { slot: 'SSD', name: 'Samsung 990 PRO 2TB PCIe 4.0 NVMe M.2', bin: 'S-01-4', serialNumber: 'SN-SSD-990P-3312', verified: true, scanned: true },
      { slot: 'Cooler', name: 'NZXT Kraken Elite 360 RGB LCD AIO Cooler', bin: 'C-02-1', serialNumber: 'SN-CLR-KRK360-1092', verified: true, scanned: true },
      { slot: 'PSU', name: 'Corsair AX1600i 1600W Titanium Fully Modular', bin: 'P-01-1', serialNumber: 'SN-PSU-1600TI-7731', verified: true, scanned: true },
      { slot: 'Cabinet', name: 'Lian Li O11 Dynamic EVO XL Full Tower White', bin: 'K-09-2', serialNumber: 'SN-CAB-O11DXL-0034', verified: true, scanned: true }
    ],
    milestones: [
      { id: 'm1', stepNumber: 1, title: 'Cleanroom ESD Grounding & Mat Calibration', description: 'Wrist strap test (<0.1 MΩ resistance) & antistatic ionization blower active', done: true, completedAt: '2026-09-30T07:20:00.000Z' },
      { id: 'm2', stepNumber: 2, title: 'CPU Socket Pin Scan & Zero-Force Seating', description: 'Optical inspection for LGA pins under magnification; latched at 1.5 N·m', done: true, completedAt: '2026-09-30T07:35:00.000Z' },
      { id: 'm3', stepNumber: 3, title: 'DDR5 Dual-Channel Seating in Slots A2/B2', description: 'Gold fingers cleaned with 99.9% IPA; audible latch lock verified', done: true, completedAt: '2026-09-30T07:48:00.000Z' },
      { id: 'm4', stepNumber: 4, title: 'NVMe Gen5 Heatsink Thermal Pad Peel & Torquing', description: 'Blue film removed, pad contact verified, M.2 screw torqued to 0.4 N·m', done: true, completedAt: '2026-09-30T08:05:00.000Z' },
      { id: 'm5', stepNumber: 5, title: 'Motherboard Insertion & Standoff Alignment', description: 'All 9 standoffs engaged with non-conductive washers in Lian Li chassis', done: true, completedAt: '2026-09-30T08:25:00.000Z' },
      { id: 'm6', stepNumber: 6, title: '360mm Radiator Mounting & Thermal Grizzly Spread', description: 'Kryonaut applied in 5-dot cross matrix, thumb-screws star-pattern torqued', done: true, completedAt: '2026-09-30T08:45:00.000Z' },
      { id: 'm7', stepNumber: 7, title: 'Dual RTX 4090 Insertion & Anti-Sag PCIe Bracket', description: 'Rigid aluminum bracket installed. Dedicated 12V-2x6 cables seated with 0 gap', done: false, completedAt: null },
      { id: 'm8', stepNumber: 8, title: 'Cable Management & Rear Routing Channels', description: 'Velcro ties installed in dual chambers; zero pinched EPS or SATA cables', done: false, completedAt: null },
      { id: 'm9', stepNumber: 9, title: 'First Cold POST & UEFI BIOS Configuration', description: 'Update to BIOS 2402, enable AMD EXPO I, custom PWM curve tuned', done: false, completedAt: null },
      { id: 'm10', stepNumber: 10, title: 'Cleanroom Dust Blow & Pre-QA Handover Checklist', description: 'Internal glass cleaned, peel film ready, staged for 32-Pt Thermal QA', done: false, completedAt: null }
    ],
    biosConfig: {
      biosVersion: 'ROG Crosshair X670E BIOS v2402',
      expoProfile: 'AMD EXPO I (6000MT/s 30-38-38-96 1.35V)',
      resizableBar: 'Enabled',
      secureBoot: 'Enabled (UEFI Standard)',
      curveOptimizer: '-20 All Cores Negative Offset',
      fanProfile: 'Quiet Studio Ramp (45% @ <70°C, 80% @ 85°C)'
    },
    benchDiagnostics: {
      cleanroomTemp: '21.2°C',
      cpuIdleTemp: '34.1°C',
      gpuIdleTemp: '28.9°C',
      voltage12v: '12.06 V',
      voltage5v: '5.01 V',
      voltage33v: '3.32 V',
      esdGroundResistance: '0.04 MΩ (Nominal)'
    },
    progressLogs: [
      { id: 'pl_1', log: 'Order assigned to Cleanroom Bay 02 by Marcus Chen. ESD bench grounded.', timestamp: '2026-09-30T07:15:10.000Z', tech: 'Marcus Chen' },
      { id: 'pl_2', log: 'AM5 socket inspection verified clean. Ryzen 9 7950X seated smoothly.', timestamp: '2026-09-30T07:35:42.000Z', tech: 'Marcus Chen' },
      { id: 'pl_3', log: 'Corsair Vengeance 64GB DDR5 dual channel locked in A2/B2 slots.', timestamp: '2026-09-30T07:49:05.000Z', tech: 'Marcus Chen' },
      { id: 'pl_4', log: 'Samsung 990 PRO thermal pad peeled and heatsink torqued.', timestamp: '2026-09-30T08:06:14.000Z', tech: 'Marcus Chen' },
      { id: 'pl_5', log: 'Kraken 360 LCD radiator mounted at top exhaust. Pump header connected.', timestamp: '2026-09-30T08:46:00.000Z', tech: 'Marcus Chen' }
    ],
    notes: 'Dual RTX 4090 GPU orientation with dedicated anti-sag PCIe bracket and dual 12V-2x6 600W direct feeds.'
  },
  {
    _id: 'task_asm_8925',
    orderId: 'ORD-8925',
    order: 'ORD-8925',
    bayNumber: 'Bay 04 - Esports Assembly',
    technician: { _id: 'usr_tech', name: 'Marcus Chen', email: 'technician@buildflow.dev', role: 'Technician', badgeId: 'TECH-409' },
    status: 'Completed',
    priority: 'STANDARD',
    rigName: 'Competitive Esports Battlestation',
    customer: { firstName: 'Karan', lastName: 'Kapoor', email: 'karan.k@gaming.in' },
    startedAt: '2026-09-29T10:00:00.000Z',
    completedAt: '2026-09-29T13:45:00.000Z',
    estimatedMinutes: 120,
    elapsedMinutes: 115,
    componentsChecklist: [
      { slot: 'CPU', name: 'AMD Ryzen 7 7800X3D', bin: 'A-02-1', serialNumber: 'SN-CPU-7800X-4412', verified: true, scanned: true },
      { slot: 'Motherboard', name: 'MSI MAG B650 TOMAHAWK WIFI', bin: 'B-02-2', serialNumber: 'SN-MB-B650-3301', verified: true, scanned: true },
      { slot: 'GPU', name: 'NVIDIA GeForce RTX 4070 Ti SUPER 16GB', bin: 'G-03-1', serialNumber: 'SN-GPU-4070TIS-1982', verified: true, scanned: true },
      { slot: 'RAM', name: 'Corsair Vengeance RGB 32GB DDR5 6000MHz', bin: 'R-01-2', serialNumber: 'SN-RAM-32GB-7712', verified: true, scanned: true },
      { slot: 'SSD', name: 'Kingston KC3000 2TB PCIe 4.0 NVMe', bin: 'S-02-1', serialNumber: 'SN-SSD-KC3000-8841', verified: true, scanned: true },
      { slot: 'Cooler', name: 'DeepCool AK620 Digital Twin Tower', bin: 'C-01-1', serialNumber: 'SN-CLR-AK620-5521', verified: true, scanned: true },
      { slot: 'PSU', name: 'Corsair RM850x 850W 80+ Gold Modular', bin: 'P-02-3', serialNumber: 'SN-PSU-850X-2201', verified: true, scanned: true },
      { slot: 'Cabinet', name: 'NZXT H7 Flow Tempered Glass White', bin: 'K-03-1', serialNumber: 'SN-CAB-H7F-9921', verified: true, scanned: true }
    ],
    milestones: [
      { id: 'm1', stepNumber: 1, title: 'Cleanroom ESD Grounding & Mat Calibration', description: 'Wrist strap test passed', done: true, completedAt: '2026-09-29T10:10:00.000Z' },
      { id: 'm2', stepNumber: 2, title: 'CPU Socket Pin Scan & Zero-Force Seating', description: 'Ryzen 7 7800X3D seated and latched', done: true, completedAt: '2026-09-29T10:25:00.000Z' },
      { id: 'm3', stepNumber: 3, title: 'DDR5 Dual-Channel Seating in Slots A2/B2', description: '32GB DDR5 dual clicks verified', done: true, completedAt: '2026-09-29T10:35:00.000Z' },
      { id: 'm4', stepNumber: 4, title: 'NVMe Gen5 Heatsink Thermal Pad Peel & Torquing', description: 'KC3000 installed with stock shield', done: true, completedAt: '2026-09-29T10:50:00.000Z' },
      { id: 'm5', stepNumber: 5, title: 'Motherboard Insertion & Standoff Alignment', description: 'MSI Tomahawk seated in NZXT H7', done: true, completedAt: '2026-09-29T11:15:00.000Z' },
      { id: 'm6', stepNumber: 6, title: 'Dual Tower Air Cooler Mounting', description: 'AK620 digital display header wired', done: true, completedAt: '2026-09-29T11:45:00.000Z' },
      { id: 'm7', stepNumber: 7, title: 'RTX 4070 Ti SUPER Seating & Anti-Sag', description: 'PCIe 4.0 x16 locked; support leg set', done: true, completedAt: '2026-09-29T12:15:00.000Z' },
      { id: 'm8', stepNumber: 8, title: 'Clean Cable Routing & Rear Tie-Downs', description: 'Rear channels tied with velcro', done: true, completedAt: '2026-09-29T12:55:00.000Z' },
      { id: 'm9', stepNumber: 9, title: 'First Cold POST & UEFI BIOS Configuration', description: 'EXPO 6000MT/s verified stable', done: true, completedAt: '2026-09-29T13:20:00.000Z' },
      { id: 'm10', stepNumber: 10, title: 'Pre-QA Bench Handover Checklist', description: 'Cleaned and moved to QA Chamber 01', done: true, completedAt: '2026-09-29T13:45:00.000Z' }
    ],
    biosConfig: {
      biosVersion: 'MSI B650 Tomahawk BIOS 7D75v1J',
      expoProfile: 'AMD EXPO (6000MT/s CL30)',
      resizableBar: 'Enabled',
      secureBoot: 'Enabled',
      curveOptimizer: '-25 All Cores',
      fanProfile: 'Performance Gaming Curve'
    },
    benchDiagnostics: {
      cleanroomTemp: '21.0°C',
      cpuIdleTemp: '32.4°C',
      gpuIdleTemp: '27.8°C',
      voltage12v: '12.04 V',
      voltage5v: '5.02 V',
      voltage33v: '3.31 V',
      esdGroundResistance: '0.03 MΩ'
    },
    progressLogs: [
      { id: 'pl_20', log: 'Assembly completed. Cold POST time: 11.8s. EXPO verified.', timestamp: '2026-09-29T13:40:00.000Z', tech: 'Marcus Chen' },
      { id: 'pl_21', log: 'Handed over to QA Inspection Chamber. Order status transitioned.', timestamp: '2026-09-29T13:45:00.000Z', tech: 'Marcus Chen' }
    ],
    notes: 'Flawless build. Run 12h Cinebench loop with EXPO memory profile verification.'
  }
];

let inMemoryLogisticsTasks = [
  {
    _id: 'task_98214',
    orderId: 'ORD-98214',
    order: 'ORD-98214',
    customer: { firstName: 'Arjun', lastName: 'Mehta', email: 'arjun.mehta@gmail.com', city: 'Mumbai', state: 'Maharashtra', address: '402, High Street Towers, Lower Parel, Mumbai - 400013', phone: '+91 98201 44321' },
    rigName: 'Apex 4K Gaming Flagship Rig',
    weightKg: 18.5,
    packageDimensions: '62 x 34 x 58 cm',
    status: 'Ready to Ship', // 'Packaging', 'Ready to Ship', 'Shipped', 'Out for Delivery', 'Delivered', 'Failed Delivery'
    courier: 'BlueDart Air Express',
    trackingNumber: 'IND-EXPRESS-98214',
    serviceType: 'Priority Air Freight / Insured',
    insuredValue: 279999,
    packagingDetails: {
      instapakFoamUsed: true,
      tamperTapeApplied: true,
      shockWatchSensorId: 'SW-98214-A',
      packedBy: 'David Miller (Warehouse Terminal)',
      packagedAt: '2026-09-29T17:30:00.000Z'
    },
    shippedAt: null,
    deliveredAt: null,
    estimatedDelivery: '2026-10-02',
    notes: 'Fragile tempered glass, dual internal Instapak foam injected.'
  },
  {
    _id: 'task_8924',
    orderId: 'ORD-8924',
    order: 'ORD-8924',
    customer: { firstName: 'Sarah', lastName: 'Jenkins', email: 'sarah.j@techcorp.io', city: 'Bengaluru', state: 'Karnataka', address: 'TechCorp Tower B, Outer Ring Road, Bellandur, Bengaluru - 560103', phone: '+91 98450 11223' },
    rigName: 'AI & 3D Render Studio Pro',
    weightKg: 24.2,
    packageDimensions: '68 x 38 x 64 cm',
    status: 'Packaging',
    courier: 'Delhivery Insured',
    trackingNumber: 'IND-EXPRESS-8924',
    serviceType: 'Critical Value Express',
    insuredValue: 379999,
    packagingDetails: {
      instapakFoamUsed: false,
      tamperTapeApplied: false,
      shockWatchSensorId: 'PENDING',
      packedBy: null,
      packagedAt: null
    },
    shippedAt: null,
    deliveredAt: null,
    estimatedDelivery: '2026-10-03',
    notes: 'Dual RTX 4090 GPUs. Heavy wooden shipping crate required.'
  },
  {
    _id: 'task_7741',
    orderId: 'ORD-7741',
    order: 'ORD-7741',
    customer: { firstName: 'Vikram', lastName: 'Rao', email: 'vikram.rao@vfxlab.com', city: 'Hyderabad', state: 'Telangana', address: 'Plot 18, HITEC City Phase 2, Madhapur, Hyderabad - 500081', phone: '+91 99880 77665' },
    rigName: 'Deep Learning Multi-GPU Rig (i9-14900K + 64GB DDR5)',
    weightKg: 22.0,
    packageDimensions: '65 x 35 x 60 cm',
    status: 'Delivered',
    courier: 'FedEx Heavy Cargo',
    trackingNumber: 'IND-EXPRESS-7741',
    serviceType: 'Dedicated Pallet Delivery',
    insuredValue: 412000,
    packagingDetails: {
      instapakFoamUsed: true,
      tamperTapeApplied: true,
      shockWatchSensorId: 'SW-7741-OK',
      packedBy: 'David Miller',
      packagedAt: '2026-09-24T10:00:00.000Z'
    },
    shippedAt: '2026-09-24T14:30:00.000Z',
    deliveredAt: '2026-09-25T14:00:00.000Z',
    estimatedDelivery: '2026-09-25',
    notes: 'Signed and delivered at VFX Lab Studio reception.'
  },
  {
    _id: 'task_8925',
    orderId: 'ORD-8925',
    order: 'ORD-8925',
    customer: { firstName: 'Karan', lastName: 'Kapoor', email: 'karan.k@gaming.in', city: 'New Delhi', state: 'Delhi', address: 'B-12, Vasant Vihar, New Delhi - 110057', phone: '+91 98110 55443' },
    rigName: 'Competitive Esports Battlestation',
    weightKg: 15.0,
    packageDimensions: '58 x 30 x 52 cm',
    status: 'Shipped',
    courier: 'BlueDart Air Express',
    trackingNumber: 'IND-EXPRESS-8925',
    serviceType: 'Priority Air Freight',
    insuredValue: 119999,
    packagingDetails: {
      instapakFoamUsed: true,
      tamperTapeApplied: true,
      shockWatchSensorId: 'SW-8925-B',
      packedBy: 'Rohan Verma',
      packagedAt: '2026-09-29T18:00:00.000Z'
    },
    shippedAt: '2026-09-30T04:15:00.000Z',
    deliveredAt: null,
    estimatedDelivery: '2026-10-01',
    notes: 'In transit to Delhi Hub via Flight 6E-204.'
  }
];

let inMemoryQATasks = [
  {
    _id: 'qa_task_8925',
    orderId: 'ORD-8925',
    order: 'ORD-8925',
    rigName: 'Competitive Esports Battlestation',
    customer: { firstName: 'Karan', lastName: 'Kapoor', email: 'karan.k@gaming.in' },
    inspector: { _id: 'usr_inspect', firstName: 'Priya', lastName: 'Sharma', email: 'inspector@buildflow.dev', role: 'Inspector' },
    status: 'Ready For Inspection',
    decision: 'Pending',
    priority: 'STANDARD',
    technicianName: 'Marcus Chen',
    chamberNumber: 'QA Chamber 01 - Thermal Loop',
    components: [
      { slot: 'CPU', name: 'AMD Ryzen 7 7800X3D', serialNumber: 'SN-CPU-7800X-4412', status: 'Verified' },
      { slot: 'Motherboard', name: 'MSI MAG B650 TOMAHAWK WIFI', serialNumber: 'SN-MB-B650-3301', status: 'Verified' },
      { slot: 'GPU', name: 'NVIDIA GeForce RTX 4070 Ti SUPER 16GB', serialNumber: 'SN-GPU-4070TIS-1982', status: 'Verified' },
      { slot: 'RAM', name: 'Corsair Vengeance RGB 32GB DDR5 6000MHz', serialNumber: 'SN-RAM-32GB-7712', status: 'Verified' },
      { slot: 'SSD', name: 'Kingston KC3000 2TB PCIe 4.0 NVMe', serialNumber: 'SN-SSD-KC3000-8841', status: 'Verified' },
      { slot: 'Cooler', name: 'DeepCool AK620 Digital Twin Tower', serialNumber: 'SN-CLR-AK620-5521', status: 'Verified' },
      { slot: 'PSU', name: 'Corsair RM850x 850W 80+ Gold Modular', serialNumber: 'SN-PSU-850X-2201', status: 'Verified' },
      { slot: 'Cabinet', name: 'NZXT H7 Flow Tempered Glass White', serialNumber: 'SN-CAB-H7F-9921', status: 'Verified' }
    ],
    checks: [
      { id: 'c1', label: 'POST & Cold Boot', description: 'UEFI initialization under 14s, BIOS v7D75v1J verified', passed: true },
      { id: 'c2', label: 'Thermals & Stress Test', description: 'CPU under 72°C and GPU under 64°C in 30-min sustained loop', passed: true },
      { id: 'c3', label: 'Memory & EXPO Stability', description: 'DDR5 6000MT/s MemTest86 0 errors detected', passed: false },
      { id: 'c4', label: 'I/O Ports & Networking', description: 'Front USB-C, rear HDMI/DP, Wi-Fi 6E & 2.5GbE tested', passed: false },
      { id: 'c5', label: 'Chassis & Cosmetic Finish', description: 'No glass scratches, cable routing snug, peel ready', passed: false }
    ],
    report: 'Cinebench loop completed with 0 thermal throttling. Ready for final EXPO pass.',
    testedAt: null,
    createdAt: '2026-09-29T14:00:00.000Z'
  }
];

function generateTokens(id, role) {
  const accessToken = jwt.sign({ id, role }, JWT_SECRET, { expiresIn: '7d' });
  const refreshToken = jwt.sign({ id }, JWT_REFRESH_SECRET, { expiresIn: '30d' });
  return { accessToken, refreshToken };
}

module.exports = {
  initialComponents,
  inMemoryCart,
  inMemoryOrders,
  inMemoryUsers,
  inMemoryAuditLogs,
  inMemoryAssemblyTasks,
  inMemoryQATasks,
  inMemoryLogisticsTasks,
  generateTokens
};
