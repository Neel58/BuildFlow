const mongoose = require('mongoose');

const componentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Component name is required'],
    trim: true
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: ['CPU', 'GPU', 'Motherboard', 'RAM', 'SSD', 'HDD', 'PSU', 'Cabinet', 'Cooler']
  },
  brand: {
    type: String,
    required: [true, 'Brand is required'],
    trim: true
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price cannot be negative']
  },
  stock: {
    type: Number,
    required: [true, 'Stock count is required'],
    min: [0, 'Stock cannot be negative'],
    default: 0
  },
  reservedStock: {
    type: Number,
    min: [0, 'Reserved stock cannot be negative'],
    default: 0
  },
  imageUrl: {
    type: String,
    default: ''
  },
  specifications: {
    socket: { type: String, default: '' },                 // e.g. AM5, LGA1700
    chipset: { type: String, default: '' },                // e.g. B650, Z790
    ramType: { type: String, default: '' },                // e.g. DDR5, DDR4
    wattage: { type: Number, default: 0 },                 // e.g. 750 (for PSU)
    powerDraw: { type: Number, default: 0 },               // e.g. 125, 250 (for CPU, GPU)
    storageInterface: { type: String, default: '' },       // e.g. M.2 NVMe, SATA III
    formFactor: { type: String, default: '' },             // e.g. ATX, Micro-ATX (for Motherboard, Cabinet)
    maxGpuLength: { type: Number, default: 0 },            // e.g. 340 (for Cabinet clearance in mm)
    gpuLength: { type: Number, default: 0 },               // e.g. 320 (for GPU length in mm)
    coolerSocketSupport: [{ type: String }]                // e.g. ['AM5', 'LGA1700'] (for Cooler)
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual helper to check actual available stock
componentSchema.virtual('availableStock').get(function() {
  return this.stock - this.reservedStock;
});

module.exports = mongoose.model('Component', componentSchema);
