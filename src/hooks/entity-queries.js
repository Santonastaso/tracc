import { makeEntityHooks } from './entity-hooks';

const materialsEntity = makeEntityHooks('materials', 'Materiale', {
  detailStaleTime: 10 * 60 * 1000,
});
const operatorsEntity = makeEntityHooks('operators', 'Operatore', {
  detailStaleTime: 10 * 60 * 1000,
});
const suppliersEntity = makeEntityHooks('suppliers', 'Fornitore');

// ===== MATERIALS =====

export const useMaterials = () =>
  materialsEntity.useList({
    orderBy: 'name',
    ascending: true,
    queryKey: ['materials'],
    staleTime: 10 * 60 * 1000,
  });

export const useMaterialsList = () =>
  materialsEntity.useList({
    orderBy: 'created_at',
    ascending: false,
    queryKey: ['materials', 'list'],
  });

export const useMaterial = (id) => materialsEntity.useDetail(id);
export const useCreateMaterial = (messages) => materialsEntity.useCreate(messages);
export const useUpdateMaterial = (messages) => materialsEntity.useUpdate(messages);
export const useDeleteMaterial = (messages) => materialsEntity.useDelete(messages);
export const useBulkDeleteMaterials = () => materialsEntity.useBulkDelete();

// ===== OPERATORS =====

export const useOperators = () =>
  operatorsEntity.useList({
    orderBy: 'name',
    ascending: true,
    queryKey: ['operators'],
    staleTime: 10 * 60 * 1000,
  });

export const useOperatorsList = () =>
  operatorsEntity.useList({
    orderBy: 'created_at',
    ascending: false,
    queryKey: ['operators', 'list'],
  });

export const useOperator = (id) => operatorsEntity.useDetail(id);
export const useCreateOperator = (messages) => operatorsEntity.useCreate(messages);
export const useUpdateOperator = (messages) => operatorsEntity.useUpdate(messages);
export const useDeleteOperator = (messages) => operatorsEntity.useDelete(messages);
export const useBulkDeleteOperators = () => operatorsEntity.useBulkDelete();

// ===== SUPPLIERS =====

export const useSuppliers = () =>
  suppliersEntity.useList({
    orderBy: 'created_at',
    ascending: false,
    queryKey: ['suppliers'],
    staleTime: 5 * 60 * 1000,
  });

export const useActiveSuppliers = () =>
  suppliersEntity.useList({
    orderBy: 'name',
    ascending: true,
    select: 'id, name',
    filters: { active: true },
    queryKey: ['suppliers', 'active'],
    staleTime: 5 * 60 * 1000,
  });

export const useSupplier = (id) => suppliersEntity.useDetail(id);
export const useCreateSupplier = (messages) => suppliersEntity.useCreate(messages);
export const useUpdateSupplier = (messages) => suppliersEntity.useUpdate(messages);
export const useDeleteSupplier = (messages) => suppliersEntity.useDelete(messages);
export const useBulkDeleteSuppliers = () => suppliersEntity.useBulkDelete();
