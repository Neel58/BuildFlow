exports.checkCompatibility = (components) => {
  const issues = [];
  
  // Extract components by category
  const cpu = components.find(c => c.category === 'CPU');
  const motherboard = components.find(c => c.category === 'Motherboard');
  const ramList = components.filter(c => c.category === 'RAM');
  const psu = components.find(c => c.category === 'PSU');
  const gpu = components.find(c => c.category === 'GPU');
  const cabinet = components.find(c => c.category === 'Cabinet');
  const cooler = components.find(c => c.category === 'Cooler');

  // CPU and Motherboard Socket Match
  if (cpu && motherboard) {
    if (cpu.specifications.socket !== motherboard.specifications.socket) {
      issues.push(`Incompatible Socket: CPU requires ${cpu.specifications.socket}, but Motherboard has ${motherboard.specifications.socket}`);
    }
  }

  // RAM and Motherboard Match
  if (motherboard && ramList.length > 0) {
    ramList.forEach(ram => {
      if (motherboard.specifications.ramType && ram.specifications.ramType !== motherboard.specifications.ramType) {
        issues.push(`Incompatible RAM: Motherboard requires ${motherboard.specifications.ramType}, but RAM is ${ram.specifications.ramType}`);
      }
    });
  }

  // PSU Wattage Check
  let totalPowerDraw = 0;
  components.forEach(c => {
    if (c.specifications && c.specifications.powerDraw) {
      totalPowerDraw += c.specifications.powerDraw;
    }
  });
  // Add base system buffer (e.g. 100W for motherboard, drives, fans)
  totalPowerDraw += 100;

  if (psu) {
    if (psu.specifications.wattage < totalPowerDraw) {
      issues.push(`Insufficient Power: Estimated draw is ${totalPowerDraw}W, but PSU provides only ${psu.specifications.wattage}W`);
    }
  }

  // Cabinet GPU Clearance Check
  if (cabinet && gpu) {
    if (gpu.specifications.gpuLength > cabinet.specifications.maxGpuLength) {
      issues.push(`GPU Clearance Issue: GPU is ${gpu.specifications.gpuLength}mm long, but Cabinet only supports up to ${cabinet.specifications.maxGpuLength}mm`);
    }
  }

  // Cooler Socket Support
  if (cooler && motherboard) {
    if (cooler.specifications.coolerSocketSupport && !cooler.specifications.coolerSocketSupport.includes(motherboard.specifications.socket)) {
      issues.push(`Cooler incompatible: Does not support ${motherboard.specifications.socket} socket`);
    }
  }

  return {
    isCompatible: issues.length === 0,
    issues,
    estimatedPowerDraw: totalPowerDraw
  };
};
