import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../../lib/auth/supabaseClient';
import {
    SavedResume,
    SavedResumeListItem,
    SavedResumeListResponse,
    SavedResumeResponse,
    SaveResumeRequest,
    UpdateSavedResumeRequest
} from '../../types/api/savedResume';

export interface UseSavedResumesReturn {
  // State
  savedResumes: SavedResumeListItem[];
  loading: boolean;
  error: string | null;
  
  // Actions
  fetchSavedResumes: () => Promise<void>;
  saveResume: (request: SaveResumeRequest) => Promise<{ success: boolean; data?: SavedResume; error?: string }>;
  getSavedResume: (id: string) => Promise<{ success: boolean; data?: SavedResume; error?: string }>;
  updateSavedResume: (request: UpdateSavedResumeRequest) => Promise<{ success: boolean; data?: SavedResume; error?: string }>;
  deleteSavedResume: (id: string) => Promise<{ success: boolean; error?: string }>;
  
  // Utility functions
  setPrimary: (id: string) => Promise<void>;
  toggleFavorite: (id: string) => Promise<void>;
  refreshList: () => Promise<void>;
}

export function useSavedResumes(): UseSavedResumesReturn {
  const [savedResumes, setSavedResumes] = useState<SavedResumeListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get auth token for API calls
  const getAuthToken = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token;
  }, []);

  // Fetch all saved resumes
  const fetchSavedResumes = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const token = await getAuthToken();
      if (!token) {
        setError('Authentication required');
        return;
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

      setSavedResumes(data.data || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch saved resumes';
      setError(errorMessage);
      console.error('Error fetching saved resumes:', err);
    } finally {
      setLoading(false);
    }
  }, [getAuthToken]);

  // Save a new resume
  const saveResume = useCallback(async (request: SaveResumeRequest) => {
    try {
      const token = await getAuthToken();
      if (!token) {
        return { success: false, error: 'Authentication required' };
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
        return { success: false, error: data.error || 'Failed to save resume' };
      }

      // Refresh the list after saving
      await fetchSavedResumes();

      return { success: true, data: data.data };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save resume';
      console.error('Error saving resume:', err);
      return { success: false, error: errorMessage };
    }
  }, [getAuthToken, fetchSavedResumes]);

  // Get a single saved resume
  const getSavedResume = useCallback(async (id: string) => {
    try {
      const token = await getAuthToken();
      if (!token) {
        return { success: false, error: 'Authentication required' };
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
        return { success: false, error: data.error || 'Failed to fetch resume' };
      }

      return { success: true, data: data.data };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch resume';
      console.error('Error fetching resume:', err);
      return { success: false, error: errorMessage };
    }
  }, [getAuthToken]);

  // Update a saved resume
  const updateSavedResume = useCallback(async (request: UpdateSavedResumeRequest) => {
    try {
      const token = await getAuthToken();
      if (!token) {
        return { success: false, error: 'Authentication required' };
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
        return { success: false, error: data.error || 'Failed to update resume' };
      }

      // Refresh the list after updating
      await fetchSavedResumes();

      return { success: true, data: data.data };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update resume';
      console.error('Error updating resume:', err);
      return { success: false, error: errorMessage };
    }
  }, [getAuthToken, fetchSavedResumes]);

  // Delete a saved resume
  const deleteSavedResume = useCallback(async (id: string) => {
    try {
      const token = await getAuthToken();
      if (!token) {
        return { success: false, error: 'Authentication required' };
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
        return { success: false, error: data.error || 'Failed to delete resume' };
      }

      // Refresh the list after deleting
      await fetchSavedResumes();

      return { success: true };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete resume';
      console.error('Error deleting resume:', err);
      return { success: false, error: errorMessage };
    }
  }, [getAuthToken, fetchSavedResumes]);

  // Set a resume as primary
  const setPrimary = useCallback(async (id: string) => {
    const result = await updateSavedResume({ id, isPrimary: true });
    if (!result.success) {
      setError(result.error || 'Failed to set primary resume');
    }
  }, [updateSavedResume]);

  // Toggle favorite status
  const toggleFavorite = useCallback(async (id: string) => {
    const currentResume = savedResumes.find(r => r.id === id);
    if (!currentResume) return;

    const result = await updateSavedResume({ 
      id, 
      isFavorite: !currentResume.is_favorite 
    });
    
    if (!result.success) {
      setError(result.error || 'Failed to toggle favorite');
    }
  }, [savedResumes, updateSavedResume]);

  // Refresh the list (alias for fetchSavedResumes)
  const refreshList = useCallback(async () => {
    await fetchSavedResumes();
  }, [fetchSavedResumes]);

  // Load saved resumes on mount
  useEffect(() => {
    fetchSavedResumes();
  }, [fetchSavedResumes]);

  return {
    // State
    savedResumes,
    loading,
    error,
    
    // Actions
    fetchSavedResumes,
    saveResume,
    getSavedResume,
    updateSavedResume,
    deleteSavedResume,
    
    // Utility functions
    setPrimary,
    toggleFavorite,
    refreshList,
  };
} 