# Hybrid Architecture Patterns Skill

## Purpose
Comprehensive patterns for building a hybrid mobile/web application using Capacitor, supporting iOS, Android, and web from a single React codebase.

## Table of Contents
1. [Capacitor Setup](#capacitor-setup)
2. [Platform Detection](#platform-detection)
3. [Native Feature Integration](#native-feature-integration)
4. [File System Access](#file-system-access)
5. [Camera & Media](#camera--media)
6. [Geolocation & Maps](#geolocation--maps)
7. [Native Storage](#native-storage)
8. [Push Notifications (Native)](#push-notifications-native)
9. [App Updates & Versioning](#app-updates--versioning)
10. [Building & Deployment](#building--deployment)
11. [Testing Hybrid Apps](#testing-hybrid-apps)

---

## Capacitor Setup

### Install Capacitor

```bash
# Install Capacitor
npm install @capacitor/core @capacitor/cli

# Initialize Capacitor
npx cap init

# Add platforms
npx cap add ios
npx cap add android

# Install common plugins
npm install @capacitor/camera @capacitor/filesystem @capacitor/geolocation
npm install @capacitor/push-notifications @capacitor/haptics @capacitor/status-bar
npm install @capacitor/keyboard @capacitor/network @capacitor/app
```

### Capacitor Configuration

```typescript
// capacitor.config.ts
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.integrationdirector.app',
  appName: 'IntegrationDirector',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    // For development
    // url: 'http://192.168.1.100:5173',
    // cleartext: true,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#3b82f6',
      androidScaleType: 'CENTER_CROP',
      showSpinner: true,
      spinnerColor: '#ffffff',
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
    Keyboard: {
      resize: 'body',
      style: 'dark',
      resizeOnFullScreen: true,
    },
  },
  ios: {
    contentInset: 'always',
  },
  android: {
    allowMixedContent: true,
    captureInput: true,
    webContentsDebuggingEnabled: true,
  },
};

export default config;
```

### Package Scripts

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    
    "cap:sync": "cap sync",
    "cap:open:ios": "cap open ios",
    "cap:open:android": "cap open android",
    
    "ios": "npm run build && cap sync ios && cap open ios",
    "android": "npm run build && cap sync android && cap open android",
    
    "mobile:dev": "vite --host",
    "mobile:build": "npm run build && cap sync"
  }
}
```

---

## Platform Detection

### Platform Detection Hook

```typescript
// src/hooks/usePlatform.ts
import { Capacitor } from '@capacitor/core';
import { useState, useEffect } from 'react';

export type Platform = 'web' | 'ios' | 'android';

export function usePlatform() {
  const [platform, setPlatform] = useState<Platform>('web');
  
  useEffect(() => {
    const detectedPlatform = Capacitor.getPlatform() as Platform;
    setPlatform(detectedPlatform);
  }, []);
  
  return {
    platform,
    isNative: Capacitor.isNativePlatform(),
    isWeb: !Capacitor.isNativePlatform(),
    isIOS: platform === 'ios',
    isAndroid: platform === 'android',
  };
}

// Alternative: Direct usage
export const Platform = {
  isNative: Capacitor.isNativePlatform(),
  isWeb: !Capacitor.isNativePlatform(),
  isIOS: Capacitor.getPlatform() === 'ios',
  isAndroid: Capacitor.getPlatform() === 'android',
  platform: Capacitor.getPlatform() as Platform,
};
```

### Platform-Specific Components

```typescript
// src/components/PlatformSpecific.tsx
import { usePlatform } from '@/hooks/usePlatform';

interface PlatformSpecificProps {
  web?: React.ReactNode;
  ios?: React.ReactNode;
  android?: React.ReactNode;
  native?: React.ReactNode;
  children?: React.ReactNode;
}

export function PlatformSpecific({ 
  web, 
  ios, 
  android, 
  native,
  children 
}: PlatformSpecificProps) {
  const { platform, isNative } = usePlatform();
  
  if (platform === 'ios' && ios) return <>{ios}</>;
  if (platform === 'android' && android) return <>{android}</>;
  if (isNative && native) return <>{native}</>;
  if (platform === 'web' && web) return <>{web}</>;
  
  return <>{children}</>;
}

// Usage
function Header() {
  return (
    <PlatformSpecific
      ios={<IOSHeader />}
      android={<AndroidHeader />}
      web={<WebHeader />}
    />
  );
}
```

### Platform-Specific Styles

```typescript
// src/utils/platformStyles.ts
import { Platform } from './platform';

export function platformClass(...classes: string[]) {
  const baseClasses = classes.filter(c => !c.includes(':'));
  const platformClasses = classes.filter(c => {
    if (c.startsWith('ios:')) return Platform.isIOS;
    if (c.startsWith('android:')) return Platform.isAndroid;
    if (c.startsWith('native:')) return Platform.isNative;
    if (c.startsWith('web:')) return Platform.isWeb;
    return false;
  }).map(c => c.split(':')[1]);
  
  return [...baseClasses, ...platformClasses].join(' ');
}

// Usage
<div className={platformClass(
  'p-4',
  'ios:pt-safe',
  'android:pt-4',
  'native:bg-white',
  'web:bg-gray-50'
)}>
  Content
</div>
```

---

## Native Feature Integration

### Feature Availability Check

```typescript
// src/lib/capabilities.ts
import { Capacitor } from '@capacitor/core';

export const Capabilities = {
  hasCamera: () => Capacitor.isPluginAvailable('Camera'),
  hasGeolocation: () => Capacitor.isPluginAvailable('Geolocation'),
  hasFilesystem: () => Capacitor.isPluginAvailable('Filesystem'),
  hasPushNotifications: () => Capacitor.isPluginAvailable('PushNotifications'),
  hasHaptics: () => Capacitor.isPluginAvailable('Haptics'),
  hasStatusBar: () => Capacitor.isPluginAvailable('StatusBar'),
  hasKeyboard: () => Capacitor.isPluginAvailable('Keyboard'),
  hasNetwork: () => Capacitor.isPluginAvailable('Network'),
  hasApp: () => Capacitor.isPluginAvailable('App'),
};

// Usage with fallback
async function takePhoto() {
  if (Capabilities.hasCamera()) {
    return await Camera.getPhoto({ ... });
  } else {
    // Web fallback: use <input type="file">
    return await webCameraFallback();
  }
}
```

### Haptic Feedback

```typescript
// src/lib/haptics.ts
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { Capabilities } from './capabilities';

export async function hapticImpact(style: ImpactStyle = ImpactStyle.Medium) {
  if (Capabilities.hasHaptics()) {
    await Haptics.impact({ style });
  }
}

export async function hapticNotification(type: 'success' | 'warning' | 'error') {
  if (Capabilities.hasHaptics()) {
    await Haptics.notification({ 
      type: type.toUpperCase() as any 
    });
  }
}

// Usage in components
function SubmitButton() {
  const handleClick = async () => {
    await hapticImpact(ImpactStyle.Light);
    // Submit form
  };
  
  return <button onClick={handleClick}>Submit</button>;
}
```

### Status Bar Control

```typescript
// src/hooks/useStatusBar.ts
import { StatusBar, Style } from '@capacitor/status-bar';
import { useEffect } from 'react';
import { Capabilities } from '@/lib/capabilities';

export function useStatusBar(style: 'light' | 'dark' = 'dark') {
  useEffect(() => {
    if (!Capabilities.hasStatusBar()) return;
    
    const setStatusBar = async () => {
      if (style === 'dark') {
        await StatusBar.setStyle({ style: Style.Dark });
        await StatusBar.setBackgroundColor({ color: '#ffffff' });
      } else {
        await StatusBar.setStyle({ style: Style.Light });
        await StatusBar.setBackgroundColor({ color: '#3b82f6' });
      }
    };
    
    setStatusBar();
  }, [style]);
}

// Usage
function App() {
  useStatusBar('dark');
  
  return <YourApp />;
}
```

### Keyboard Management

```typescript
// src/hooks/useKeyboard.ts
import { Keyboard, KeyboardInfo } from '@capacitor/keyboard';
import { useState, useEffect } from 'react';
import { Capabilities } from '@/lib/capabilities';

export function useKeyboard() {
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);
  
  useEffect(() => {
    if (!Capabilities.hasKeyboard()) return;
    
    const showListener = Keyboard.addListener('keyboardWillShow', (info: KeyboardInfo) => {
      setKeyboardHeight(info.keyboardHeight);
      setIsKeyboardOpen(true);
    });
    
    const hideListener = Keyboard.addListener('keyboardWillHide', () => {
      setKeyboardHeight(0);
      setIsKeyboardOpen(false);
    });
    
    return () => {
      showListener.remove();
      hideListener.remove();
    };
  }, []);
  
  const hideKeyboard = async () => {
    if (Capabilities.hasKeyboard()) {
      await Keyboard.hide();
    }
  };
  
  return {
    keyboardHeight,
    isKeyboardOpen,
    hideKeyboard,
  };
}

// Usage: Adjust layout when keyboard appears
function ChatInput() {
  const { keyboardHeight } = useKeyboard();
  
  return (
    <div 
      className="fixed bottom-0 left-0 right-0 transition-all"
      style={{ bottom: `${keyboardHeight}px` }}
    >
      <input type="text" placeholder="Type a message..." />
    </div>
  );
}
```

---

## File System Access

### File System Operations

```typescript
// src/lib/filesystem.ts
import { 
  Filesystem, 
  Directory, 
  Encoding 
} from '@capacitor/filesystem';
import { Capacitor } from '@capacitor/core';

export class FileSystemService {
  async writeFile(
    path: string,
    data: string,
    directory: Directory = Directory.Documents
  ) {
    if (!Capacitor.isNativePlatform()) {
      // Web fallback: use localStorage or IndexedDB
      localStorage.setItem(path, data);
      return;
    }
    
    await Filesystem.writeFile({
      path,
      data,
      directory,
      encoding: Encoding.UTF8,
    });
  }
  
  async readFile(
    path: string,
    directory: Directory = Directory.Documents
  ): Promise<string> {
    if (!Capacitor.isNativePlatform()) {
      return localStorage.getItem(path) || '';
    }
    
    const result = await Filesystem.readFile({
      path,
      directory,
      encoding: Encoding.UTF8,
    });
    
    return result.data as string;
  }
  
  async deleteFile(
    path: string,
    directory: Directory = Directory.Documents
  ) {
    if (!Capacitor.isNativePlatform()) {
      localStorage.removeItem(path);
      return;
    }
    
    await Filesystem.deleteFile({
      path,
      directory,
    });
  }
  
  async listFiles(
    path: string = '',
    directory: Directory = Directory.Documents
  ) {
    if (!Capacitor.isNativePlatform()) {
      // Return empty for web
      return { files: [] };
    }
    
    return await Filesystem.readdir({
      path,
      directory,
    });
  }
  
  async downloadFile(url: string, filename: string) {
    const response = await fetch(url);
    const blob = await response.blob();
    const base64 = await this.blobToBase64(blob);
    
    await this.writeFile(filename, base64, Directory.Documents);
  }
  
  private blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }
}

export const fileSystem = new FileSystemService();
```

### File Picker

```typescript
// src/hooks/useFilePicker.ts
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Capacitor } from '@capacitor/core';

export function useFilePicker() {
  const pickFile = async (accept: string = '*/*'): Promise<File | null> => {
    if (Capacitor.isNativePlatform()) {
      // Use native file picker
      // Note: Requires additional plugin like @capacitor-community/file-picker
      // For now, we'll use camera/photos
      return null;
    } else {
      // Web: Use native file input
      return new Promise((resolve) => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = accept;
        input.onchange = (e) => {
          const files = (e.target as HTMLInputElement).files;
          resolve(files ? files[0] : null);
        };
        input.click();
      });
    }
  };
  
  return { pickFile };
}
```

---

## Camera & Media

### Camera Integration

```typescript
// src/hooks/useCamera.ts
import { 
  Camera, 
  CameraResultType, 
  CameraSource,
  Photo 
} from '@capacitor/camera';
import { Capabilities } from '@/lib/capabilities';

export function useCamera() {
  const takePhoto = async (): Promise<Photo | null> => {
    if (!Capabilities.hasCamera()) {
      // Web fallback
      return await webCameraFallback();
    }
    
    try {
      const photo = await Camera.getPhoto({
        resultType: CameraResultType.Uri,
        source: CameraSource.Camera,
        quality: 90,
        allowEditing: true,
        width: 1024,
        height: 1024,
      });
      
      return photo;
    } catch (error) {
      console.error('Camera error:', error);
      return null;
    }
  };
  
  const pickFromGallery = async (): Promise<Photo | null> => {
    if (!Capabilities.hasCamera()) {
      return await webCameraFallback();
    }
    
    try {
      const photo = await Camera.getPhoto({
        resultType: CameraResultType.Uri,
        source: CameraSource.Photos,
        quality: 90,
      });
      
      return photo;
    } catch (error) {
      console.error('Gallery error:', error);
      return null;
    }
  };
  
  const webCameraFallback = async (): Promise<Photo | null> => {
    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.capture = 'environment';
      
      input.onchange = async (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (!file) {
          resolve(null);
          return;
        }
        
        const dataUrl = await fileToDataUrl(file);
        resolve({
          dataUrl,
          format: file.type.split('/')[1],
        } as Photo);
      };
      
      input.click();
    });
  };
  
  return {
    takePhoto,
    pickFromGallery,
  };
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.readAsDataURL(file);
  });
}

// Usage in component
function DriverPhotoUpload() {
  const { takePhoto, pickFromGallery } = useCamera();
  const [photo, setPhoto] = useState<string | null>(null);
  
  const handleTakePhoto = async () => {
    const result = await takePhoto();
    if (result?.dataUrl) {
      setPhoto(result.dataUrl);
    }
  };
  
  return (
    <div>
      <button onClick={handleTakePhoto}>Take Photo</button>
      <button onClick={async () => {
        const result = await pickFromGallery();
        if (result?.dataUrl) setPhoto(result.dataUrl);
      }}>
        Choose from Gallery
      </button>
      
      {photo && <img src={photo} alt="Driver" />}
    </div>
  );
}
```

---

## Geolocation & Maps

### Geolocation Hook

```typescript
// src/hooks/useGeolocation.ts
import { Geolocation, Position } from '@capacitor/geolocation';
import { useState, useEffect } from 'react';
import { Capabilities } from '@/lib/capabilities';

export function useGeolocation(watch: boolean = false) {
  const [position, setPosition] = useState<Position | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    let watchId: string | undefined;
    
    const getCurrentPosition = async () => {
      try {
        const coords = await Geolocation.getCurrentPosition({
          enableHighAccuracy: true,
          timeout: 10000,
        });
        setPosition(coords);
        setError(null);
      } catch (err) {
        setError('Failed to get location');
        console.error('Geolocation error:', err);
      } finally {
        setLoading(false);
      }
    };
    
    const startWatching = async () => {
      watchId = await Geolocation.watchPosition(
        { enableHighAccuracy: true },
        (position, err) => {
          if (err) {
            setError('Failed to watch location');
            return;
          }
          if (position) {
            setPosition(position);
            setError(null);
          }
        }
      );
    };
    
    if (!Capabilities.hasGeolocation()) {
      setError('Geolocation not available');
      setLoading(false);
      return;
    }
    
    if (watch) {
      startWatching();
    } else {
      getCurrentPosition();
    }
    
    return () => {
      if (watchId) {
        Geolocation.clearWatch({ id: watchId });
      }
    };
  }, [watch]);
  
  const requestPermissions = async () => {
    try {
      const result = await Geolocation.requestPermissions();
      return result.location === 'granted';
    } catch (err) {
      console.error('Permission request failed:', err);
      return false;
    }
  };
  
  return {
    position,
    error,
    loading,
    requestPermissions,
  };
}

