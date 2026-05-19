import React, { useState } from 'react';
import { useSilos } from '../hooks';
import {
  useMovementsReport,
  useOutboundReport,
  useCombinedMovementsReport,
  useStockReport,
  useSnapshotReport,
  useSnapshotSiloDetail,
} from '../hooks';
import { Button } from '../ui';
import { Card } from '../ui';
import { Input } from '../ui';
import { showError } from '../lib/toast';
import { formatDateTime } from '../lib/format';
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

  // State for selected silo in snapshot view
  const [selectedSnapshotSilo, setSelectedSnapshotSilo] = useState(null);

  const { data: silosData } = useSilos();

  const { data: movementsData, isLoading: movementsLoading } = useMovementsReport(filters);
  const { data: outboundData, isLoading: outboundLoading } = useOutboundReport(filters);
  const { data: combinedMovementsData, isLoading: combinedMovementsLoading } =
    useCombinedMovementsReport(filters);
  const { data: stockData, isLoading: stockLoading } = useStockReport(filters, silosData);
  const { data: snapshotData, isLoading: snapshotLoading } = useSnapshotReport(filters, silosData);
  const { data: snapshotSiloDetail } = useSnapshotSiloDetail(
    selectedSnapshotSilo,
    filters
  );

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSnapshotSiloClick = (silo) => {
    setSelectedSnapshotSilo(silo);
  };

  const handleCloseSnapshotDetail = () => {
    setSelectedSnapshotSilo(null);
  };

  const formatValue = (value) => {
    if (value === null || value === undefined) return '';
    if (typeof value === 'object') {
      // Handle nested objects like silos: { name: 'Silo 1' }
      if (value.name) return value.name;
      if (Array.isArray(value)) {
        return value.map(item => 
          typeof item === 'object' && item.snapshot 
            ? `${item.snapshot.product || 'N/A'}: ${item.quantity_kg}kg${item.snapshot.lot_supplier ? ` (${item.snapshot.lot_supplier})` : ''}`
            : String(item)
        ).join('; ');
      }
      return JSON.stringify(value);
    }
    return value;
  };

  const transformDataForExport = (data, reportType) => {
    if (!data || data.length === 0) return [];

    switch (reportType) {
      case 'movements':
        return data.map(item => ({
          'Data/Ora': formatDateTime(item.created_at),
          'DDT': item.ddt_number || '',
          'Silos': item.silos?.name || '',
          'Prodotto': item.product || '',
          'Quantità (kg)': item.quantity_kg || 0,
          'Lotto Fornitore': item.lot_supplier || '',
          'Lotto TF': item.lot_tf || '',
          'Pulizia': item.cleaned ? 'Accettata' : 'Non Accettata',
          'Proteine (%)': item.proteins || '',
          'Umidità (%)': item.humidity || '',
          'Operatore': item.operator_name || ''
        }));

      case 'outbound':
        return data.map(item => ({
          'Data/Ora': formatDateTime(item.created_at),
          'Silos': item.silos?.name || '',
          'Quantità (kg)': item.quantity_kg || 0,
          'Operatore': item.operator_name || '',
          'Dettagli Prelievo': item.items ? formatValue(item.items) : ''
        }));

      case 'combined':
        return data.map(item => ({
          'Data/Ora': formatDateTime(item.created_at),
          'Tipo': item.movement_type || '',
          'DDT': item.ddt_number || '-',
          'Silos': item.silos?.name || '',
          'Prodotto': item.product || '-',
          'Quantità (kg)': item.quantity_kg || 0,
          'Lotto Fornitore': item.lot_supplier || '-',
          'Lotto TF': item.lot_tf || '-',
          'Pulizia': item.movement_type === 'IN' ? (item.cleaned ? 'Accettata' : 'Non Accettata') : '-',
          'Proteine (%)': item.proteins ? `${item.proteins}%` : '-',
          'Umidità (%)': item.humidity ? `${item.humidity}%` : '-',
          'Operatore': item.operator_name || '-'
        }));

      case 'stock':
        return data.map(item => ({
          'Silos': item.name || '',
          'Capacità (kg)': item.capacity_kg || 0,
          'Totale Entrate (kg)': item.totalInbound || 0,
          'Totale Uscite (kg)': item.totalOutbound || 0,
          'Giacenza Attuale (kg)': item.currentStock || 0,
          'Utilizzo (%)': Math.round(item.utilizationPercentage || 0)
        }));

      case 'snapshot':
        return data.map(item => ({
          'Silos': item.name || '',
          'Capacità (kg)': item.capacity_kg || 0,
          'Totale Entrate (kg)': item.totalInbound || 0,
          'Totale Uscite (kg)': item.totalOutbound || 0,
          'Giacenza Attuale (kg)': item.currentStock || 0,
          'Utilizzo (%)': Math.round(item.utilizationPercentage || 0),
          'Data Snapshot': formatDateTime(item.snapshotDateTime)
        }));

      default:
        return data;
    }
  };

  const exportToXLSX = async (data, filename, reportType) => {
    if (!data || data.length === 0) {
      showError('Nessun dato da esportare');
      return;
    }

    const XLSX = await import('xlsx');
    const transformedData = transformDataForExport(data, reportType);
    const worksheet = XLSX.utils.json_to_sheet(transformedData);

    // Set column widths for better readability
    const maxWidth = 50;
    const minWidth = 10;
    const colWidths = Object.keys(transformedData[0] || {}).map(key => {
      const maxLength = Math.max(
        key.length,
        ...transformedData.map(row => String(row[key] || '').length)
      );
      return {
        wch: Math.min(Math.max(maxLength + 2, minWidth), maxWidth)
      };
    });
    worksheet['!cols'] = colWidths;

    // Create workbook
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Report');

    // Generate filename with date
    const dateStr = new Date().toISOString().split('T')[0];
    const xlsxFilename = `${filename}_${dateStr}.xlsx`;

    // Write file
    XLSX.writeFile(workbook, xlsxFilename);
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
                  {formatDateTime(movement.created_at)}
                </td>
                <td className="p-2">{movement.ddt_number}</td>
                <td className="p-2">{movement.silos?.name ?? '—'}</td>
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
                  {formatDateTime(outbound.created_at)}
                </td>
                <td className="p-2">{outbound.silos?.name ?? '—'}</td>
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
                  {formatDateTime(movement.created_at)}
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
                <td className="p-2">{movement.silos?.name ?? '-'}</td>
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
                <td className="p-2">{(silo.capacity_kg ?? 0).toLocaleString()} kg</td>
                <td className="p-2">{(silo.totalInbound ?? 0).toLocaleString()} kg</td>
                <td className="p-2">{(silo.totalOutbound ?? 0).toLocaleString()} kg</td>
                <td className="p-2">{(silo.currentStock ?? 0).toLocaleString()} kg</td>
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
            <strong>Snapshot al:</strong> {formatDateTime(snapshotData[0]?.snapshotDateTime)}
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
                  <td className="p-2 font-medium">{silo.name}</td>
                  <td className="p-2">{(silo.capacity_kg ?? 0).toLocaleString()} kg</td>
                  <td className="p-2">{(silo.totalInbound ?? 0).toLocaleString()} kg</td>
                  <td className="p-2">{(silo.totalOutbound ?? 0).toLocaleString()} kg</td>
                  <td className="p-2 font-medium">{(silo.currentStock ?? 0).toLocaleString()} kg</td>
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
                      <span className="font-medium">{Math.round(silo.utilizationPercentage)}%</span>
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
            onClick={() => exportToXLSX(getCurrentData(), `report_${filters.reportType}`, filters.reportType)}
            variant="outline"
          >
            Esporta XLSX
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
