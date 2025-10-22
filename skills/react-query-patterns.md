# React Query (TanStack Query) Patterns Skill

## Purpose
Comprehensive patterns for TanStack Query v5 in the IntegrationDirector React frontend with TypeScript.

## Table of Contents
1. [Setup & Configuration](#setup--configuration)
2. [Query Patterns](#query-patterns)
3. [Mutation Patterns](#mutation-patterns)
4. [Authentication Integration](#authentication-integration)
5. [Optimistic Updates](#optimistic-updates)
6. [Pagination & Infinite Queries](#pagination--infinite-queries)
7. [Error Handling](#error-handling)
8. [Cache Management](#cache-management)
9. [Prefetching & Background Updates](#prefetching--background-updates)
10. [Testing Patterns](#testing-patterns)

---

## Setup & Configuration

### Install Dependencies

```bash
npm install @tanstack/react-query @tanstack/react-query-devtools
```

### Query Client Setup

```typescript
// src/lib/queryClient.ts
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
      retry: 1,
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: 1,
      onError: (error) => {
        console.error('Mutation error:', error);
        // Global error handling
      },
    },
  },
});
```

### Provider Setup

```typescript
// src/App.tsx
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { queryClient } from './lib/queryClient';

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      {/* Your app components */}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
```

---

## Query Patterns

### API Client with Supabase Auth

```typescript
// src/lib/apiClient.ts
import { supabase } from './supabase';

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public response?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function getAuthHeaders(): Promise<HeadersInit> {
  const { data: { session } } = await supabase.auth.getSession();
  
  return {
    'Content-Type': 'application/json',
    ...(session?.access_token && {
      'Authorization': `Bearer ${session.access_token}`
    })
  };
}

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
  const headers = await getAuthHeaders();
  
  const response = await fetch(`${baseUrl}${endpoint}`, {
    ...options,
    headers: {
      ...headers,
      ...options.headers,
    },
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Unknown error' }));
    throw new ApiError(
      error.message || `API Error: ${response.status}`,
      response.status,
      error
    );
  }
  
  return response.json();
}
```

### Basic Query Hook

```typescript
// src/hooks/queries/useVessels.ts
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/apiClient';

interface Vessel {
  id: string;
  imo: string;
  name: string;
  position: {
    lat: number;
    lon: number;
    timestamp: string;
  };
  status: string;
}

interface VesselsResponse {
  vessels: Vessel[];
  total: number;
}

export function useVessels() {
  return useQuery({
    queryKey: ['vessels'],
    queryFn: () => apiRequest<VesselsResponse>('/api/vessels'),
    select: (data) => data.vessels, // Transform response
  });
}

// Usage in component
function VesselsList() {
  const { data: vessels, isLoading, error } = useVessels();
  
  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} />;
  
  return (
    <div>
      {vessels?.map(vessel => (
        <VesselCard key={vessel.id} vessel={vessel} />
      ))}
    </div>
  );
}
```

### Query with Parameters

```typescript
// src/hooks/queries/useVessel.ts
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/apiClient';

interface VesselDetails extends Vessel {
  compliance_status: {
    compliant: boolean;
    certificates: any[];
    deficiencies: any[];
  };
  port_calls: any[];
}

export function useVessel(imo: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ['vessel', imo],
    queryFn: () => apiRequest<VesselDetails>(`/api/vessels/${imo}`),
    enabled: options?.enabled ?? !!imo, // Don't run if no IMO
    staleTime: 2 * 60 * 1000, // 2 minutes (vessel data changes frequently)
  });
}

// Usage with conditional fetching
function VesselDetails({ selectedImo }: { selectedImo?: string }) {
  const { data, isLoading } = useVessel(selectedImo || '', {
    enabled: !!selectedImo, // Only fetch when IMO is selected
  });
  
  if (!selectedImo) return <div>Select a vessel</div>;
  if (isLoading) return <LoadingSpinner />;
  
  return <VesselDetailsView vessel={data} />;
}
```

### Dependent Queries

```typescript
// src/hooks/queries/useVesselWithCompliance.ts
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/apiClient';

export function useVesselWithCompliance(imo: string) {
  // First query: Get vessel details
  const vesselQuery = useQuery({
    queryKey: ['vessel', imo],
    queryFn: () => apiRequest<VesselDetails>(`/api/vessels/${imo}`),
  });
  
  // Second query: Get compliance (depends on vessel ID)
  const complianceQuery = useQuery({
    queryKey: ['compliance', vesselQuery.data?.id],
    queryFn: () => 
      apiRequest(`/api/compliance/${vesselQuery.data?.id}`),
    enabled: !!vesselQuery.data?.id, // Only run after vessel query succeeds
  });
  
  return {
    vessel: vesselQuery.data,
    compliance: complianceQuery.data,
    isLoading: vesselQuery.isLoading || complianceQuery.isLoading,
    error: vesselQuery.error || complianceQuery.error,
  };
}
```

### Parallel Queries

```typescript
// src/hooks/queries/useDashboardData.ts
import { useQueries } from '@tanstack/react-query';
import { apiRequest } from '@/lib/apiClient';

export function useDashboardData() {
  const results = useQueries({
    queries: [
      {
        queryKey: ['vessels'],
        queryFn: () => apiRequest('/api/vessels'),
      },
      {
        queryKey: ['drivers'],
        queryFn: () => apiRequest('/api/drivers'),
      },
      {
        queryKey: ['alerts'],
        queryFn: () => apiRequest('/api/alerts'),
      },
      {
        queryKey: ['stats'],
        queryFn: () => apiRequest('/api/stats'),
      },
    ],
  });
  
  return {
    vessels: results[0].data,
    drivers: results[1].data,
    alerts: results[2].data,
    stats: results[3].data,
    isLoading: results.some(r => r.isLoading),
    errors: results.map(r => r.error).filter(Boolean),
  };
}
```

---

## Mutation Patterns

### Basic Mutation

```typescript
// src/hooks/mutations/useCreateDriver.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/apiClient';

interface CreateDriverInput {
  name: string;
  phone: string;
  email: string;
  license_number: string;
}

export function useCreateDriver() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: CreateDriverInput) =>
      apiRequest('/api/drivers', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      // Invalidate and refetch drivers list
      queryClient.invalidateQueries({ queryKey: ['drivers'] });
    },
    onError: (error) => {
      console.error('Failed to create driver:', error);
      // Show error toast
    },
  });
}

// Usage in component
function CreateDriverForm() {
  const createDriver = useCreateDriver();
  
  const handleSubmit = async (data: CreateDriverInput) => {
    try {
      await createDriver.mutateAsync(data);
      // Success! Show success message
      toast.success('Driver created successfully');
    } catch (error) {
      // Error handled in mutation's onError
      toast.error('Failed to create driver');
    }
  };
  
  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
      <button 
        type="submit" 
        disabled={createDriver.isPending}
      >
        {createDriver.isPending ? 'Creating...' : 'Create Driver'}
      </button>
    </form>
  );
}
```

### Update Mutation

```typescript
// src/hooks/mutations/useUpdateVessel.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/apiClient';

interface UpdateVesselInput {
  imo: string;
  data: Partial<Vessel>;
}

export function useUpdateVessel() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ imo, data }: UpdateVesselInput) =>
      apiRequest(`/api/vessels/${imo}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    onSuccess: (_, variables) => {
      // Invalidate specific vessel query
      queryClient.invalidateQueries({ 
        queryKey: ['vessel', variables.imo] 
      });
      // Also invalidate vessels list
      queryClient.invalidateQueries({ 
        queryKey: ['vessels'] 
      });
    },
  });
}
```

### Delete Mutation

```typescript
// src/hooks/mutations/useDeleteDriver.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/apiClient';

export function useDeleteDriver() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (driverId: string) =>
      apiRequest(`/api/drivers/${driverId}`, {
        method: 'DELETE',
      }),
    onSuccess: (_, driverId) => {
      // Remove from cache immediately
      queryClient.setQueryData(['drivers'], (old: any) =>
        old?.filter((d: any) => d.id !== driverId)
      );
      // Then refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: ['drivers'] });
    },
  });
}
```

---

## Authentication Integration

### Auth-aware Query Hook

```typescript
// src/hooks/queries/useAuthQuery.ts
import { useQuery } from '@tanstack/react-query';
import { useSession } from '@/hooks/useSession';
import { apiRequest } from '@/lib/apiClient';

export function useProfile() {
  const session = useSession();
  
  return useQuery({
    queryKey: ['profile', session?.user?.id],
    queryFn: () => apiRequest('/api/profile'),
    enabled: !!session?.user, // Only fetch when authenticated
    staleTime: 10 * 60 * 1000, // Profile data doesn't change often
  });
}

// Custom hook for session
export function useSession() {
  return useQuery({
    queryKey: ['session'],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      return session;
    },
    staleTime: 5 * 60 * 1000,
  });
}
```

### Logout with Cache Clear

```typescript
// src/hooks/mutations/useLogout.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export function useLogout() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async () => {
      await supabase.auth.signOut();
    },
    onSuccess: () => {
      // Clear all queries on logout
      queryClient.clear();
    },
  });
}
```

---

## Optimistic Updates

### Optimistic Create

```typescript
// src/hooks/mutations/useCreateAlert.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/apiClient';

