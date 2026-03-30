# Utils Folder Structure

This directory contains utility functions organized by domain and functionality.

## Structure

```
utils/
├── auth/                    # Authentication-related utilities
│   ├── helpers.ts          # General auth helper functions
│   ├── error-handling.ts   # Error handling and user feedback
│   ├── validation.ts       # Form validation functions
│   ├── navigation.ts       # Auth navigation utilities
│   └── index.ts           # Barrel exports
├── user/                   # User-related utilities
│   ├── display.ts         # User display and formatting
│   ├── formatting.ts      # Date and time formatting
│   └── index.ts          # Barrel exports
├── token/                  # Token management utilities
│   ├── parse.ts          # Token parsing functions
│   ├── validate.ts       # Token validation functions
│   ├── storage.ts        # Token storage functions
│   └── index.ts          # Barrel exports
└── README.md             # This file
```

## Usage Examples

### Auth Functions
```typescript
import { 
  handleAuthError, 
  isValidEmail, 
  validateLoginForm,
  redirectToLogin 
} from '@/utils/auth'

// Handle authentication errors
const errorMessage = handleAuthError(error)

// Validate email
const isValid = isValidEmail(user.email)

// Validate login form
const result = validateLoginForm({ email, password })

// Redirect to login
redirectToLogin('/dashboard')
```

### User Functions
```typescript
import { 
  getUserDisplayName, 
  getUserInitials, 
  isAdmin,
  formatLastLogin 
} from '@/utils/user'

// Get user display name
const name = getUserDisplayName(user)

// Get user initials
const initials = getUserInitials(user)

// Check if user is admin
const admin = isAdmin(user)

// Format last login time
const lastLogin = formatLastLogin(user.lastLoginAt)
```

### Token Functions
```typescript
import { 
  parseToken, 
  isTokenExpired, 
  storeTokens,
  getStoredTokens 
} from '@/utils/token'

// Parse JWT token
const payload = parseToken(token)

// Check if token is expired
const expired = isTokenExpired(token)

// Store tokens
storeTokens({ accessToken, refreshToken, expiresAt })

// Get stored tokens
const tokens = getStoredTokens()
```

## Design Principles

1. **Plain Functions**: No static classes - use plain functions with clear names
2. **Single Responsibility**: Each file has a single, clear purpose
3. **Barrel Exports**: Use index.ts files for clean imports
4. **Type Safety**: Full TypeScript support with proper types
5. **Tree Shaking**: Functions can be individually imported and optimized

## Migration from Static Classes

Static classes have been refactored to plain functions:

### Before
```typescript
export class AuthUtils {
  static getUserDisplayName(user) { /* ... */ }
  static isAdmin(user) { /* ... */ }
}

// Usage
AuthUtils.getUserDisplayName(user)
```

### After
```typescript
// utils/user/display.ts
export const getUserDisplayName = (user) => { /* ... */ }
export const isAdmin = (user) => { /* ... */ }

// Usage
import { getUserDisplayName, isAdmin } from '@/utils/user'
getUserDisplayName(user)
```

This approach provides better tree shaking, easier testing, and cleaner imports.
