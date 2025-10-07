import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../services/supabase/client';
import { useDeleteMaterial } from '../hooks';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { ArrowLeft, Edit, Save, X, Trash2, Package } from 'lucide-react';
import { confirmAction } from '../utils';

export function MaterialDetailCard({ material, onClose, onEdit }) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: material.name || '',
    description: material.description || '',
    unit: material.unit || '',
    min_quantity: material.min_quantity || '',
    max_quantity: material.max_quantity || '',
    notes: material.notes || '',
    active: material.active !== undefined ? material.active : true
  });

  const deleteMutation = useDeleteMaterial();
  const queryClient = useQueryClient();

  const updateMutation = useMutation({
    mutationFn: async (data) => {
      const { error } = await supabase
        .from('materials')
        .update(data)
        .eq('id', material.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['materials']);
      setIsEditing(false);
    }
  });

  const handleSave = () => {
    updateMutation.mutate(formData);
  };

  const handleCancel = () => {
    setFormData({
      name: material.name || '',
      description: material.description || '',
      unit: material.unit || '',
      min_quantity: material.min_quantity || '',
      max_quantity: material.max_quantity || '',
      notes: material.notes || '',
      active: material.active !== undefined ? material.active : true
    });
    setIsEditing(false);
  };

  const handleDelete = () => {
    if (confirmAction('Sei sicuro di voler eliminare questo materiale?')) {
      deleteMutation.mutate(material.id, {
        onSuccess: () => {
          onClose();
        }
      });
    }
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
                <Package className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">
                  {isEditing ? 'Edit Material' : 'Material Details'}
                </h1>
                <p className="text-muted-foreground">
                  {isEditing ? 'Modify material information' : material.name}
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
                    <Label htmlFor="name">Nome Materiale</Label>
                    {isEditing ? (
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Inserisci nome materiale"
                      />
                    ) : (
                      <p className="text-foreground font-medium">{material.name}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="description">Descrizione</Label>
                    {isEditing ? (
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Inserisci descrizione del materiale"
                        rows={3}
                      />
                    ) : (
                      <p className="text-foreground">{material.description || 'N/A'}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="unit">Unità di Misura</Label>
                    {isEditing ? (
                      <Input
                        id="unit"
                        value={formData.unit}
                        onChange={(e) => setFormData(prev => ({ ...prev, unit: e.target.value }))}
                        placeholder="es. Kg, L, pz"
                      />
                    ) : (
                      <p className="text-foreground font-medium">{material.unit || 'N/A'}</p>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-foreground mb-4">Quantity Limits</h3>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="min_quantity">Quantità Minima</Label>
                    {isEditing ? (
                      <Input
                        id="min_quantity"
                        type="number"
                        value={formData.min_quantity}
                        onChange={(e) => setFormData(prev => ({ ...prev, min_quantity: e.target.value }))}
                        placeholder="Inserisci quantità minima"
                      />
                    ) : (
                      <p className="text-foreground font-medium">{material.min_quantity || 'N/A'}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="max_quantity">Quantità Massima</Label>
                    {isEditing ? (
                      <Input
                        id="max_quantity"
                        type="number"
                        value={formData.max_quantity}
                        onChange={(e) => setFormData(prev => ({ ...prev, max_quantity: e.target.value }))}
                        placeholder="Inserisci quantità massima"
                      />
                    ) : (
                      <p className="text-foreground font-medium">{material.max_quantity || 'N/A'}</p>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-foreground mb-4">Notes</h3>
                {isEditing ? (
                  <Textarea
                    value={formData.notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Inserisci note aggiuntive"
                    rows={4}
                  />
                ) : (
                  <p className="text-foreground">{material.notes || 'Nessuna nota'}</p>
                )}
              </div>
            </div>

            {/* Right Column - Metadata */}
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-4">Status & Settings</h3>
                <div className="space-y-4">
                  <div>
                    <Label>ID Materiale</Label>
                    <p className="text-foreground font-medium">#{material.id}</p>
                  </div>

                  <div>
                    <Label>Attivo</Label>
                    {isEditing ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={formData.active}
                          onChange={(e) => setFormData(prev => ({ ...prev, active: e.target.checked }))}
                          className="h-4 w-4 text-primary border-gray-300 rounded focus:ring-primary"
                        />
                        <span className="text-sm text-muted-foreground">
                          {formData.active ? 'Materiale attivo' : 'Materiale inattivo'}
                        </span>
                      </div>
                    ) : (
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        material.active ? 'text-green-600 bg-green-100' : 'text-red-600 bg-red-100'
                      }`}>
                        {material.active ? 'Sì' : 'No'}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-foreground mb-4">Timestamps</h3>
                <div className="space-y-4">
                  <div>
                    <Label>Data Creazione</Label>
                    <p className="text-foreground font-medium">
                      {new Date(material.created_at).toLocaleDateString('it-IT', { 
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
                      {new Date(material.updated_at).toLocaleDateString('it-IT', { 
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
                <h3 className="text-lg font-semibold text-foreground mb-4">Usage Information</h3>
                <div className="space-y-2">
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="text-sm text-muted-foreground">
                      Questo materiale può essere utilizzato nei silos e nei movimenti di merce.
                    </p>
                  </div>
                  {material.min_quantity && material.max_quantity && (
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <p className="text-sm text-blue-800">
                        Range di quantità: {material.min_quantity} - {material.max_quantity} {material.unit}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