// Usage
function DriverLocationTracker() {
  const { position, error, loading } = useGeolocation(true);
  
  if (loading) return <div>Getting location...</div>;
  if (error) return <div>Error: {error}</div>;
  
  return (
    <div>
      <p>Latitude: {position?.coords.latitude}</p>
      <p>Longitude: {position?.coords.longitude}</p>
      <p>Accuracy: {position?.coords.accuracy}m</p>
    </div>
  );
}
```

### Native Maps

```typescript
// src/components/NativeMap.tsx
import { useEffect, useRef } from 'react';
import { Capacitor } from '@capacitor/core';

interface NativeMapProps {
  center: { lat: number; lng: number };
  markers?: Array<{ lat: number; lng: number; title: string }>;
}

export function NativeMap({ center, markers = [] }: NativeMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      // Use native map plugin (e.g., @capacitor/google-maps)
      initNativeMap();
    } else {
      // Use web map (e.g., Leaflet, Mapbox)
      initWebMap();
    }
  }, [center, markers]);
  
  const initNativeMap = async () => {
    // Native map initialization
    // This requires @capacitor/google-maps plugin
  };
  
  const initWebMap = () => {
    // Web map initialization with Leaflet or Mapbox
  };
  
  return (
    <div 
      ref={mapRef} 
      className="w-full h-full"
    />
  );
}
```

---

## Native Storage

### Secure Storage

```typescript
// src/lib/secureStorage.ts
import { Preferences } from '@capacitor/preferences';

