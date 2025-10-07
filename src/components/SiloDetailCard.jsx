import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../services/supabase/client';
import { useMaterials, useDeleteSilo } from '../hooks';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { ArrowLeft, Edit, Save, X, Trash2 } from 'lucide-react';
import { confirmAction } from '../utils';

export function SiloDetailCard({ silo, onClose, onEdit }) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: silo.name || '',
    capacity_kg: silo.capacity_kg || '',
    allowed_material_ids: silo.allowed_material_ids || []
  });

  const { data: materialsData } = useMaterials();
  const deleteMutation = useDeleteSilo();
  const queryClient = useQueryClient();

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
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                {isEditing ? 'Edit Silo' : 'Silo Details'}
              </h1>
              <p className="text-muted-foreground">
                {isEditing ? 'Modify silo information' : silo.name}
              </p>
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

            {/* Right Column - Metadata */}
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-4">Metadata</h3>
                <div className="space-y-4">
                  <div>
                    <Label>ID Silos</Label>
                    <p className="text-foreground font-medium">#{silo.id}</p>
                  </div>

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
                <h3 className="text-lg font-semibold text-foreground mb-4">Status</h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-foreground">Active</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    <span className="text-sm text-foreground">Available</span>
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
