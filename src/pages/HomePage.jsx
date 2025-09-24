import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { useSilos, useInbound, useOutbound } from '../hooks';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';

function HomePage() {
  const { user } = useAuth();
  const navigate = useNavigate();

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

  // Build 14-day trend series (UTC+0)
  const {
    trendLabels,
    inboundCountSeries,
    outboundCountSeries,
    inboundQtySeries,
    outboundQtySeries
  } = useMemo(() => {
    const days = 14;
    const todayUTC = new Date();
    // Normalize to start of day UTC
    const startOfDayUTC = (d) => new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
    const endOfDayUTC = (d) => new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 23, 59, 59, 999));

    const labels = [];
    const inboundCounts = [];
    const outboundCounts = [];
    const inboundQty = [];
    const outboundQty = [];

    for (let i = days - 1; i >= 0; i--) {
      const day = new Date(startOfDayUTC(todayUTC));
      day.setUTCDate(day.getUTCDate() - i);
      const dayStart = startOfDayUTC(day);
      const dayEnd = endOfDayUTC(day);
      const key = dayStart.toISOString().split('T')[0];

      // Counts
      const inbCount = (inboundData || []).filter(x => {
        const t = new Date(x.created_at);
        return t >= dayStart && t <= dayEnd;
      }).length;
      const outCount = (outboundData || []).filter(x => {
        const t = new Date(x.created_at);
        return t >= dayStart && t <= dayEnd;
      }).length;

      // Quantities
      const inbQty = (inboundData || []).reduce((sum, x) => {
        const t = new Date(x.created_at);
        return (t >= dayStart && t <= dayEnd) ? sum + (x.quantity_kg || 0) : sum;
      }, 0);
      const outQty = (outboundData || []).reduce((sum, x) => {
        const t = new Date(x.created_at);
        return (t >= dayStart && t <= dayEnd) ? sum + (x.quantity_kg || 0) : sum;
      }, 0);

      labels.push(key);
      inboundCounts.push(inbCount);
      outboundCounts.push(outCount);
      inboundQty.push(inbQty);
      outboundQty.push(outQty);
    }

    return {
      trendLabels: labels,
      inboundCountSeries: inboundCounts,
      outboundCountSeries: outboundCounts,
      inboundQtySeries: inboundQty,
      outboundQtySeries: outboundQty
    };
  }, [inboundData, outboundData]);

  // Simple inline line chart renderer (no deps)
  const LineChart = ({ width = 600, height = 120, labels, series, colors }) => {
    const padding = { top: 10, right: 10, bottom: 18, left: 24 };
    const w = width - padding.left - padding.right;
    const h = height - padding.top - padding.bottom;
    const n = Math.max(1, labels.length - 1);
    const maxY = Math.max(1, ...series.flat());
    const xFor = (i) => (w * i) / n;
    const yFor = (v) => h - (h * v) / maxY;
    const buildPath = (arr) => arr.map((v, i) => `${i === 0 ? 'M' : 'L'} ${xFor(i).toFixed(2)} ${yFor(v).toFixed(2)}`).join(' ');
    const yTicks = 3;
    const gridY = Array.from({ length: yTicks + 1 }, (_, i) => (h * i) / yTicks);

    return (
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-28">
        <g transform={`translate(${padding.left},${padding.top})`}>
          {/* Grid */}
          {gridY.map((gy, idx) => (
            <line key={idx} x1={0} y1={gy} x2={w} y2={gy} stroke="#e5e7eb" strokeWidth="1" />
          ))}
          {/* Lines */}
          {series.map((arr, idx) => (
            <path key={idx} d={buildPath(arr)} fill="none" stroke={colors[idx]} strokeWidth="2" />
          ))}
          {/* Last points */}
          {series.map((arr, idx) => (
            <circle key={`pt-${idx}`} cx={xFor(arr.length - 1)} cy={yFor(arr[arr.length - 1])} r="2.5" fill={colors[idx]} />
          ))}
          {/* X-axis labels (sparse) */}
          {labels.map((d, i) => (i % 3 === 0 ? (
            <text key={d} x={xFor(i)} y={h + 12} fontSize="9" textAnchor="middle" fill="#6b7280">{d.slice(5)}</text>
          ) : null))}
          {/* Y-axis max label */}
          <text x={-8} y={-2} fontSize="9" textAnchor="end" fill="#6b7280">{Math.round(maxY)}</text>
        </g>
      </svg>
    );
  };

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

      {/* Trends */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-semibold">Trend Movimenti (14 giorni)</h2>
            <div className="flex items-center gap-3 text-xs">
              <div className="flex items-center gap-1"><span className="inline-block w-3 h-1 bg-gray-800" /> IN</div>
              <div className="flex items-center gap-1"><span className="inline-block w-3 h-1 bg-gray-400" /> OUT</div>
            </div>
          </div>
          <LineChart labels={trendLabels} series={[inboundCountSeries, outboundCountSeries]} colors={["#111827", "#9ca3af"]} />
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-semibold">Quantità IN/OUT (kg) • 14 giorni</h2>
            <div className="flex items-center gap-3 text-xs">
              <div className="flex items-center gap-1"><span className="inline-block w-3 h-1 bg-green-600" /> IN</div>
              <div className="flex items-center gap-1"><span className="inline-block w-3 h-1 bg-red-600" /> OUT</div>
            </div>
          </div>
          <LineChart labels={trendLabels} series={[inboundQtySeries, outboundQtySeries]} colors={["#16a34a", "#dc2626"]} />
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
            onClick={() => navigate('/silos')}
          >
            Gestisci Silos
          </Button>
          <Button 
            variant="outline"
            onClick={() => navigate('/merce-in/new')}
          >
            Registra Merce IN
          </Button>
          <Button 
            variant="outline"
            onClick={() => navigate('/merce-out/new')}
          >
            Registra Merce OUT
          </Button>
          <Button 
            variant="outline"
            onClick={() => navigate('/reports')}
          >
            Visualizza Report
          </Button>
        </div>
      </Card>
    </div>
  );
}

export default HomePage;
