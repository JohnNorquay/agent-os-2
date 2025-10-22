# Mobile-First PWA Patterns Skill

## Purpose
Comprehensive patterns for building a mobile-first Progressive Web App with offline support, installation, and native-like experience.

## Table of Contents
1. [PWA Setup & Configuration](#pwa-setup--configuration)
2. [Mobile-First Responsive Design](#mobile-first-responsive-design)
3. [Touch Interactions & Gestures](#touch-interactions--gestures)
4. [Offline Functionality](#offline-functionality)
5. [Service Worker Patterns](#service-worker-patterns)
6. [Push Notifications](#push-notifications)
7. [App Installation](#app-installation)
8. [Performance Optimization](#performance-optimization)
9. [Mobile UX Patterns](#mobile-ux-patterns)
10. [Testing on Mobile](#testing-on-mobile)

---

## PWA Setup & Configuration

### Install Dependencies

```bash
npm install workbox-webpack-plugin workbox-window
npm install -D vite-plugin-pwa
```

### Vite PWA Plugin Setup

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg'],
      manifest: {
        name: 'IntegrationDirector',
        short_name: 'IntegrationDir',
        description: 'Fleet and driver management platform',
        theme_color: '#3b82f6',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/api\.integrationdirector\.com\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60, // 1 hour
              },
              networkTimeoutSeconds: 10,
            },
          },
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'supabase-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 30, // 30 minutes
              },
            },
          },
          {
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'images-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
              },
            },
          },
        ],
      },
      devOptions: {
        enabled: true,
        type: 'module',
      },
    }),
  ],
});
```

### Manifest.json

```json
{
  "name": "IntegrationDirector",
  "short_name": "IntegrationDir",
  "description": "Fleet and driver management platform",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#3b82f6",
  "orientation": "portrait-primary",
  "icons": [
    {
      "src": "/pwa-192x192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/pwa-512x512.png",
      "sizes": "512x512",
      "type": "image/png"
    },
    {
      "src": "/pwa-512x512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ],
  "screenshots": [
    {
      "src": "/screenshot-mobile.png",
      "sizes": "540x720",
      "type": "image/png",
      "form_factor": "narrow"
    },
    {
      "src": "/screenshot-desktop.png",
      "sizes": "1920x1080",
      "type": "image/png",
      "form_factor": "wide"
    }
  ],
  "categories": ["business", "productivity"],
  "shortcuts": [
    {
      "name": "Dashboard",
      "short_name": "Dashboard",
      "description": "View dashboard",
      "url": "/dashboard",
      "icons": [
        {
          "src": "/icons/dashboard.png",
          "sizes": "96x96"
        }
      ]
    },
    {
      "name": "Vessels",
      "short_name": "Vessels",
      "description": "View vessels",
      "url": "/vessels",
      "icons": [
        {
          "src": "/icons/vessel.png",
          "sizes": "96x96"
        }
      ]
    }
  ]
}
```

---

## Mobile-First Responsive Design

### Tailwind Mobile-First Breakpoints

```typescript
// tailwind.config.js
export default {
  theme: {
    screens: {
      'xs': '375px',   // Small phones
      'sm': '640px',   // Large phones
      'md': '768px',   // Tablets
      'lg': '1024px',  // Small laptops
      'xl': '1280px',  // Desktops
      '2xl': '1536px', // Large screens
    },
  },
};
```

### Responsive Layout Component

```typescript
// src/components/ResponsiveLayout.tsx
import { useState, useEffect } from 'react';

export function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  return isMobile;
}

export function ResponsiveLayout({ children }: { children: React.ReactNode }) {
  const isMobile = useIsMobile();
  
  return (
    <div className={`
      min-h-screen
      ${isMobile ? 'pb-16' : 'pb-0'}
    `}>
      {children}
      {isMobile && <MobileBottomNav />}
    </div>
  );
}
```

### Mobile-First Card Component

```typescript
// src/components/VesselCard.tsx
interface VesselCardProps {
  vessel: Vessel;
  onClick?: () => void;
}

export function VesselCard({ vessel, onClick }: VesselCardProps) {
  return (
    <div
      onClick={onClick}
      className="
        /* Mobile-first (default) */
        p-4 
        bg-white 
        rounded-lg 
        shadow-sm
        border border-gray-200
        active:bg-gray-50
        
        /* Tablet and up */
        md:p-6
        md:hover:shadow-md
        md:transition-shadow
        
        /* Desktop */
        lg:p-8
      "
    >
      <div className="
        flex flex-col space-y-2
        md:flex-row md:items-center md:justify-between md:space-y-0
      ">
        <div className="flex-1">
          <h3 className="text-lg font-semibold md:text-xl">
            {vessel.name}
          </h3>
          <p className="text-sm text-gray-600">
            IMO: {vessel.imo}
          </p>
        </div>
        
        <div className="
          flex items-center justify-between
          md:flex-col md:items-end
        ">
          <StatusBadge status={vessel.status} />
          <span className="text-sm text-gray-500 md:mt-2">
            {vessel.position.speed} kn
          </span>
        </div>
      </div>
    </div>
  );
}
```

### Responsive Grid

```typescript
// src/components/VesselsGrid.tsx
export function VesselsGrid({ vessels }: { vessels: Vessel[] }) {
  return (
    <div className="
      grid gap-4
      
      /* Mobile: 1 column */
      grid-cols-1
      
      /* Tablet: 2 columns */
      md:grid-cols-2
      md:gap-6
      
      /* Desktop: 3 columns */
      lg:grid-cols-3
      lg:gap-8
      
      /* Large desktop: 4 columns */
      2xl:grid-cols-4
    ">
      {vessels.map(vessel => (
        <VesselCard key={vessel.id} vessel={vessel} />
      ))}
    </div>
  );
}
```

---

## Touch Interactions & Gestures

### Touch-Optimized Button

```typescript
// src/components/TouchButton.tsx
interface TouchButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary';
}

