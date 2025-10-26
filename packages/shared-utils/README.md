# @andrea/shared-utils

Shared utilities for React apps with Supabase. Eliminates code duplication across tracc, scheduler_demo, and other projects.

## Features

- **Toast notifications** - Unified toast system with validation error handling
- **Supabase client** - Configurable Supabase client factory with error handling  
- **Authentication** - React context provider for Supabase auth
- **Base services** - Generic CRUD operations for database entities

## Install

```bash
pnpm add @andrea/shared-utils
```

## Usage

### Toast Notifications

```typescript
import { showSuccess, showError, showValidationError } from '@andrea/shared-utils/utils';

showSuccess('Operation completed!');
showError('Something went wrong');
showValidationError(['Field is required', 'Invalid email']);
```

### Supabase Client

```typescript
import { createSupabaseFromEnv, createSupabaseClient } from '@andrea/shared-utils/services';

// From environment variables
const supabase = createSupabaseFromEnv();

// Direct configuration  
const supabase = createSupabaseClient({
  url: 'your-url',
  anonKey: 'your-key'
});
```

### Authentication

```typescript
import { AuthProvider, useAuth } from '@andrea/shared-utils/auth';

// Wrap your app
<AuthProvider supabaseClient={supabase}>
  <App />
</AuthProvider>

// Use in components
const { user, signIn, signOut } = useAuth();
```

### Base Service

```typescript
import { BaseService } from '@andrea/shared-utils/services';

class UsersService extends BaseService {
  constructor(supabaseClient) {
    super(supabaseClient, 'users');
  }
  
  // Inherits: getAll, getById, create, update, delete, count
}
```

## Exports

- `@andrea/shared-utils` - All utilities
- `@andrea/shared-utils/auth` - Authentication only
- `@andrea/shared-utils/services` - Supabase services only  
- `@andrea/shared-utils/utils` - Toast and other utilities only