export class SecureStorage {
  async set(key: string, value: string) {
    await Preferences.set({ key, value });
  }
  
  async get(key: string): Promise<string | null> {
    const { value } = await Preferences.get({ key });
    return value;
  }
  
  async remove(key: string) {
    await Preferences.remove({ key });
  }
  
  async clear() {
    await Preferences.clear();
  }
  
  // Typed storage helpers
  async setObject<T>(key: string, value: T) {
    await this.set(key, JSON.stringify(value));
  }
  
  async getObject<T>(key: string): Promise<T | null> {
    const value = await this.get(key);
    return value ? JSON.parse(value) : null;
  }
}

export const secureStorage = new SecureStorage();

// Usage: Store auth tokens securely
await secureStorage.set('auth_token', token);
const token = await secureStorage.get('auth_token');
```

### SQLite Storage (for complex data)

```typescript
// src/lib/database.ts
import { CapacitorSQLite, SQLiteConnection } from '@capacitor-community/sqlite';

export class Database {
  private sqlite: SQLiteConnection;
  private db: any;
  
  async init() {
    this.sqlite = new SQLiteConnection(CapacitorSQLite);
    
    this.db = await this.sqlite.createConnection(
      'integrationdirector',
      false,
      'no-encryption',
      1,
      false
    );
    
    await this.db.open();
    await this.createTables();
  }
  