export function TouchButton({ 
  children, 
  onClick, 
  variant = 'primary' 
}: TouchButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`
        /* Touch target: minimum 44x44px (Apple HIG) */
        min-h-[44px]
        min-w-[44px]
        px-6
        py-3
        
        /* Typography */
        text-base
        font-medium
        
        /* Touch feedback */
        active:scale-95
        transition-transform
        
        /* Prevent double-tap zoom */
        touch-manipulation
        
        /* Variant styles */
        ${variant === 'primary' 
          ? 'bg-blue-600 text-white active:bg-blue-700' 
          : 'bg-gray-100 text-gray-900 active:bg-gray-200'
        }
        
        rounded-lg
      `}
    >
      {children}
    </button>
  );
}
```

### Swipeable List Item

```typescript
// src/components/SwipeableListItem.tsx
import { useState } from 'react';

interface SwipeableListItemProps {
  children: React.ReactNode;
  onDelete?: () => void;
  onArchive?: () => void;
}

export function SwipeableListItem({ 
  children, 
  onDelete, 
  onArchive 
}: SwipeableListItemProps) {
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);
  const [swipeAction, setSwipeAction] = useState<'delete' | 'archive' | null>(null);
  
  const minSwipeDistance = 50;
  
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(0);
    setTouchStart(e.targetTouches[0].clientX);
  };
  
  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };
  
  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    
    if (isLeftSwipe && onDelete) {
      setSwipeAction('delete');
    } else if (isRightSwipe && onArchive) {
      setSwipeAction('archive');
    }
  };
  
  return (
    <div className="relative overflow-hidden">
      {/* Background actions */}
      <div className="absolute inset-0 flex">
        {onArchive && (
          <div className="flex items-center justify-start flex-1 bg-green-500 px-4">
            <span className="text-white font-medium">Archive</span>
          </div>
        )}
        {onDelete && (
          <div className="flex items-center justify-end flex-1 bg-red-500 px-4">
            <span className="text-white font-medium">Delete</span>
          </div>
        )}
      </div>
      
      {/* Main content */}
      <div
        className={`
          relative bg-white
          transition-transform duration-200
          ${swipeAction === 'delete' ? '-translate-x-20' : ''}
          ${swipeAction === 'archive' ? 'translate-x-20' : ''}
        `}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {children}
      </div>
    </div>
  );
}
```

### Pull-to-Refresh

```typescript
// src/hooks/usePullToRefresh.ts
import { useState, useRef, useEffect } from 'react';

