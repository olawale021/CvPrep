import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../../lib/auth/supabaseClient';
import { SavedResumeResponse, UpdateSavedResumeRequest } from '../../../../types/api/savedResume';

// GET - Fetch a single saved resume
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Get user from auth token
    const authHeader = req.headers.get('Authorization');
    const sessionCookie = req.cookies.get('sb-access-token')?.value;
    const token = authHeader?.replace('Bearer ', '') || sessionCookie;

    if (!token) {
      return NextResponse.json({ 
        success: false, 
        error: 'Authentication required' 
      }, { status: 401 });
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid authentication token' 
      }, { status: 401 });
    }

    // Fetch the saved resume
    const { data: savedResume, error: fetchError } = await supabase
      .from('saved_resumes')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json({ 
          success: false, 
          error: 'Resume not found' 
        }, { status: 404 });
      }
      
      console.error('Error fetching saved resume:', fetchError);
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to fetch resume' 
      }, { status: 500 });
    }

    const response: SavedResumeResponse = {
      success: true,
      data: savedResume
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Get saved resume API error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}

// PUT - Update a saved resume
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Get user from auth token
    const authHeader = req.headers.get('Authorization');
    const sessionCookie = req.cookies.get('sb-access-token')?.value;
    const token = authHeader?.replace('Bearer ', '') || sessionCookie;

    if (!token) {
      return NextResponse.json({ 
        success: false, 
        error: 'Authentication required' 
      }, { status: 401 });
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid authentication token' 
      }, { status: 401 });
    }

    // Parse request body
    const body: UpdateSavedResumeRequest = await req.json();
    const { title, generatedData, isPrimary, isFavorite } = body;

    // Build update object with only provided fields
    const updateData: {
      title?: string;
      generated_summary?: string;
      generated_skills?: unknown;
      generated_work_experience?: unknown;
      generated_education?: unknown;
      generated_projects?: unknown;
      generated_certifications?: unknown;
      is_primary?: boolean;
      is_favorite?: boolean;
    } = {};
    
    if (title !== undefined) {
      if (!title.trim()) {
        return NextResponse.json({ 
          success: false, 
          error: 'Resume title cannot be empty' 
        }, { status: 400 });
      }
      updateData.title = title.trim();
    }
    
    if (generatedData !== undefined) {
      if (generatedData.summary !== undefined) updateData.generated_summary = generatedData.summary;
      if (generatedData.skills !== undefined) updateData.generated_skills = generatedData.skills;
      if (generatedData.work_experience !== undefined) updateData.generated_work_experience = generatedData.work_experience;
      if (generatedData.education !== undefined) updateData.generated_education = generatedData.education;
      if (generatedData.projects !== undefined) updateData.generated_projects = generatedData.projects;
      if (generatedData.certifications !== undefined) updateData.generated_certifications = generatedData.certifications;
    }
    
    if (isPrimary !== undefined) updateData.is_primary = isPrimary;
    if (isFavorite !== undefined) updateData.is_favorite = isFavorite;

    // Check if there's anything to update
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'No fields to update' 
      }, { status: 400 });
    }

    // Update the saved resume
    const { data: updatedResume, error: updateError } = await supabase
      .from('saved_resumes')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (updateError) {
      if (updateError.code === 'PGRST116') {
        return NextResponse.json({ 
          success: false, 
          error: 'Resume not found' 
        }, { status: 404 });
      }
      
      console.error('Error updating saved resume:', updateError);
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to update resume' 
      }, { status: 500 });
    }

    const response: SavedResumeResponse = {
      success: true,
      data: updatedResume
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Update saved resume API error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}

// DELETE - Delete a saved resume
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Get user from auth token
    const authHeader = req.headers.get('Authorization');
    const sessionCookie = req.cookies.get('sb-access-token')?.value;
    const token = authHeader?.replace('Bearer ', '') || sessionCookie;

    if (!token) {
      return NextResponse.json({ 
        success: false, 
        error: 'Authentication required' 
      }, { status: 401 });
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid authentication token' 
      }, { status: 401 });
    }

    // Delete the saved resume
    const { error: deleteError } = await supabase
      .from('saved_resumes')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (deleteError) {
      console.error('Error deleting saved resume:', deleteError);
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to delete resume' 
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Resume deleted successfully' 
    });

  } catch (error) {
    console.error('Delete saved resume API error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
} 