  private async createTables() {
    const schema = `
      CREATE TABLE IF NOT EXISTS vessels (
        id TEXT PRIMARY KEY,
        imo TEXT NOT NULL,
        name TEXT NOT NULL,
        data TEXT NOT NULL,
        synced INTEGER DEFAULT 0,
        updated_at INTEGER NOT NULL
      );
      
      CREATE TABLE IF NOT EXISTS drivers (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        phone TEXT NOT NULL,
        data TEXT NOT NULL,
        synced INTEGER DEFAULT 0,
        updated_at INTEGER NOT NULL
      );
    `;
    
    await this.db.execute(schema);
  }
  
  async insertVessel(vessel: any) {
    const sql = `
      INSERT OR REPLACE INTO vessels (id, imo, name, data, updated_at)
      VALUES (?, ?, ?, ?, ?)
    `;
    
    await this.db.run(sql, [
      vessel.id,
      vessel.imo,
      vessel.name,
      JSON.stringify(vessel),
      Date.now(),
    ]);
  }
  
  async getVessels() {
    const result = await this.db.query('SELECT * FROM vessels ORDER BY updated_at DESC');
    return result.values.map((row: any) => JSON.parse(row.data));
  }
  
  async getUnsyncedVessels() {
    const result = await this.db.query(
      'SELECT * FROM vessels WHERE synced = 0'
    );
    return result.values;
  }
}

