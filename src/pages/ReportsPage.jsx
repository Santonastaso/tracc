import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../services/supabase/client';
import { useSilos } from '../hooks';
import { Button } from '@santonastaso/shared';
import { Card } from '@santonastaso/shared';
import { Input } from '@santonastaso/shared';
import { SiloDetailCard } from '../components/SiloDetailCard';
// Using native HTML select instead of complex Select component

function ReportsPage() {
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    siloId: 'all',
    reportType: 'movements',
    snapshotDate: '',
    snapshotTime: ''
  });

  // State for snapshot silo detail view
  const [selectedSnapshotSilo, setSelectedSnapshotSilo] = useState(null);

  // Fetch silos for filter
  const { data: silosData } = useSilos();

  // Fetch movements report
  const { data: movementsData, isLoading: movementsLoading } = useQuery({
    queryKey: ['movements-report', filters],
    queryFn: async () => {
      let query = supabase
        .from('inbound')
        .select('*, silos(name)')
        .order('created_at', { ascending: false });

      if (filters.startDate) {
        query = query.gte('created_at', filters.startDate + 'T00:00:00.000Z');
      }
      if (filters.endDate) {
        query = query.lte('created_at', filters.endDate + 'T23:59:59.999Z');
      }
      if (filters.siloId && filters.siloId !== 'all') {
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
        .select('*, silos(name)')
        .order('created_at', { ascending: false });

      if (filters.startDate) {
        query = query.gte('created_at', filters.startDate + 'T00:00:00.000Z');
      }
      if (filters.endDate) {
        query = query.lte('created_at', filters.endDate + 'T23:59:59.999Z');
      }
      if (filters.siloId && filters.siloId !== 'all') {
        query = query.eq('silo_id', filters.siloId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: filters.reportType === 'outbound'
  });

  // Fetch combined movements report (IN & OUT)
  const { data: combinedMovementsData, isLoading: combinedMovementsLoading } = useQuery({
    queryKey: ['combined-movements-report', filters],
    queryFn: async () => {
      // Fetch inbound movements
      let inboundQuery = supabase
        .from('inbound')
        .select('*, silos(name)')
        .order('created_at', { ascending: false });

      if (filters.startDate) {
        inboundQuery = inboundQuery.gte('created_at', filters.startDate + 'T00:00:00.000Z');
      }
      if (filters.endDate) {
        inboundQuery = inboundQuery.lte('created_at', filters.endDate + 'T23:59:59.999Z');
      }
      if (filters.siloId && filters.siloId !== 'all') {
        inboundQuery = inboundQuery.eq('silo_id', filters.siloId);
      }

      // Fetch outbound movements
      let outboundQuery = supabase
        .from('outbound')
        .select('*, silos(name)')
        .order('created_at', { ascending: false });

      if (filters.startDate) {
        outboundQuery = outboundQuery.gte('created_at', filters.startDate + 'T00:00:00.000Z');
      }
      if (filters.endDate) {
        outboundQuery = outboundQuery.lte('created_at', filters.endDate + 'T23:59:59.999Z');
      }
      if (filters.siloId && filters.siloId !== 'all') {
        outboundQuery = outboundQuery.eq('silo_id', filters.siloId);
      }

      const [inboundResult, outboundResult] = await Promise.all([
        inboundQuery,
        outboundQuery
      ]);

      if (inboundResult.error) throw inboundResult.error;
      if (outboundResult.error) throw outboundResult.error;

      // Combine and sort by date
      const combinedData = [
        ...inboundResult.data.map(item => ({ ...item, movement_type: 'IN' })),
        ...outboundResult.data.map(item => ({ ...item, movement_type: 'OUT' }))
      ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

      return combinedData;
    },
    enabled: filters.reportType === 'combined'
  });

  // Fetch stock levels report
  const { data: stockData, isLoading: stockLoading } = useQuery({
    queryKey: ['stock-report', filters],
    queryFn: async () => {
      // Use cached silos data if available, otherwise fetch
      let silos = silosData;
      if (!silos) {
        const { data, error: silosError } = await supabase
          .from('silos')
          .select('*')
          .order('id');
        
        if (silosError) throw silosError;
        silos = data;
      }

      // Build date filter conditions
      let inboundQuery = supabase
        .from('inbound')
        .select('silo_id, quantity_kg, created_at')
        .order('created_at', { ascending: true });

      let outboundQuery = supabase
        .from('outbound')
        .select('silo_id, quantity_kg, created_at')
        .order('created_at', { ascending: true });

      // Apply date filters if provided
      if (filters.startDate) {
        const startDateTime = filters.startDate + 'T00:00:00.000Z';
        inboundQuery = inboundQuery.gte('created_at', startDateTime);
        outboundQuery = outboundQuery.gte('created_at', startDateTime);
      }
      if (filters.endDate) {
        const endDateTime = filters.endDate + 'T23:59:59.999Z';
        inboundQuery = inboundQuery.lte('created_at', endDateTime);
        outboundQuery = outboundQuery.lte('created_at', endDateTime);
      }

      // Apply silo filter if provided
      if (filters.siloId && filters.siloId !== 'all') {
        inboundQuery = inboundQuery.eq('silo_id', filters.siloId);
        outboundQuery = outboundQuery.eq('silo_id', filters.siloId);
      }

      // Fetch inbound and outbound data
      const { data: inboundData, error: inboundError } = await inboundQuery;
      if (inboundError) throw inboundError;

      const { data: outboundData, error: outboundError } = await outboundQuery;
      if (outboundError) throw outboundError;

      // Calculate stock levels for each silo
      const stockLevels = silos.map(silo => {
        const siloInbound = inboundData.filter(item => item.silo_id === silo.id);
        const siloOutbound = outboundData.filter(item => item.silo_id === silo.id);
        
        const totalInbound = siloInbound.reduce((sum, item) => sum + item.quantity_kg, 0);
        const totalOutbound = siloOutbound.reduce((sum, item) => sum + item.quantity_kg, 0);
        const currentStock = totalInbound - totalOutbound;
        
        return {
          ...silo,
          totalInbound,
          totalOutbound,
          currentStock,
          utilizationPercentage: silo.capacity_kg > 0 ? (currentStock / silo.capacity_kg) * 100 : 0
        };
      });

      // Filter silos if specific silo is selected
      if (filters.siloId && filters.siloId !== 'all') {
        return stockLevels.filter(silo => silo.id === parseInt(filters.siloId));
      }
      
      return stockLevels;
    },
    enabled: filters.reportType === 'stock'
  });

  // Fetch snapshot report - shows silo stock levels at a specific point in time
  const { data: snapshotData, isLoading: snapshotLoading } = useQuery({
    queryKey: ['snapshot-report', filters],
    queryFn: async () => {
      if (!filters.snapshotDate || !filters.snapshotTime) {
        throw new Error('Data e ora snapshot sono richiesti');
      }

      const snapshotDateTime = `${filters.snapshotDate}T${filters.snapshotTime}:59.999Z`;
      
      // Use cached silos data if available, otherwise fetch
      let silos = silosData;
      if (!silos) {
        const { data, error: silosError } = await supabase
          .from('silos')
          .select('*')
          .order('id');
        
        if (silosError) throw silosError;
        silos = data;
      }

      // Build date filter conditions - same logic as stock report but with snapshot time as end date
      let inboundQuery = supabase
        .from('inbound')
        .select('silo_id, quantity_kg, created_at')
        .order('created_at', { ascending: true });

      let outboundQuery = supabase
        .from('outbound')
        .select('silo_id, quantity_kg, created_at')
        .order('created_at', { ascending: true });

      // Apply snapshot time as end date filter
      inboundQuery = inboundQuery.lte('created_at', snapshotDateTime);
      outboundQuery = outboundQuery.lte('created_at', snapshotDateTime);

      // Apply silo filter if provided
      if (filters.siloId && filters.siloId !== 'all') {
        inboundQuery = inboundQuery.eq('silo_id', filters.siloId);
        outboundQuery = outboundQuery.eq('silo_id', filters.siloId);
      }

      // Fetch inbound and outbound data
      const { data: inboundData, error: inboundError } = await inboundQuery;
      if (inboundError) {
        console.error('Inbound query error:', inboundError);
        console.error('Snapshot datetime:', snapshotDateTime);
        throw inboundError;
      }

      const { data: outboundData, error: outboundError } = await outboundQuery;
      if (outboundError) {
        console.error('Outbound query error:', outboundError);
        throw outboundError;
      }

      // Calculate stock levels for each silo at snapshot time - same logic as stock report
      const stockLevels = silos.map(silo => {
        const siloInbound = inboundData.filter(item => item.silo_id === silo.id);
        const siloOutbound = outboundData.filter(item => item.silo_id === silo.id);
        
        const totalInbound = siloInbound.reduce((sum, item) => sum + item.quantity_kg, 0);
        const totalOutbound = siloOutbound.reduce((sum, item) => sum + item.quantity_kg, 0);
        const currentStock = totalInbound - totalOutbound;
        
        return {
          ...silo,
          totalInbound,
          totalOutbound,
          currentStock,
          utilizationPercentage: silo.capacity_kg > 0 ? (currentStock / silo.capacity_kg) * 100 : 0,
          snapshotDateTime
        };
      });

      // Filter silos if specific silo is selected
      if (filters.siloId && filters.siloId !== 'all') {
        return stockLevels.filter(silo => silo.id === parseInt(filters.siloId));
      }
      
      return stockLevels;
    },
    enabled: filters.reportType === 'snapshot' && !!filters.snapshotDate && !!filters.snapshotTime
  });

  // Fetch detailed silo data with lots for snapshot detail view
  const { data: snapshotSiloDetail, isLoading: snapshotSiloDetailLoading } = useQuery({
    queryKey: ['snapshot-silo-detail', selectedSnapshotSilo?.id, filters.snapshotDate, filters.snapshotTime],
    queryFn: async () => {
      if (!selectedSnapshotSilo || !filters.snapshotDate || !filters.snapshotTime) {
        return null;
      }

      const snapshotDateTime = `${filters.snapshotDate}T${filters.snapshotTime}:59.999Z`;
      
      // Fetch all inbound items for this silo up to snapshot time
      const { data: inboundItems, error: inboundError } = await supabase
        .from('inbound')
        .select('*')
        .eq('silo_id', selectedSnapshotSilo.id)
        .lte('created_at', snapshotDateTime)
        .order('created_at', { ascending: true });

      if (inboundError) throw inboundError;

      // Fetch all outbound items for this silo up to snapshot time
      const { data: outboundItems, error: outboundError } = await supabase
        .from('outbound')
        .select('*')
        .eq('silo_id', selectedSnapshotSilo.id)
        .lte('created_at', snapshotDateTime)
        .order('created_at', { ascending: true });

      if (outboundError) throw outboundError;

      // Calculate available items using FIFO logic at snapshot time
      const availableItems = [];
      let totalInbound = 0;
      let totalOutbound = 0;

      // Process inbound items
      for (const inbound of inboundItems) {
        availableItems.push({
          id: inbound.id,
          product: inbound.product,
          lot_supplier: inbound.lot_supplier,
          lot_tf: inbound.lot_tf,
          proteins: inbound.proteins,
          humidity: inbound.humidity,
          cleaned: inbound.cleaned,
          available_quantity: inbound.quantity_kg,
          created_at: inbound.created_at
        });
        totalInbound += inbound.quantity_kg;
      }

      // Process outbound items and reduce available quantities using FIFO
      for (const outbound of outboundItems) {
        totalOutbound += outbound.quantity_kg;
        if (outbound.items && outbound.items.length > 0) {
          // Use detailed item information from outbound
          for (const item of outbound.items) {
            const availableItem = availableItems.find(ai => ai.id === item.inbound_id);
            if (availableItem) {
              availableItem.available_quantity -= item.quantity_kg;
            }
          }
        } else {
          // Fallback to FIFO if no detailed items
          let remainingToWithdraw = outbound.quantity_kg;
          for (const item of availableItems) {
            if (remainingToWithdraw <= 0) break;
            const withdrawFromThis = Math.min(remainingToWithdraw, item.available_quantity);
            item.available_quantity -= withdrawFromThis;
            remainingToWithdraw -= withdrawFromThis;
          }
        }
      }

      // Filter out items with zero or negative quantities
      const filteredAvailableItems = availableItems.filter(item => item.available_quantity > 0);

      const currentLevel = totalInbound - totalOutbound;

      return {
        ...selectedSnapshotSilo,
        availableItems: filteredAvailableItems,
        currentLevel,
        totalInbound,
        totalOutbound,
        utilizationPercentage: selectedSnapshotSilo.capacity_kg > 0 ? (currentLevel / selectedSnapshotSilo.capacity_kg) * 100 : 0,
        snapshotDateTime
      };
    },
    enabled: !!selectedSnapshotSilo && !!filters.snapshotDate && !!filters.snapshotTime
  });

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handlers for snapshot silo detail view
  const handleSnapshotSiloClick = (silo) => {
    setSelectedSnapshotSilo(silo);
  };

  const handleCloseSnapshotDetail = () => {
    setSelectedSnapshotSilo(null);
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
      case 'combined':
        return combinedMovementsData;
      case 'stock':
        return stockData;
      case 'snapshot':
        return snapshotData;
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
      case 'combined':
        return combinedMovementsLoading;
      case 'stock':
        return stockLoading;
      case 'snapshot':
        return snapshotLoading;
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
                <td className="p-2">{movement.product}</td>
                <td className="p-2">{movement.quantity_kg} kg</td>
                <td className="p-2">{movement.lot_supplier}</td>
                <td className="p-2">{movement.lot_tf}</td>
                <td className="p-2">{movement.cleaned ? 'Accettata' : 'Non Accettata'}</td>
                <td className="p-2">{movement.proteins}%</td>
                <td className="p-2">{movement.humidity}%</td>
                <td className="p-2">{movement.operator_name}</td>
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
                <td className="p-2">{outbound.operator_name}</td>
                <td className="p-2">
                  <div className="text-xs">
                    {outbound.items?.map((item, index) => (
                      <div key={index}>
                        {item.snapshot?.product || 'N/A'}: {item.quantity_kg}kg
                        {item.snapshot?.lot_supplier && ` (${item.snapshot.lot_supplier})`}
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

  const renderCombinedMovementsTable = () => {
    if (!combinedMovementsData || combinedMovementsData.length === 0) {
      return <p className="text-gray-500 text-center py-4">Nessun movimento trovato</p>;
    }

    return (
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="text-left p-2">Data/Ora</th>
              <th className="text-left p-2">Tipo</th>
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
            {combinedMovementsData.map((movement) => (
              <tr key={`${movement.movement_type}-${movement.id}`} className="border-b">
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
                <td className="p-2">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    movement.movement_type === 'IN' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-blue-100 text-blue-800'
                  }`}>
                    {movement.movement_type}
                  </span>
                </td>
                <td className="p-2">{movement.ddt_number || '-'}</td>
                <td className="p-2">{movement.silos.name}</td>
                <td className="p-2">{movement.product || '-'}</td>
                <td className="p-2">{movement.quantity_kg} kg</td>
                <td className="p-2">{movement.lot_supplier || '-'}</td>
                <td className="p-2">{movement.lot_tf || '-'}</td>
                <td className="p-2">
                  {movement.movement_type === 'IN' ? (
                    movement.cleaned ? 'Accettata' : 'Non Accettata'
                  ) : '-'}
                </td>
                <td className="p-2">{movement.proteins ? `${movement.proteins}%` : '-'}</td>
                <td className="p-2">{movement.humidity ? `${movement.humidity}%` : '-'}</td>
                <td className="p-2">{movement.operator_name || '-'}</td>
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
                    <span>{Math.round(silo.utilizationPercentage)}%</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const renderSnapshotTable = () => {
    if (!snapshotData || snapshotData.length === 0) {
      return <p className="text-gray-500 text-center py-4">Nessun dato snapshot trovato</p>;
    }

    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center mb-4">
          <div className="text-sm text-gray-600">
            <strong>Snapshot al:</strong> {new Date(snapshotData[0]?.snapshotDateTime).toLocaleString('it-IT', { 
              timeZone: 'UTC',
              year: 'numeric',
              month: '2-digit',
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </div>
          <div className="text-xs text-muted-foreground">
            💡 Clicca su una riga per vedere i dettagli dei lotti
          </div>
        </div>
        
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
              {snapshotData.map((silo) => (
                <tr 
                  key={silo.id} 
                  className="border-b hover:bg-muted/50 cursor-pointer transition-colors"
                  onClick={() => handleSnapshotSiloClick(silo)}
                  title="Clicca per vedere i dettagli dei lotti"
                >
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
                      <span>{Math.round(silo.utilizationPercentage)}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="p-4 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-foreground">Report e Analisi</h1>
        <div className="flex gap-2">
          <Button 
            onClick={() => exportToCSV(getCurrentData(), `report_${filters.reportType}`)}
            variant="outline"
          >
            Esporta CSV
          </Button>
          <Button 
            onClick={printReport}
            className=""
          >
            Stampa Report
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="p-2">
        <h2 className="text-lg font-semibold mb-4">Filtri Report</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Tipo Report</label>
            <select
              value={filters.reportType}
              onChange={(e) => handleFilterChange('reportType', e.target.value)}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value="movements">Movimenti IN</option>
              <option value="outbound">Movimenti OUT</option>
              <option value="combined">Movimenti IN & OUT</option>
              <option value="stock">Giacenze Silos</option>
              <option value="snapshot">Snapshot Silos</option>
            </select>
          </div>
          
          {filters.reportType === 'snapshot' ? (
            <>
              <div>
                <label className="block text-sm font-medium mb-1">Data Snapshot</label>
                <Input
                  type="date"
                  value={filters.snapshotDate}
                  onChange={(e) => handleFilterChange('snapshotDate', e.target.value)}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Ora Snapshot</label>
                <Input
                  type="time"
                  value={filters.snapshotTime}
                  onChange={(e) => handleFilterChange('snapshotTime', e.target.value)}
                />
              </div>
            </>
          ) : (
            <>
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
            </>
          )}
          
          <div>
            <label className="block text-sm font-medium mb-1">Silos</label>
            <select
              value={filters.siloId}
              onChange={(e) => handleFilterChange('siloId', e.target.value)}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value="all">Tutti i silos</option>
              {silosData?.map(silo => (
                <option key={silo.id} value={silo.id.toString()}>
                  {silo.name}
                </option>
              ))}
            </select>
          </div>
          
          <div className="flex items-end">
            <Button 
              onClick={() => setFilters({ 
                startDate: '', 
                endDate: '', 
                siloId: 'all', 
                reportType: 'movements',
                snapshotDate: '',
                snapshotTime: ''
              })}
              variant="outline"
              className="w-full"
            >
              Reset Filtri
            </Button>
          </div>
        </div>
      </Card>

      {/* Report Content */}
      <Card className="p-2">
        <h2 className="text-lg font-semibold mb-4">
          {filters.reportType === 'movements' && 'Report Movimenti IN'}
          {filters.reportType === 'outbound' && 'Report Movimenti OUT'}
          {filters.reportType === 'combined' && 'Report Movimenti IN & OUT'}
          {filters.reportType === 'stock' && 'Report Giacenze Silos'}
          {filters.reportType === 'snapshot' && 'Report Snapshot Silos'}
        </h2>
        
        {getCurrentLoading() ? (
          <div className="animate-pulse">
            <div className="h-64 bg-muted rounded"></div>
          </div>
        ) : (
          <>
            {filters.reportType === 'movements' && renderMovementsTable()}
            {filters.reportType === 'outbound' && renderOutboundTable()}
            {filters.reportType === 'combined' && renderCombinedMovementsTable()}
            {filters.reportType === 'stock' && renderStockTable()}
            {filters.reportType === 'snapshot' && renderSnapshotTable()}
          </>
        )}
      </Card>

      {/* Snapshot Silo Detail Card */}
      {selectedSnapshotSilo && snapshotSiloDetail && (
        <SiloDetailCard
          silo={snapshotSiloDetail}
          onClose={handleCloseSnapshotDetail}
          isSnapshot={true}
          snapshotDateTime={filters.snapshotDate && filters.snapshotTime ? 
            `${filters.snapshotDate}T${filters.snapshotTime}:59.999Z` : null
          }
        />
      )}
    </div>
  );
}

export default ReportsPage;
