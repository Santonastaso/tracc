import React from 'react';

function SilosVisualization({ silosData, silosLevels }) {
  if (!silosData || !silosLevels) {
    return <div className="text-center text-gray-500">Caricamento dati silos...</div>;
  }

  const getSiloLevel = (siloId) => {
    const level = silosLevels[siloId];
    if (!level) return { percentage: 0, current: 0, capacity: 0 };
    
    const current = level.totalIn - level.totalOut;
    const silo = silosData.find(s => s.id === siloId);
    const capacity = silo?.capacity_kg || 10000;
    const percentage = Math.min((current / capacity) * 100, 100);
    
    return { percentage, current, capacity };
  };

  const getLevelColor = (percentage) => {
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 70) return 'bg-yellow-500';
    if (percentage >= 30) return 'bg-green-500';
    return 'bg-gray-300';
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {silosData.map((silo) => {
        const { percentage, current, capacity } = getSiloLevel(silo.id);
        
        return (
          <div key={silo.id} className="text-center">
            <div className="mb-2">
              <h3 className="font-semibold text-sm">{silo.name}</h3>
              <p className="text-xs text-gray-500">Capacità: {capacity.toLocaleString()} kg</p>
            </div>
            
            {/* Silos visualization */}
            <div className="relative w-16 h-32 mx-auto border-2 border-gray-400 rounded-lg overflow-hidden bg-gray-100">
              <div 
                className={`absolute bottom-0 w-full transition-all duration-500 ${getLevelColor(percentage)}`}
                style={{ height: `${Math.max(percentage, 2)}%` }}
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xs font-bold text-white drop-shadow-lg">
                  {Math.round(percentage)}%
                </span>
              </div>
            </div>
            
            <div className="mt-2 text-xs">
              <p className="font-medium">{current.toLocaleString()} kg</p>
              <p className="text-gray-500">
                {Math.round(percentage)}% utilizzato
              </p>
            </div>
            
            {/* Status indicator */}
            <div className="mt-1">
              {percentage === 0 && (
                <span className="inline-block w-2 h-2 bg-gray-400 rounded-full" title="Vuoto" />
              )}
              {percentage > 0 && percentage < 30 && (
                <span className="inline-block w-2 h-2 bg-green-400 rounded-full" title="Basso" />
              )}
              {percentage >= 30 && percentage < 70 && (
                <span className="inline-block w-2 h-2 bg-yellow-400 rounded-full" title="Medio" />
              )}
              {percentage >= 70 && percentage < 90 && (
                <span className="inline-block w-2 h-2 bg-orange-400 rounded-full" title="Alto" />
              )}
              {percentage >= 90 && (
                <span className="inline-block w-2 h-2 bg-red-400 rounded-full" title="Pieno" />
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default SilosVisualization;