export const database = new Database();
```

---

## Push Notifications (Native)

### Push Notification Setup

```typescript
// src/lib/pushNotifications.ts
import { 
  PushNotifications,
  Token,
  PushNotificationSchema,
  ActionPerformed 
} from '@capacitor/push-notifications';
import { Capacitor } from '@capacitor/core';

export class PushNotificationService {
  async init() {
    if (!Capacitor.isNativePlatform()) {
      console.log('Push notifications only available on native platforms');
      return;
    }
    
    // Request permission
    const permission = await PushNotifications.requestPermissions();
    
    if (permission.receive === 'granted') {
      // Register with Apple / Google
      await PushNotifications.register();
    }
    
    // Listen for registration
    await PushNotifications.addListener('registration', (token: Token) => {
      console.log('Push registration success, token:', token.value);
      this.savePushToken(token.value);
    });
    
    // Listen for registration errors
    await PushNotifications.addListener('registrationError', (error: any) => {
      console.error('Push registration error:', error);
    });
    
    // Listen for push notifications
    await PushNotifications.addListener(
      'pushNotificationReceived',
      (notification: PushNotificationSchema) => {
        console.log('Push notification received:', notification);
        this.handleNotificationReceived(notification);
      }
    );
    
    // Listen for notification actions
    await PushNotifications.addListener(
      'pushNotificationActionPerformed',
      (action: ActionPerformed) => {
        console.log('Push notification action:', action);
        this.handleNotificationAction(action);
      }
    );
  }
  
