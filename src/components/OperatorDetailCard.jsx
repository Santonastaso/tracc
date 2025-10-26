import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../services/supabase/client';
import { useDeleteOperator } from '../hooks';
import { Button } from '@santonastaso/crm-ui';
import { Card } from '@santonastaso/crm-ui';
import { Input } from '@santonastaso/crm-ui';
import { Label } from '@santonastaso/crm-ui';

import { Badge } from '@santonastaso/crm-ui';
import { ArrowLeft, Edit, Save, X, Trash2, User } from 'lucide-react';
import { confirmAction } from '../utils';

export function OperatorDetailCard({ operator, onClose, onEdit }) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: operator.name || '',
    code: operator.code || '',
    role: operator.role || '',
    status: operator.status || 'active',
    phone: operator.phone || '',
    email: operator.email || '',
    notes: operator.notes || '',
    active: operator.active !== undefined ? operator.active : true
  });

  const deleteMutation = useDeleteOperator();
  const queryClient = useQueryClient();

  const updateMutation = useMutation({
    mutationFn: async (data) => {
      const { error } = await supabase
        .from('operators')
        .update(data)
        .eq('id', operator.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['operators']);
      setIsEditing(false);
    }
  });

  const handleSave = () => {
    updateMutation.mutate(formData);
  };

  const handleCancel = () => {
    setFormData({
      name: operator.name || '',
      code: operator.code || '',
      role: operator.role || '',
      status: operator.status || 'active',
      phone: operator.phone || '',
      email: operator.email || '',
      notes: operator.notes || '',
      active: operator.active !== undefined ? operator.active : true
    });
    setIsEditing(false);
  };

  const handleDelete = () => {
    if (confirmAction('Sei sicuro di voler eliminare questo operatore?')) {
      deleteMutation.mutate(operator.id, {
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
                <User className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">
                  {isEditing ? 'Edit Operator' : 'Operator Details'}
                </h1>
                <p className="text-muted-foreground">
                  {isEditing ? 'Modify operator information' : operator.name}
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
                    <Label htmlFor="name">Nome</Label>
                    {isEditing ? (
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Inserisci nome operatore"
                      />
                    ) : (
                      <p className="text-foreground font-medium">{operator.name}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="code">Codice</Label>
                    {isEditing ? (
                      <Input
                        id="code"
                        value={formData.code}
                        onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value }))}
                        placeholder="Inserisci codice operatore"
                      />
                    ) : (
                      <p className="text-foreground font-medium">{operator.code}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="role">Ruolo</Label>
                    {isEditing ? (
                      <Input
                        id="role"
                        value={formData.role}
                        onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
                        placeholder="Inserisci ruolo"
                      />
                    ) : (
                      <p className="text-foreground font-medium">{operator.role}</p>
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
                      <Badge variant={getStatusVariant(operator.status)}>
                        {operator.status || 'N/A'}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-foreground mb-4">Contact Information</h3>
                <div className="space-y-4">
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
                      <p className="text-foreground font-medium">{operator.phone || 'N/A'}</p>
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
                      <p className="text-foreground font-medium">{operator.email || 'N/A'}</p>
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
                  <p className="text-foreground">{operator.notes || 'Nessuna nota'}</p>
                )}
              </div>
            </div>

            {/* Right Column - Metadata */}
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-4">Status & Settings</h3>
                <div className="space-y-4">
                  <div>
                    <Label>ID Operatore</Label>
                    <p className="text-foreground font-medium">#{operator.id}</p>
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
                          {formData.active ? 'Operatore attivo' : 'Operatore inattivo'}
                        </span>
                      </div>
                    ) : (
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        operator.active ? 'text-green-600 bg-green-100' : 'text-red-600 bg-red-100'
                      }`}>
                        {operator.active ? 'Sì' : 'No'}
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
                      {new Date(operator.created_at).toLocaleDateString('it-IT', { 
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
                      {new Date(operator.updated_at).toLocaleDateString('it-IT', { 
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
