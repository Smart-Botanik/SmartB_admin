// Application constants

export const APP_ROUTES = {
  LOGIN: '/login',
  DASHBOARD: '/',
  USERS: '/users',
  USERS_CREATE: '/users/create',
  USERS_EDIT: '/users/edit/:id',
  USERS_SHOW: '/users/show/:id',
  PLANTS: '/plants',
  PLANTS_CREATE: '/plants/create',
  PLANTS_EDIT: '/plants/edit/:id',
  PLANTS_SHOW: '/plants/show/:id',
  DIARIES: '/diaries',
  DIARIES_CREATE: '/diaries/create',
  DIARIES_EDIT: '/diaries/edit/:id',
  DIARIES_SHOW: '/diaries/show/:id',
  BRANDS: '/brands',
  BRANDS_CREATE: '/brands/create',
  BRANDS_EDIT: '/brands/edit/:id',
  BRANDS_SHOW: '/brands/show/:id',
  PRODUCTS: '/products',
  PRODUCTS_CREATE: '/products/create',
  PRODUCTS_EDIT: '/products/edit/:id',
  PRODUCTS_SHOW: '/products/show/:id',
  MEDIA: '/media',
  MEDIA_CREATE: '/media/create',
  MEDIA_EDIT: '/media/edit/:id',
  MEDIA_SHOW: '/media/show/:id',
} as const

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh',
    ME: '/auth/me',
  },
  USERS: '/users',
  PLANTS: '/plants',
  DIARIES: '/diaries',
  BRANDS: '/brands',
  PRODUCTS: '/products',
  MEDIA: '/media',
} as const

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
} as const

export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 10,
  DEFAULT_PAGE: 1,
  PAGE_SIZE_OPTIONS: ['10', '20', '50', '100'],
} as const

export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
  USER_PREFERENCES: 'user_preferences',
  THEME: 'theme',
  SIDEBAR_COLLAPSED: 'sidebar_collapsed',
} as const

export const THEME = {
  LIGHT: 'light',
  DARK: 'dark',
} as const

export const BREAKPOINTS = {
  XS: '480px',
  SM: '576px',
  MD: '768px',
  LG: '992px',
  XL: '1200px',
  XXL: '1600px',
} as const
