import React, { useMemo } from 'react';
import { useAuth } from '../auth/AuthContext';
import { useSilos, useInbound, useOutbound } from '../hooks';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';

function HomePage() {
  const { user } = useAuth();

  // Fetch data using centralized query hooks
  const { data: silosData, isLoading: silosLoading } = useSilos();
  const { data: inboundData, isLoading: inboundLoading } = useInbound();
  const { data: outboundData, isLoading: outboundLoading } = useOutbound();

  // Calculate metrics
  const metrics = useMemo(() => {
    if (silosLoading || inboundLoading || outboundLoading) return {};

    // Calculate total capacity
    const totalCapacity = silosData?.reduce((sum, silo) => sum + (silo.capacity_kg || 0), 0) || 0;

    // Calculate current stock levels
    const silosWithLevels = silosData?.map(silo => {
      const siloInbound = inboundData?.filter(item => item.silo_id === silo.id) || [];
      const siloOutbound = outboundData?.filter(item => item.silo_id === silo.id) || [];
      
      const totalInbound = siloInbound.reduce((sum, item) => sum + (item.quantity_kg || 0), 0);
      const totalOutbound = siloOutbound.reduce((sum, item) => sum + (item.quantity_kg || 0), 0);
      const currentLevel = totalInbound - totalOutbound;
      
      return {
        ...silo,
        currentLevel: Math.max(0, currentLevel), // Ensure no negative values
        utilizationPercentage: silo.capacity_kg > 0 ? (Math.max(0, currentLevel) / silo.capacity_kg) * 100 : 0
      };
    }) || [];

    const totalCurrentStock = silosWithLevels.reduce((sum, silo) => sum + silo.currentLevel, 0);
    const totalUtilization = totalCapacity > 0 ? (totalCurrentStock / totalCapacity) * 100 : 0;

    // Calculate today's movements
    const today = new Date().toISOString().split('T')[0];
    const todayInbound = inboundData?.filter(item => 
      item.created_at?.split('T')[0] === today
    ).length || 0;
    
    const todayOutbound = outboundData?.filter(item => 
      item.created_at?.split('T')[0] === today
    ).length || 0;

    // Calculate this week's movements
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const weekAgoISO = weekAgo.toISOString();
    
    const weekInbound = inboundData?.filter(item => 
      item.created_at >= weekAgoISO
    ).length || 0;
    
    const weekOutbound = outboundData?.filter(item => 
      item.created_at >= weekAgoISO
    ).length || 0;

    // Calculate total quantities
    const totalInboundQuantity = inboundData?.reduce((sum, item) => sum + (item.quantity_kg || 0), 0) || 0;
    const totalOutboundQuantity = outboundData?.reduce((sum, item) => sum + (item.quantity_kg || 0), 0) || 0;

    return {
      totalSilos: silosData?.length || 0,
      totalCapacity,
      totalCurrentStock,
      totalUtilization,
      todayInbound,
      todayOutbound,
      weekInbound,
      weekOutbound,
      totalInboundQuantity,
      totalOutboundQuantity,
      silosWithLevels
    };
  }, [silosData, inboundData, outboundData, silosLoading, inboundLoading, outboundLoading]);

  const isLoading = silosLoading || inboundLoading || outboundLoading;

  if (isLoading) {
    return (
      <div className="p-4">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-300 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-300 rounded"></div>
            ))}
          </div>
          <div className="h-64 bg-gray-300 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard Tracciabilità Molino</h1>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 bg-white border-gray-200">
          <h3 className="text-sm font-medium text-gray-800 mb-1">Silos Totali</h3>
          <div className="text-2xl font-bold text-gray-900">{metrics.totalSilos}</div>
          <div className="text-xs text-gray-600">Capacità: {metrics.totalCapacity.toLocaleString()} kg</div>
        </Card>
        
        <Card className="p-4 bg-white border-gray-200">
          <h3 className="text-sm font-medium text-gray-800 mb-1">Giacenza Attuale</h3>
          <div className="text-2xl font-bold text-gray-900">{metrics.totalCurrentStock.toLocaleString()} kg</div>
          <div className="text-xs text-gray-600">Utilizzo: {Math.round(metrics.totalUtilization)}%</div>
        </Card>
        
        <Card className="p-4 bg-white border-gray-200">
          <h3 className="text-sm font-medium text-gray-800 mb-1">Movimenti Oggi</h3>
          <div className="text-2xl font-bold text-gray-900">{metrics.todayInbound + metrics.todayOutbound}</div>
          <div className="text-xs text-gray-600">IN: {metrics.todayInbound} | OUT: {metrics.todayOutbound}</div>
        </Card>
        
        <Card className="p-4 bg-white border-gray-200">
          <h3 className="text-sm font-medium text-gray-800 mb-1">Movimenti Settimana</h3>
          <div className="text-2xl font-bold text-gray-900">{metrics.weekInbound + metrics.weekOutbound}</div>
          <div className="text-xs text-gray-600">IN: {metrics.weekInbound} | OUT: {metrics.weekOutbound}</div>
        </Card>
      </div>

      {/* Silos Status Overview */}
      <Card className="p-4">
        <h2 className="text-lg font-semibold mb-4">Stato Silos</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {metrics.silosWithLevels?.map((silo) => (
            <div key={silo.id} className="border rounded-lg p-3">
              <h3 className="font-semibold text-gray-900">{silo.name}</h3>
              <div className="mt-2 space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Capacità:</span>
                  <span className="font-medium">{silo.capacity_kg.toLocaleString()} kg</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Livello:</span>
                  <span className="font-medium">{silo.currentLevel.toLocaleString()} kg</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Utilizzo:</span>
                  <span className="font-medium text-gray-900">
                    {Math.round(silo.utilizationPercentage)}%
                  </span>
                </div>
                <div className="mt-2">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="h-2 rounded-full bg-gray-600"
                      style={{ width: `${Math.min(silo.utilizationPercentage, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Quick Actions */}
      <Card className="p-4">
        <h2 className="text-lg font-semibold mb-4">Azioni Rapide</h2>
        <div className="flex flex-wrap gap-3">
          <Button 
            className="bg-navy-800 hover:bg-navy-700"
            onClick={() => window.location.href = '/silos'}
          >
            Gestisci Silos
          </Button>
          <Button 
            variant="outline"
            onClick={() => window.location.href = '/merce-in/new'}
          >
            Registra Merce IN
          </Button>
          <Button 
            variant="outline"
            onClick={() => window.location.href = '/merce-out/new'}
          >
            Registra Merce OUT
          </Button>
          <Button 
            variant="outline"
            onClick={() => window.location.href = '/reports'}
          >
            Visualizza Report
          </Button>
        </div>
      </Card>
    </div>
  );
}

export default HomePage;
