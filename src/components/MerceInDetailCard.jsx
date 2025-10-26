import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../services/supabase/client';
import { useDeleteInbound, useMaterials, useOperators, useSilos } from '../hooks';
import { Button, Input, Label } from '@santonastaso/crm-ui';
import { Card } from '@santonastaso/crm-ui';

import { ArrowLeft, Edit, Save, X, Trash2, ArrowDown } from 'lucide-react';
import { confirmAction } from '../utils';

export function MerceInDetailCard({ inbound, onClose, onEdit }) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    ddt_number: inbound.ddt_number || '',
    product: inbound.product || '',
    quantity_kg: inbound.quantity_kg || '',
    silo_id: inbound.silo_id || '',
    lot_supplier: inbound.lot_supplier || '',
    lot_tf: inbound.lot_tf || '',
    cleaned: inbound.cleaned !== undefined ? inbound.cleaned : false,
    proteins: inbound.proteins || '',
    humidity: inbound.humidity || '',
    operator_name: inbound.operator_name || '',
    notes: inbound.notes || ''
  });

  const { data: materialsData } = useMaterials();
  const { data: operatorsData } = useOperators();
  const { data: silosData } = useSilos();
  const deleteMutation = useDeleteInbound();
  const queryClient = useQueryClient();

  const updateMutation = useMutation({
    mutationFn: async (data) => {
      const { error } = await supabase
        .from('inbound')
        .update(data)
        .eq('id', inbound.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['inbound']);
      setIsEditing(false);
    }
  });

  const handleSave = () => {
    updateMutation.mutate(formData);
  };

  const handleCancel = () => {
    setFormData({
      ddt_number: inbound.ddt_number || '',
      product: inbound.product || '',
      quantity_kg: inbound.quantity_kg || '',
      silo_id: inbound.silo_id || '',
      lot_supplier: inbound.lot_supplier || '',
      lot_tf: inbound.lot_tf || '',
      cleaned: inbound.cleaned !== undefined ? inbound.cleaned : false,
      proteins: inbound.proteins || '',
      humidity: inbound.humidity || '',
      operator_name: inbound.operator_name || '',
      notes: inbound.notes || ''
    });
    setIsEditing(false);
  };

  const handleDelete = () => {
    if (confirmAction('Sei sicuro di voler eliminare questo movimento?')) {
      deleteMutation.mutate(inbound.id, {
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
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <ArrowDown className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">
                  {isEditing ? 'Edit Inbound Movement' : 'Inbound Movement Details'}
                </h1>
                <p className="text-muted-foreground">
                  {isEditing ? 'Modify movement information' : `Movement ${inbound.id}`}
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
                    <Label htmlFor="ddt_number">DDT Number</Label>
                    {isEditing ? (
                      <Input
                        id="ddt_number"
                        value={formData.ddt_number}
                        onChange={(e) => setFormData(prev => ({ ...prev, ddt_number: e.target.value }))}
                        placeholder="Inserisci numero DDT"
                      />
                    ) : (
                      <p className="text-foreground font-medium">{inbound.ddt_number || 'N/A'}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="product">Prodotto</Label>
                    {isEditing ? (
                      <Input
                        id="product"
                        value={formData.product}
                        onChange={(e) => setFormData(prev => ({ ...prev, product: e.target.value }))}
                        placeholder="Inserisci nome prodotto"
                      />
                    ) : (
                      <p className="text-foreground font-medium">{inbound.product}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="quantity_kg">Quantità (Kg)</Label>
                    {isEditing ? (
                      <Input
                        id="quantity_kg"
                        type="number"
                        value={formData.quantity_kg}
                        onChange={(e) => setFormData(prev => ({ ...prev, quantity_kg: e.target.value }))}
                        placeholder="Inserisci quantità in kg"
                      />
                    ) : (
                      <p className="text-foreground font-medium">{inbound.quantity_kg} kg</p>
                    )}
                  </div>

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
                      <p className="text-foreground font-medium">{getSiloName(inbound.silo_id)}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="fornitore">Fornitore</Label>
                    {isEditing ? (
                      <Input
                        id="lot_supplier"
                        value={formData.lot_supplier}
                        onChange={(e) => setFormData(prev => ({ ...prev, lot_supplier: e.target.value }))}
                        placeholder="Inserisci nome fornitore"
                      />
                    ) : (
                      <p className="text-foreground font-medium">{inbound.lot_supplier || 'N/A'}</p>
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
                      <p className="text-foreground font-medium">{inbound.operator_name || 'N/A'}</p>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-foreground mb-4">Lot Information</h3>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="lot_supplier">Lotto Fornitore</Label>
                    {isEditing ? (
                      <Input
                        id="lot_supplier"
                        value={formData.lot_supplier}
                        onChange={(e) => setFormData(prev => ({ ...prev, lot_supplier: e.target.value }))}
                        placeholder="Inserisci lotto fornitore"
                      />
                    ) : (
                      <p className="text-foreground font-medium">{inbound.lot_supplier || 'N/A'}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="lot_tf">Lotto TF</Label>
                    {isEditing ? (
                      <Input
                        id="lot_tf"
                        value={formData.lot_tf}
                        onChange={(e) => setFormData(prev => ({ ...prev, lot_tf: e.target.value }))}
                        placeholder="Inserisci lotto TF"
                      />
                    ) : (
                      <p className="text-foreground font-medium">{inbound.lot_tf || 'N/A'}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Quality & Metadata */}
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-4">Quality Information</h3>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="proteins">Proteine (%)</Label>
                    {isEditing ? (
                      <Input
                        id="proteins"
                        type="number"
                        step="0.1"
                        value={formData.proteins}
                        onChange={(e) => setFormData(prev => ({ ...prev, proteins: e.target.value }))}
                        placeholder="Inserisci percentuale proteine"
                      />
                    ) : (
                      <p className="text-foreground font-medium">{inbound.proteins ? `${inbound.proteins}%` : 'N/A'}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="humidity">Umidità (%)</Label>
                    {isEditing ? (
                      <Input
                        id="humidity"
                        type="number"
                        step="0.1"
                        value={formData.humidity}
                        onChange={(e) => setFormData(prev => ({ ...prev, humidity: e.target.value }))}
                        placeholder="Inserisci percentuale umidità"
                      />
                    ) : (
                      <p className="text-foreground font-medium">{inbound.humidity ? `${inbound.humidity}%` : 'N/A'}</p>
                    )}
                  </div>

                  <div>
                    <Label>Pulizia</Label>
                    {isEditing ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={formData.cleaned}
                          onChange={(e) => setFormData(prev => ({ ...prev, cleaned: e.target.checked }))}
                          className="h-4 w-4 text-primary border-gray-300 rounded focus:ring-primary"
                        />
                        <span className="text-sm text-muted-foreground">
                          {formData.cleaned ? 'Pulizia accettata' : 'Pulizia non accettata'}
                        </span>
                      </div>
                    ) : (
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        inbound.cleaned ? 'text-green-600 bg-green-100' : 'text-red-600 bg-red-100'
                      }`}>
                        {inbound.cleaned ? 'Accettata' : 'Non Accettata'}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-foreground mb-4">Timestamps</h3>
                <div className="space-y-4">
                  <div>
                    <Label>Data/Ora Movimento</Label>
                    <p className="text-foreground font-medium">
                      {new Date(inbound.created_at).toLocaleString('it-IT', { 
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
                      {new Date(inbound.updated_at).toLocaleDateString('it-IT', { 
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
                <h3 className="text-lg font-semibold text-foreground mb-4">Notes</h3>
                {isEditing ? (
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Inserisci note aggiuntive"
                    rows={4}
                  />
                ) : (
                  <p className="text-foreground">{inbound.notes || 'Nessuna nota'}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
