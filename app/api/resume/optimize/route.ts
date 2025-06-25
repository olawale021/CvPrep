import { NextRequest, NextResponse } from 'next/server';
import { withFeatureLimit } from '../../../../lib/auth/userRateLimit';
import { extractTextFromFile } from '../../../../lib/services/resume/fileParser';
import { OptimizedResume, optimizeResume } from '../../../../lib/services/resume/optimizeResume';
import { structure_resume } from '../../../../lib/services/resume/resumeParser';

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
  return withFeatureLimit(req, 'resume_optimize', async () => {
    const startTime = Date.now();
    
    try {
      console.log('Optimize API: Request started');
      
      const formData = await req.formData();
      const file = formData.get('file') as File;
      if (!file) throw new Error('No file uploaded');
      
      const job = formData.get('job') as string || '';
      if (!job) throw new Error('No job description provided');
      
      // Get missing skills from the form data (optional)
      const missingSkillsStr = formData.get('missing_skills') as string || '';
      const missingSkills = missingSkillsStr ? JSON.parse(missingSkillsStr) : [];
      
      console.log('Optimize API: File and job validation passed', {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        jobLength: job.length
      });
      
      // Validate file type
      const allowedTypes = ['application/pdf', 'text/plain', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if (!allowedTypes.includes(file.type)) {
        throw new Error('Invalid file type. Please upload a PDF, DOC, DOCX, or TXT file.');
      }

      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        throw new Error('File too large. Please upload a file smaller than 5MB.');
      }
      
      // Get this from form but don't use it
      formData.get('useOpenAI');
      
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const mimetype = file.type;
      
      console.log('Optimize API: File processing started');
      
      // Extract text from the resume file
      const text = await extractTextFromFile(buffer, mimetype);

      if (!text || text.trim().length < 50) {
        throw new Error('Could not extract sufficient text from the file. Please ensure the file contains readable text.');
      }
      
      console.log('Optimize API: Text extraction completed', {
        textLength: text.length,
        elapsedTime: Date.now() - startTime
      });
      
      // OPTIMIZATION: Run structure_resume in parallel with optimization instead of sequentially
      // This saves 15-20 seconds by removing the sequential dependency
      console.log('Optimize API: Starting parallel optimization (structure + optimize)');
      
      const [optimized, structuredResume] = await Promise.all([
        // Start optimization without waiting for structuring
        optimizeResume(text, job, undefined, missingSkills), // Pass missing skills to optimization
        // Run structuring in parallel
        structure_resume(text)
      ]);
    
      console.log('Optimize API: Parallel optimization completed', {
        hasOptimized: !!optimized,
        hasSummary: !!optimized?.summary,
        hasSkills: !!optimized?.skills,
        hasWorkExperience: !!optimized?.work_experience,
        hasStructure: !!structuredResume,
        elapsedTime: Date.now() - startTime
      });

      // Validate optimization result
      if (!optimized || typeof optimized !== 'object') {
        throw new Error('Optimization failed: Invalid response from AI service');
      }
    
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
      
      console.log('Optimize API: Response data prepared', {
        hasSummary: !!responseData.summary,
        hasSkills: !!responseData.skills?.technical_skills?.length,
        hasWorkExperience: !!responseData.work_experience?.length,
        hasProjects: !!responseData.projects?.length,
        summaryPreview: responseData.summary?.substring(0, 100),
        elapsedTime: Date.now() - startTime
      });

      
      return NextResponse.json(responseData);
    } catch (error: unknown) {
      console.error('Optimize API: Error occurred', {
        error: error instanceof Error ? error.message : 'Unknown error',
        elapsedTime: Date.now() - startTime
      });
      
      return NextResponse.json(
        { 
          error: error instanceof Error ? error.message : 'An unexpected error occurred',
          details: 'Please check your file and try again.'
        },
        { status: 500 }
      );
    }
  });
} 