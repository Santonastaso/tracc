import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../services/supabase/client';
import { useDeleteSupplier } from '../hooks';
import { Button } from '@santonastaso/crm-ui';
import { Card } from '@santonastaso/crm-ui';
import { Input } from '@santonastaso/crm-ui';
import { Label } from '@santonastaso/crm-ui';

import { Badge } from '@santonastaso/crm-ui';
import { ArrowLeft, Edit, Save, X, Trash2, Building2 } from 'lucide-react';
import { confirmAction } from '../utils';

export function SupplierDetailCard({ supplier, onClose, onEdit }) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: supplier.name || '',
    code: supplier.code || '',
    contact_person: supplier.contact_person || '',
    status: supplier.status || 'active',
    address: supplier.address || '',
    phone: supplier.phone || '',
    email: supplier.email || '',
    notes: supplier.notes || '',
    active: supplier.active !== undefined ? supplier.active : true
  });

  const deleteMutation = useDeleteSupplier();
  const queryClient = useQueryClient();

  const updateMutation = useMutation({
    mutationFn: async (data) => {
      const { error } = await supabase
        .from('suppliers')
        .update(data)
        .eq('id', supplier.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['suppliers']);
      setIsEditing(false);
    }
  });

  const handleSave = () => {
    updateMutation.mutate(formData);
  };

  const handleCancel = () => {
    setFormData({
      name: supplier.name || '',
      code: supplier.code || '',
      contact_person: supplier.contact_person || '',
      status: supplier.status || 'active',
      address: supplier.address || '',
      phone: supplier.phone || '',
      email: supplier.email || '',
      notes: supplier.notes || '',
      active: supplier.active !== undefined ? supplier.active : true
    });
    setIsEditing(false);
  };

  const handleDelete = () => {
    if (confirmAction('Sei sicuro di voler eliminare questo fornitore?')) {
      deleteMutation.mutate(supplier.id, {
        onSuccess: () => {
          onClose();
        }
      });
    }
  };

  const getStatusVariant = (status) => {
    switch (status) {
      case 'active': return 'default';
      case 'inactive': return 'destructive';
      case 'suspended': return 'secondary';
      default: return 'outline';
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
                <Building2 className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">
                  {isEditing ? 'Edit Supplier' : 'Supplier Details'}
                </h1>
                <p className="text-muted-foreground">
                  {isEditing ? 'Modify supplier information' : supplier.name}
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
                <h3 className="text-lg font-semibold text-foreground mb-4">Company Information</h3>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name">Nome Fornitore</Label>
                    {isEditing ? (
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Inserisci nome fornitore"
                      />
                    ) : (
                      <p className="text-foreground font-medium">{supplier.name}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="code">Codice</Label>
                    {isEditing ? (
                      <Input
                        id="code"
                        value={formData.code}
                        onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value }))}
                        placeholder="Inserisci codice fornitore"
                      />
                    ) : (
                      <p className="text-foreground font-medium">{supplier.code}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="contact_person">Persona di Contatto</Label>
                    {isEditing ? (
                      <Input
                        id="contact_person"
                        value={formData.contact_person}
                        onChange={(e) => setFormData(prev => ({ ...prev, contact_person: e.target.value }))}
                        placeholder="Inserisci persona di contatto"
                      />
                    ) : (
                      <p className="text-foreground font-medium">{supplier.contact_person || 'N/A'}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="status">Stato</Label>
                    {isEditing ? (
                      <select
                        id="status"
                        value={formData.status}
                        onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                        className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground"
                      >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                        <option value="suspended">Suspended</option>
                      </select>
                    ) : (
                      <Badge variant={getStatusVariant(supplier.status)}>
                        {supplier.status || 'N/A'}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-foreground mb-4">Contact Information</h3>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="address">Indirizzo</Label>
                    {isEditing ? (
                      <textarea
                        id="address"
                        value={formData.address}
                        onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                        placeholder="Inserisci indirizzo completo"
                        rows={3}
                      />
                    ) : (
                      <p className="text-foreground">{supplier.address || 'N/A'}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="phone">Telefono</Label>
                    {isEditing ? (
                      <Input
                        id="phone"
                        value={formData.phone}
                        onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                        placeholder="Inserisci numero di telefono"
                      />
                    ) : (
                      <p className="text-foreground font-medium">{supplier.phone || 'N/A'}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="email">Email</Label>
                    {isEditing ? (
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                        placeholder="Inserisci indirizzo email"
                      />
                    ) : (
                      <p className="text-foreground font-medium">{supplier.email || 'N/A'}</p>
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
                  <p className="text-foreground">{supplier.notes || 'Nessuna nota'}</p>
                )}
              </div>
            </div>

            {/* Right Column - Metadata */}
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-4">Status & Settings</h3>
                <div className="space-y-4">
                  <div>
                    <Label>ID Fornitore</Label>
                    <p className="text-foreground font-medium">#{supplier.id}</p>
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
                          {formData.active ? 'Fornitore attivo' : 'Fornitore inattivo'}
                        </span>
                      </div>
                    ) : (
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        supplier.active ? 'text-green-600 bg-green-100' : 'text-red-600 bg-red-100'
                      }`}>
                        {supplier.active ? 'Sì' : 'No'}
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
                      {new Date(supplier.created_at).toLocaleDateString('it-IT', { 
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
                      {new Date(supplier.updated_at).toLocaleDateString('it-IT', { 
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
                <h3 className="text-lg font-semibold text-foreground mb-4">Business Information</h3>
                <div className="space-y-2">
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="text-sm text-muted-foreground">
                      Questo fornitore può essere utilizzato nei movimenti di merce in entrata.
                    </p>
                  </div>
                  {supplier.contact_person && (
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <p className="text-sm text-blue-800">
                        Contatto principale: {supplier.contact_person}
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