interface Alert {
  id: string;
  message: string;
  severity: 'info' | 'warning' | 'error';
  timestamp: string;
}

export function useCreateAlert() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (newAlert: Omit<Alert, 'id' | 'timestamp'>) =>
      apiRequest('/api/alerts', {
        method: 'POST',
        body: JSON.stringify(newAlert),
      }),
    // Optimistic update
    onMutate: async (newAlert) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['alerts'] });
      
      // Snapshot the previous value
      const previousAlerts = queryClient.getQueryData(['alerts']);
      
      // Optimistically update to the new value
      const optimisticAlert: Alert = {
        id: `temp-${Date.now()}`,
        ...newAlert,
        timestamp: new Date().toISOString(),
      };
      
      queryClient.setQueryData(['alerts'], (old: any) => ({
        ...old,
        alerts: [optimisticAlert, ...(old?.alerts || [])],
      }));
      
      // Return context with the snapshot
      return { previousAlerts };
    },
    onError: (err, newAlert, context) => {
      // Rollback on error
      queryClient.setQueryData(['alerts'], context?.previousAlerts);
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
    },
  });
}
```

### Optimistic Update

```typescript
// src/hooks/mutations/useToggleAlertRead.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/apiClient';

export function useToggleAlertRead() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ alertId, isRead }: { alertId: string; isRead: boolean }) =>
      apiRequest(`/api/alerts/${alertId}`, {
        method: 'PATCH',
        body: JSON.stringify({ is_read: isRead }),
      }),
    onMutate: async ({ alertId, isRead }) => {
      await queryClient.cancelQueries({ queryKey: ['alerts'] });
      
      const previousAlerts = queryClient.getQueryData(['alerts']);
      
      // Optimistically update
      queryClient.setQueryData(['alerts'], (old: any) => ({
        ...old,
        alerts: old?.alerts?.map((alert: Alert & { is_read: boolean }) =>
          alert.id === alertId ? { ...alert, is_read: isRead } : alert
        ),
      }));
      
      return { previousAlerts };
    },
    onError: (err, variables, context) => {
      queryClient.setQueryData(['alerts'], context?.previousAlerts);
    },
  });
}

