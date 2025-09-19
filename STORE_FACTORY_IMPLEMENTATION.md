# Store Factory Pattern Implementation

## Overview
Successfully implemented the store factory pattern for DRY state management in the tracc project, bringing it up to the same level as the ship project. This implementation provides enterprise-level state management with consistent patterns and reusable abstractions.

## What Was Implemented

### 1. Store Factory (`/src/store/storeFactory.js`)
- **Generic Entity Store Creator**: `createEntityStore()` for any entity type
- **Specialized Store Creators**: `createSiloStore()`, `createMovementStore()`
- **Common Selectors**: Standardized selectors for all entities
- **Utility Actions**: CRUD operations, sorting, filtering, deduplication
- **Custom Actions Support**: Extensible pattern for entity-specific logic

### 2. Entity Stores Created
- **`useSilosStore`**: Manages silos with level calculations
- **`useInboundStore`**: Manages inbound movements with FIFO logic
- **`useOutboundStore`**: Manages outbound movements with FIFO logic
- **`useMaterialsStore`**: Manages materials reference data
- **`useOperatorsStore`**: Manages operators reference data

### 3. Enhanced UI Store (`/src/store/useUIStore.js`)
- **Comprehensive State Management**: Loading, forms, filters, notifications, modals
- **Granular Loading States**: Per-entity loading management
- **Form State Management**: Centralized form state for all forms
- **Filter Management**: Date ranges, silo filters, report types
- **Modal Management**: Confirm dialogs, delete dialogs
- **Notification System**: Success, error, warning, info messages

### 4. Utility Hooks
- **`useErrorHandler`**: Consistent error handling across the app
- **`useValidation`**: Form validation with common rules
- **`useStoreSync`**: Synchronizes React Query data with Zustand stores

## Store Factory Pattern Benefits

### 1. **DRY Principles**
```javascript
// Before: Duplicate code in each store
const useSilosStore = create((set, get) => ({
  silos: [],
  getSilos: () => get().silos,
  getSiloById: (id) => get().silos.find(silo => silo.id === id),
  setSilos: (silos) => set({ silos }),
  // ... repeated patterns
}));

// After: Factory pattern eliminates duplication
export const useSilosStore = createSilosStore();
```

### 2. **Consistent API**
All stores now have the same interface:
- `get[Entity]()` - Get all entities
- `get[Entity]ById(id)` - Get entity by ID
- `get[Entity]BySilo(siloId)` - Get entities by silo
- `get[Entity]ByDate(date)` - Get entities by date
- `set[Entity](entities)` - Set entities
- `add[Entity](entity)` - Add entity
- `update[Entity](id, updates)` - Update entity
- `remove[Entity](id)` - Remove entity

### 3. **Specialized Functionality**
```javascript
// Silos store with level calculations
const { 
  calculateTotalCapacity, 
  calculateTotalCurrentStock,
  getSilosByUtilization 
} = useSilosStore();

// Movement stores with quantity calculations
const { 
  getTotalInboundQuantity,
  getTotalInboundQuantityBySilo 
} = useInboundStore();
```

## Usage Examples

### Basic Store Usage
```javascript
import { useSilosStore, useUIStore } from '../store';

function MyComponent() {
  const { getSilos, getSiloById, addSilo } = useSilosStore();
  const { openForm, closeForm, setLoadingState } = useUIStore();
  
  const silos = getSilos();
  const silo = getSiloById(1);
  
  const handleAddSilo = (siloData) => {
    addSilo(siloData);
    closeForm('siloForm');
  };
}
```

### Advanced Store Usage with Validation
```javascript
import { useValidation, useErrorHandler } from '../hooks';
import { useSilosStore } from '../store';

function SiloForm() {
  const { addSilo } = useSilosStore();
  const { values, errors, setValue, validateForm, commonRules } = useValidation();
  const { handleError } = useErrorHandler();
  
  const handleSubmit = () => {
    const rules = {
      name: commonRules.text('Silo Name', 1, 50),
      capacity: commonRules.number('Capacity', 1, 10000),
    };
    
    if (validateForm(rules)) {
      try {
        addSilo(values);
      } catch (error) {
        handleError(error, 'silo creation');
      }
    }
  };
}
```