  private async savePushToken(token: string) {
    // Send token to your backend
    await fetch('/api/push/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    });
  }
  
  private handleNotificationReceived(notification: PushNotificationSchema) {
    // Handle incoming notification (app in foreground)
    // Show in-app notification UI
  }
  
  private handleNotificationAction(action: ActionPerformed) {
    // Handle notification tap (app in background)
    const data = action.notification.data;
    
    // Navigate to relevant screen
    if (data.type === 'vessel_alert') {
      // Navigate to vessel details
      window.location.href = `/vessels/${data.vessel_id}`;
    }
  }
  
  async getDeliveredNotifications() {
    const result = await PushNotifications.getDeliveredNotifications();
    return result.notifications;
  }
  
  async removeDeliveredNotifications() {
    await PushNotifications.removeAllDeliveredNotifications();
  }
}

export const pushNotificationService = new PushNotificationService();
```

---

## App Updates & Versioning

### App Info Hook

```typescript
// src/hooks/useAppInfo.ts
import { App } from '@capacitor/app';
import { useState, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';

export function useAppInfo() {
  const [appInfo, setAppInfo] = useState({
    version: '1.0.0',
    build: '1',
  });
  
  useEffect(() => {
    const getInfo = async () => {
      if (Capacitor.isNativePlatform()) {
        const info = await App.getInfo();
        setAppInfo({
          version: info.version,
          build: info.build,
        });
      } else {
        // Web: Get from package.json or env
        setAppInfo({
          version: import.meta.env.VITE_APP_VERSION || '1.0.0',
          build: import.meta.env.VITE_APP_BUILD || '1',
        });
      }
    };
    
    getInfo();
  }, []);
  
  return appInfo;
}
```

### App State Management

```typescript
// src/hooks/useAppState.ts
import { App, AppState } from '@capacitor/app';
import { useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';

export function useAppState() {
  const [isActive, setIsActive] = useState(true);
  
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    
    const stateListener = App.addListener('appStateChange', (state: AppState) => {
      setIsActive(state.isActive);
      
      if (state.isActive) {
        // App came to foreground
        // Refresh data, check for updates
      } else {
        // App went to background
        // Save state, pause timers
      }
    });
    
    return () => {
      stateListener.remove();
    };
  }, []);
  
  return { isActive };
}
```

### Deep Linking

```typescript
// src/lib/deepLinks.ts
import { App, URLOpenListenerEvent } from '@capacitor/app';

export function initDeepLinks() {
  App.addListener('appUrlOpen', (event: URLOpenListenerEvent) => {
    const url = event.url;
    const slug = url.split('.app').pop();
    
    if (slug) {
      // Navigate to the appropriate route
      // Example: integrationdirector://vessels/123
      window.location.href = slug;
    }
  });
}

// Call in main.tsx
initDeepLinks();
```

---

## Building & Deployment

### iOS Build

```bash
# 1. Build web assets
npm run build

# 2. Sync to iOS
npx cap sync ios

# 3. Open Xcode
npx cap open ios

# 4. In Xcode:
# - Select your team
# - Update bundle identifier
# - Configure signing certificates
# - Build and run (Cmd+R)
# - Archive for App Store (Product > Archive)
```

### Android Build

```bash
# 1. Build web assets
npm run build

# 2. Sync to Android
npx cap sync android

# 3. Open Android Studio
npx cap open android

# 4. In Android Studio:
# - Update applicationId in build.gradle
# - Configure signing keystore
# - Build > Generate Signed Bundle/APK
# - Select release variant
```

### Environment Configuration

```typescript
// vite.config.ts
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
    define: {
      'import.meta.env.VITE_API_URL': JSON.stringify(
        mode === 'production' 
          ? 'https://api.integrationdirector.com'
          : 'http://localhost:8000'
      ),
    },
  };
});
```

### CI/CD Pipeline

```yaml
# .github/workflows/mobile.yml
name: Build Mobile Apps

