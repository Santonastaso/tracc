import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../services/supabase/client';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';

function ReportsPage() {
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    siloId: '',
    reportType: 'movements'
  });

  // Fetch silos for filter
  const { data: silosData } = useQuery({
    queryKey: ['silos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('silos')
        .select('*')
        .order('id');
      
      if (error) throw error;
      return data;
    }
  });

  // Fetch movements report
  const { data: movementsData, isLoading: movementsLoading } = useQuery({
    queryKey: ['movements-report', filters],
    queryFn: async () => {
      let query = supabase
        .from('inbound')
        .select(`
          *,
          silos!inner(name),
          materials!inner(name),
          suppliers!inner(name),
          operators!inner(name)
        `)
        .order('created_at', { ascending: false });

      if (filters.startDate) {
        query = query.gte('created_at', filters.startDate + 'T00:00:00.000Z');
      }
      if (filters.endDate) {
        query = query.lte('created_at', filters.endDate + 'T23:59:59.999Z');
      }
      if (filters.siloId) {
        query = query.eq('silo_id', filters.siloId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: filters.reportType === 'movements'
  });

  // Fetch outbound movements report
  const { data: outboundData, isLoading: outboundLoading } = useQuery({
    queryKey: ['outbound-report', filters],
    queryFn: async () => {
      let query = supabase
        .from('outbound')
        .select(`
          *,
          silos!inner(name),
          operators!inner(name)
        `)
        .order('created_at', { ascending: false });

      if (filters.startDate) {
        query = query.gte('created_at', filters.startDate + 'T00:00:00.000Z');
      }
      if (filters.endDate) {
        query = query.lte('created_at', filters.endDate + 'T23:59:59.999Z');
      }
      if (filters.siloId) {
        query = query.eq('silo_id', filters.siloId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: filters.reportType === 'outbound'
  });

  // Fetch stock levels report
  const { data: stockData, isLoading: stockLoading } = useQuery({
    queryKey: ['stock-report', filters],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('silos')
        .select(`
          *,
          inbound!inner(quantity_kg, created_at),
          outbound!inner(quantity_kg)
        `)
        .order('id');
      
      if (error) throw error;
      
      // Calculate stock levels for each silo
      const stockLevels = data.map(silo => {
        const totalInbound = silo.inbound.reduce((sum, item) => sum + item.quantity_kg, 0);
        const totalOutbound = silo.outbound.reduce((sum, item) => sum + item.quantity_kg, 0);
        const currentStock = totalInbound - totalOutbound;
        
        return {
          ...silo,
          totalInbound,
          totalOutbound,
          currentStock,
          utilizationPercentage: (currentStock / silo.capacity_kg) * 100
        };
      });
      
      return stockLevels;
    },
    enabled: filters.reportType === 'stock'
  });

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const exportToCSV = (data, filename) => {
    if (!data || data.length === 0) {
      alert('Nessun dato da esportare');
      return;
    }

    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => {
          const value = row[header];
          if (typeof value === 'object' && value !== null) {
            return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
          }
          return `"${String(value || '').replace(/"/g, '""')}"`;
        }).join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const printReport = () => {
    window.print();
  };

  const getCurrentData = () => {
    switch (filters.reportType) {
      case 'movements':
        return movementsData;
      case 'outbound':
        return outboundData;
      case 'stock':
        return stockData;
      default:
        return [];
    }
  };

  const getCurrentLoading = () => {
    switch (filters.reportType) {
      case 'movements':
        return movementsLoading;
      case 'outbound':
        return outboundLoading;
      case 'stock':
        return stockLoading;
      default:
        return false;
    }
  };

  const renderMovementsTable = () => {
    if (!movementsData || movementsData.length === 0) {
      return <p className="text-gray-500 text-center py-4">Nessun movimento trovato</p>;
    }

    return (
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="text-left p-2">Data/Ora</th>
              <th className="text-left p-2">DDT</th>
              <th className="text-left p-2">Silos</th>
              <th className="text-left p-2">Prodotto</th>
              <th className="text-left p-2">Quantità</th>
              <th className="text-left p-2">Lotto Fornitore</th>
              <th className="text-left p-2">Lotto TF</th>
              <th className="text-left p-2">Pulizia</th>
              <th className="text-left p-2">Proteine</th>
              <th className="text-left p-2">Umidità</th>
              <th className="text-left p-2">Operatore</th>
            </tr>
          </thead>
          <tbody>
            {movementsData.map((movement) => (
              <tr key={movement.id} className="border-b">
                <td className="p-2">
                  {new Date(movement.created_at).toLocaleString('it-IT', { 
                    timeZone: 'UTC',
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </td>
                <td className="p-2">{movement.ddt_number}</td>
                <td className="p-2">{movement.silos.name}</td>
                <td className="p-2">{movement.materials.name}</td>
                <td className="p-2">{movement.quantity_kg} kg</td>
                <td className="p-2">{movement.supplier_lot}</td>
                <td className="p-2">{movement.tf_lot}</td>
                <td className="p-2">{movement.cleaning_status === 'accepted' ? 'Accettata' : 'Non Accettata'}</td>
                <td className="p-2">{movement.protein_content}%</td>
                <td className="p-2">{movement.moisture_content}%</td>
                <td className="p-2">{movement.operators.name}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const renderOutboundTable = () => {
    if (!outboundData || outboundData.length === 0) {
      return <p className="text-gray-500 text-center py-4">Nessun prelievo trovato</p>;
    }

    return (
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="text-left p-2">Data/Ora</th>
              <th className="text-left p-2">Silos</th>
              <th className="text-left p-2">Quantità</th>
              <th className="text-left p-2">Operatore</th>
              <th className="text-left p-2">Dettagli Prelievo</th>
            </tr>
          </thead>
          <tbody>
            {outboundData.map((outbound) => (
              <tr key={outbound.id} className="border-b">
                <td className="p-2">
                  {new Date(outbound.created_at).toLocaleString('it-IT', { 
                    timeZone: 'UTC',
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </td>
                <td className="p-2">{outbound.silos.name}</td>
                <td className="p-2">{outbound.quantity_kg} kg</td>
                <td className="p-2">{outbound.operators.name}</td>
                <td className="p-2">
                  <div className="text-xs">
                    {outbound.items?.map((item, index) => (
                      <div key={index}>
                        {item.material_name}: {item.quantity_kg}kg
                        {item.supplier_lot && ` (${item.supplier_lot})`}
                      </div>
                    ))}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const renderStockTable = () => {
    if (!stockData || stockData.length === 0) {
      return <p className="text-gray-500 text-center py-4">Nessun dato silos trovato</p>;
    }

    return (
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="text-left p-2">Silos</th>
              <th className="text-left p-2">Capacità</th>
              <th className="text-left p-2">Totale Entrate</th>
              <th className="text-left p-2">Totale Uscite</th>
              <th className="text-left p-2">Giacenza Attuale</th>
              <th className="text-left p-2">Utilizzo</th>
            </tr>
          </thead>
          <tbody>
            {stockData.map((silo) => (
              <tr key={silo.id} className="border-b">
                <td className="p-2">{silo.name}</td>
                <td className="p-2">{silo.capacity_kg.toLocaleString()} kg</td>
                <td className="p-2">{silo.totalInbound.toLocaleString()} kg</td>
                <td className="p-2">{silo.totalOutbound.toLocaleString()} kg</td>
                <td className="p-2">{silo.currentStock.toLocaleString()} kg</td>
                <td className="p-2">
                  <div className="flex items-center gap-2">
                    <div className="w-20 bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${
                          silo.utilizationPercentage >= 90 ? 'bg-red-500' :
                          silo.utilizationPercentage >= 70 ? 'bg-yellow-500' :
                          silo.utilizationPercentage >= 30 ? 'bg-green-500' : 'bg-gray-300'
                        }`}
                        style={{ width: `${Math.min(silo.utilizationPercentage, 100)}%` }}
                      />
                    </div>
                    <span>{silo.utilizationPercentage.toFixed(1)}%</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="p-4 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Report e Analisi</h1>
        <div className="flex gap-2">
          <Button 
            onClick={() => exportToCSV(getCurrentData(), `report_${filters.reportType}`)}
            variant="outline"
          >
            Esporta CSV
          </Button>
          <Button 
            onClick={printReport}
            className="bg-navy-800 hover:bg-navy-700"
          >
            Stampa Report
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <h2 className="text-lg font-semibold mb-4">Filtri Report</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Tipo Report</label>
            <Select 
              value={filters.reportType} 
              onValueChange={(value) => handleFilterChange('reportType', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="movements">Movimenti IN</SelectItem>
                <SelectItem value="outbound">Movimenti OUT</SelectItem>
                <SelectItem value="stock">Giacenze Silos</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Data Inizio</label>
            <Input
              type="date"
              value={filters.startDate}
              onChange={(e) => handleFilterChange('startDate', e.target.value)}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Data Fine</label>
            <Input
              type="date"
              value={filters.endDate}
              onChange={(e) => handleFilterChange('endDate', e.target.value)}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Silos</label>
            <Select 
              value={filters.siloId} 
              onValueChange={(value) => handleFilterChange('siloId', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Tutti i silos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Tutti i silos</SelectItem>
                {silosData?.map(silo => (
                  <SelectItem key={silo.id} value={silo.id.toString()}>
                    {silo.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex items-end">
            <Button 
              onClick={() => setFilters({ startDate: '', endDate: '', siloId: '', reportType: 'movements' })}
              variant="outline"
              className="w-full"
            >
              Reset Filtri
            </Button>
          </div>
        </div>
      </Card>

      {/* Report Content */}
      <Card className="p-4">
        <h2 className="text-lg font-semibold mb-4">
          {filters.reportType === 'movements' && 'Report Movimenti IN'}
          {filters.reportType === 'outbound' && 'Report Movimenti OUT'}
          {filters.reportType === 'stock' && 'Report Giacenze Silos'}
        </h2>
        
        {getCurrentLoading() ? (
          <div className="animate-pulse">
            <div className="h-64 bg-gray-300 rounded"></div>
          </div>
        ) : (
          <>
            {filters.reportType === 'movements' && renderMovementsTable()}
            {filters.reportType === 'outbound' && renderOutboundTable()}
            {filters.reportType === 'stock' && renderStockTable()}
          </>
        )}
      </Card>
    </div>
  );
}

export default ReportsPage;