### Store Synchronization
```javascript
import { useStoreSync } from '../hooks';

function App() {
  // Automatically syncs React Query data with Zustand stores
  useStoreSync();
  
  return <div>App content</div>;
}
```

## Comparison with Ship Project

| Feature | Tracc (Before) | Tracc (After) | Ship Project |
|---------|----------------|---------------|--------------|
| Store Pattern | Basic single store | Factory pattern ✅ | Factory pattern ✅ |
| State Management | Minimal | Comprehensive ✅ | Comprehensive ✅ |
| DRY Principles | Poor | Excellent ✅ | Excellent ✅ |
| Error Handling | Basic | Advanced ✅ | Advanced ✅ |
| Validation | None | Comprehensive ✅ | Comprehensive ✅ |
| Store Sync | None | React Query sync ✅ | React Query sync ✅ |

## Advanced Features

### 1. **Smart Selectors**
```javascript
// Get silos by capacity
const largeSilos = getSilosByCapacity(1000);

// Get movements by date range
const recentMovements = getInboundByDateRange('2024-01-01', '2024-01-31');

// Get silos by utilization
const fullSilos = getSilosByUtilization(80);
```

### 2. **Utility Actions**
```javascript
// Sort entities by date
sortInboundByDate(true); // ascending

// Remove duplicates
cleanupDuplicateSilos();

// Calculate totals
const totalCapacity = calculateTotalCapacity();
const totalStock = calculateTotalCurrentStock();
```

### 3. **UI State Management**
```javascript
// Form management
openForm('siloForm', editingSilo);
closeForm('siloForm');

// Filter management
setFilter('dateRange', { startDate: '2024-01-01', endDate: '2024-01-31' });
setFilter('siloFilter', 'all');

// Modal management
showConfirmDialog('Delete Silo', 'Are you sure?', handleDelete);
showDeleteDialog(silo, handleDelete);
```

## Files Created/Modified

### New Files
- `/src/store/storeFactory.js` - Core factory pattern
- `/src/store/useSilosStore.js` - Silos store
- `/src/store/useInboundStore.js` - Inbound store
- `/src/store/useOutboundStore.js` - Outbound store
- `/src/store/useMaterialsStore.js` - Materials store
- `/src/store/useOperatorsStore.js` - Operators store
- `/src/hooks/useErrorHandler.js` - Error handling hook
- `/src/hooks/useValidation.js` - Validation hook
- `/src/hooks/useStoreSync.js` - Store synchronization hook
- `/src/components/examples/StoreUsageExample.jsx` - Usage example

### Modified Files
- `/src/store/useUIStore.js` - Enhanced with comprehensive state management
- `/src/store/index.js` - Updated exports
- `/src/hooks/index.js` - Added utility hooks
- `/src/App.jsx` - Added store synchronization

## Benefits Achieved

1. **Code Reusability**: Factory pattern eliminates duplicate code
2. **Consistency**: All stores follow the same patterns
3. **Maintainability**: Changes to common patterns affect all stores
4. **Extensibility**: Easy to add new entity stores
5. **Type Safety**: Consistent interfaces across all stores
6. **Performance**: Optimized selectors and actions
7. **Developer Experience**: Clear, predictable APIs

## Next Steps
The tracc project now has enterprise-level state management that matches the ship project. Consider implementing:
1. **Service Abstraction Layer** (like ship project)
2. **Advanced Error Handling** with custom error types
3. **Performance Optimizations** with memoization
4. **TypeScript Migration** for better type safety

The store factory pattern implementation brings the tracc project to the same level of sophistication as the ship project! 🚀
