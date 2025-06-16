'use client';

import {
    Calendar,
    Crown,
    Download,
    Edit,
    Eye,
    FileText,
    Loader2,
    MoreVertical,
    Search,
    Star,
    Trash2
} from 'lucide-react';
import { useState } from 'react';
import { Badge } from '../../components/ui/base/Badge';
import { Button } from '../../components/ui/base/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/base/Card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../../components/ui/composite/Dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from '../../components/ui/composite/DropdownMenu';
import { Input } from '../../components/ui/base/Input';
import Sidebar from '../../components/layout/Sidebar';
import { useAuth } from '../../context/AuthContext';
import { useSavedResumesCached } from '../../hooks/api/useSavedResumesCached';
import { SavedResumeListItem } from '../../types/api/savedResume';

export default function SavedResumesPage() {
  const { user, isLoading: authLoading } = useAuth();
  const { 
    savedResumes, 
    loading, 
    error, 
    deleteSavedResume, 
    setPrimary, 
    toggleFavorite 
  } = useSavedResumesCached();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'favorites' | 'primary'>('all');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Filter resumes based on search and filter type
  const filteredResumes = savedResumes.filter(resume => {
    const matchesSearch = resume.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         resume.job_description?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesFilter = filterType === 'all' || 
                         (filterType === 'favorites' && resume.is_favorite) ||
                         (filterType === 'primary' && resume.is_primary);
    
    return matchesSearch && matchesFilter;
  });

  // Sort resumes: favorites first, then primary, then by date
  const sortedResumes = [...filteredResumes].sort((a, b) => {
    if (a.is_favorite && !b.is_favorite) return -1;
    if (!a.is_favorite && b.is_favorite) return 1;
    if (a.is_primary && !b.is_primary) return -1;
    if (!a.is_primary && b.is_primary) return 1;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  const handleDelete = async (id: string) => {
    setIsDeleting(true);
    try {
      await deleteSavedResume(id);
      setDeleteConfirmId(null);
    } catch (error) {
      console.error('Error deleting resume:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSetPrimary = async (id: string) => {
    await setPrimary(id);
  };

  const handleToggleFavorite = async (id: string) => {
    await toggleFavorite(id);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Redirect to login if not authenticated
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <FileText className="h-12 w-12 text-blue-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Authentication Required</h2>
            <p className="text-gray-600 mb-6">Please sign in to view your saved resumes.</p>
            <Button 
              onClick={() => window.location.href = '/login'}
              className="w-full"
            >
              Sign In
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar />
      
      {/* Main Content */}
      <div className="flex-1 p-2 sm:p-4 md:p-6 pt-16 md:pt-6 overflow-x-hidden">
        <div className="w-full max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2 flex items-center gap-2">
              <FileText className="h-7 w-7 md:h-8 md:w-8 text-blue-600" />
              Saved Resumes
            </h1>
            <p className="text-gray-600">
              Manage your saved resumes. View, edit, download, or delete your resumes anytime.
            </p>
          </div>

          {/* Search and Filter Bar */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search resumes by title or job description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant={filterType === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterType('all')}
              >
                All ({savedResumes.length})
              </Button>
              <Button
                variant={filterType === 'favorites' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterType('favorites')}
                className="flex items-center gap-1"
              >
                <Star className="h-3 w-3" />
                Favorites ({savedResumes.filter(r => r.is_favorite).length})
              </Button>
              <Button
                variant={filterType === 'primary' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterType('primary')}
                className="flex items-center gap-1"
              >
                <Crown className="h-3 w-3" />
                Primary ({savedResumes.filter(r => r.is_primary).length})
              </Button>
            </div>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
                <p className="text-gray-600">Loading your saved resumes...</p>
              </div>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-red-800">{error}</p>
            </div>
          )}

          {/* Empty State */}
          {!loading && !error && sortedResumes.length === 0 && (
            <div className="text-center py-12">
              <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {searchQuery || filterType !== 'all' ? 'No resumes found' : 'No saved resumes yet'}
              </h3>
              <p className="text-gray-600 mb-6">
                {searchQuery || filterType !== 'all' 
                  ? 'Try adjusting your search or filter criteria.'
                  : 'Create your first resume to get started.'
                }
              </p>
              {!searchQuery && filterType === 'all' && (
                <Button onClick={() => window.location.href = '/resume/create'}>
                  Create Resume
                </Button>
              )}
            </div>
          )}

          {/* Resumes Grid */}
          {!loading && !error && sortedResumes.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sortedResumes.map((resume) => (
                <ResumeCard
                  key={resume.id}
                  resume={resume}
                  onDelete={() => setDeleteConfirmId(resume.id)}
                  onSetPrimary={() => handleSetPrimary(resume.id)}
                  onToggleFavorite={() => handleToggleFavorite(resume.id)}
                  formatDate={formatDate}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Resume</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this resume? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end space-x-2 pt-4">
            <Button
              variant="outline"
              onClick={() => setDeleteConfirmId(null)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Deleting...
                </>
              ) : (
                'Delete Resume'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Resume Card Component
interface ResumeCardProps {
  resume: SavedResumeListItem;
  onDelete: () => void;
  onSetPrimary: () => void;
  onToggleFavorite: () => void;
  formatDate: (date: string) => string;
}

function ResumeCard({ resume, onDelete, onSetPrimary, onToggleFavorite, formatDate }: ResumeCardProps) {
  const handleCardClick = () => {
    window.location.href = `/saved-resumes/${resume.id}`;
  };

  return (
    <Card 
      className="hover:shadow-lg transition-shadow duration-200 cursor-pointer group"
      onClick={handleCardClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg font-semibold text-gray-900 truncate group-hover:text-blue-600 transition-colors">
              {resume.title}
            </CardTitle>
            <div className="flex items-center gap-2 mt-1">
              {resume.is_primary && (
                <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                  <Crown className="h-3 w-3 mr-1" />
                  Primary
                </Badge>
              )}
              {resume.is_favorite && (
                <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                  <Star className="h-3 w-3 mr-1" />
                  Favorite
                </Badge>
              )}
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 w-8 p-0"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => window.location.href = `/saved-resumes/${resume.id}`}>
                <Eye className="h-4 w-4 mr-2" />
                View Resume
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => window.location.href = `/saved-resumes/${resume.id}/edit`}>
                <Edit className="h-4 w-4 mr-2" />
                Edit Resume
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => window.location.href = `/saved-resumes/${resume.id}/download`}>
                <Download className="h-4 w-4 mr-2" />
                Download PDF
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onToggleFavorite}>
                <Star className={`h-4 w-4 mr-2 ${resume.is_favorite ? 'fill-current' : ''}`} />
                {resume.is_favorite ? 'Remove from Favorites' : 'Add to Favorites'}
              </DropdownMenuItem>
              {!resume.is_primary && (
                <DropdownMenuItem onClick={onSetPrimary}>
                  <Crown className="h-4 w-4 mr-2" />
                  Set as Primary
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onDelete} className="text-red-600">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Resume
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {resume.job_description && (
            <p className="text-sm text-gray-600 line-clamp-2">
              {resume.job_description.substring(0, 100)}...
            </p>
          )}
          <div className="flex items-center text-xs text-gray-500">
            <Calendar className="h-3 w-3 mr-1" />
            Created {formatDate(resume.created_at)}
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 