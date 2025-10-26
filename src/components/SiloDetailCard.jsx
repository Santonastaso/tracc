import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../services/supabase/client';
import { useMaterials, useDeleteSilo, useSilosWithLevels } from '../hooks';
import { Button } from '@andrea/crm-ui';
import { Card } from './ui/card';
import { Input } from '@andrea/crm-ui';
import { Label } from '@andrea/crm-ui';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { ArrowLeft, Edit, Save, X, Trash2, Warehouse, Package, Calendar } from 'lucide-react';
import { confirmAction } from '../utils';

export function SiloDetailCard({ silo, onClose, onEdit }) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: silo.name || '',
    capacity_kg: silo.capacity_kg || '',
    allowed_material_ids: silo.allowed_material_ids || []
  });

  const { data: materialsData } = useMaterials();
  const { data: silosWithLevels } = useSilosWithLevels(true);
  const deleteMutation = useDeleteSilo();
  const queryClient = useQueryClient();

  // Get current silo data with levels and inventory
  const currentSiloData = silosWithLevels?.find(s => s.id === silo.id) || silo;

  const updateMutation = useMutation({
    mutationFn: async (data) => {
      const { error } = await supabase
        .from('silos')
        .update(data)
        .eq('id', silo.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['silos']);
      setIsEditing(false);
    }
  });

  const handleSave = () => {
    updateMutation.mutate(formData);
  };

  const handleCancel = () => {
    setFormData({
      name: silo.name || '',
      capacity_kg: silo.capacity_kg || '',
      allowed_material_ids: silo.allowed_material_ids || []
    });
    setIsEditing(false);
  };

  const handleDelete = () => {
    if (confirmAction('Sei sicuro di voler eliminare questo silos?')) {
      deleteMutation.mutate(silo.id, {
        onSuccess: () => {
          onClose();
        }
      });
    }
  };

  const handleMaterialToggle = (materialId) => {
    const currentIds = formData.allowed_material_ids || [];
    const newIds = currentIds.includes(materialId)
      ? currentIds.filter(id => id !== materialId)
      : [...currentIds, materialId];
    
    setFormData(prev => ({
      ...prev,
      allowed_material_ids: newIds
    }));
  };

  const getMaterialNames = () => {
    if (!silo.allowed_material_ids || silo.allowed_material_ids.length === 0) {
      return 'Tutti i materiali';
    }
    
    return silo.allowed_material_ids
      .map(id => {
        const material = materialsData?.find(m => m.id === id);
        return material ? material.name : `ID: ${id}`;
      })
      .join(', ');
  };

  const getFormMaterialNames = () => {
    if (!formData.allowed_material_ids || formData.allowed_material_ids.length === 0) {
      return 'Tutti i materiali';
    }
    
    return formData.allowed_material_ids
      .map(id => {
        const material = materialsData?.find(m => m.id === id);
        return material ? material.name : `ID: ${id}`;
      })
      .join(', ');
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
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                <Warehouse className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">
                  {isEditing ? 'Edit Silo' : 'Silo Details'}
                </h1>
                <p className="text-muted-foreground">
                  {isEditing ? 'Modify silo information' : silo.name}
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
            {/* Left Column - Basic Info */}
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-4">Basic Information</h3>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name">Nome Silos</Label>
                    {isEditing ? (
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Inserisci nome silos"
                      />
                    ) : (
                      <p className="text-foreground font-medium">{silo.name}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="capacity">Capacità (Kg)</Label>
                    {isEditing ? (
                      <Input
                        id="capacity"
                        type="number"
                        value={formData.capacity_kg}
                        onChange={(e) => setFormData(prev => ({ ...prev, capacity_kg: e.target.value }))}
                        placeholder="Inserisci capacità in kg"
                      />
                    ) : (
                      <p className="text-foreground font-medium">{silo.capacity_kg?.toLocaleString()} kg</p>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-foreground mb-4">Materiali Consentiti</h3>
                {isEditing ? (
                  <div className="space-y-2">
                    <div className="text-sm text-muted-foreground mb-2">
                      Seleziona i materiali che questo silos può accettare. Lascia vuoto per accettare tutti i materiali.
                    </div>
                    <div className="grid grid-cols-1 gap-2 max-h-40 overflow-y-auto border border-border rounded-md p-3">
                      {materialsData?.map(material => (
                        <label key={material.id} className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.allowed_material_ids?.includes(material.id) || false}
                            onChange={() => handleMaterialToggle(material.id)}
                            className="h-4 w-4 text-primary border-gray-300 rounded focus:ring-primary"
                          />
                          <span className="text-sm font-medium">{material.name}</span>
                        </label>
                      ))}
                    </div>
                    {formData.allowed_material_ids?.length > 0 && (
                      <div className="text-xs text-muted-foreground">
                        {formData.allowed_material_ids.length} materiali selezionati
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    <p className="text-foreground font-medium">{getMaterialNames()}</p>
                    {silo.allowed_material_ids?.length > 0 && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {silo.allowed_material_ids.length} materiale{silo.allowed_material_ids.length !== 1 ? 'i' : ''} specificati
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Right Column - Status & Inventory */}
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-4">Status & Settings</h3>
                <div className="space-y-4">
                  <div>
                    <Label>ID Silos</Label>
                    <p className="text-foreground font-medium">#{silo.id}</p>
                  </div>

                  <div>
                    <Label>Capacità Attuale</Label>
                    <p className="text-foreground font-medium">
                      {currentSiloData.currentLevel?.toLocaleString() || 0} / {silo.capacity_kg?.toLocaleString()} kg
                    </p>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                      <div 
                        className="bg-primary h-2 rounded-full" 
                        style={{ 
                          width: `${Math.min(((currentSiloData.currentLevel || 0) / (silo.capacity_kg || 1)) * 100, 100)}%` 
                        }}
                      ></div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {Math.round(((currentSiloData.currentLevel || 0) / (silo.capacity_kg || 1)) * 100)}% utilizzato
                    </p>
                  </div>

                  <div>
                    <Label>Stato</Label>
                    <Badge variant="default" className="bg-green-100 text-green-800">
                      Attivo
                    </Badge>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-foreground mb-4">Timestamps</h3>
                <div className="space-y-4">
                  <div>
                    <Label>Data Creazione</Label>
                    <p className="text-foreground font-medium">
                      {new Date(silo.created_at).toLocaleDateString('it-IT', { 
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
                      {new Date(silo.updated_at).toLocaleDateString('it-IT', { 
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

              <div>
                <h3 className="text-lg font-semibold text-foreground mb-4">Giacenza Attuale</h3>
                <div className="space-y-2">
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="text-sm text-muted-foreground">
                      Questo silos contiene {currentSiloData.availableItems?.length || 0} lotti di materiale.
                    </p>
                  </div>
                  {currentSiloData.availableItems?.length > 0 && (
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <p className="text-sm text-blue-800">
                        Totale giacenza: {currentSiloData.currentLevel?.toLocaleString()} kg
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Inventory Breakdown Section */}
          {currentSiloData.availableItems && currentSiloData.availableItems.length > 0 && (
            <div className="border-t border-border pt-6">
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Giacenza Scorporata nei Lotti
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Lista dei materiali attualmente presenti nel silos, organizzati per lotti
                </p>
              </div>
              
              <div className="space-y-3">
                {currentSiloData.availableItems.map((item, index) => (
                  <div key={index} className="border border-border rounded-lg p-4 bg-card">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: `hsl(${(index * 137.5) % 360}, 70%, 50%)` }}></div>
                        <span className="font-medium text-foreground">
                          {item.materials?.name || item.product || 'Materiale'}
                        </span>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        Lotto #{index + 1}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <Label className="text-xs text-muted-foreground">Quantità Disponibile</Label>
                        <p className="font-medium">{item.available_quantity?.toLocaleString()} kg</p>
                      </div>
                      
                      {item.lot_supplier && (
                        <div>
                          <Label className="text-xs text-muted-foreground">Lotto Fornitore</Label>
                          <p className="font-medium">{item.lot_supplier}</p>
                        </div>
                      )}
                      
                      {item.lot_tf && (
                        <div>
                          <Label className="text-xs text-muted-foreground">Lotto TF</Label>
                          <p className="font-medium">{item.lot_tf}</p>
                        </div>
                      )}
                      
                      <div>
                        <Label className="text-xs text-muted-foreground">Data Entrata</Label>
                        <p className="font-medium flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(item.created_at).toLocaleDateString('it-IT', { 
                            timeZone: 'UTC',
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric'
                          })}
                        </p>
                      </div>
                    </div>
                    
                    {(item.proteins || item.humidity || item.cleaned) && (
                      <div className="mt-3 pt-3 border-t border-border">
                        <div className="grid grid-cols-3 gap-4 text-xs">
                          {item.proteins && (
                            <div>
                              <Label className="text-muted-foreground">Proteine</Label>
                              <p className="font-medium">{item.proteins}%</p>
                            </div>
                          )}
                          {item.humidity && (
                            <div>
                              <Label className="text-muted-foreground">Umidità</Label>
                              <p className="font-medium">{item.humidity}%</p>
                            </div>
                          )}
                          {item.cleaned !== undefined && (
                            <div>
                              <Label className="text-muted-foreground">Pulito</Label>
                              <Badge variant={item.cleaned ? "default" : "secondary"} className="text-xs">
                                {item.cleaned ? 'Sì' : 'No'}
                              </Badge>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {(!currentSiloData.availableItems || currentSiloData.availableItems.length === 0) && (
            <div className="border-t border-border pt-6">
              <div className="text-center py-8">
                <Warehouse className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">Silos Vuoto</h3>
                <p className="text-muted-foreground">
                  Questo silos non contiene attualmente alcun materiale.
                </p>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
