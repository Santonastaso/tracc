import React from 'react';
import { Card } from '@santonastaso/crm-ui';

const SiloCard = ({ silo, onClick }) => {
  const { id, name, capacity_kg, currentLevel, availableItems = [] } = silo;
  
  // Calculate usage percentage
  const usagePercentage = capacity_kg > 0 ? (currentLevel / capacity_kg) * 100 : 0;
  
  // Generate colors for different lots
  const getLotColor = (index) => {
    const colors = [
      '#3B82F6', // blue
      '#10B981', // emerald
      '#F59E0B', // amber
      '#EF4444', // red
      '#8B5CF6', // violet
      '#06B6D4', // cyan
      '#84CC16', // lime
      '#F97316', // orange
    ];
    return colors[index % colors.length];
  };

  // Create vertical stacked bar chart
  const createVerticalStackedBar = () => {
    if (availableItems.length === 0) {
      return (
        <div className="w-20 h-40 bg-gray-100 rounded flex items-center justify-center">
          <span className="text-gray-400 text-xs transform -rotate-90">Vuoto</span>
        </div>
      );
    }

    return (
      <div className="relative w-20 h-40 bg-gray-100 rounded overflow-hidden flex flex-col justify-end">
        {/* Capacity indicator line */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gray-400 opacity-50"></div>
        
        {availableItems.map((item, index) => {
          // Calculate height based on capacity, not current level
          const heightPercentage = (item.available_quantity / capacity_kg) * 100;
          return (
            <div
              key={index}
              className="flex items-center justify-center relative"
              style={{
                height: `${heightPercentage}%`,
                backgroundColor: getLotColor(index),
                minHeight: heightPercentage > 3 ? 'auto' : '4px'
              }}
              title={`${item.materials?.name || 'Materiale'}: ${item.available_quantity}kg`}
            >
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <Card 
      className="p-4 hover:shadow-lg transition-shadow duration-200 cursor-pointer"
      onClick={onClick}
    >
      <div className="space-y-4">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{name}</h3>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600">
              {currentLevel.toLocaleString()} / {capacity_kg.toLocaleString()} kg
            </p>
            <p className="text-xs text-gray-500">
              {Math.round(usagePercentage)}% utilizzato
            </p>
          </div>
        </div>

        {/* Vertical Stacked Bar Chart */}
        <div className="flex items-end space-x-2">
          {createVerticalStackedBar()}
        </div>

      </div>
    </Card>
  );
};

export default SiloCard;

