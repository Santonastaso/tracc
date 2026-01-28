import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../services/supabase/client';
import { 
  useDeleteOutbound,
  useDeleteOutboundBatch,
  queryKeys
} from '../hooks';
import { Button } from '@santonastaso/shared';
import { Card } from '@santonastaso/shared';
import { MerceOutDetailCard } from '../components/MerceOutDetailCard';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, Edit, ChevronDown, ChevronRight, Layers } from 'lucide-react';

function MerceOutListPage() {
  const navigate = useNavigate();
  const [selectedOutbound, setSelectedOutbound] = useState(null);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [expandedBatches, setExpandedBatches] = useState({});
  const [selectedIds, setSelectedIds] = useState([]);

  // Fetch data using centralized query hooks
  const { data: outboundData, isLoading } = useQuery({
    queryKey: [...queryKeys.outbound, 'with-silos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('outbound')
        .select(`
          *,
          silos!inner(name)
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });

  // Helper to extract batch_id from record (column or items)
  const getBatchId = (record) => {
    // First check the column
    if (record.batch_id) return record.batch_id;
    // Fallback: check if batch_id is stored in items
    if (record.items && record.items.length > 0 && record.items[0].batch_id) {
      return record.items[0].batch_id;
    }
    return null;
  };

  // Group records by batch_id
  const groupedData = useMemo(() => {
    if (!outboundData) return [];

    const batches = {};
    const singles = [];

    outboundData.forEach(record => {
      const batchId = getBatchId(record);
      
      if (batchId) {
        if (!batches[batchId]) {
          batches[batchId] = {
            batch_id: batchId,
            isBatch: true,
            records: [],
            created_at: record.created_at,
            operator_name: record.operator_name,
            total_quantity: 0,
            silo_names: []
          };
        }
        batches[batchId].records.push(record);
        batches[batchId].total_quantity += record.quantity_kg;
        if (!batches[batchId].silo_names.includes(record.silos.name)) {
          batches[batchId].silo_names.push(record.silos.name);
        }
        // Use earliest created_at for the batch
        if (new Date(record.created_at) < new Date(batches[batchId].created_at)) {
          batches[batchId].created_at = record.created_at;
        }
      } else {
        singles.push({
          ...record,
          isBatch: false
        });
      }
    });

    // Filter out "batches" that only have 1 record (not really a batch)
    Object.entries(batches).forEach(([batchId, batch]) => {
      if (batch.records.length === 1) {
        singles.push({ ...batch.records[0], isBatch: false });
        delete batches[batchId];
      }
    });

    // Combine batches and singles, sorted by created_at
    const allItems = [...Object.values(batches), ...singles];
    allItems.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    return allItems;
  }, [outboundData]);

  // Use centralized mutation hooks
  const deleteMutation = useDeleteOutbound();
  const deleteBatchMutation = useDeleteOutboundBatch();
  const queryClient = useQueryClient();
  
  const bulkDelete = useMutation({
    mutationFn: async (ids) => {
      const { error } = await supabase
        .from('outbound')
        .delete()
        .in('id', ids);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries([...queryKeys.outbound, 'with-silos']);
      setSelectedIds([]);
    }
  });

  const toggleBatchExpanded = (batchId) => {
    setExpandedBatches(prev => ({
      ...prev,
      [batchId]: !prev[batchId]
    }));
  };

  const handleRowClick = (item) => {
    if (item.isBatch) {
      setSelectedBatch(item);
      setSelectedOutbound(null);
    } else {
      setSelectedOutbound(item);
      setSelectedBatch(null);
    }
  };

  const handleCloseDetail = () => {
    setSelectedOutbound(null);
    setSelectedBatch(null);
  };

  const handleEditRow = (item) => {
    if (item.isBatch) {
      // For batches, we don't support editing (would need to recreate)
      return;
    }
    navigate(`/merce-out/edit/${item.id}`);
  };

  const handleDeleteRow = (item) => {
    if (item.isBatch) {
      deleteBatchMutation.mutate(item.batch_id);
    } else {
      deleteMutation.mutate(item.id);
    }
  };

  const toggleSelectItem = (item) => {
    if (item.isBatch) {
      const batchRecordIds = item.records.map(r => r.id);
      const allSelected = batchRecordIds.every(id => selectedIds.includes(id));
      if (allSelected) {
        setSelectedIds(prev => prev.filter(id => !batchRecordIds.includes(id)));
      } else {
        setSelectedIds(prev => [...new Set([...prev, ...batchRecordIds])]);
      }
    } else {
      setSelectedIds(prev => 
        prev.includes(item.id) 
          ? prev.filter(id => id !== item.id)
          : [...prev, item.id]
      );
    }
  };

  const isItemSelected = (item) => {
    if (item.isBatch) {
      return item.records.every(r => selectedIds.includes(r.id));
    }
    return selectedIds.includes(item.id);
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleString('it-IT', { 
      timeZone: 'UTC',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <div className="p-2">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-1/4 mb-4"></div>
          <div className="h-64 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col p-2">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold text-foreground">Lista Movimenti OUT</h1>
        <div className="flex gap-2">
          {selectedIds.length > 0 && (
            <Button 
              variant="destructive" 
              onClick={() => bulkDelete.mutate(selectedIds)}
              disabled={bulkDelete.isPending}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Elimina ({selectedIds.length})
            </Button>
          )}
          <Button onClick={() => navigate('/merce-out/new')}>
            <Plus className="h-4 w-4 mr-2" />
            Nuovo Prelievo
          </Button>
        </div>
      </div>

      <div className="flex gap-4 flex-1 overflow-hidden">
        {/* Table */}
        <Card className="flex-1 overflow-hidden flex flex-col">
          <div className="overflow-auto flex-1">
            <table className="w-full">
              <thead className="bg-muted/50 sticky top-0">
                <tr>
                  <th className="p-3 text-left w-10">
                    <input
                      type="checkbox"
                      checked={groupedData.length > 0 && selectedIds.length === outboundData?.length}
                      onChange={() => {
                        if (selectedIds.length === outboundData?.length) {
                          setSelectedIds([]);
                        } else {
                          setSelectedIds(outboundData?.map(r => r.id) || []);
                        }
                      }}
                      className="rounded border-input"
                    />
                  </th>
                  <th className="p-3 text-left w-10"></th>
                  <th className="p-3 text-left">ID</th>
                  <th className="p-3 text-left">Data/Ora</th>
                  <th className="p-3 text-left">Silos</th>
                  <th className="p-3 text-left">Quantità (Kg)</th>
                  <th className="p-3 text-left">Operatore</th>
                  <th className="p-3 text-left">Lotti</th>
                  <th className="p-3 text-left w-24">Azioni</th>
                </tr>
              </thead>
              <tbody>
                {groupedData.map((item) => (
                  <React.Fragment key={item.isBatch ? item.batch_id : item.id}>
                    {/* Main Row */}
                    <tr 
                      className={`border-b hover:bg-muted/30 cursor-pointer ${
                        item.isBatch ? 'bg-primary/5' : ''
                      } ${
                        (selectedOutbound?.id === item.id) || (selectedBatch?.batch_id === item.batch_id) 
                          ? 'bg-primary/10' 
                          : ''
                      }`}
                      onClick={() => handleRowClick(item)}
                    >
                      <td className="p-3" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isItemSelected(item)}
                          onChange={() => toggleSelectItem(item)}
                          className="rounded border-input"
                        />
                      </td>
                      <td className="p-3" onClick={(e) => { e.stopPropagation(); if (item.isBatch) toggleBatchExpanded(item.batch_id); }}>
                        {item.isBatch && (
                          <button className="p-1 hover:bg-muted rounded">
                            {expandedBatches[item.batch_id] ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                          </button>
                        )}
                      </td>
                      <td className="p-3">
                        {item.isBatch ? (
                          <div className="flex items-center gap-2">
                            <Layers className="h-4 w-4 text-primary" />
                            <span className="text-primary font-medium">Miscela</span>
                          </div>
                        ) : (
                          `#${item.id}`
                        )}
                      </td>
                      <td className="p-3">{formatDate(item.created_at)}</td>
                      <td className="p-3">
                        {item.isBatch ? (
                          <div>
                            <span className="font-medium">{item.silo_names.length} silos</span>
                            <div className="text-sm text-muted-foreground">
                              {item.silo_names.join(', ')}
                            </div>
                          </div>
                        ) : (
                          item.silos?.name
                        )}
                      </td>
                      <td className="p-3 font-medium">
                        {item.isBatch ? item.total_quantity.toFixed(2) : item.quantity_kg} kg
                      </td>
                      <td className="p-3">{item.operator_name}</td>
                      <td className="p-3">
                        {item.isBatch ? (
                          <span className="text-sm text-muted-foreground">
                            {item.records.reduce((sum, r) => sum + (r.items?.length || 0), 0)} lotti
                          </span>
                        ) : (
                          <div className="text-sm">
                            {item.items?.length === 1 ? (
                              <>
                                <div className="font-medium">{item.items[0].material_name}</div>
                                <div className="text-muted-foreground">
                                  {item.items[0].supplier_lot || item.items[0].tf_lot || 'Senza lotto'}
                                </div>
                              </>
                            ) : item.items?.length > 1 ? (
                              <>
                                <div className="font-medium">{item.items.length} lotti</div>
                                <div className="text-muted-foreground">
                                  {item.items.map(i => i.material_name).filter((v, idx, a) => a.indexOf(v) === idx).join(', ')}
                                </div>
                              </>
                            ) : (
                              <span className="text-muted-foreground">N/A</span>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="p-3" onClick={(e) => e.stopPropagation()}>
                        <div className="flex gap-1">
                          {!item.isBatch && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleEditRow(item)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteRow(item)}
                            disabled={deleteMutation.isPending || deleteBatchMutation.isPending}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </td>
                    </tr>

                    {/* Expanded Batch Rows */}
                    {item.isBatch && expandedBatches[item.batch_id] && item.records.map((record) => (
                      <tr 
                        key={record.id}
                        className="border-b bg-muted/20 hover:bg-muted/40 cursor-pointer"
                        onClick={() => {
                          setSelectedOutbound(record);
                          setSelectedBatch(null);
                        }}
                      >
                        <td className="p-3 pl-6" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(record.id)}
                            onChange={() => toggleSelectItem(record)}
                            className="rounded border-input"
                          />
                        </td>
                        <td className="p-3"></td>
                        <td className="p-3 text-muted-foreground">#{record.id}</td>
                        <td className="p-3 text-muted-foreground">{formatDate(record.created_at)}</td>
                        <td className="p-3">{record.silos?.name}</td>
                        <td className="p-3">{record.quantity_kg} kg</td>
                        <td className="p-3 text-muted-foreground">{record.operator_name}</td>
                        <td className="p-3">
                          <div className="text-sm">
                            {record.items?.length === 1 ? (
                              <>
                                <div className="font-medium">{record.items[0].material_name}</div>
                                <div className="text-muted-foreground">
                                  {record.items[0].supplier_lot || record.items[0].tf_lot || 'Senza lotto'}
                                </div>
                              </>
                            ) : record.items?.length > 1 ? (
                              <>
                                <div className="font-medium">{record.items.length} lotti</div>
                              </>
                            ) : (
                              <span className="text-muted-foreground">N/A</span>
                            )}
                          </div>
                        </td>
                        <td className="p-3" onClick={(e) => e.stopPropagation()}>
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => navigate(`/merce-out/edit/${record.id}`)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => deleteMutation.mutate(record.id)}
                              disabled={deleteMutation.isPending}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </React.Fragment>
                ))}

                {groupedData.length === 0 && (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-muted-foreground">
                      Nessun movimento OUT registrato
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Detail Panel */}
        {(selectedOutbound || selectedBatch) && (
          <Card className="w-96 flex-shrink-0 overflow-hidden">
            {selectedBatch ? (
              <BatchDetailCard batch={selectedBatch} onClose={handleCloseDetail} />
            ) : (
              <MerceOutDetailCard outbound={selectedOutbound} onClose={handleCloseDetail} />
            )}
          </Card>
        )}
      </div>
    </div>
  );
}

// Batch detail card component
function BatchDetailCard({ batch, onClose }) {
  const deleteBatchMutation = useDeleteOutboundBatch();

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleString('it-IT', { 
      timeZone: 'UTC',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Layers className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">Dettaglio Miscela</h3>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose}>×</Button>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Summary */}
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Data/Ora</span>
            <span className="font-medium">{formatDate(batch.created_at)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Operatore</span>
            <span className="font-medium">{batch.operator_name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Silos Coinvolti</span>
            <span className="font-medium">{batch.silo_names.length}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Quantità Totale</span>
            <span className="font-bold text-lg text-primary">{batch.total_quantity.toFixed(2)} kg</span>
          </div>
        </div>

        {/* Breakdown by silo */}
        <div>
          <h4 className="font-medium mb-2">Composizione Miscela</h4>
          <div className="space-y-3">
            {batch.records.map((record) => (
              <div key={record.id} className="p-3 bg-muted/30 rounded-lg">
                <div className="flex justify-between items-start mb-2">
                  <span className="font-medium">{record.silos.name}</span>
                  <span className="font-semibold">{record.quantity_kg} kg</span>
                </div>
                {record.items && record.items.length > 0 && (
                  <div className="space-y-1">
                    {record.items.map((item, idx) => (
                      <div key={idx} className="text-sm text-muted-foreground flex justify-between">
                        <span>
                          {item.material_name}
                          {item.supplier_lot && ` (${item.supplier_lot})`}
                        </span>
                        <span>{item.quantity_kg} kg</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Percentage breakdown */}
        <div>
          <h4 className="font-medium mb-2">Percentuali</h4>
          <div className="space-y-2">
            {batch.records.map((record) => {
              const percentage = (record.quantity_kg / batch.total_quantity * 100).toFixed(1);
              return (
                <div key={record.id}>
                  <div className="flex justify-between text-sm mb-1">
                    <span>{record.silos.name}</span>
                    <span>{percentage}%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div 
                      className="bg-primary rounded-full h-2 transition-all"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="p-4 border-t">
        <Button
          variant="destructive"
          className="w-full"
          onClick={() => deleteBatchMutation.mutate(batch.batch_id)}
          disabled={deleteBatchMutation.isPending}
        >
          <Trash2 className="h-4 w-4 mr-2" />
          {deleteBatchMutation.isPending ? 'Eliminando...' : 'Elimina Miscela'}
        </Button>
      </div>
    </div>
  );
}

export default MerceOutListPage;