interface PullToRefreshOptions {
  onRefresh: () => Promise<void>;
  threshold?: number;
}

export function usePullToRefresh({ 
  onRefresh, 
  threshold = 80 
}: PullToRefreshOptions) {
  const [isPulling, setIsPulling] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const startY = useRef(0);
  
  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      if (window.scrollY === 0) {
        startY.current = e.touches[0].clientY;
        setIsPulling(true);
      }
    };
    
    const handleTouchMove = (e: TouchEvent) => {
      if (!isPulling) return;
      
      const currentY = e.touches[0].clientY;
      const distance = Math.max(0, currentY - startY.current);
      
      if (distance > 0) {
        e.preventDefault();
        setPullDistance(Math.min(distance, threshold * 2));
      }
    };
    
    const handleTouchEnd = async () => {
      if (pullDistance >= threshold && !isRefreshing) {
        setIsRefreshing(true);
        await onRefresh();
        setIsRefreshing(false);
      }
      
      setIsPulling(false);
      setPullDistance(0);
    };
    
    window.addEventListener('touchstart', handleTouchStart);
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleTouchEnd);
    
    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isPulling, pullDistance, threshold, isRefreshing, onRefresh]);
  
  return { isPulling, pullDistance, isRefreshing };
}

// Usage in component
function VesselsList() {
  const queryClient = useQueryClient();
  
  const { isPulling, pullDistance, isRefreshing } = usePullToRefresh({
    onRefresh: async () => {
      await queryClient.invalidateQueries({ queryKey: ['vessels'] });
    },
  });
  
  return (
    <div className="relative">
      {/* Pull indicator */}
      {(isPulling || isRefreshing) && (
        <div 
          className="absolute top-0 left-0 right-0 flex justify-center items-center"
          style={{ height: `${pullDistance}px` }}
        >
          {isRefreshing ? (
            <Spinner />
          ) : (
            <ArrowDownIcon 
              className={`transition-transform ${
                pullDistance >= 80 ? 'rotate-180' : ''
              }`}
            />
          )}
        </div>
      )}
      
      {/* List content */}
      <VesselsListContent />
    </div>
  );
}
```

---

## Offline Functionality

### Online/Offline Detection

```typescript
// src/hooks/useOnlineStatus.ts
import { useState, useEffect } from 'react';

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  
  return isOnline;
}

// Offline Banner Component
export function OfflineBanner() {
  const isOnline = useOnlineStatus();
  
  if (isOnline) return null;
  
  return (
    <div className="
      fixed top-0 left-0 right-0 z-50
      bg-yellow-500 text-white
      py-2 px-4
      text-center text-sm font-medium
    ">
      📡 You're offline. Some features may be limited.
    </div>
  );
}
```

### IndexedDB Cache

```typescript
// src/lib/offlineCache.ts
import { openDB, DBSchema, IDBPDatabase } from 'idb';

interface OfflineCacheDB extends DBSchema {
  vessels: {
    key: string;
    value: {
      id: string;
      data: any;
      timestamp: number;
    };
  };
  drivers: {
    key: string;
    value: {
      id: string;
      data: any;
      timestamp: number;
    };
  };
}

class OfflineCache {
  private db: IDBPDatabase<OfflineCacheDB> | null = null;
  
  async init() {
    this.db = await openDB<OfflineCacheDB>('IntegrationDirector', 1, {
      upgrade(db) {
        db.createObjectStore('vessels', { keyPath: 'id' });
        db.createObjectStore('drivers', { keyPath: 'id' });
      },
    });
  }
  
  async set(store: 'vessels' | 'drivers', id: string, data: any) {
    if (!this.db) await this.init();
    
    await this.db!.put(store, {
      id,
      data,
      timestamp: Date.now(),
    });
  }
  
  async get(store: 'vessels' | 'drivers', id: string) {
    if (!this.db) await this.init();
    
    const cached = await this.db!.get(store, id);
    
    if (!cached) return null;
    
    // Check if cache is stale (older than 1 hour)
    const isStale = Date.now() - cached.timestamp > 60 * 60 * 1000;
    
    return isStale ? null : cached.data;
  }
  