// Usage - instant UI feedback
function AlertItem({ alert }: { alert: Alert & { is_read: boolean } }) {
  const toggleRead = useToggleAlertRead();
  
  return (
    <div 
      onClick={() => toggleRead.mutate({ 
        alertId: alert.id, 
        isRead: !alert.is_read 
      })}
      className={alert.is_read ? 'opacity-50' : ''}
    >
      {alert.message}
    </div>
  );
}
```

---

## Pagination & Infinite Queries

### Offset-based Pagination

```typescript
// src/hooks/queries/useVesselsPaginated.ts
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/apiClient';
import { useState } from 'react';

interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  per_page: number;
}

export function useVesselsPaginated(perPage: number = 20) {
  const [page, setPage] = useState(1);
  
  const query = useQuery({
    queryKey: ['vessels', 'paginated', page, perPage],
    queryFn: () =>
      apiRequest<PaginatedResponse<Vessel>>(
        `/api/vessels?page=${page}&per_page=${perPage}`
      ),
    keepPreviousData: true, // Keep old data while fetching new page
  });
  
  return {
    ...query,
    page,
    setPage,
    totalPages: query.data ? Math.ceil(query.data.total / perPage) : 0,
  };
}

// Usage in component
function VesselsTable() {
  const { data, isLoading, page, setPage, totalPages } = useVesselsPaginated(20);
  
  return (
    <div>
      <table>
        {data?.data.map(vessel => (
          <tr key={vessel.id}>
            <td>{vessel.name}</td>
            <td>{vessel.imo}</td>
          </tr>
        ))}
      </table>
      
      <Pagination
        currentPage={page}
        totalPages={totalPages}
        onPageChange={setPage}
      />
    </div>
  );
}
```

### Infinite Scroll

```typescript
// src/hooks/queries/useVesselsInfinite.ts
import { useInfiniteQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/apiClient';

interface InfiniteVesselsResponse {
  vessels: Vessel[];
  next_cursor?: string;
  has_more: boolean;
}

export function useVesselsInfinite() {
  return useInfiniteQuery({
    queryKey: ['vessels', 'infinite'],
    queryFn: ({ pageParam }) =>
      apiRequest<InfiniteVesselsResponse>(
        `/api/vessels/infinite${pageParam ? `?cursor=${pageParam}` : ''}`
      ),
    initialPageParam: undefined,
    getNextPageParam: (lastPage) =>
      lastPage.has_more ? lastPage.next_cursor : undefined,
  });
}

// Usage with intersection observer
function VesselsInfiniteList() {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useVesselsInfinite();
  
  const observerTarget = useRef(null);
  
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 1.0 }
    );
    
    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }
    
    return () => observer.disconnect();
  }, [hasNextPage, fetchNextPage]);
  
  return (
    <div>
      {data?.pages.map((page, i) => (
        <React.Fragment key={i}>
          {page.vessels.map(vessel => (
            <VesselCard key={vessel.id} vessel={vessel} />
          ))}
        </React.Fragment>
      ))}
      
      <div ref={observerTarget}>
        {isFetchingNextPage && <LoadingSpinner />}
      </div>
    </div>
  );
}
```

---

## Error Handling

### Global Error Boundary

```typescript
// src/components/QueryErrorBoundary.tsx
import { QueryErrorResetBoundary } from '@tanstack/react-query';
import { ErrorBoundary } from 'react-error-boundary';

