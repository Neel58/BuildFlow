const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Component = require('../src/models/Component');
const User = require('../src/models/User');

dotenv.config();

const componentsData = [
  {
    name: 'AMD Ryzen 7 7800X3D',
    category: 'CPU',
    brand: 'AMD',
    price: 399,
    stock: 25,
    specifications: { socket: 'AM5', powerDraw: 120 }
  },
  {
    name: 'Intel Core i9-14900K',
    category: 'CPU',
    brand: 'Intel',
    price: 589,
    stock: 15,
    specifications: { socket: 'LGA1700', powerDraw: 253 }
  },
  {
    name: 'NVIDIA RTX 4090',
    category: 'GPU',
    brand: 'NVIDIA',
    price: 1599,
    stock: 5,
    specifications: { powerDraw: 450, gpuLength: 336 }
  },
  {
    name: 'MSI B650 TOMAHAWK WIFI',
    category: 'Motherboard',
    brand: 'MSI',
    price: 219,
    stock: 30,
    specifications: { socket: 'AM5', chipset: 'B650', formFactor: 'ATX', ramType: 'DDR5' }
  },
  {
    name: 'Corsair Vengeance 32GB DDR5 6000MHz',
    category: 'RAM',
    brand: 'Corsair',
    price: 115,
    stock: 50,
    specifications: { ramType: 'DDR5' }
  },
  {
    name: 'Samsung 990 PRO 2TB',
    category: 'SSD',
    brand: 'Samsung',
    price: 169,
    stock: 40,
    specifications: { storageInterface: 'M.2 NVMe' }
  },
  {
    name: 'Corsair RM850x',
    category: 'PSU',
    brand: 'Corsair',
    price: 149,
    stock: 20,
    specifications: { wattage: 850 }
  },
  {
    name: 'NZXT H7 Flow',
    category: 'Cabinet',
    brand: 'NZXT',
    price: 129,
    stock: 15,
    specifications: { formFactor: 'ATX', maxGpuLength: 400 }
  }
];

const seedDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/buildflow');
    console.log('MongoDB Connected for Seeding');

    await Component.deleteMany();
    console.log('Cleared existing components');

    await Component.insertMany(componentsData);
    console.log('Successfully seeded components');

    process.exit(0);
  } catch (error) {
    console.error(`Error with seeding data: ${error}`);
    process.exit(1);
  }
};

seedDB();
