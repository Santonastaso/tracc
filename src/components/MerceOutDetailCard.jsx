import React, { useState } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { supabase } from '../services/supabase/client';
import { useDeleteOutbound, useSilos, useSilosWithLevels, queryKeys } from '../hooks';
import { Button } from '@santonastaso/shared';
import { Input } from '@santonastaso/shared';
import { Label } from '@santonastaso/shared';
import { ArrowLeft, Edit, Save, X, Trash2, ArrowUp, Layers } from 'lucide-react';
import { confirmAction } from '@santonastaso/shared';

export function MerceOutDetailCard({ outbound, onClose, onEdit }) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    silo_id: outbound.silo_id || '',
    quantity_kg: outbound.quantity_kg || '',
    operator_name: outbound.operator_name || '',
    items: outbound.items || [],
    notes: outbound.notes || ''
  });

  const { data: silosData } = useSilos();
  const { data: silosWithLevels } = useSilosWithLevels();
  const deleteMutation = useDeleteOutbound();
  const queryClient = useQueryClient();

  // Get batch_id from column or from items
  const batchId = outbound.batch_id || (outbound.items?.[0]?.batch_id);

  // Fetch batch siblings if this record is part of a batch
  const { data: batchSiblings } = useQuery({
    queryKey: ['outbound', 'batch', batchId],
    queryFn: async () => {
      if (!batchId) return null;
      
      // First try batch_id column
      let { data, error } = await supabase
        .from('outbound')
        .select(`
          *,
          silos!inner(name)
        `)
        .eq('batch_id', batchId)
        .order('created_at', { ascending: true });
      
      // If column doesn't exist or no data, search in items
      if (error || !data || data.length === 0) {
        const { data: allData, error: allError } = await supabase
          .from('outbound')
          .select(`
            *,
            silos!inner(name)
          `)
          .order('created_at', { ascending: true });
        
        if (allError) throw allError;
        
        // Filter by batch_id in items
        data = allData?.filter(record => {
          if (record.items && record.items.length > 0 && record.items[0].batch_id === batchId) {
            return true;
          }
          return false;
        }) || [];
      }
      
      return data;
    },
    enabled: !!batchId
  });

  const updateMutation = useMutation({
    mutationFn: async (data) => {
      const { error } = await supabase
        .from('outbound')
        .update(data)
        .eq('id', outbound.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.outbound });
      queryClient.invalidateQueries({ queryKey: [...queryKeys.outbound, 'with-silos'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.silosWithLevels });
      setIsEditing(false);
    }
  });

  const handleSave = () => {
    updateMutation.mutate(formData);
  };

  const handleCancel = () => {
    setFormData({
      silo_id: outbound.silo_id || '',
      quantity_kg: outbound.quantity_kg || '',
      operator_name: outbound.operator_name || '',
      items: outbound.items || [],
      notes: outbound.notes || ''
    });
    setIsEditing(false);
  };

  const handleDelete = () => {
    if (confirmAction('Sei sicuro di voler eliminare questo prelievo?')) {
      deleteMutation.mutate(outbound.id, {
        onSuccess: () => {
          onClose();
        }
      });
    }
  };

  const getSiloName = (siloId) => {
    const silo = silosData?.find(s => s.id === siloId);
    return silo ? silo.name : 'N/A';
  };

  const getSiloWithLevels = (siloId) => {
    return silosWithLevels?.find(s => s.id === siloId);
  };

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, {
        material_name: '',
        quantity_kg: '',
        supplier_lot: '',
        tf_lot: '',
        protein_content: '',
        moisture_content: ''
      }]
    }));
  };

  const updateItem = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
    }));
  };

  const removeItem = (index) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleString('it-IT', { 
      timeZone: 'UTC',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isPartOfBatch = batchId && batchSiblings && batchSiblings.length > 1;

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b flex justify-between items-start">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
            <ArrowUp className="h-5 w-5 text-red-600 dark:text-red-400" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">
              Movimento #{outbound.id}
            </h3>
            <p className="text-sm text-muted-foreground">
              {getSiloName(outbound.silo_id)}
            </p>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose}>×</Button>
      </div>

      {/* Batch Info Banner */}
      {isPartOfBatch && (
        <div className="p-3 bg-primary/10 border-b flex items-center gap-2">
          <Layers className="h-4 w-4 text-primary" />
          <span className="text-sm">
            Parte di una miscela con <strong>{batchSiblings.length} silos</strong>
          </span>
        </div>
      )}
      
      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Movement Info */}
        <div className="space-y-3">
          <h4 className="font-medium text-foreground">Informazioni Movimento</h4>
          
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Data/Ora</span>
              <span className="font-medium">{formatDate(outbound.created_at)}</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-muted-foreground">Silos</span>
              {isEditing ? (
                <select
                  value={formData.silo_id}
                  onChange={(e) => setFormData(prev => ({ ...prev, silo_id: e.target.value }))}
                  className="px-2 py-1 border border-input rounded-md bg-background text-foreground text-sm"
                >
                  <option value="">Seleziona</option>
                  {silosData?.map(silo => (
                    <option key={silo.id} value={silo.id}>{silo.name}</option>
                  ))}
                </select>
              ) : (
                <span className="font-medium">{getSiloName(outbound.silo_id)}</span>
              )}
            </div>
            
            <div className="flex justify-between">
              <span className="text-muted-foreground">Quantità</span>
              {isEditing ? (
                <Input
                  type="number"
                  value={formData.quantity_kg}
                  onChange={(e) => setFormData(prev => ({ ...prev, quantity_kg: e.target.value }))}
                  className="w-24 h-7 text-sm"
                />
              ) : (
                <span className="font-bold text-primary">{outbound.quantity_kg} kg</span>
              )}
            </div>
            
            <div className="flex justify-between">
              <span className="text-muted-foreground">Operatore</span>
              {isEditing ? (
                <Input
                  value={formData.operator_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, operator_name: e.target.value }))}
                  className="w-32 h-7 text-sm"
                />
              ) : (
                <span className="font-medium">{outbound.operator_name || 'N/A'}</span>
              )}
            </div>
          </div>
        </div>

        {/* Batch Siblings */}
        {isPartOfBatch && (
          <div className="space-y-3">
            <h4 className="font-medium text-foreground">Altri Silos nella Miscela</h4>
            <div className="space-y-2">
              {batchSiblings.filter(s => s.id !== outbound.id).map(sibling => (
                <div key={sibling.id} className="p-2 bg-muted/30 rounded-lg flex justify-between items-center">
                  <div>
                    <div className="font-medium text-sm">{sibling.silos.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {sibling.items?.length || 0} lotti
                    </div>
                  </div>
                  <span className="font-semibold">{sibling.quantity_kg} kg</span>
                </div>
              ))}
              <div className="pt-2 border-t flex justify-between">
                <span className="font-medium">Totale Miscela</span>
                <span className="font-bold text-primary">
                  {batchSiblings.reduce((sum, s) => sum + s.quantity_kg, 0).toFixed(2)} kg
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Items Detail */}
        <div className="space-y-3">
          <h4 className="font-medium text-foreground">Dettaglio Lotti</h4>
          
          {isEditing ? (
            <div className="space-y-3">
              {formData.items.map((item, index) => (
                <div key={index} className="p-3 border border-border rounded-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm">Lotto {index + 1}</span>
                    <Button variant="ghost" size="sm" onClick={() => removeItem(index)}>
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-xs">Materiale</Label>
                      <Input
                        value={item.material_name}
                        onChange={(e) => updateItem(index, 'material_name', e.target.value)}
                        className="h-7 text-sm"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Quantità (Kg)</Label>
                      <Input
                        type="number"
                        value={item.quantity_kg}
                        onChange={(e) => updateItem(index, 'quantity_kg', e.target.value)}
                        className="h-7 text-sm"
                      />
                    </div>
                  </div>
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={addItem} className="w-full">
                + Aggiungi Lotto
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {outbound.items && outbound.items.length > 0 ? (
                <>
                  {/* Summary */}
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <div className="flex justify-between items-center text-sm">
                      <span>Totale prelevato:</span>
                      <span className="font-bold text-primary">
                        {outbound.items.reduce((sum, item) => sum + (item.quantity_kg || 0), 0).toFixed(2)} kg
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {outbound.items.length} lotto{outbound.items.length !== 1 ? 'i' : ''}
                    </div>
                  </div>

                  {/* Individual Lots */}
                  {outbound.items.map((item, index) => (
                    <div key={index} className="p-2 bg-muted/30 rounded-lg text-sm">
                      <div className="flex justify-between items-start mb-1">
                        <span className="font-medium">{item.material_name}</span>
                        <span className="font-semibold">{item.quantity_kg} kg</span>
                      </div>
                      <div className="text-xs text-muted-foreground space-y-0.5">
                        {item.supplier_lot && <div>Lotto: {item.supplier_lot}</div>}
                        {item.tf_lot && <div>TF: {item.tf_lot}</div>}
                        {(item.protein_content || item.moisture_content) && (
                          <div>
                            {item.protein_content && `Prot: ${item.protein_content}%`}
                            {item.protein_content && item.moisture_content && ' • '}
                            {item.moisture_content && `Um: ${item.moisture_content}%`}
                          </div>
                        )}
                        {item.entry_date && (
                          <div>Entrata: {new Date(item.entry_date).toLocaleDateString('it-IT')}</div>
                        )}
                      </div>
                    </div>
                  ))}
                </>
              ) : (
                <p className="text-sm text-muted-foreground">Nessun dettaglio disponibile</p>
              )}
            </div>
          )}
        </div>

        {/* Current Silo Status */}
        {!isEditing && (
          <div className="space-y-3">
            <h4 className="font-medium text-foreground">Stato Silos Attuale</h4>
            {(() => {
              const siloWithLevels = getSiloWithLevels(outbound.silo_id);
              if (!siloWithLevels) {
                return <p className="text-sm text-muted-foreground">Dati non disponibili</p>;
              }
              
              const percentage = (siloWithLevels.currentLevel / siloWithLevels.capacity_kg) * 100;
              
              return (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Livello</span>
                    <span className="font-medium">
                      {siloWithLevels.currentLevel?.toFixed(2) || 0} / {siloWithLevels.capacity_kg} kg
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div 
                      className="bg-primary h-2 rounded-full transition-all"
                      style={{ width: `${Math.min(100, percentage)}%` }}
                    />
                  </div>
                  <div className="text-xs text-muted-foreground text-center">
                    {percentage.toFixed(1)}% utilizzato
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* Notes */}
        {(outbound.notes || isEditing) && (
          <div className="space-y-2">
            <h4 className="font-medium text-foreground">Note</h4>
            {isEditing ? (
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Aggiungi note..."
                rows={3}
                className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground text-sm"
              />
            ) : (
              <p className="text-sm text-muted-foreground">{outbound.notes || 'Nessuna nota'}</p>
            )}
          </div>
        )}

        {/* Timestamps */}
        {!isEditing && (
          <div className="text-xs text-muted-foreground pt-2 border-t space-y-1">
            <div>Creato: {formatDate(outbound.created_at)}</div>
            {outbound.updated_at !== outbound.created_at && (
              <div>Modificato: {formatDate(outbound.updated_at)}</div>
            )}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="p-4 border-t flex gap-2">
        {isEditing ? (
          <>
            <Button variant="outline" className="flex-1" onClick={handleCancel}>
              <X className="h-4 w-4 mr-2" />
              Annulla
            </Button>
            <Button className="flex-1" onClick={handleSave} disabled={updateMutation.isPending}>
              <Save className="h-4 w-4 mr-2" />
              {updateMutation.isPending ? 'Salvando...' : 'Salva'}
            </Button>
          </>
        ) : (
          <>
            <Button variant="outline" className="flex-1" onClick={() => setIsEditing(true)}>
              <Edit className="h-4 w-4 mr-2" />
              Modifica
            </Button>
            <Button 
              variant="destructive" 
              className="flex-1" 
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Elimina
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