function ErrorFallback({ error, resetErrorBoundary }: any) {
  return (
    <div role="alert" className="error-container">
      <h2>Something went wrong</h2>
      <pre>{error.message}</pre>
      <button onClick={resetErrorBoundary}>Try again</button>
    </div>
  );
}

export function QueryErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <QueryErrorResetBoundary>
      {({ reset }) => (
        <ErrorBoundary onReset={reset} FallbackComponent={ErrorFallback}>
          {children}
        </ErrorBoundary>
      )}
    </QueryErrorResetBoundary>
  );
}
```

### Query-specific Error Handling

```typescript
// src/hooks/queries/useVesselWithErrorHandling.ts
import { useQuery } from '@tanstack/react-query';
import { apiRequest, ApiError } from '@/lib/apiClient';
import { toast } from 'sonner';

export function useVesselWithErrorHandling(imo: string) {
  return useQuery({
    queryKey: ['vessel', imo],
    queryFn: () => apiRequest<VesselDetails>(`/api/vessels/${imo}`),
    retry: (failureCount, error) => {
      // Don't retry on 404
      if (error instanceof ApiError && error.status === 404) {
        return false;
      }
      // Retry other errors up to 2 times
      return failureCount < 2;
    },
    onError: (error) => {
      if (error instanceof ApiError) {
        if (error.status === 404) {
          toast.error('Vessel not found');
        } else if (error.status === 403) {
          toast.error('Access denied');
        } else {
          toast.error('Failed to load vessel data');
        }
      }
    },
  });
}
```

---

## Cache Management

### Manual Cache Updates

```typescript
// src/hooks/mutations/useUpdateVesselLocation.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/apiClient';

