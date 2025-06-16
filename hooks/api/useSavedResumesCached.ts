import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { supabase } from '../../lib/auth/supabaseClient';
import {
    SavedResume,
    SavedResumeListItem,
    SavedResumeListResponse,
    SavedResumeResponse,
    SaveResumeRequest,
    UpdateSavedResumeRequest
} from '../../types/api/savedResume';

// Query keys for React Query
export const SAVED_RESUMES_KEYS = {
  all: ['saved-resumes'] as const,
  lists: () => [...SAVED_RESUMES_KEYS.all, 'list'] as const,
  list: (filters?: string) => [...SAVED_RESUMES_KEYS.lists(), filters] as const,
  details: () => [...SAVED_RESUMES_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...SAVED_RESUMES_KEYS.details(), id] as const,
};

// API functions
const getAuthToken = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token;
};

const fetchSavedResumesList = async (): Promise<SavedResumeListItem[]> => {
  const token = await getAuthToken();
  if (!token) {
    throw new Error('Authentication required');
  }

  const response = await fetch('/api/saved-resumes', {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  const data: SavedResumeListResponse = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(data.error || 'Failed to fetch saved resumes');
  }

  return data.data || [];
};

const fetchSavedResume = async (id: string): Promise<SavedResume> => {
  const token = await getAuthToken();
  if (!token) {
    throw new Error('Authentication required');
  }

  const response = await fetch(`/api/saved-resumes/${id}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  const data: SavedResumeResponse = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(data.error || 'Failed to fetch resume');
  }

  if (!data.data) {
    throw new Error('Resume not found');
  }

  return data.data;
};

const saveResumeAPI = async (request: SaveResumeRequest): Promise<SavedResume> => {
  const token = await getAuthToken();
  if (!token) {
    throw new Error('Authentication required');
  }

  const response = await fetch('/api/saved-resumes', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  const data: SavedResumeResponse = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(data.error || 'Failed to save resume');
  }

  if (!data.data) {
    throw new Error('No data returned from save operation');
  }

  return data.data;
};

const updateResumeAPI = async (request: UpdateSavedResumeRequest): Promise<SavedResume> => {
  const token = await getAuthToken();
  if (!token) {
    throw new Error('Authentication required');
  }

  const response = await fetch(`/api/saved-resumes/${request.id}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  const data: SavedResumeResponse = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(data.error || 'Failed to update resume');
  }

  if (!data.data) {
    throw new Error('No data returned from update operation');
  }

  return data.data;
};

const deleteResumeAPI = async (id: string): Promise<void> => {
  const token = await getAuthToken();
  if (!token) {
    throw new Error('Authentication required');
  }

  const response = await fetch(`/api/saved-resumes/${id}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  const data = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(data.error || 'Failed to delete resume');
  }
};

// Custom hooks
export function useSavedResumesList() {
  return useQuery({
    queryKey: SAVED_RESUMES_KEYS.list(),
    queryFn: fetchSavedResumesList,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}

export function useSavedResume(id: string) {
  return useQuery({
    queryKey: SAVED_RESUMES_KEYS.detail(id),
    queryFn: () => fetchSavedResume(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}

export function useSaveResume() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: saveResumeAPI,
    onSuccess: (newResume) => {
      // Update the list cache
      queryClient.setQueryData<SavedResumeListItem[]>(
        SAVED_RESUMES_KEYS.list(),
        (oldData) => {
          if (!oldData) return [newResume];
          return [newResume, ...oldData];
        }
      );

      // Set the individual resume cache
      queryClient.setQueryData(
        SAVED_RESUMES_KEYS.detail(newResume.id),
        newResume
      );

      // Invalidate to ensure fresh data
      queryClient.invalidateQueries({
        queryKey: SAVED_RESUMES_KEYS.lists(),
      });
    },
  });
}

export function useUpdateResume() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateResumeAPI,
    onSuccess: (updatedResume) => {
      // Update the list cache
      queryClient.setQueryData<SavedResumeListItem[]>(
        SAVED_RESUMES_KEYS.list(),
        (oldData) => {
          if (!oldData) return [updatedResume];
          return oldData.map((resume) =>
            resume.id === updatedResume.id ? updatedResume : resume
          );
        }
      );

      // Update the individual resume cache
      queryClient.setQueryData(
        SAVED_RESUMES_KEYS.detail(updatedResume.id),
        updatedResume
      );

      // If setting as primary, invalidate all to update other resumes
      if (updatedResume.is_primary) {
        queryClient.invalidateQueries({
          queryKey: SAVED_RESUMES_KEYS.lists(),
        });
      }
    },
  });
}

export function useDeleteResume() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteResumeAPI,
    onSuccess: (_, deletedId) => {
      // Remove from list cache
      queryClient.setQueryData<SavedResumeListItem[]>(
        SAVED_RESUMES_KEYS.list(),
        (oldData) => {
          if (!oldData) return [];
          return oldData.filter((resume) => resume.id !== deletedId);
        }
      );

      // Remove individual resume cache
      queryClient.removeQueries({
        queryKey: SAVED_RESUMES_KEYS.detail(deletedId),
      });

      // Invalidate to ensure fresh data
      queryClient.invalidateQueries({
        queryKey: SAVED_RESUMES_KEYS.lists(),
      });
    },
  });
}

// Utility hooks
export function useSetPrimaryResume() {
  const updateResume = useUpdateResume();

  return useCallback(
    (id: string) => {
      return updateResume.mutateAsync({ id, isPrimary: true });
    },
    [updateResume]
  );
}

export function useToggleFavoriteResume() {
  const updateResume = useUpdateResume();
  const queryClient = useQueryClient();

  return useCallback(
    (id: string) => {
      // Get current data to determine current favorite status
      const currentData = queryClient.getQueryData<SavedResumeListItem[]>(
        SAVED_RESUMES_KEYS.list()
      );
      
      const currentResume = currentData?.find((r) => r.id === id);
      if (!currentResume) return Promise.reject(new Error('Resume not found'));

      return updateResume.mutateAsync({ 
        id, 
        isFavorite: !currentResume.is_favorite 
      });
    },
    [updateResume, queryClient]
  );
}

// Combined hook for backward compatibility
export interface UseSavedResumesCachedReturn {
  // State
  savedResumes: SavedResumeListItem[];
  loading: boolean;
  error: string | null;
  
  // Actions
  refetch: () => void;
  saveResume: (request: SaveResumeRequest) => Promise<SavedResume>;
  getSavedResume: (id: string) => Promise<SavedResume>;
  updateSavedResume: (request: UpdateSavedResumeRequest) => Promise<SavedResume>;
  deleteSavedResume: (id: string) => Promise<void>;
  
  // Utility functions
  setPrimary: (id: string) => Promise<SavedResume>;
  toggleFavorite: (id: string) => Promise<SavedResume>;
}

export function useSavedResumesCached(): UseSavedResumesCachedReturn {
  const { data: savedResumes = [], isLoading, error, refetch } = useSavedResumesList();
  const saveResumeMutation = useSaveResume();
  const updateResumeMutation = useUpdateResume();
  const deleteResumeMutation = useDeleteResume();
  const setPrimary = useSetPrimaryResume();
  const toggleFavorite = useToggleFavoriteResume();

  return {
    // State
    savedResumes,
    loading: isLoading,
    error: error?.message || null,
    
    // Actions
    refetch,
    saveResume: saveResumeMutation.mutateAsync,
    getSavedResume: fetchSavedResume,
    updateSavedResume: updateResumeMutation.mutateAsync,
    deleteSavedResume: deleteResumeMutation.mutateAsync,
    
    // Utility functions
    setPrimary,
    toggleFavorite,
  };
} 