  async getAll(store: 'vessels' | 'drivers') {
    if (!this.db) await this.init();
    
    const items = await this.db!.getAll(store);
    return items.map(item => item.data);
  }
  
  async clear(store: 'vessels' | 'drivers') {
    if (!this.db) await this.init();
    
    await this.db!.clear(store);
  }
}

export const offlineCache = new OfflineCache();
```

### Offline-First Query

```typescript
// src/hooks/queries/useVesselsOffline.ts
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/apiClient';
import { offlineCache } from '@/lib/offlineCache';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';

export function useVesselsOffline() {
  const isOnline = useOnlineStatus();
  
  return useQuery({
    queryKey: ['vessels'],
    queryFn: async () => {
      if (isOnline) {
        // Online: fetch from API
        const data = await apiRequest<VesselsResponse>('/api/vessels');
        
        // Cache for offline use
        for (const vessel of data.vessels) {
          await offlineCache.set('vessels', vessel.id, vessel);
        }
        
        return data.vessels;
      } else {
        // Offline: return cached data
        const cached = await offlineCache.getAll('vessels');
        
        if (cached.length === 0) {
          throw new Error('No offline data available');
        }
        
        return cached;
      }
    },
  });
}
```

### Background Sync

```typescript
// src/lib/backgroundSync.ts
export async function registerBackgroundSync() {
  if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
    const registration = await navigator.serviceWorker.ready;
    
    try {
      await registration.sync.register('sync-data');
      console.log('Background sync registered');
    } catch (error) {
      console.error('Background sync registration failed:', error);
    }
  }
}

// In service worker
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-data') {
    event.waitUntil(syncPendingData());
  }
});

async function syncPendingData() {
  // Get pending mutations from IndexedDB
  // Send to server
  // Clear pending queue on success
}
```

---

## Service Worker Patterns

### Register Service Worker

```typescript
// src/main.tsx
import { registerSW } from 'virtual:pwa-register';

// Register service worker with auto-update
const updateSW = registerSW({
  onNeedRefresh() {
    if (confirm('New version available! Reload?')) {
      updateSW(true);
    }
  },
  onOfflineReady() {
    console.log('App ready to work offline');
  },
});

// Or register manually
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('SW registered:', registration);
    } catch (error) {
      console.error('SW registration failed:', error);
    }
  });
}
```

### Custom Service Worker

```typescript
// public/sw.js
import { precacheAndRoute } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { NetworkFirst, CacheFirst, StaleWhileRevalidate } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';
import { CacheableResponsePlugin } from 'workbox-cacheable-response';

// Precache app shell
precacheAndRoute(self.__WB_MANIFEST);

// API requests - Network First
registerRoute(
  ({ url }) => url.pathname.startsWith('/api/'),
  new NetworkFirst({
    cacheName: 'api-cache',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 100,
        maxAgeSeconds: 60 * 60, // 1 hour
      }),
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
    ],
    networkTimeoutSeconds: 10,
  })
);

// Images - Cache First
registerRoute(
  ({ request }) => request.destination === 'image',
  new CacheFirst({
    cacheName: 'images-cache',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 100,
        maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
      }),
    ],
  })
);

// Google Fonts - Stale While Revalidate
registerRoute(
  ({ url }) => url.origin === 'https://fonts.googleapis.com' ||
               url.origin === 'https://fonts.gstatic.com',
  new StaleWhileRevalidate({
    cacheName: 'google-fonts',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 20,
        maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
      }),
    ],
  })
);

// Background sync
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-data') {
    event.waitUntil(syncData());
  }
});

async function syncData() {
  // Implement sync logic
}
```

---

## Push Notifications

### Request Permission

```typescript
// src/hooks/useNotifications.ts
import { useState, useEffect } from 'react';

export function useNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  
  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);
  
  const requestPermission = async () => {
    if (!('Notification' in window)) {
      console.warn('Notifications not supported');
      return false;
    }
    
    const result = await Notification.requestPermission();
    setPermission(result);
    return result === 'granted';
  };
  
  const sendNotification = (title: string, options?: NotificationOptions) => {
    if (permission !== 'granted') return;
    
    new Notification(title, {
      icon: '/pwa-192x192.png',
      badge: '/badge-72x72.png',
      ...options,
    });
  };
  
  return {
    permission,
    requestPermission,
    sendNotification,
    isSupported: 'Notification' in window,
  };
}

