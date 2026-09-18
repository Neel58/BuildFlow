const Component = require('../models/Component');

exports.checkCompatibility = async (req, res, next) => {
  try {
    const { componentIds } = req.body;
    if (!componentIds || !Array.isArray(componentIds)) {
      return res.status(400).json({ message: 'componentIds array is required' });
    }

    const components = await Component.find({ _id: { $in: componentIds } });
    
    let isValid = true;
    let warnings = [];

    // Categorize components
    let cpu, motherboard, ram, gpu, psu, cabinet, cooler;
    
    components.forEach(comp => {
      switch(comp.category) {
        case 'CPU': cpu = comp; break;
        case 'Motherboard': motherboard = comp; break;
        case 'RAM': ram = comp; break;
        case 'GPU': gpu = comp; break;
        case 'PSU': psu = comp; break;
        case 'Cabinet': cabinet = comp; break;
        case 'Cooler': cooler = comp; break;
      }
    });

    // 1. CPU & Motherboard Socket Compatibility
    if (cpu && motherboard) {
      if (cpu.specifications.socket && motherboard.specifications.socket) {
        if (cpu.specifications.socket !== motherboard.specifications.socket) {
          isValid = false;
          warnings.push(`CPU socket (${cpu.specifications.socket}) does not match Motherboard socket (${motherboard.specifications.socket}).`);
        }
      }
    }

    // 2. Motherboard & RAM Type Compatibility
    if (motherboard && ram) {
      if (motherboard.specifications.ramType && ram.specifications.ramType) {
        if (motherboard.specifications.ramType !== ram.specifications.ramType) {
          isValid = false;
          warnings.push(`RAM type (${ram.specifications.ramType}) does not match Motherboard supported RAM type (${motherboard.specifications.ramType}).`);
        }
      }
    }

    // 3. Power Supply Wattage Compatibility
    if (psu) {
      let totalPowerDraw = 0;
      if (cpu && cpu.specifications.powerDraw) totalPowerDraw += cpu.specifications.powerDraw;
      if (gpu && gpu.specifications.powerDraw) totalPowerDraw += gpu.specifications.powerDraw;
      
      // Add a buffer for other components (e.g. 100W)
      const estimatedTotalPower = totalPowerDraw + 100;
      
      if (psu.specifications.wattage && estimatedTotalPower > psu.specifications.wattage) {
        isValid = false;
        warnings.push(`Estimated total power draw (${estimatedTotalPower}W) exceeds PSU wattage (${psu.specifications.wattage}W).`);
      }
    }

    // 4. GPU Length & Cabinet Clearance
    if (gpu && cabinet) {
      if (gpu.specifications.gpuLength && cabinet.specifications.maxGpuLength) {
        if (gpu.specifications.gpuLength > cabinet.specifications.maxGpuLength) {
          isValid = false;
          warnings.push(`GPU length (${gpu.specifications.gpuLength}mm) exceeds Cabinet maximum GPU clearance (${cabinet.specifications.maxGpuLength}mm).`);
        }
      }
    }

    // 5. Cooler and CPU Socket
    if (cooler && cpu) {
      if (cooler.specifications.coolerSocketSupport && cooler.specifications.coolerSocketSupport.length > 0 && cpu.specifications.socket) {
        if (!cooler.specifications.coolerSocketSupport.includes(cpu.specifications.socket)) {
          isValid = false;
          warnings.push(`Cooler does not support CPU socket (${cpu.specifications.socket}).`);
        }
      }
    }

    res.json({
      isValid,
      warnings,
      componentsCount: components.length
    });
  } catch (error) {
    next(error);
  }
};
