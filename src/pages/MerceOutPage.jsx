import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../services/supabase/client';
import { 
  useSilos, 
  useSilosWithLevels, 
  useOperators,
  useCreateOutbound,
  useUpdateOutbound
} from '../hooks';
import { GenericForm } from "@santonastaso/shared";
import { Button, Input, Label } from '@santonastaso/shared';
import { Card } from '@santonastaso/shared';
import { useParams, useNavigate } from 'react-router-dom';
import { Trash2, Plus } from 'lucide-react';

function MerceOutPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [editingItem, setEditingItem] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // Form state for manual lot selection
  const [selectedSilo, setSelectedSilo] = useState('');
  const [operatorName, setOperatorName] = useState('');
  const [selectedLots, setSelectedLots] = useState([]);
  const [availableLots, setAvailableLots] = useState([]);

  // Fetch data for editing if ID is provided
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
          }
          setIsLoading(false);
        });
    }
  }, [id, navigate]);

  const { data: silosData } = useSilos();
  const { data: silosWithLevels } = useSilosWithLevels();
  const { data: operatorsData } = useOperators();

  // Update available lots when silo is selected
  useEffect(() => {
    if (selectedSilo && silosWithLevels) {
      const silo = silosWithLevels.find(s => s.id === parseInt(selectedSilo));
      if (silo && silo.availableItems) {
        setAvailableLots(silo.availableItems);
      } else {
        setAvailableLots([]);
      }
      setSelectedLots([]); // Reset selected lots when silo changes
    }
  }, [selectedSilo, silosWithLevels]);

  // Use centralized mutation hooks
  const createMutation = useCreateOutbound();
  const updateMutation = useUpdateOutbound();

  // Handle form submission with manual lot selection
  const handleSubmit = async () => {
    try {
      // Validation
      if (!selectedSilo) {
        throw new Error('Seleziona un silos');
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

      // Calculate total quantity
      const totalQuantity = selectedLots.reduce((sum, lot) => sum + parseFloat(lot.withdrawQuantity), 0);

      // Prepare items to withdraw
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
        silo_id: parseInt(selectedSilo),
        quantity_kg: totalQuantity,
        operator_name: operatorName,
        items: itemsToWithdraw,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      if (editingItem) {
        await updateMutation.mutateAsync({ id: editingItem.id, updates: dataToSave });
      } else {
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
          {editingItem ? 'Modifica Prelievo Merce OUT' : 'Nuovo Prelievo Merce OUT'}
        </h1>
        <Button variant="outline" onClick={handleCancel}>
          Annulla
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 flex-1">
        {/* Left Column - Form */}
        <Card className="p-4">
          <h2 className="text-lg font-semibold mb-4">Informazioni Prelievo</h2>
          
          <div className="space-y-4">
            {/* Silo Selection */}
            <div>
              <Label htmlFor="silo_id">Silos di Prelievo</Label>
              <select
                id="silo_id"
                value={selectedSilo}
                onChange={(e) => setSelectedSilo(e.target.value)}
                className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground"
              >
                <option value="">Seleziona silos</option>
                {silosData?.map(silo => (
                  <option key={silo.id} value={silo.id}>
                    {silo.name}
                  </option>
                ))}
              </select>
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

            {/* Total Quantity Display */}
            {selectedLots.length > 0 && (
              <div className="p-3 bg-muted/50 rounded-lg">
                <Label>Quantità Totale Selezionata</Label>
                <p className="text-lg font-semibold text-foreground">
                  {getTotalSelectedQuantity().toFixed(2)} kg
                </p>
              </div>
            )}

            {/* Submit Button */}
            <Button
              onClick={handleSubmit}
              disabled={!selectedSilo || !operatorName || selectedLots.length === 0 || createMutation.isPending || updateMutation.isPending}
              className="w-full"
            >
              {createMutation.isPending || updateMutation.isPending ? 'Registrando...' : 'Registra Prelievo'}
            </Button>
          </div>
        </Card>

        {/* Right Column - Lot Selection */}
        <Card className="p-4">
          <h2 className="text-lg font-semibold mb-4">Selezione Lotti</h2>
          
          {!selectedSilo ? (
            <p className="text-muted-foreground">Seleziona un silos per vedere i lotti disponibili</p>
          ) : availableLots.length === 0 ? (
            <p className="text-muted-foreground">Nessun lotto disponibile in questo silos</p>
          ) : (
            <div className="space-y-4">
              {/* Available Lots */}
              <div>
                <h3 className="font-medium mb-2">Lotti Disponibili</h3>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {availableLots.map(lot => (
                    <div
                      key={lot.id}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        selectedLots.find(selected => selected.id === lot.id)
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
                          variant={selectedLots.find(selected => selected.id === lot.id) ? "default" : "outline"}
                          onClick={(e) => {
                            e.stopPropagation();
                            addLotToSelection(lot);
                          }}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Selected Lots */}
              {selectedLots.length > 0 && (
                <div>
                  <h3 className="font-medium mb-2">Lotti Selezionati</h3>
                  <div className="space-y-2">
                    {selectedLots.map(lot => (
                      <div key={lot.id} className="p-3 border border-primary bg-primary/5 rounded-lg">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex-1">
                            <div className="font-medium text-foreground">{lot.product}</div>
                            <div className="text-sm text-muted-foreground">
                              {lot.lot_supplier && `${lot.lot_supplier}`}
                              {lot.lot_supplier && lot.lot_tf && ' • '}
                              {lot.lot_tf && `${lot.lot_tf}`}
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => removeLotFromSelection(lot.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="flex items-center gap-2">
                          <Label htmlFor={`quantity-${lot.id}`} className="text-sm">
                            Quantità da prelevare:
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
                            className="w-24"
                          />
                          <span className="text-sm text-muted-foreground">
                            / {lot.available_quantity} kg
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

export default MerceOutPage;