on:
  push:
    branches: [main]

jobs:
  build-ios:
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build web assets
        run: npm run build
      
      - name: Sync Capacitor
        run: npx cap sync ios
      
      - name: Build iOS
        run: |
          cd ios/App
          xcodebuild -workspace App.xcworkspace \
            -scheme App \
            -configuration Release \
            -archivePath App.xcarchive \
            archive
  
  build-android:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Setup Java
        uses: actions/setup-java@v3
        with:
          distribution: 'temurin'
          java-version: '17'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build web assets
        run: npm run build
      
      - name: Sync Capacitor
        run: npx cap sync android
      
      - name: Build Android APK
        run: |
          cd android
          ./gradlew assembleRelease
```

---

## Testing Hybrid Apps

### Platform-Specific Tests

```typescript
// src/test/platform.test.ts
import { Capacitor } from '@capacitor/core';

describe('Platform Detection', () => {
  it('detects web platform in test environment', () => {
    expect(Capacitor.getPlatform()).toBe('web');
  });
  
  it('checks native platform availability', () => {
    expect(Capacitor.isNativePlatform()).toBe(false);
  });
});
```

### Mock Native Plugins

```typescript
// src/test/mocks/capacitor.ts
import { jest } from '@jest/globals';

export const mockCamera = {
  getPhoto: jest.fn().mockResolvedValue({
    dataUrl: 'data:image/png;base64,mock',
    format: 'png',
  }),
};

export const mockGeolocation = {
  getCurrentPosition: jest.fn().mockResolvedValue({
    coords: {
      latitude: 37.7749,
      longitude: -122.4194,
      accuracy: 10,
    },
    timestamp: Date.now(),
  }),
};

jest.mock('@capacitor/camera', () => ({
  Camera: mockCamera,
}));

jest.mock('@capacitor/geolocation', () => ({
  Geolocation: mockGeolocation,
}));
```

### Testing with Real Devices

```bash
# iOS: Run on connected device
npx cap run ios --target="Your Device Name"

# Android: Run on connected device
npx cap run android --target="device-id"

# Live reload on device (development)
npm run mobile:dev
# Update capacitor.config.ts with your local IP
# Then rebuild: npm run ios or npm run android
```

---

## Best Practices Summary

### 1. **Platform Abstraction**
- Always check platform availability
- Provide web fallbacks
- Use platform-specific components

### 2. **Performance**
- Minimize native bridge calls
- Cache data locally
- Use native components when available

### 3. **User Experience**
- Handle native keyboard properly
- Use native navigation patterns
- Respect platform conventions

### 4. **Security**
- Use secure storage for sensitive data
- Validate SSL certificates
- Implement proper authentication

### 5. **Testing**
- Test on real devices
- Mock native plugins in unit tests
- Test offline scenarios

### 6. **Updates**
- Handle app state changes
- Implement background sync
- Monitor network status

### 7. **Distribution**
- Follow platform guidelines
- Test on multiple devices
- Monitor crash reports

---

## Quick Reference: Common Tasks

```typescript
// Take a photo
const { takePhoto } = useCamera();
const photo = await takePhoto();

// Get location
const { position } = useGeolocation();
console.log(position?.coords.latitude);

// Store data securely
await secureStorage.set('token', 'abc123');

// Show haptic feedback
await hapticImpact(ImpactStyle.Medium);

// Handle app state
const { isActive } = useAppState();

// Get app info
const { version, build } = useAppInfo();

// Check platform
const { isIOS, isAndroid, isNative } = usePlatform();
```

---

This comprehensive skill provides everything needed for building production hybrid apps with Capacitor!