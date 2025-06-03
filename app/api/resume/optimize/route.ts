import { NextRequest, NextResponse } from 'next/server';
import { extractTextFromFile } from '../../../../lib/resume/fileParser';
import { OptimizedResume, optimizeResume } from '../../../../lib/resume/optimizeResume';
import { structure_resume } from '../../../../lib/resume/resumeParser';

// Define an extended interface for the response that might have capitalized keys
interface ExtendedOptimizedResume extends OptimizedResume {
  Summary?: string;
  "Technical Skills"?: string[];
  "Work Experience"?: Array<{
    company: string;
    role: string;
    date_range: string;
    accomplishments: string[];
  }>;
  Education?: Array<{
    institution: string;
    degree: string;
    graduation_date: string;
  }>;
  Certifications?: string[];
  Projects?: Array<{
    title: string;
    description: string;
    technologies?: string[];
  }> | string[];
}

export const config = {
  api: {
    bodyParser: false,
  },
};

export async function POST(req: NextRequest) {
  try {
      const formData = await req.formData();
      const file = formData.get('file') as File;
      if (!file) throw new Error('No file uploaded');
      
      const job = formData.get('job') as string || '';
      if (!job) throw new Error('No job description provided');
      
      // Get this from form but don't use it
      formData.get('useOpenAI');
      
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const mimetype = file.type;
      
      // Extract text from the resume file
      const text = await extractTextFromFile(buffer, mimetype);

      
      // Structure the resume for better optimization
      const structuredResume = await structure_resume(text);

      
      // Optimize the resume using both text and structured data
      const optimized = await optimizeResume(text, job, structuredResume);
    
    // Log the optimized resume data for debugging

    
    // Typecast the optimized result to a more specific type
    const optimizedWithCapitalKeys = optimized as ExtendedOptimizedResume;
    
    // Process projects to ensure correct structure
    let processedProjects: Array<{
      title: string;
      name: string; // For backward compatibility
      description: string;
      technologies: string[];
    }> = [];
    
    if (optimized.projects) {
      processedProjects = optimized.projects.map((project, index) => ({
        title: project.title || `Project ${index + 1}`,
        name: project.title || `Project ${index + 1}`, // For backward compatibility
        description: project.description || '',
        technologies: project.technologies || []
      }));
    } else if (optimizedWithCapitalKeys["Projects"]) {
      // Handle case where Projects might be a string array (from old structure)
      const projects = optimizedWithCapitalKeys["Projects"];
      if (Array.isArray(projects)) {
        processedProjects = projects.map((project, index) => {
          if (typeof project === 'string') {
            return {
              title: `Project ${index + 1}`,
              name: `Project ${index + 1}`,
              description: project,
              technologies: []
            };
          } else {
            return {
              title: project.title || `Project ${index + 1}`,
              name: project.title || `Project ${index + 1}`,
              description: project.description || '',
              technologies: project.technologies || []
            };
          }
        });
      }
    }
    
    // Create a properly structured response that matches frontend expectations
    const responseData = {
      ...optimized,
      // Map Technical Skills to skills if needed and process them to ensure individual skills
      skills: (() => {
        let skills = optimized.skills || (optimizedWithCapitalKeys["Technical Skills"] ? {
          technical_skills: optimizedWithCapitalKeys["Technical Skills"]
        } : {});
        
        // Process technical skills to ensure individual skills
        if (skills.technical_skills) {
          const processedSkills: string[] = [];
          skills.technical_skills.forEach(skill => {
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
            
          skills = {
            ...skills,
            technical_skills: uniqueSkills
          };
        }
        
        return skills;
      })(),
      // Ensure work_experience is mapped correctly
      work_experience: optimized.work_experience || optimizedWithCapitalKeys["Work Experience"] || [],
      // Map remaining fields
      summary: optimized.summary || optimizedWithCapitalKeys["Summary"] || "",
      education: optimized.education || optimizedWithCapitalKeys["Education"] || [],
      certifications: optimized.certifications || optimizedWithCapitalKeys["Certifications"] || [],
      projects: processedProjects
    };
    
    // Sample of data returned from each section
    if (responseData.skills) {

    }
    
    if (responseData.work_experience && responseData.work_experience.length > 0) {

    }
    

    
    return NextResponse.json(responseData);
  } catch (error: unknown) {
    console.error('Optimize API error:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ error: errorMessage }, { status: 400 });
  }
} 