export function useUpdateVesselLocation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ imo, position }: { imo: string; position: Position }) =>
      apiRequest(`/api/vessels/${imo}/location`, {
        method: 'PATCH',
        body: JSON.stringify(position),
      }),
    onSuccess: (data, variables) => {
      // Update cache directly instead of invalidating
      queryClient.setQueryData(['vessel', variables.imo], (old: any) => ({
        ...old,
        position: data.position,
      }));
    },
  });
}
```

### Selective Invalidation

```typescript
// src/hooks/mutations/useUpdateDriver.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';

export function useUpdateDriver() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: updateDriverApi,
    onSuccess: (_, variables) => {
      // Invalidate specific driver
      queryClient.invalidateQueries({
        queryKey: ['driver', variables.id],
      });
      
      // Invalidate drivers list
      queryClient.invalidateQueries({
        queryKey: ['drivers'],
        exact: false, // Invalidate all queries starting with ['drivers']
      });
      
      // Don't invalidate unrelated queries
    },
  });
}
```

### Time-based Refetching

```typescript
// src/hooks/queries/useRealtimeVesselTracking.ts
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/apiClient';

export function useRealtimeVesselTracking(imo: string) {
  return useQuery({
    queryKey: ['vessel', 'tracking', imo],
    queryFn: () => apiRequest(`/api/vessels/${imo}/tracking`),
    refetchInterval: 30 * 1000, // Refetch every 30 seconds
    refetchIntervalInBackground: false, // Pause when tab not active
  });
}
```

---

## Prefetching & Background Updates

### Hover Prefetch

```typescript
// src/components/VesselListItem.tsx
import { useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/apiClient';

function VesselListItem({ vessel }: { vessel: Vessel }) {
  const queryClient = useQueryClient();
  
  const prefetchVesselDetails = () => {
    queryClient.prefetchQuery({
      queryKey: ['vessel', vessel.imo],
      queryFn: () => apiRequest(`/api/vessels/${vessel.imo}`),
      staleTime: 5 * 60 * 1000,
    });
  };
  
  return (
    <div 
      onMouseEnter={prefetchVesselDetails}
      onClick={() => navigate(`/vessels/${vessel.imo}`)}
    >
      {vessel.name}
    </div>
  );
}
```

### Route-based Prefetching

```typescript
// src/hooks/usePrefetchRoutes.ts
import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { apiRequest } from '@/lib/apiClient';

export function usePrefetchDashboard() {
  const queryClient = useQueryClient();
  
  useEffect(() => {
    // Prefetch common dashboard data on app load
    queryClient.prefetchQuery({
      queryKey: ['vessels'],
      queryFn: () => apiRequest('/api/vessels'),
    });
    
    queryClient.prefetchQuery({
      queryKey: ['alerts'],
      queryFn: () => apiRequest('/api/alerts'),
    });
  }, [queryClient]);
}
```

### Background Refetch

```typescript
// src/hooks/queries/useBackgroundSync.ts
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/apiClient';

export function useBackgroundSync() {
  // Runs in background, doesn't show loading state
  return useQuery({
    queryKey: ['sync'],
    queryFn: () => apiRequest('/api/sync'),
    refetchInterval: 5 * 60 * 1000, // Every 5 minutes
    notifyOnChangeProps: [], // Don't trigger re-renders
    select: () => undefined, // Don't return data
  });
}
```

---

## Testing Patterns

### Mock Query Client

```typescript
// src/test/utils.tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react';

export function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
    },
  });
}

export function renderWithQueryClient(ui: React.ReactElement) {
  const testQueryClient = createTestQueryClient();
  
  return render(
    <QueryClientProvider client={testQueryClient}>
      {ui}
    </QueryClientProvider>
  );
}
```

### Testing Queries

```typescript
// src/hooks/queries/__tests__/useVessels.test.ts
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useVessels } from '../useVessels';
import * as apiClient from '@/lib/apiClient';

// Mock the API
jest.mock('@/lib/apiClient');

