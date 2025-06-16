import { NextRequest, NextResponse } from 'next/server';
import { getServerUser } from '../../../lib/auth/supabase-server';
import { supabaseAdmin } from '../../../lib/auth/supabaseClient';
import { SaveResumeRequest, SavedResumeListResponse, SavedResumeResponse } from '../../../types/api/savedResume';

// GET - List all saved resumes for the authenticated user
export async function GET(req: NextRequest) {
  try {
    // Get user using proper SSR authentication
    const { user, error: authError } = await getServerUser(req);
    
    if (authError || !user) {
      return NextResponse.json({ 
        success: false, 
        error: 'Authentication required' 
      }, { status: 401 });
    }

    if (!supabaseAdmin) {
      return NextResponse.json({ 
        success: false, 
        error: 'Service configuration error' 
      }, { status: 500 });
    }

    // Fetch saved resumes for the user using admin client to bypass RLS
    const { data: savedResumes, error: fetchError } = await supabaseAdmin
      .from('saved_resumes')
      .select(`
        id,
        title,
        is_primary,
        is_favorite,
        created_at,
        updated_at,
        job_description
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (fetchError) {
      console.error('Error fetching saved resumes:', fetchError);
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to fetch saved resumes' 
      }, { status: 500 });
    }

    const response: SavedResumeListResponse = {
      success: true,
      data: savedResumes || []
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Saved resumes API error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}

// POST - Save a new resume
export async function POST(req: NextRequest) {
  try {
    // Get user using proper SSR authentication
    const { user, error: authError } = await getServerUser(req);
    
    if (authError || !user) {
      return NextResponse.json({ 
        success: false, 
        error: 'Authentication required' 
      }, { status: 401 });
    }

    if (!supabaseAdmin) {
      return NextResponse.json({ 
        success: false, 
        error: 'Service configuration error' 
      }, { status: 500 });
    }

    // Parse request body
    const body: SaveResumeRequest = await req.json();
    const { title, formData, generatedData, isPrimary = false, isFavorite = false } = body;

    // Validate required fields
    if (!title || !title.trim()) {
      return NextResponse.json({ 
        success: false, 
        error: 'Resume title is required' 
      }, { status: 400 });
    }

    if (!generatedData) {
      return NextResponse.json({ 
        success: false, 
        error: 'Generated resume data is required' 
      }, { status: 400 });
    }

    // Prepare data for insertion
    const resumeData = {
      user_id: user.id,
      title: title.trim(),
      
      // Original form data
      job_description: formData?.jobDescription || null,
      current_summary: formData?.currentSummary || null,
      work_experience: formData?.workExperience || null,
      education: formData?.education || null,
      projects: formData?.projects || null,
      certifications: formData?.certifications || null,
      licenses: formData?.licenses || null,
      
      // Generated resume data
      generated_summary: generatedData.summary || null,
      generated_skills: generatedData.skills || null,
      generated_work_experience: generatedData.work_experience || null,
      generated_education: generatedData.education || null,
      generated_projects: generatedData.projects || null,
      generated_certifications: generatedData.certifications || null,
      
      // Metadata
      is_primary: isPrimary,
      is_favorite: isFavorite
    };

    // Insert the saved resume using admin client to bypass RLS
    const { data: savedResume, error: insertError } = await supabaseAdmin
      .from('saved_resumes')
      .insert([resumeData])
      .select()
      .single();

    if (insertError) {
      console.error('Error saving resume:', insertError);
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to save resume' 
      }, { status: 500 });
    }

    const response: SavedResumeResponse = {
      success: true,
      data: savedResume
    };

    return NextResponse.json(response, { status: 201 });

  } catch (error) {
    console.error('Save resume API error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
} 