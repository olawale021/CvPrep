import { NextRequest, NextResponse } from 'next/server';
import { getServerUser } from '../../../../lib/auth/supabase-server';
import { supabaseAdmin } from '../../../../lib/auth/supabaseClient';
import { SavedResumeResponse, UpdateSavedResumeRequest } from '../../../../types/api/savedResume';

// GET - Get a specific saved resume
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;

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

    // Fetch the specific saved resume for the user
    const { data: savedResume, error: fetchError } = await supabaseAdmin
      .from('saved_resumes')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id) // Ensure user can only access their own resumes
      .single();

    if (fetchError) {
      console.error('Error fetching saved resume:', fetchError);
      
      if (fetchError.code === 'PGRST116') { // No rows returned
        return NextResponse.json({ 
          success: false, 
          error: 'Resume not found' 
        }, { status: 404 });
      }
      
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
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;

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
    const body: UpdateSavedResumeRequest = await req.json();
    const { title, isPrimary, isFavorite } = body;

    // Prepare update data (only include fields that are provided)
    const updateData: Record<string, unknown> = {};
    
    if (title !== undefined) {
      if (!title.trim()) {
        return NextResponse.json({ 
          success: false, 
          error: 'Resume title cannot be empty' 
        }, { status: 400 });
      }
      updateData.title = title.trim();
    }
    
    if (isPrimary !== undefined) {
      updateData.is_primary = isPrimary;
      
      // If setting as primary, unset other primary resumes first
      if (isPrimary) {
        await supabaseAdmin
          .from('saved_resumes')
          .update({ is_primary: false })
          .eq('user_id', user.id)
          .neq('id', id);
      }
    }
    
    if (isFavorite !== undefined) {
      updateData.is_favorite = isFavorite;
    }

    // Add updated timestamp
    updateData.updated_at = new Date().toISOString();

    // Update the saved resume
    const { data: updatedResume, error: updateError } = await supabaseAdmin
      .from('saved_resumes')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', user.id) // Ensure user can only update their own resumes
      .select()
      .single();

    if (updateError) {
      console.error('Error updating saved resume:', updateError);
      
      if (updateError.code === 'PGRST116') { // No rows returned
        return NextResponse.json({ 
          success: false, 
          error: 'Resume not found or you do not have permission to update it' 
        }, { status: 404 });
      }
      
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
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;

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

    // Delete the saved resume
    const { error: deleteError } = await supabaseAdmin
      .from('saved_resumes')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id); // Ensure user can only delete their own resumes

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