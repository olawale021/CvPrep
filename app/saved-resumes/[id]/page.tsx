'use client';

import {
    ArrowLeft,
    Calendar,
    ChevronDown,
    ChevronUp,
    Crown,
    Edit,
    Eye,
    FileText,
    Loader2,
    Star,
    Trash2
} from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../../../components/ui/Dialog';
import Sidebar from '../../../components/ui/Sidebar';
import { useAuth } from '../../../context/AuthContext';
import { useDeleteResume, useSavedResume, useUpdateResume } from '../../../hooks/useSavedResumesCached';
import { SavedResume } from '../../../types/savedResume';
import OptimizedResume from '../../resume/optimize/components/OptimizedResume';
import { usePdfGenerator } from '../../resume/optimize/hooks/usePdfGenerator';
import { ResumeData } from '../../resume/optimize/types';

export default function SavedResumeViewPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  
  // Use cached hooks
  const { data: savedResume, isLoading: loading, error } = useSavedResume(id as string);
  const deleteResumeMutation = useDeleteResume();
  const updateResumeMutation = useUpdateResume();
  const { downloadPdf, isPdfGenerating } = usePdfGenerator();

  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showJobDescription, setShowJobDescription] = useState(false);

  // Convert saved resume data to ResumeData format for OptimizedResume component
  const convertToResumeData = (savedResume: SavedResume): ResumeData => {
    return {
      summary: savedResume.generated_summary || '',
      skills: savedResume.generated_skills || { technical_skills: [], soft_skills: [] },
      work_experience: savedResume.generated_work_experience || [],
      education: savedResume.generated_education?.map(edu => ({
        school: edu.institution || '',
        degree: edu.degree || '',
        dates: edu.graduationDate || ''
      })) || [],
      projects: savedResume.generated_projects?.map(proj => ({
        title: proj.title || '',
        description: proj.description || '',
        technologies: typeof proj.technologies === 'string' 
          ? proj.technologies.split(',').map(t => t.trim())
          : []
      })) || [],
      certifications: savedResume.generated_certifications || [],
      contact_details: {
        name: '',
        email: '',
        phone: '',
        location: ''
      }
    };
  };

  const handleDownloadPdf = async (editableResume?: ResumeData) => {
    if (!savedResume) return;

    try {
      const resumeData = editableResume || convertToResumeData(savedResume);
      const resumeResponse = {
        data: resumeData,
        original: resumeData,
        contact_details: {
          name: '',
          email: '',
          phone_number: '',
          location: ''
        }
      };
      
      await downloadPdf(resumeData, resumeResponse);
    } catch (error) {
      console.error("Error generating PDF:", error);
    }
  };

  const handleDelete = async () => {
    if (!savedResume) return;

    try {
      await deleteResumeMutation.mutateAsync(savedResume.id);
      router.push('/saved-resumes');
    } catch (error) {
      console.error('Error deleting resume:', error);
    } finally {
      setShowDeleteDialog(false);
    }
  };

  const handleSetPrimary = async () => {
    if (!savedResume) return;
    try {
      await updateResumeMutation.mutateAsync({ id: savedResume.id, isPrimary: true });
    } catch (error) {
      console.error('Error setting primary:', error);
    }
  };

  const handleToggleFavorite = async () => {
    if (!savedResume) return;
    try {
      await updateResumeMutation.mutateAsync({ 
        id: savedResume.id, 
        isFavorite: !savedResume.is_favorite 
      });
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
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
              onClick={() => router.push('/login')}
              className="w-full"
            >
              Sign In
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Loading state
  if (loading) {
    return (
      <div className="flex flex-col md:flex-row min-h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 p-4 md:p-6 pt-16 md:pt-6">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
              <p className="text-gray-600">Loading resume...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !savedResume) {
    return (
      <div className="flex flex-col md:flex-row min-h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 p-4 md:p-6 pt-16 md:pt-6">
          <div className="max-w-2xl mx-auto">
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
              <FileText className="h-12 w-12 text-red-400 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-red-800 mb-2">Resume Not Found</h2>
              <p className="text-red-600 mb-4">
                {error?.message || 'The resume you are looking for could not be found.'}
              </p>
              <Button 
                onClick={() => router.push('/saved-resumes')}
                variant="outline"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Saved Resumes
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-gray-50">
      <Sidebar />
      
      <div className="flex-1 p-4 md:p-6 pt-16 md:pt-6 overflow-x-hidden">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <Button 
              variant="ghost" 
              onClick={() => router.push('/saved-resumes')}
              className="mb-4 -ml-2"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Saved Resumes
            </Button>
            
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                    {savedResume.title}
                  </h1>
                  <div className="flex gap-2">
                    {savedResume.is_primary && (
                      <Badge variant="default" className="bg-yellow-100 text-yellow-800 border-yellow-200">
                        <Crown className="h-3 w-3 mr-1" />
                        Primary
                      </Badge>
                    )}
                    {savedResume.is_favorite && (
                      <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-200">
                        <Star className="h-3 w-3 mr-1" />
                        Favorite
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    Created: {formatDate(savedResume.created_at)}
                  </div>
                  {savedResume.updated_at !== savedResume.created_at && (
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      Updated: {formatDate(savedResume.updated_at)}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleToggleFavorite}
                  disabled={updateResumeMutation.isPending}
                >
                  <Star className={`h-4 w-4 mr-1 ${savedResume.is_favorite ? 'fill-current' : ''}`} />
                  {savedResume.is_favorite ? 'Unfavorite' : 'Favorite'}
                </Button>
                
                {!savedResume.is_primary && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSetPrimary}
                    disabled={updateResumeMutation.isPending}
                  >
                    <Crown className="h-4 w-4 mr-1" />
                    Set Primary
                  </Button>
                )}
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push(`/resume/edit/${savedResume.id}`)}
                >
                  <Edit className="h-4 w-4 mr-1" />
                  Edit
                </Button>
                
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setShowDeleteDialog(true)}
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete
                </Button>
              </div>
            </div>
          </div>

          {/* Job Description Toggle */}
          {savedResume.job_description && (
            <Card className="mb-6">
              <CardHeader className="pb-3">
                <Button
                  variant="ghost"
                  onClick={() => setShowJobDescription(!showJobDescription)}
                  className="flex items-center justify-between w-full p-0 h-auto font-medium text-left"
                >
                  <div className="flex items-center gap-2">
                    <Eye className="h-4 w-4" />
                    {showJobDescription ? 'Hide' : 'Show'} Target Job Description
                  </div>
                  {showJobDescription ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>
              </CardHeader>
              {showJobDescription && (
                <CardContent className="pt-0">
                  <div className="bg-gray-50 rounded-lg p-4 border">
                    <pre className="whitespace-pre-wrap text-sm text-gray-700 font-sans">
                      {savedResume.job_description}
                    </pre>
                  </div>
                </CardContent>
              )}
            </Card>
          )}

          {/* Resume Content */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Resume Content</span>
                <Button
                  onClick={() => handleDownloadPdf()}
                  disabled={isPdfGenerating}
                  size="sm"
                >
                  {isPdfGenerating ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <FileText className="h-4 w-4 mr-2" />
                  )}
                  Download PDF
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <OptimizedResume
                response={convertToResumeData(savedResume)}
                handleDownloadPdf={handleDownloadPdf}
                isPdfGenerating={isPdfGenerating}
              />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Resume</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{savedResume.title}&quot;? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 mt-4">
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              disabled={deleteResumeMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteResumeMutation.isPending}
            >
              {deleteResumeMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
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