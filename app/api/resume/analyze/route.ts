import { NextRequest, NextResponse } from 'next/server';
import { extractContactDetails } from '../../../../lib/services/resume/resumeUtils/extractContactDetails';
import { extractTextFromFile } from '../../../../lib/services/resume/resumeUtils/fileParser';
import { structure_resume } from '../../../../lib/services/resume/resumeUtils/resumeParser';

export const config = {
  api: {
    bodyParser: false,
  },
};

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const jobDescription = formData.get('job') as string;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!jobDescription) {
      return NextResponse.json({ error: 'No job description provided' }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = ['application/pdf', 'text/plain', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Invalid file type. Please upload a PDF, DOC, DOCX, or TXT file.' }, { status: 400 });
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large. Please upload a file smaller than 5MB.' }, { status: 400 });
    }

    // Convert file to buffer
    const buffer = Buffer.from(await file.arrayBuffer());
    
    // Extract text from the file
    const resumeText = await extractTextFromFile(buffer, file.type);
    
    if (!resumeText || resumeText.trim().length < 50) {
      return NextResponse.json({ error: 'Could not extract sufficient text from the file. Please ensure the file contains readable text.' }, { status: 400 });
    }
    
    // Structure the resume (analyze without optimization)
    const structuredResume = await structure_resume(resumeText);
    
    // Validate that structuring worked
    if (!structuredResume || typeof structuredResume !== 'object') {
      return NextResponse.json({ error: 'Failed to process resume structure. Please try again.' }, { status: 500 });
    }
    
    // Extract contact details with error handling
    let contactDetails;
    try {
      contactDetails = await extractContactDetails(resumeText);
    } catch (contactError) {
      console.warn('Contact details extraction failed:', contactError);
      contactDetails = {}; // Fallback to empty object
    }
    
    // Get the technical skills array from the structured resume
    const technicalSkills = structuredResume["Technical Skills"] || [];
    
    // Process skills to ensure we have individual skills, not grouped ones
    const processedSkills: string[] = [];
    technicalSkills.forEach(skill => {
      try {
        // Check if skill contains parentheses with grouped skills
        const parenthesesMatch = skill.match(/^(.+?)\s*\((.+)\)$/);
        if (parenthesesMatch && parenthesesMatch[2]) {
          // Extract individual skills from parentheses
          const groupedSkills = parenthesesMatch[2];
          const individualSkills = groupedSkills.split(/[,\s]+/).filter(s => s.trim().length > 0);
          processedSkills.push(...individualSkills);
        } else {
          // Check if skill contains comma-separated values
          const commaSeparated = skill.split(',').map(s => s.trim()).filter(s => s.length > 0);
          if (commaSeparated.length > 1) {
            processedSkills.push(...commaSeparated);
          } else {
            processedSkills.push(skill.trim());
          }
        }
      } catch (regexError) {
        console.warn('Regex error processing skill:', skill, regexError);
        // Fallback: just add the skill as-is
        processedSkills.push(skill.trim());
      }
    });
    
    // Remove duplicates and filter out empty/invalid skills
    const uniqueSkills = [...new Set(processedSkills)]
      .filter(skill => skill && skill.length > 1 && skill.length < 50)
      .map(skill => skill.trim());
    
    // Process projects to extract title and technologies
    const processedProjects = structuredResume.Projects?.map((projectText, index) => {
      try {
        // Try to extract project title and technologies from the description
        const lines = projectText.split('\n').filter(line => line.trim());
        let title = `Project ${index + 1}`;
        let description = projectText;
        let technologies: string[] = [];
        
        // Look for title in the first line or common patterns
        if (lines.length > 0) {
          const firstLine = lines[0].trim();
          // If first line is short and doesn't contain technical details, it's likely the title
          if (firstLine.length < 100 && !firstLine.toLowerCase().includes('using') && !firstLine.toLowerCase().includes('with')) {
            title = firstLine;
            description = lines.slice(1).join('\n').trim() || firstLine;
          }
        }
        
        // Extract technologies from the description with safer patterns
        try {
          const techPatterns = [
            /(?:using|with|built with|technologies?:?|stack:?)\s*([^.!?\n]+)/gi,
            /(?:react|angular|vue|node|python|java|javascript|typescript|html|css|sql|mongodb|postgresql|mysql|express|spring|django|flask)/gi
          ];
          
          const foundTechs = new Set<string>();
          techPatterns.forEach(pattern => {
            try {
              const matches = description.match(pattern);
              if (matches) {
                matches.forEach(match => {
                  try {
                    // Extract individual technologies with safer regex
                    const techs = match.split(/[,\s]+/).filter(tech => {
                      // Safer validation
                      if (!tech || tech.length <= 2 || tech.length > 30) return false;
                      // Simple alphanumeric check instead of complex regex
                      const isValid = /^[a-zA-Z0-9.-]+$/.test(tech.trim());
                      const isNotStopWord = !['using', 'with', 'built', 'technologies', 'technology', 'stack'].includes(tech.toLowerCase());
                      return isValid && isNotStopWord;
                    });
                    techs.forEach(tech => foundTechs.add(tech.trim()));
                  } catch (techError) {
                    console.warn('Error processing tech match:', match, techError);
                  }
                });
              }
            } catch (patternError) {
              console.warn('Error with tech pattern:', pattern, patternError);
            }
          });
          
          technologies = Array.from(foundTechs);
        } catch (techExtractError) {
          console.warn('Error extracting technologies:', techExtractError);
          technologies = [];
        }
        
        return {
          title: title || `Project ${index + 1}`,
          name: title || `Project ${index + 1}`, // For backward compatibility
          description: description || projectText,
          technologies: technologies
        };
      } catch (projectError) {
        console.warn('Error processing project:', projectText, projectError);
        return {
          title: `Project ${index + 1}`,
          name: `Project ${index + 1}`,
          description: projectText || '',
          technologies: []
        };
      }
    }) || [];
    
    // Convert to the format expected by the frontend
    const analyzedResume = {
      summary: structuredResume.Summary || "",
      contact_details: contactDetails,
      work_experience: structuredResume["Work Experience"]?.map(exp => ({
        company: exp.company,
        title: exp.role,
        dates: exp.date_range,
        accomplishments: exp.accomplishments
      })) || [],
      skills: {
        technical_skills: uniqueSkills
      },
      education: structuredResume.Education?.map(edu => ({
        degree: edu.degree,
        school: edu.institution,
        dates: edu.graduation_date
      })) || [],
      certifications: structuredResume.Certifications || [],
      projects: processedProjects
    };
    
    return NextResponse.json(analyzedResume);
    
  } catch (error) {
    console.error('ANALYZE API Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json({ 
      error: 'Internal server error',
      message: 'An unexpected error occurred. Please try again.',
      details: errorMessage
    }, { status: 500 });
  }
} 