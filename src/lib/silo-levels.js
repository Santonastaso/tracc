/**
 * FIFO silo level calculation from inbound/outbound movement rows.
 */

function computeAvailableItemsForSilo(siloInbound, totalOutbound, includeMaterials) {
  let remainingOutbound = totalOutbound;
  const availableItems = [];

  for (const inbound of siloInbound) {
    if (remainingOutbound <= 0) {
      const item = {
        ...inbound,
        available_quantity: inbound.quantity_kg,
      };
      if (includeMaterials) {
        item.materials = { name: inbound.product };
      }
      availableItems.push(item);
    } else if (remainingOutbound < inbound.quantity_kg) {
      const available = inbound.quantity_kg - remainingOutbound;
      const item = {
        ...inbound,
        available_quantity: available,
      };
      if (includeMaterials) {
        item.materials = { name: inbound.product };
      }
      availableItems.push(item);
      remainingOutbound = 0;
    } else {
      remainingOutbound -= inbound.quantity_kg;
    }
  }

  return availableItems;
}

/**
 * @param {Array} silos
 * @param {Array} inboundData
 * @param {Array} outboundData
 * @param {{ includeMaterials?: boolean }} [options]
 */
export function computeSiloLevels(silos, inboundData, outboundData, { includeMaterials = false } = {}) {
  return silos.map((silo) => {
    const siloInbound = inboundData.filter((item) => item.silo_id === silo.id);
    const siloOutbound = outboundData.filter((item) => item.silo_id === silo.id);

    const totalOutbound = siloOutbound.reduce((sum, out) => sum + out.quantity_kg, 0);
    const availableItems = computeAvailableItemsForSilo(siloInbound, totalOutbound, includeMaterials);

    const totalInbound = siloInbound.reduce((sum, inb) => sum + inb.quantity_kg, 0);
    const currentLevel = totalInbound - totalOutbound;

    return {
      ...silo,
      currentLevel,
      availableItems,
      totalInbound,
      totalOutbound,
      utilizationPercentage: silo.capacity_kg > 0 ? (currentLevel / silo.capacity_kg) * 100 : 0,
    };
  });
}

/**
 * Stock totals per silo (no FIFO available items).
 */
export function computeStockLevels(silos, inboundData, outboundData) {
  return silos.map((silo) => {
    const siloInbound = inboundData.filter((item) => item.silo_id === silo.id);
    const siloOutbound = outboundData.filter((item) => item.silo_id === silo.id);
    const totalInbound = siloInbound.reduce((sum, item) => sum + item.quantity_kg, 0);
    const totalOutbound = siloOutbound.reduce((sum, item) => sum + item.quantity_kg, 0);
    const currentStock = totalInbound - totalOutbound;
    return {
      ...silo,
      totalInbound,
      totalOutbound,
      currentStock,
      utilizationPercentage: silo.capacity_kg > 0 ? (currentStock / silo.capacity_kg) * 100 : 0,
    };
  });
}

/**
 * FIFO available items for a single silo at a point in time.
 */
export function computeSiloAvailableItems(siloId, inboundData, outboundData, includeMaterials = false) {
  const siloInbound = inboundData.filter((item) => item.silo_id === siloId);
  const siloOutbound = outboundData.filter((item) => item.silo_id === siloId);
  const totalOutbound = siloOutbound.reduce((sum, out) => sum + out.quantity_kg, 0);
  return computeAvailableItemsForSilo(siloInbound, totalOutbound, includeMaterials);
}