describe('useVessels', () => {
  let queryClient: QueryClient;
  
  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });
  });
  
  afterEach(() => {
    queryClient.clear();
  });
  
  const wrapper = ({ children }: any) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
  
  it('fetches vessels successfully', async () => {
    const mockVessels = [
      { id: '1', imo: '9123456', name: 'Test Vessel' },
    ];
    
    (apiClient.apiRequest as jest.Mock).mockResolvedValue({
      vessels: mockVessels,
    });
    
    const { result } = renderHook(() => useVessels(), { wrapper });
    
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    
    expect(result.current.data).toEqual(mockVessels);
  });
  
  it('handles errors', async () => {
    (apiClient.apiRequest as jest.Mock).mockRejectedValue(
      new Error('API Error')
    );
    
    const { result } = renderHook(() => useVessels(), { wrapper });
    
    await waitFor(() => expect(result.current.isError).toBe(true));
    
    expect(result.current.error).toBeDefined();
  });
});
```

### Testing Mutations

```typescript
// src/hooks/mutations/__tests__/useCreateDriver.test.ts
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useCreateDriver } from '../useCreateDriver';
import * as apiClient from '@/lib/apiClient';

jest.mock('@/lib/apiClient');

describe('useCreateDriver', () => {
  let queryClient: QueryClient;
  
  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        mutations: { retry: false },
      },
    });
  });
  
  const wrapper = ({ children }: any) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
  
  it('creates driver and invalidates cache', async () => {
    const mockDriver = {
      id: '1',
      name: 'John Doe',
      phone: '+15551234567',
    };
    
    (apiClient.apiRequest as jest.Mock).mockResolvedValue(mockDriver);
    
    const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries');
    
    const { result } = renderHook(() => useCreateDriver(), { wrapper });
    
    result.current.mutate({
      name: 'John Doe',
      phone: '+15551234567',
      email: 'john@example.com',
      license_number: 'DL12345',
    });
    
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: ['drivers'],
    });
  });
});
```

---

## Best Practices Summary

### 1. **Query Keys**
- Use arrays for hierarchical keys: `['vessels', imo]`
- Include all variables that affect the query
- Be consistent across the app

### 2. **Stale Time**
- Set based on data volatility
- Short for real-time data (1-2 minutes)
- Long for stable data (10+ minutes)

### 3. **Error Handling**
- Use global error boundaries
- Add query-specific error handling
- Show user-friendly error messages

### 4. **Optimistic Updates**
- Use for instant feedback
- Always include rollback logic
- Refetch after success

### 5. **Cache Invalidation**
- Invalidate related queries after mutations
- Use selective invalidation
- Consider manual updates for performance

### 6. **Performance**
- Enable keepPreviousData for pagination
- Prefetch on hover/route changes
- Use select to transform data

### 7. **Testing**
- Mock apiRequest function
- Test loading, success, and error states
- Verify cache invalidation

### 8. **DevTools**
- Keep React Query DevTools enabled in dev
- Monitor cache state and refetches
- Debug query timing issues

---

## Common Patterns Quick Reference

```typescript
// Basic query
const { data, isLoading, error } = useQuery({
  queryKey: ['key'],
  queryFn: fetchFn,
});

// Query with params
const { data } = useQuery({
  queryKey: ['key', param],
  queryFn: () => fetchFn(param),
  enabled: !!param,
});

// Mutation
const mutation = useMutation({
  mutationFn: updateFn,
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['key'] });
  },
});

// Optimistic update
const mutation = useMutation({
  mutationFn: updateFn,
  onMutate: async (newData) => {
    await queryClient.cancelQueries({ queryKey: ['key'] });
    const previous = queryClient.getQueryData(['key']);
    queryClient.setQueryData(['key'], newData);
    return { previous };
  },
  onError: (err, newData, context) => {
    queryClient.setQueryData(['key'], context?.previous);
  },
  onSettled: () => {
    queryClient.invalidateQueries({ queryKey: ['key'] });
  },
});

// Infinite scroll
const { data, fetchNextPage, hasNextPage } = useInfiniteQuery({
  queryKey: ['key'],
  queryFn: ({ pageParam }) => fetchFn(pageParam),
  initialPageParam: undefined,
  getNextPageParam: (lastPage) => lastPage.nextCursor,
});
```

---

This comprehensive skill covers everything needed for TanStack Query in IntegrationDirector!