// Usage
function NotificationSettings() {
  const { permission, requestPermission, isSupported } = useNotifications();
  
  if (!isSupported) {
    return <div>Notifications not supported</div>;
  }
  
  return (
    <div>
      <p>Notification status: {permission}</p>
      {permission === 'default' && (
        <button onClick={requestPermission}>
          Enable Notifications
        </button>
      )}
    </div>
  );
}
```

### Push Subscription

```typescript
// src/lib/pushNotifications.ts
export async function subscribeToPush() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    throw new Error('Push notifications not supported');
  }
  
  const registration = await navigator.serviceWorker.ready;
  
  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(
      import.meta.env.VITE_VAPID_PUBLIC_KEY
    ),
  });
  
  // Send subscription to backend
  await fetch('/api/push/subscribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(subscription),
  });
  
  return subscription;
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');
  
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  
  return outputArray;
}
```

---

## App Installation

### Install Prompt

```typescript
// src/components/InstallPrompt.tsx
import { useState, useEffect } from 'react';

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  
  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPrompt(true);
    };
    
    window.addEventListener('beforeinstallprompt', handler);
    
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);
  
  const handleInstall = async () => {
    if (!deferredPrompt) return;
    
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    console.log(`User ${outcome} the install prompt`);
    
    setDeferredPrompt(null);
    setShowPrompt(false);
  };
  
  const handleDismiss = () => {
    setShowPrompt(false);
    // Remember dismissal in localStorage
    localStorage.setItem('installPromptDismissed', 'true');
  };
  
  if (!showPrompt) return null;
  
  return (
    <div className="
      fixed bottom-20 left-4 right-4
      md:bottom-4 md:left-auto md:right-4 md:max-w-sm
      bg-white rounded-lg shadow-xl
      p-4
      border-2 border-blue-500
      z-50
    ">
      <div className="flex items-start gap-3">
        <img 
          src="/pwa-192x192.png" 
          alt="App icon" 
          className="w-12 h-12 rounded-lg"
        />
        <div className="flex-1">
          <h3 className="font-semibold text-lg">
            Install IntegrationDirector
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Install our app for quick access and offline use
          </p>
          
          <div className="flex gap-2 mt-3">
            <TouchButton onClick={handleInstall} variant="primary">
              Install
            </TouchButton>
            <TouchButton onClick={handleDismiss} variant="secondary">
              Not now
            </TouchButton>
          </div>
        </div>
      </div>
    </div>
  );
}
```

### iOS Install Instructions

```typescript
// src/components/IOSInstallPrompt.tsx
import { useState, useEffect } from 'react';

export function IOSInstallPrompt() {
  const [showPrompt, setShowPrompt] = useState(false);
  
  useEffect(() => {
    // Check if iOS and not standalone
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const dismissed = localStorage.getItem('iosInstallDismissed');
    
    if (isIOS && !isStandalone && !dismissed) {
      setShowPrompt(true);
    }
  }, []);
  
  if (!showPrompt) return null;
  
  return (
    <div className="
      fixed bottom-0 left-0 right-0
      bg-white border-t-2 border-blue-500
      p-4 pb-8
      shadow-2xl
      z-50
    ">
      <button
        onClick={() => {
          setShowPrompt(false);
          localStorage.setItem('iosInstallDismissed', 'true');
        }}
        className="absolute top-2 right-2 p-2"
      >
        ✕
      </button>
      
      <h3 className="font-semibold text-lg mb-2">
        Install IntegrationDirector
      </h3>
      
      <p className="text-sm text-gray-600 mb-3">
        Install this app on your iPhone:
      </p>
      
      <ol className="text-sm space-y-2">
        <li className="flex items-center gap-2">
          <span className="text-blue-500">1.</span>
          <span>Tap the Share button</span>
          <ShareIcon className="w-5 h-5 text-blue-500" />
        </li>
        <li className="flex items-center gap-2">
          <span className="text-blue-500">2.</span>
          <span>Scroll and tap "Add to Home Screen"</span>
          <PlusSquareIcon className="w-5 h-5 text-blue-500" />
        </li>
        <li className="flex items-center gap-2">
          <span className="text-blue-500">3.</span>
          <span>Tap "Add"</span>
        </li>
      </ol>
    </div>
  );
}
```

---

## Performance Optimization

### Image Optimization

```typescript
// src/components/OptimizedImage.tsx
interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  priority?: boolean;
}

