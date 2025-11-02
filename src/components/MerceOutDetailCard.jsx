import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../services/supabase/client';
import { useDeleteOutbound, useSilos, useSilosWithLevels } from '../hooks';
import { Button } from '@santonastaso/shared';
import { Card } from '@santonastaso/shared';
import { Input } from '@santonastaso/shared';
import { Label } from '@santonastaso/shared';

import { ArrowLeft, Edit, Save, X, Trash2, ArrowUp } from 'lucide-react';
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

  const updateMutation = useMutation({
    mutationFn: async (data) => {
      const { error } = await supabase
        .from('outbound')
        .update(data)
        .eq('id', outbound.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['outbound']);
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

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden bg-background">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to List
            </Button>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <ArrowUp className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">
                  {isEditing ? 'Edit Outbound Movement' : 'Outbound Movement Details'}
                </h1>
                <p className="text-muted-foreground">
                  {isEditing ? 'Modify movement information' : `Movement ${outbound.id}`}
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!isEditing ? (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-2"
                >
                  <Edit className="h-4 w-4" />
                  Edit
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleDelete}
                  className="flex items-center gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCancel}
                  className="flex items-center gap-2"
                >
                  <X className="h-4 w-4" />
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleSave}
                  disabled={updateMutation.isPending}
                  className="flex items-center gap-2"
                >
                  <Save className="h-4 w-4" />
                  {updateMutation.isPending ? 'Saving...' : 'Save'}
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column - Movement Info */}
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-4">Movement Information</h3>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="silo_id">Silos</Label>
                    {isEditing ? (
                      <select
                        id="silo_id"
                        value={formData.silo_id}
                        onChange={(e) => setFormData(prev => ({ ...prev, silo_id: e.target.value }))}
                        className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground"
                      >
                        <option value="">Seleziona silos</option>
                        {silosData?.map(silo => (
                          <option key={silo.id} value={silo.id}>
                            {silo.name}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <p className="text-foreground font-medium">{getSiloName(outbound.silo_id)}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="quantity_kg">Quantità Totale (Kg)</Label>
                    {isEditing ? (
                      <Input
                        id="quantity_kg"
                        type="number"
                        value={formData.quantity_kg}
                        onChange={(e) => setFormData(prev => ({ ...prev, quantity_kg: e.target.value }))}
                        placeholder="Inserisci quantità totale in kg"
                      />
                    ) : (
                      <p className="text-foreground font-medium">{outbound.quantity_kg} kg</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="operator_name">Operatore</Label>
                    {isEditing ? (
                      <Input
                        id="operator_name"
                        value={formData.operator_name}
                        onChange={(e) => setFormData(prev => ({ ...prev, operator_name: e.target.value }))}
                        placeholder="Inserisci nome operatore"
                      />
                    ) : (
                      <p className="text-foreground font-medium">{outbound.operator_name || 'N/A'}</p>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-foreground mb-4">Notes</h3>
                {isEditing ? (
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Inserisci note aggiuntive"
                    rows={4}
                  />
                ) : (
                  <p className="text-foreground">{outbound.notes || 'Nessuna nota'}</p>
                )}
              </div>
            </div>

            {/* Right Column - Items & Metadata */}
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-4">Dettagli Prelievo</h3>
                {isEditing ? (
                  <div className="space-y-4">
                    {formData.items.map((item, index) => (
                      <div key={index} className="p-4 border border-border rounded-lg space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium text-foreground">Item {index + 1}</h4>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => removeItem(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <Label>Materiale</Label>
                            <Input
                              value={item.material_name}
                              onChange={(e) => updateItem(index, 'material_name', e.target.value)}
                              placeholder="Nome materiale"
                            />
                          </div>
                          <div>
                            <Label>Quantità (Kg)</Label>
                            <Input
                              type="number"
                              value={item.quantity_kg}
                              onChange={(e) => updateItem(index, 'quantity_kg', e.target.value)}
                              placeholder="Quantità"
                            />
                          </div>
                          <div>
                            <Label>Lotto Fornitore</Label>
                            <Input
                              value={item.supplier_lot}
                              onChange={(e) => updateItem(index, 'supplier_lot', e.target.value)}
                              placeholder="Lotto fornitore"
                            />
                          </div>
                          <div>
                            <Label>Lotto TF</Label>
                            <Input
                              value={item.tf_lot}
                              onChange={(e) => updateItem(index, 'tf_lot', e.target.value)}
                              placeholder="Lotto TF"
                            />
                          </div>
                          <div>
                            <Label>Proteine (%)</Label>
                            <Input
                              type="number"
                              step="0.1"
                              value={item.protein_content}
                              onChange={(e) => updateItem(index, 'protein_content', e.target.value)}
                              placeholder="Proteine"
                            />
                          </div>
                          <div>
                            <Label>Umidità (%)</Label>
                            <Input
                              type="number"
                              step="0.1"
                              value={item.moisture_content}
                              onChange={(e) => updateItem(index, 'moisture_content', e.target.value)}
                              placeholder="Umidità"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                    <Button
                      variant="outline"
                      onClick={addItem}
                      className="w-full"
                    >
                      + Aggiungi Item
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {outbound.items && outbound.items.length > 0 ? (
                      <>
                        {/* Summary */}
                        <div className="p-3 bg-primary/10 rounded-lg border border-primary/20">
                          <div className="flex justify-between items-center">
                            <span className="font-medium text-foreground">Totale Prelevato:</span>
                            <span className="text-lg font-bold text-primary">
                              {outbound.items.reduce((sum, item) => sum + (item.quantity_kg || 0), 0).toFixed(2)} kg
                            </span>
                          </div>
                          <div className="text-sm text-muted-foreground mt-1">
                            {outbound.items.length} lotto{outbound.items.length !== 1 ? 'i' : ''} utilizzato{outbound.items.length !== 1 ? 'i' : ''}
                          </div>
                        </div>

                        {/* Individual Lots */}
                        <div className="space-y-2">
                          <h4 className="font-medium text-foreground">Dettaglio Lotti:</h4>
                          {outbound.items.map((item, index) => (
                            <div key={index} className="p-3 bg-muted/50 rounded-lg border border-border">
                              <div className="flex justify-between items-start mb-2">
                                <div className="flex-1">
                                  <div className="font-medium text-foreground">{item.material_name}</div>
                                  <div className="text-sm text-muted-foreground">
                                    Quantità prelevata: <span className="font-medium text-foreground">{item.quantity_kg} kg</span>
                                  </div>
                                </div>
                                {item.entry_date && (
                                  <div className="text-xs text-muted-foreground">
                                    Entrata: {new Date(item.entry_date).toLocaleDateString('it-IT')}
                                  </div>
                                )}
                              </div>
                              
                              {/* Lot Information */}
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                                {item.supplier_lot && (
                                  <div>
                                    <span className="text-muted-foreground">Lotto Fornitore:</span>
                                    <span className="ml-1 font-medium text-foreground">{item.supplier_lot}</span>
                                  </div>
                                )}
                                {item.tf_lot && (
                                  <div>
                                    <span className="text-muted-foreground">Lotto TF:</span>
                                    <span className="ml-1 font-medium text-foreground">{item.tf_lot}</span>
                                  </div>
                                )}
                                {item.protein_content && (
                                  <div>
                                    <span className="text-muted-foreground">Proteine:</span>
                                    <span className="ml-1 font-medium text-foreground">{item.protein_content}%</span>
                                  </div>
                                )}
                                {item.moisture_content && (
                                  <div>
                                    <span className="text-muted-foreground">Umidità:</span>
                                    <span className="ml-1 font-medium text-foreground">{item.moisture_content}%</span>
                                  </div>
                                )}
                                {item.cleaning_status !== undefined && (
                                  <div>
                                    <span className="text-muted-foreground">Pulito:</span>
                                    <span className={`ml-1 font-medium ${item.cleaning_status ? 'text-green-600' : 'text-orange-600'}`}>
                                      {item.cleaning_status ? 'Sì' : 'No'}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </>
                    ) : (
                      <p className="text-muted-foreground">Nessun dettaglio disponibile</p>
                    )}
                  </div>
                )}
              </div>

              {/* Current Silo Balance */}
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-4">Stato Silos Attuale</h3>
                {(() => {
                  const siloWithLevels = getSiloWithLevels(outbound.silo_id);
                  if (!siloWithLevels) {
                    return <p className="text-muted-foreground">Dati silos non disponibili</p>;
                  }
                  
                  return (
                    <div className="space-y-3">
                      {/* Current Level */}
                      <div className="p-3 bg-muted/30 rounded-lg">
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">Livello Attuale:</span>
                          <span className="font-semibold text-foreground">
                            {siloWithLevels.currentLevel?.toFixed(2) || 0} kg
                          </span>
                        </div>
                        <div className="flex justify-between items-center mt-1">
                          <span className="text-muted-foreground">Capacità:</span>
                          <span className="text-foreground">
                            {siloWithLevels.capacity_kg} kg
                          </span>
                        </div>
                        <div className="mt-2">
                          <div className="w-full bg-muted rounded-full h-2">
                            <div 
                              className="bg-primary h-2 rounded-full transition-all duration-300"
                              style={{ 
                                width: `${Math.min(100, (siloWithLevels.currentLevel / siloWithLevels.capacity_kg) * 100)}%` 
                              }}
                            />
                          </div>
                          <div className="text-xs text-muted-foreground mt-1 text-center">
                            {((siloWithLevels.currentLevel / siloWithLevels.capacity_kg) * 100).toFixed(1)}% utilizzato
                          </div>
                        </div>
                      </div>

                      {/* Available Lots */}
                      {siloWithLevels.availableItems && siloWithLevels.availableItems.length > 0 && (
                        <div>
                          <h4 className="font-medium text-foreground mb-2">Lotti Disponibili:</h4>
                          <div className="space-y-2 max-h-40 overflow-y-auto">
                            {siloWithLevels.availableItems.map((item, index) => (
                              <div key={index} className="p-2 bg-muted/20 rounded text-sm">
                                <div className="flex justify-between items-center">
                                  <span className="font-medium text-foreground">{item.product}</span>
                                  <span className="text-muted-foreground">{item.available_quantity} kg</span>
                                </div>
                                {(item.lot_supplier || item.lot_tf) && (
                                  <div className="text-xs text-muted-foreground mt-1">
                                    {item.lot_supplier && `${item.lot_supplier}`}
                                    {item.lot_supplier && item.lot_tf && ' • '}
                                    {item.lot_tf && `${item.lot_tf}`}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>

              <div>
                <h3 className="text-lg font-semibold text-foreground mb-4">Timestamps</h3>
                <div className="space-y-4">
                  <div>
                    <Label>Data/Ora Movimento</Label>
                    <p className="text-foreground font-medium">
                      {new Date(outbound.created_at).toLocaleString('it-IT', { 
                        timeZone: 'UTC',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>

                  <div>
                    <Label>Ultima Modifica</Label>
                    <p className="text-foreground font-medium">
                      {new Date(outbound.updated_at).toLocaleDateString('it-IT', { 
                        timeZone: 'UTC',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
