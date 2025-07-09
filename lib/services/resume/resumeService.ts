import { supabase } from '../../auth/supabaseClient';
import { sanitizeFilename, validateFileUpload } from '../../core/inputSanitization';
import logger from '../../core/logger';

// Resume bucket name
const RESUME_BUCKET = 'resumes';

// Resume file types allowed
const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // docx
  'application/vnd.oasis.opendocument.text', // odt
];

// Max file size (5MB)
const MAX_FILE_SIZE = 5 * 1024 * 1024;

// Resume type definitions
export interface Resume {
  id: string;
  title: string;
  file_name: string;
  file_url: string;
  file_type: string;
  file_size: number;
  is_primary: boolean;
  created_at: string;
  updated_at: string;
}

export interface ResumeUploadParams {
  file: File;
  userId: string;
  title: string;
  isPrimary?: boolean;
}

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Enhanced validate resume file with better security checks
 */
export function validateResumeFile(file: File): ValidationResult {
  // Use the enhanced validation from input sanitization module
  return validateFileUpload(file, {
    maxSize: MAX_FILE_SIZE,
    allowedTypes: ALLOWED_MIME_TYPES,
    allowedExtensions: ['.pdf', '.doc', '.docx', '.odt']
  });
}

/**
 * Upload a resume file to Supabase storage and save metadata to database
 */
export async function uploadResume(params: ResumeUploadParams): Promise<{ success: boolean; resume?: Resume; error?: string }> {
  try {
    const { file, userId, title, isPrimary = false } = params;
    
    // Log current Supabase user and session for debugging
    // const currentUser = await supabase.auth.getUser();
    // const currentSession = await supabase.auth.getSession();
    

    // Validate file first
    const validation = validateResumeFile(file);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    // Create a unique file name with sanitization
    const timestamp = new Date().getTime();
    const fileExt = file.name.split('.').pop();
    const sanitizedOriginalName = sanitizeFilename(file.name.split('.').slice(0, -1).join('.'));
    const fileName = `${userId}-${timestamp}-${sanitizedOriginalName}.${fileExt}`;
    const filePath = `${userId}/${fileName}`;

    // Upload file to Supabase Storage
    const { error: storageError } = await supabase.storage
      .from(RESUME_BUCKET)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (storageError) {
      logger.error('Resume upload storage error', {
        error: storageError,
        userId,
        context: 'ResumeService',
      });
      return { success: false, error: storageError.message };
    }

    // Get the public URL for the file
    const { data: { publicUrl } } = supabase.storage
      .from(RESUME_BUCKET)
      .getPublicUrl(filePath);

    // Insert the resume record into the database
    const { data: resumeData, error: dbError } = await supabase
      .from('resumes')
      .insert({
        user_id: userId,
        title,
        file_name: file.name,
        file_url: publicUrl,
        file_type: file.type,
        file_size: file.size,
        is_primary: isPrimary,
      })
      .select()
      .single();

    if (dbError) {
      logger.error('Resume database insert error', {
        error: dbError,
        userId,
        context: 'ResumeService',
      });
      
      // If DB insert fails, try to clean up the uploaded file
      await supabase.storage.from(RESUME_BUCKET).remove([filePath]);
      
      return { success: false, error: dbError.message };
    }

    logger.info('Resume uploaded successfully', {
      resumeId: resumeData.id,
      userId,
      context: 'ResumeService',
    });

    return { success: true, resume: resumeData as Resume };
  } catch (error) {
    logger.error('Unexpected error in resume upload', {
      error,
      context: 'ResumeService',
    });
    return { success: false, error: 'An unexpected error occurred during upload' };
  }
}

/**
 * Get all resumes for a user
 */
export async function getUserResumes(userId: string): Promise<{ resumes: Resume[]; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('resumes')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('Error fetching user resumes', {
        error,
        userId,
        context: 'ResumeService',
      });
      return { resumes: [], error: error.message };
    }

    return { resumes: data as Resume[] };
  } catch (error) {
    logger.error('Unexpected error fetching resumes', {
      error,
      context: 'ResumeService',
    });
    return { resumes: [], error: 'An unexpected error occurred' };
  }
}

/**
 * Set a resume as primary
 */
export async function setPrimaryResume(resumeId: string, userId: string): Promise<{ success: boolean; error?: string }> {
  try {
    // First verify the resume belongs to this user
    const { data: resumeCheck, error: checkError } = await supabase
      .from('resumes')
      .select('id')
      .eq('id', resumeId)
      .eq('user_id', userId)
      .single();

    if (checkError || !resumeCheck) {
      return { success: false, error: 'Resume not found or access denied' };
    }

    // Update the resume to be primary (trigger will handle updating others)
    const { error } = await supabase
      .from('resumes')
      .update({ is_primary: true })
      .eq('id', resumeId);

    if (error) {
      logger.error('Error setting primary resume', {
        error,
        resumeId,
        userId,
        context: 'ResumeService',
      });
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    logger.error('Unexpected error setting primary resume', {
      error,
      context: 'ResumeService',
    });
    return { success: false, error: 'An unexpected error occurred' };
  }
}

/**
 * Delete a resume
 */
export async function deleteResume(resumeId: string, userId: string): Promise<{ success: boolean; error?: string }> {
  try {
    // First get the resume to find the file path
    const { data: resume, error: getError } = await supabase
      .from('resumes')
      .select('*')
      .eq('id', resumeId)
      .eq('user_id', userId)
      .single();

    if (getError || !resume) {
      return { success: false, error: 'Resume not found or access denied' };
    }

    // Delete from database first
    const { error: dbError } = await supabase
      .from('resumes')
      .delete()
      .eq('id', resumeId);

    if (dbError) {
      logger.error('Error deleting resume from database', {
        error: dbError,
        resumeId,
        userId,
        context: 'ResumeService',
      });
      return { success: false, error: dbError.message };
    }

    // Extract the file path from the URL
    const fileUrl = resume.file_url;
    const urlParts = fileUrl.split('/');
    const filePath = `${userId}/${urlParts[urlParts.length - 1]}`;

    // Delete from storage
    const { error: storageError } = await supabase.storage
      .from(RESUME_BUCKET)
      .remove([filePath]);

    if (storageError) {
      logger.error('Error deleting resume file from storage', {
        error: storageError,
        resumeId,
        userId,
        context: 'ResumeService',
      });
      // We don't return failure here since the DB record is already gone
      // and that's what matters most to the user
    }

    return { success: true };
  } catch (error) {
    logger.error('Unexpected error deleting resume', {
      error,
      context: 'ResumeService',
    });
    return { success: false, error: 'An unexpected error occurred' };
  }
} 