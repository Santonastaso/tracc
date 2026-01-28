import React, { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../services/supabase/client';
import { 
  useSilos, 
  useSilosWithLevels, 
  useOperators,
  useCreateOutbound,
  useCreateOutboundBatch,
  useUpdateOutbound
} from '../hooks';
import { Button, Input, Label } from '@santonastaso/shared';
import { Card } from '@santonastaso/shared';
import { useParams, useNavigate } from 'react-router-dom';
import { Trash2, Plus, X, ChevronDown, ChevronUp } from 'lucide-react';

function MerceOutPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [editingItem, setEditingItem] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // Form state for multi-silo selection
  const [selectedSiloIds, setSelectedSiloIds] = useState([]);
  const [operatorName, setOperatorName] = useState('');
  const [selectedLots, setSelectedLots] = useState([]);
  const [expandedSilos, setExpandedSilos] = useState({});
  const [siloDropdownOpen, setSiloDropdownOpen] = useState(false);

  // Fetch data for editing if ID is provided (single silo edit mode)
  useEffect(() => {
    if (id && id !== 'new') {
      setIsLoading(true);
      supabase
        .from('outbound')
        .select(`
          *,
          silos!inner(name)
        `)
        .eq('id', id)
        .single()
        .then(({ data, error }) => {
          if (error) {
            console.error('Error fetching outbound data:', error);
            navigate('/merce-out/list');
          } else {
            setEditingItem(data);
            // For editing, set the single silo
            setSelectedSiloIds([data.silo_id]);
            setOperatorName(data.operator_name || '');
          }
          setIsLoading(false);
        });
    }
  }, [id, navigate]);

  const { data: silosData } = useSilos();
  const { data: silosWithLevels } = useSilosWithLevels();
  const { data: operatorsData } = useOperators();

  // Get silos with available stock
  const silosWithStock = useMemo(() => {
    if (!silosWithLevels) return [];
    return silosWithLevels.filter(silo => 
      silo.currentLevel > 0 && silo.availableItems && silo.availableItems.length > 0
    );
  }, [silosWithLevels]);

  // Merge available lots from all selected silos, grouped by silo
  const availableLotsBySilo = useMemo(() => {
    if (!silosWithLevels || selectedSiloIds.length === 0) return {};
    
    const result = {};
    selectedSiloIds.forEach(siloId => {
      const silo = silosWithLevels.find(s => s.id === siloId);
      if (silo && silo.availableItems && silo.availableItems.length > 0) {
        result[siloId] = {
          siloName: silo.name,
          currentLevel: silo.currentLevel,
          items: silo.availableItems.map(item => ({
            ...item,
            silo_id: siloId,
            silo_name: silo.name
          }))
        };
      }
    });
    return result;
  }, [silosWithLevels, selectedSiloIds]);

  // Auto-expand silos when selected
  useEffect(() => {
    const newExpanded = {};
    selectedSiloIds.forEach(siloId => {
      newExpanded[siloId] = true;
    });
    setExpandedSilos(newExpanded);
  }, [selectedSiloIds]);

  // Use centralized mutation hooks
  const createMutation = useCreateOutbound();
  const createBatchMutation = useCreateOutboundBatch();
  const updateMutation = useUpdateOutbound();

  // Handle form submission with multi-silo batch creation
  const handleSubmit = async () => {
    try {
      // Validation
      if (selectedSiloIds.length === 0) {
        throw new Error('Seleziona almeno un silos');
      }
      if (!operatorName) {
        throw new Error('Seleziona un operatore');
      }
      if (selectedLots.length === 0) {
        throw new Error('Seleziona almeno un lotto da prelevare');
      }

      // Check if all selected lots have valid quantities
      for (const lot of selectedLots) {
        if (!lot.withdrawQuantity || lot.withdrawQuantity <= 0) {
          throw new Error(`Inserisci una quantità valida per il lotto ${lot.lot_supplier || lot.lot_tf || 'senza nome'}`);
        }
        if (lot.withdrawQuantity > lot.available_quantity) {
          throw new Error(`Quantità richiesta (${lot.withdrawQuantity}kg) supera quella disponibile (${lot.available_quantity}kg) per il lotto ${lot.lot_supplier || lot.lot_tf || 'senza nome'}`);
        }
      }

      // Group lots by silo
      const lotsBySilo = {};
      selectedLots.forEach(lot => {
        const siloId = lot.silo_id;
        if (!lotsBySilo[siloId]) {
          lotsBySilo[siloId] = [];
        }
        lotsBySilo[siloId].push(lot);
      });

      const siloIds = Object.keys(lotsBySilo);
      const isMultiSilo = siloIds.length > 1;

      if (editingItem) {
        // Editing mode - only single silo (existing behavior)
        const totalQuantity = selectedLots.reduce((sum, lot) => sum + parseFloat(lot.withdrawQuantity), 0);
        const itemsToWithdraw = selectedLots.map(lot => ({
          inbound_id: lot.id,
          quantity_kg: parseFloat(lot.withdrawQuantity),
          material_name: lot.product,
          supplier_lot: lot.lot_supplier,
          tf_lot: lot.lot_tf,
          protein_content: lot.proteins,
          moisture_content: lot.humidity,
          cleaning_status: lot.cleaned,
          entry_date: lot.created_at.split('T')[0]
        }));

        const dataToSave = {
          silo_id: editingItem.silo_id,
          quantity_kg: totalQuantity,
          operator_name: operatorName,
          items: itemsToWithdraw,
          updated_at: new Date().toISOString()
        };

        await updateMutation.mutateAsync({ id: editingItem.id, updates: dataToSave });
      } else if (isMultiSilo) {
        // Multi-silo batch creation
        const batchId = crypto.randomUUID();
        const siloWithdrawals = siloIds.map(siloId => {
          const lots = lotsBySilo[siloId];
          const totalQuantity = lots.reduce((sum, lot) => sum + parseFloat(lot.withdrawQuantity), 0);
          const items = lots.map(lot => ({
            inbound_id: lot.id,
            quantity_kg: parseFloat(lot.withdrawQuantity),
            material_name: lot.product,
            supplier_lot: lot.lot_supplier,
            tf_lot: lot.lot_tf,
            protein_content: lot.proteins,
            moisture_content: lot.humidity,
            cleaning_status: lot.cleaned,
            entry_date: lot.created_at.split('T')[0]
          }));

          return {
            silo_id: parseInt(siloId),
            quantity_kg: totalQuantity,
            items
          };
        });

        await createBatchMutation.mutateAsync({
          siloWithdrawals,
          operatorName,
          batchId
        });
      } else {
        // Single silo creation (no batch_id needed for backward compatibility)
        const siloId = siloIds[0];
        const lots = lotsBySilo[siloId];
        const totalQuantity = lots.reduce((sum, lot) => sum + parseFloat(lot.withdrawQuantity), 0);
        const itemsToWithdraw = lots.map(lot => ({
          inbound_id: lot.id,
          quantity_kg: parseFloat(lot.withdrawQuantity),
          material_name: lot.product,
          supplier_lot: lot.lot_supplier,
          tf_lot: lot.lot_tf,
          protein_content: lot.proteins,
          moisture_content: lot.humidity,
          cleaning_status: lot.cleaned,
          entry_date: lot.created_at.split('T')[0]
        }));

        const dataToSave = {
          silo_id: parseInt(siloId),
          quantity_kg: totalQuantity,
          operator_name: operatorName,
          items: itemsToWithdraw,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        await createMutation.mutateAsync(dataToSave);
      }
      
      // Navigate back to list after successful submission
      navigate('/merce-out/list');
    } catch (error) {
      console.error('Error submitting outbound:', error);
      throw error;
    }
  };

  const handleCancel = () => {
    navigate('/merce-out/list');
  };

  // Silo selection functions
  const toggleSiloSelection = (siloId) => {
    if (editingItem) return; // Don't allow changing silos in edit mode
    
    setSelectedSiloIds(prev => {
      if (prev.includes(siloId)) {
        // Remove silo and its selected lots
        setSelectedLots(lots => lots.filter(lot => lot.silo_id !== siloId));
        return prev.filter(id => id !== siloId);
      } else {
        return [...prev, siloId];
      }
    });
  };

  const toggleSiloExpanded = (siloId) => {
    setExpandedSilos(prev => ({
      ...prev,
      [siloId]: !prev[siloId]
    }));
  };

  // Lot management functions
  const addLotToSelection = (lot) => {
    if (selectedLots.find(selected => selected.id === lot.id)) {
      return; // Already selected
    }
    setSelectedLots(prev => [...prev, { ...lot, withdrawQuantity: '' }]);
  };

  const removeLotFromSelection = (lotId) => {
    setSelectedLots(prev => prev.filter(lot => lot.id !== lotId));
  };

  const updateLotQuantity = (lotId, quantity) => {
    setSelectedLots(prev => 
      prev.map(lot => 
        lot.id === lotId ? { ...lot, withdrawQuantity: quantity } : lot
      )
    );
  };

  const getTotalSelectedQuantity = () => {
    return selectedLots.reduce((sum, lot) => {
      const qty = parseFloat(lot.withdrawQuantity) || 0;
      return sum + qty;
    }, 0);
  };

  const getSelectedSiloCount = () => {
    const siloIds = new Set(selectedLots.map(lot => lot.silo_id));
    return siloIds.size;
  };

  // Group selected lots by silo for display
  const selectedLotsBySilo = useMemo(() => {
    const grouped = {};
    selectedLots.forEach(lot => {
      if (!grouped[lot.silo_id]) {
        grouped[lot.silo_id] = {
          siloName: lot.silo_name,
          lots: []
        };
      }
      grouped[lot.silo_id].lots.push(lot);
    });
    return grouped;
  }, [selectedLots]);

  const isPending = createMutation.isPending || createBatchMutation.isPending || updateMutation.isPending;

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
      <div className="flex justify-between items-center mb-4 flex-shrink-0">
        <h1 className="text-2xl font-bold text-foreground">
          {editingItem ? 'Modifica Prelievo Merce OUT' : 'Nuovo Prelievo Merce OUT (Miscela)'}
        </h1>
        <Button variant="outline" onClick={handleCancel}>
          Annulla
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 flex-1 overflow-hidden">
        {/* Left Column - Form */}
        <Card className="p-4 flex flex-col">
          <h2 className="text-lg font-semibold mb-4">Informazioni Prelievo</h2>
          
          <div className="space-y-4 flex-1">
            {/* Multi-Silo Selection */}
            <div>
              <Label htmlFor="silo_ids">Silos di Prelievo {!editingItem && '(seleziona multipli per miscela)'}</Label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => !editingItem && setSiloDropdownOpen(!siloDropdownOpen)}
                  disabled={editingItem}
                  className={`w-full px-3 py-2 border border-input rounded-md bg-background text-foreground text-left flex justify-between items-center ${editingItem ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  <span className={selectedSiloIds.length === 0 ? 'text-muted-foreground' : ''}>
                    {selectedSiloIds.length === 0 
                      ? 'Seleziona silos...'
                      : `${selectedSiloIds.length} silos selezionati`}
                  </span>
                  <ChevronDown className={`h-4 w-4 transition-transform ${siloDropdownOpen ? 'rotate-180' : ''}`} />
                </button>
                
                {siloDropdownOpen && !editingItem && (
                  <div className="absolute z-10 w-full mt-1 bg-background border border-input rounded-md shadow-lg max-h-60 overflow-y-auto">
                    {silosWithStock.length === 0 ? (
                      <div className="p-3 text-muted-foreground text-sm">
                        Nessun silos con stock disponibile
                      </div>
                    ) : (
                      silosWithStock.map(silo => (
                        <div
                          key={silo.id}
                          onClick={() => toggleSiloSelection(silo.id)}
                          className={`p-3 cursor-pointer hover:bg-muted/50 flex justify-between items-center ${
                            selectedSiloIds.includes(silo.id) ? 'bg-primary/10' : ''
                          }`}
                        >
                          <div>
                            <div className="font-medium">{silo.name}</div>
                            <div className="text-sm text-muted-foreground">
                              Disponibile: {silo.currentLevel?.toFixed(2)} kg
                            </div>
                          </div>
                          {selectedSiloIds.includes(silo.id) && (
                            <div className="h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                              <span className="text-primary-foreground text-xs">✓</span>
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
              
              {/* Selected silos tags */}
              {selectedSiloIds.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {selectedSiloIds.map(siloId => {
                    const silo = silosWithStock.find(s => s.id === siloId);
                    return silo ? (
                      <span
                        key={siloId}
                        className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary rounded-md text-sm"
                      >
                        {silo.name}
                        {!editingItem && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleSiloSelection(siloId);
                            }}
                            className="hover:bg-primary/20 rounded-full p-0.5"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        )}
                      </span>
                    ) : null;
                  })}
                </div>
              )}
            </div>

            {/* Operator Selection */}
            <div>
              <Label htmlFor="operator_name">Operatore</Label>
              <select
                id="operator_name"
                value={operatorName}
                onChange={(e) => setOperatorName(e.target.value)}
                className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground"
              >
                <option value="">Seleziona operatore</option>
                {operatorsData?.map(operator => (
                  <option key={operator.id} value={operator.name}>
                    {operator.name}{operator.code ? ` (${operator.code})` : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Summary */}
            {selectedLots.length > 0 && (
              <div className="p-3 bg-muted/50 rounded-lg space-y-2">
                <div className="flex justify-between">
                  <Label>Silos Coinvolti</Label>
                  <span className="font-semibold">{getSelectedSiloCount()}</span>
                </div>
                <div className="flex justify-between">
                  <Label>Lotti Selezionati</Label>
                  <span className="font-semibold">{selectedLots.length}</span>
                </div>
                <div className="flex justify-between border-t pt-2">
                  <Label>Quantità Totale</Label>
                  <span className="text-lg font-bold text-primary">
                    {getTotalSelectedQuantity().toFixed(2)} kg
                  </span>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <Button
              onClick={handleSubmit}
              disabled={selectedSiloIds.length === 0 || !operatorName || selectedLots.length === 0 || isPending}
              className="w-full"
            >
              {isPending ? 'Registrando...' : (
                getSelectedSiloCount() > 1 
                  ? `Registra Miscela (${getSelectedSiloCount()} silos)` 
                  : 'Registra Prelievo'
              )}
            </Button>
          </div>
        </Card>

        {/* Right Column - Lot Selection */}
        <Card className="p-4 flex flex-col overflow-hidden">
          <h2 className="text-lg font-semibold mb-4">Selezione Lotti</h2>
          
          <div className="flex-1 overflow-y-auto">
            {selectedSiloIds.length === 0 ? (
              <p className="text-muted-foreground">Seleziona uno o più silos per vedere i lotti disponibili</p>
            ) : Object.keys(availableLotsBySilo).length === 0 ? (
              <p className="text-muted-foreground">Nessun lotto disponibile nei silos selezionati</p>
            ) : (
              <div className="space-y-4">
                {/* Available Lots grouped by Silo */}
                {Object.entries(availableLotsBySilo).map(([siloId, siloData]) => (
                  <div key={siloId} className="border rounded-lg overflow-hidden">
                    <button
                      type="button"
                      onClick={() => toggleSiloExpanded(parseInt(siloId))}
                      className="w-full p-3 bg-muted/30 flex justify-between items-center hover:bg-muted/50"
                    >
                      <div className="text-left">
                        <div className="font-medium">{siloData.siloName}</div>
                        <div className="text-sm text-muted-foreground">
                          {siloData.items.length} lotti • {siloData.currentLevel?.toFixed(2)} kg disponibili
                        </div>
                      </div>
                      {expandedSilos[parseInt(siloId)] ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </button>
                    
                    {expandedSilos[parseInt(siloId)] && (
                      <div className="p-2 space-y-2">
                        {siloData.items.map(lot => {
                          const isSelected = selectedLots.find(selected => selected.id === lot.id);
                          return (
                            <div
                              key={lot.id}
                              className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                                isSelected
                                  ? 'border-primary bg-primary/5'
                                  : 'border-border hover:border-primary/50'
                              }`}
                              onClick={() => addLotToSelection(lot)}
                            >
                              <div className="flex justify-between items-start">
                                <div className="flex-1">
                                  <div className="font-medium text-foreground">{lot.product}</div>
                                  <div className="text-sm text-muted-foreground">
                                    {lot.lot_supplier && `Lotto Fornitore: ${lot.lot_supplier}`}
                                    {lot.lot_supplier && lot.lot_tf && ' • '}
                                    {lot.lot_tf && `Lotto TF: ${lot.lot_tf}`}
                                  </div>
                                  <div className="text-sm text-muted-foreground">
                                    Disponibile: <span className="font-medium">{lot.available_quantity} kg</span>
                                  </div>
                                  {(lot.proteins || lot.humidity) && (
                                    <div className="text-xs text-muted-foreground mt-1">
                                      {lot.proteins && `Proteine: ${lot.proteins}%`}
                                      {lot.proteins && lot.humidity && ' • '}
                                      {lot.humidity && `Umidità: ${lot.humidity}%`}
                                    </div>
                                  )}
                                </div>
                                <Button
                                  size="sm"
                                  variant={isSelected ? "default" : "outline"}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    addLotToSelection(lot);
                                  }}
                                >
                                  <Plus className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ))}

                {/* Selected Lots Summary */}
                {selectedLots.length > 0 && (
                  <div className="border-t pt-4">
                    <h3 className="font-medium mb-2">Lotti Selezionati ({selectedLots.length})</h3>
                    <div className="space-y-3">
                      {Object.entries(selectedLotsBySilo).map(([siloId, { siloName, lots }]) => (
                        <div key={siloId} className="bg-primary/5 rounded-lg p-3">
                          <div className="font-medium text-sm text-primary mb-2">{siloName}</div>
                          <div className="space-y-2">
                            {lots.map(lot => (
                              <div key={lot.id} className="p-2 bg-background rounded border">
                                <div className="flex justify-between items-start mb-2">
                                  <div className="flex-1">
                                    <div className="font-medium text-sm text-foreground">{lot.product}</div>
                                    <div className="text-xs text-muted-foreground">
                                      {lot.lot_supplier && `${lot.lot_supplier}`}
                                      {lot.lot_supplier && lot.lot_tf && ' • '}
                                      {lot.lot_tf && `${lot.lot_tf}`}
                                    </div>
                                  </div>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-6 w-6 p-0"
                                    onClick={() => removeLotFromSelection(lot.id)}
                                  >
                                    <Trash2 className="h-3 w-3 text-destructive" />
                                  </Button>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Label htmlFor={`quantity-${lot.id}`} className="text-xs whitespace-nowrap">
                                    Kg:
                                  </Label>
                                  <Input
                                    id={`quantity-${lot.id}`}
                                    type="number"
                                    step="0.1"
                                    min="0"
                                    max={lot.available_quantity}
                                    value={lot.withdrawQuantity}
                                    onChange={(e) => updateLotQuantity(lot.id, e.target.value)}
                                    placeholder="0"
                                    className="w-20 h-7 text-sm"
                                  />
                                  <span className="text-xs text-muted-foreground">
                                    / {lot.available_quantity}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Click outside to close dropdown */}
      {siloDropdownOpen && (
        <div 
          className="fixed inset-0 z-0" 
          onClick={() => setSiloDropdownOpen(false)}
        />
      )}
    </div>
  );
}

export default MerceOutPage;