export function OptimizedImage({ 
  src, 
  alt, 
  width, 
  height,
  priority = false 
}: OptimizedImageProps) {
  const [loaded, setLoaded] = useState(false);
  
  return (
    <div className="relative overflow-hidden">
      {/* Blur placeholder */}
      {!loaded && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse" />
      )}
      
      <img
        src={src}
        alt={alt}
        width={width}
        height={height}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        onLoad={() => setLoaded(true)}
        className={`
          transition-opacity duration-300
          ${loaded ? 'opacity-100' : 'opacity-0'}
        `}
      />
    </div>
  );
}
```

### Code Splitting

```typescript
// src/App.tsx
import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

// Eager load critical routes
import Dashboard from './pages/Dashboard';
import LoadingSpinner from './components/LoadingSpinner';

// Lazy load secondary routes
const Vessels = lazy(() => import('./pages/Vessels'));
const Drivers = lazy(() => import('./pages/Drivers'));
const Settings = lazy(() => import('./pages/Settings'));

export function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<LoadingSpinner />}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/vessels" element={<Vessels />} />
          <Route path="/drivers" element={<Drivers />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
```

### Virtual Scrolling

```typescript
// src/components/VirtualList.tsx
import { useVirtualizer } from '@tanstack/react-virtual';
import { useRef } from 'react';

interface VirtualListProps<T> {
  items: T[];
  renderItem: (item: T) => React.ReactNode;
  estimateSize: number;
}

export function VirtualList<T>({ 
  items, 
  renderItem, 
  estimateSize 
}: VirtualListProps<T>) {
  const parentRef = useRef<HTMLDivElement>(null);
  
  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => estimateSize,
    overscan: 5,
  });
  
  return (
    <div
      ref={parentRef}
      className="h-screen overflow-auto"
    >
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {virtualizer.getVirtualItems().map((virtualRow) => (
          <div
            key={virtualRow.index}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: `${virtualRow.size}px`,
              transform: `translateY(${virtualRow.start}px)`,
            }}
          >
            {renderItem(items[virtualRow.index])}
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

## Mobile UX Patterns

### Bottom Navigation

```typescript
// src/components/MobileBottomNav.tsx
import { Home, Ship, Users, Settings } from 'lucide-react';
import { NavLink } from 'react-router-dom';

export function MobileBottomNav() {
  const navItems = [
    { to: '/', icon: Home, label: 'Home' },
    { to: '/vessels', icon: Ship, label: 'Vessels' },
    { to: '/drivers', icon: Users, label: 'Drivers' },
    { to: '/settings', icon: Settings, label: 'Settings' },
  ];
  
  return (
    <nav className="
      fixed bottom-0 left-0 right-0
      bg-white border-t border-gray-200
      safe-area-inset-bottom
      z-40
      md:hidden
    ">
      <div className="flex items-center justify-around h-16">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => `
              flex flex-col items-center justify-center
              flex-1 h-full
              text-xs
              transition-colors
              ${isActive 
                ? 'text-blue-600' 
                : 'text-gray-600 active:text-blue-600'
              }
            `}
          >
            <Icon className="w-6 h-6 mb-1" />
            <span>{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
```

### Mobile Search

```typescript
// src/components/MobileSearch.tsx
import { useState } from 'react';
import { Search, X } from 'lucide-react';

export function MobileSearch({ onSearch }: { onSearch: (query: string) => void }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [query, setQuery] = useState('');
  
  return (
    <div className="flex items-center gap-2">
      {isExpanded ? (
        <div className="
          flex items-center gap-2
          flex-1
          bg-gray-100 rounded-lg
          px-3 py-2
        ">
          <Search className="w-5 h-5 text-gray-400" />
          <input
            type="search"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              onSearch(e.target.value);
            }}
            placeholder="Search..."
            autoFocus
            className="
              flex-1
              bg-transparent
              outline-none
              text-base
            "
          />
          <button
            onClick={() => {
              setIsExpanded(false);
              setQuery('');
              onSearch('');
            }}
            className="p-1"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>
      ) : (
        <button
          onClick={() => setIsExpanded(true)}
          className="
            p-2
            bg-gray-100 rounded-lg
            active:bg-gray-200
          "
        >
          <Search className="w-5 h-5 text-gray-600" />
        </button>
      )}
    </div>
  );
}
```

### Bottom Sheet

```typescript
// src/components/BottomSheet.tsx
import { useState, useEffect } from 'react';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  snapPoints?: number[];
}

export function BottomSheet({ 
  isOpen, 
  onClose, 
  children,
  snapPoints = [0.3, 0.7, 0.95]
}: BottomSheetProps) {
  const [currentSnap, setCurrentSnap] = useState(1);
  
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);
  
  if (!isOpen) return null;
  
  const height = snapPoints[currentSnap] * 100;
  
  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40"
        onClick={onClose}
      />
      
      {/* Sheet */}
      <div
        className="
          fixed bottom-0 left-0 right-0
          bg-white
          rounded-t-3xl
          shadow-2xl
          z-50
          transition-all duration-300
        "
        style={{ height: `${height}vh` }}
      >
        {/* Handle */}
        <div className="flex justify-center py-3">
          <div className="w-12 h-1.5 bg-gray-300 rounded-full" />
        </div>
        
        {/* Content */}
        <div className="overflow-y-auto h-[calc(100%-3rem)] px-4 pb-safe">
          {children}
        </div>
      </div>
    </>
  );
}
```

---

## Testing on Mobile

### Responsive Testing Hook

```typescript
// src/test/utils.ts
import { render } from '@testing-library/react';

export function renderMobile(ui: React.ReactElement) {
  // Set mobile viewport
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: 375,
  });
  
  Object.defineProperty(window, 'innerHeight', {
    writable: true,
    configurable: true,
    value: 667,
  });
  
  window.dispatchEvent(new Event('resize'));
  
  return render(ui);
}

export function renderTablet(ui: React.ReactElement) {
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: 768,
  });
  
  window.dispatchEvent(new Event('resize'));
  
  return render(ui);
}
```

### Touch Event Testing

```typescript
// src/components/__tests__/SwipeableListItem.test.tsx
import { fireEvent } from '@testing-library/react';
import { renderMobile } from '@/test/utils';
import { SwipeableListItem } from '../SwipeableListItem';

describe('SwipeableListItem', () => {
  it('triggers delete on left swipe', () => {
    const onDelete = jest.fn();
    const { container } = renderMobile(
      <SwipeableListItem onDelete={onDelete}>
        <div>Test Item</div>
      </SwipeableListItem>
    );
    
    const item = container.firstChild;
    
    // Simulate swipe
    fireEvent.touchStart(item, {
      touches: [{ clientX: 100 }],
    });
    
    fireEvent.touchMove(item, {
      touches: [{ clientX: 20 }],
    });
    
    fireEvent.touchEnd(item);
    
    expect(onDelete).toHaveBeenCalled();
  });
});
```

---

## Best Practices Summary

### 1. **Mobile-First Design**
- Start with mobile layout
- Progressively enhance for larger screens
- Use touch-friendly targets (min 44x44px)

### 2. **Performance**
- Lazy load routes and images
- Use virtual scrolling for long lists
- Minimize bundle size
- Optimize images

### 3. **Offline Support**
- Cache API responses
- Use IndexedDB for persistent data
- Implement background sync
- Show offline indicators

### 4. **Touch Interactions**
- Support gestures (swipe, pull-to-refresh)
- Provide immediate visual feedback
- Prevent double-tap zoom with `touch-manipulation`

### 5. **PWA Features**
- Add to home screen prompt
- Push notifications
- Update detection
- Offline functionality

### 6. **Testing**
- Test on real devices
- Test touch interactions
- Test offline scenarios
- Test different screen sizes

---

This comprehensive skill provides everything needed for a production-ready mobile-first PWA!