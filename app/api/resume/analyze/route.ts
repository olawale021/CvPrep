import { NextRequest, NextResponse } from 'next/server';
import { extractContactDetails } from '../../../../lib/resume/extractContactDetails';
import { extractTextFromFile } from '../../../../lib/resume/fileParser';
import { structure_resume } from '../../../../lib/resume/resumeParser';

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

    // Convert file to buffer
    const buffer = Buffer.from(await file.arrayBuffer());
    
    // Extract text from the file
    const resumeText = await extractTextFromFile(buffer, file.type);
    
    // Structure the resume (analyze without optimization)
    const structuredResume = await structure_resume(resumeText);
    
    // Extract contact details
    const contactDetails = await extractContactDetails(resumeText);
    
    // Get the technical skills array from the structured resume
    const technicalSkills = structuredResume["Technical Skills"] || [];
    
    // Process skills to ensure we have individual skills, not grouped ones
    const processedSkills: string[] = [];
    technicalSkills.forEach(skill => {
      // Check if skill contains parentheses with grouped skills
      const parenthesesMatch = skill.match(/^(.+?)\s*\((.+)\)$/);
      if (parenthesesMatch) {
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
    });
    
    // Remove duplicates and filter out empty/invalid skills
    const uniqueSkills = [...new Set(processedSkills)]
      .filter(skill => skill && skill.length > 1 && skill.length < 50)
      .map(skill => skill.trim());
    
    // Process projects to extract title and technologies
    const processedProjects = structuredResume.Projects?.map((projectText, index) => {
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
      
      // Extract technologies from the description
      const techPatterns = [
        /(?:using|with|built with|technologies?:?|stack:?)\s*([^.!?\n]+)/gi,
        /(?:react|angular|vue|node|python|java|javascript|typescript|html|css|sql|mongodb|postgresql|mysql|express|spring|django|flask)/gi
      ];
      
      const foundTechs = new Set<string>();
      techPatterns.forEach(pattern => {
        const matches = description.match(pattern);
        if (matches) {
          matches.forEach(match => {
            // Extract individual technologies
            const techs = match.split(/[,\s]+/).filter(tech => 
              tech.length > 2 && 
              /^[a-zA-Z0-9.-]+$/.test(tech) &&
              !['using', 'with', 'built', 'technologies', 'technology', 'stack'].includes(tech.toLowerCase())
            );
            techs.forEach(tech => foundTechs.add(tech));
          });
        }
      });
      
      technologies = Array.from(foundTechs);
      
      return {
        title: title || `Project ${index + 1}`,
        name: title || `Project ${index + 1}`, // For backward compatibility
        description: description || projectText,
        technologies: technologies
      };
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
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to analyze resume' },
      { status: 500 }
    );
  }
} 