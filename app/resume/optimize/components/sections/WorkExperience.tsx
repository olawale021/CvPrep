import { Briefcase, Calendar, Edit, MapPin, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "../../../../../components/ui/Button";
import { Input } from "../../../../../components/ui/Input";
import { Textarea } from "../../../../../components/ui/Textarea";
import { useResumeEdit } from "../../context/ResumeEditContext";
import { WorkExperience } from "../../types";

interface WorkExperienceProps {
  isEditMode?: boolean;
  work_experience?: WorkExperience[];
}

// Define the extended experience type for internal use that can handle both formats
type ExtendedWorkExperience = WorkExperience & {
  role?: string;
  date_range?: string;
  accomplishments?: string[];
};

export default function WorkExperienceSection({ 
  isEditMode = true,
  work_experience = []
}: WorkExperienceProps) {
  const { editableResume, updateResumeField } = useResumeEdit();
  const [editing, setEditing] = useState(false);
  const [activeExpIndex, setActiveExpIndex] = useState<number | null>(null);
  const [bulletEdits, setBulletEdits] = useState<{[key: string]: string}>({});
  
  // Initialize from props if needed
  useEffect(() => {
    if (work_experience && work_experience.length > 0 && 
        (!editableResume.work_experience || editableResume.work_experience.length === 0)) {
      updateResumeField('work_experience', work_experience);
    }
  }, [work_experience, editableResume.work_experience, updateResumeField]);
  
  // Log props and state when component mounts or props change
  useEffect(() => {
    
  }, [isEditMode, work_experience, editableResume.work_experience, editing, activeExpIndex]);
  
  // Only use experiences from the editable resume
  const experiences = (editableResume.work_experience || []) as ExtendedWorkExperience[];

  // Add debugging to help identify issues
  

  // Add new work experience
  const handleAddExperience = () => {
    const newExperience: WorkExperience = {
      company: "Company Name",
      title: "Position Title",
      dates: "Month Year - Present",
      location: "City, State",
      bullets: ["Add your accomplishment here"]
    };
    updateResumeField('work_experience', [...experiences, newExperience]);
    handleEditExperience(experiences.length); // Set new as active
  };

  if (!experiences || experiences.length === 0) {
    return (
      <>
        <h3 className="text-xl font-semibold mb-4 text-gray-900">Work Experience</h3>
        {isEditMode && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleAddExperience}
            className="mb-4"
          >
            <Plus className="h-4 w-4 mr-2" /> Add Work Experience
          </Button>
        )}
        <p className="text-gray-500 italic">No work experience available</p>
      </>
    );
  }

  // Update the function to handle when user clicks "Done"
  const handleEditExperience = (index: number) => {

    
    if (editing && activeExpIndex === index) {
      // User is clicking "Done" - ensure all edits are committed

      
      // Apply any pending bullet edits to the work experience
      const updatedExperiences = [...experiences];
      const currentExp = updatedExperiences[index];
      
      // Check if there are any bullet edits for this experience
      const bulletKeys = Object.keys(bulletEdits).filter(key => key.startsWith(`${index}-`));
      
      if (bulletKeys.length > 0) {

        
        // Apply each edit to the final object
        bulletKeys.forEach(key => {
          const bulletIndex = parseInt(key.split('-')[1]);
          const bulletItems = currentExp.bullets || (currentExp.accomplishments || []);
          bulletItems[bulletIndex] = bulletEdits[key];
          
          // Update the appropriate field based on which one exists
          if (currentExp.bullets) {
            currentExp.bullets = bulletItems;
          } else if (currentExp.accomplishments) {
            currentExp.accomplishments = bulletItems;
          }
        });
        
        // Commit the final state
        updateResumeField('work_experience', updatedExperiences);
        
        // Clear the bullet edits for this experience
        const newBulletEdits = {...bulletEdits};
        bulletKeys.forEach(key => delete newBulletEdits[key]);
        setBulletEdits(newBulletEdits);
      }
      
      // Exit edit mode
      setEditing(false);
      setActiveExpIndex(null);
    } else {
      // User is starting to edit
      setActiveExpIndex(index);
      setEditing(true);
    }
  };

  // Update the function to handle field editing
  const handleUpdateField = (
    index: number,
    field: keyof WorkExperience,
    value: string
  ) => {
    const updatedExp = { ...experiences[index], [field]: value };
    const updatedExperiences = [...experiences];
    updatedExperiences[index] = updatedExp;
    updateResumeField('work_experience', updatedExperiences);
  };

  // Update the function to handle bullet point editing
  const handleUpdateBullet = (expIndex: number, bulletIndex: number, value: string) => {
    const updatedExperiences = [...experiences];
    const currentExp = { ...updatedExperiences[expIndex] };
    const bulletItems = currentExp.bullets || (currentExp.accomplishments || []);
    bulletItems[bulletIndex] = value;
    if (currentExp.bullets) {
      currentExp.bullets = bulletItems;
    } else if (currentExp.accomplishments) {
      currentExp.accomplishments = bulletItems;
    }
    updatedExperiences[expIndex] = currentExp;
    updateResumeField('work_experience', updatedExperiences);
  };

  // Function to get the current value of a bullet (either from edits or original)
  const getBulletValue = (expIndex: number, bulletIndex: number, originalValue: string) => {
    const editKey = `${expIndex}-${bulletIndex}`;
    return bulletEdits[editKey] !== undefined ? bulletEdits[editKey] : originalValue;
  };
  
  // Add new bullet point to an experience
  const handleAddBullet = (expIndex: number) => {
    const updatedExperiences = [...experiences];
    const currentExp = { ...updatedExperiences[expIndex] };
    if (currentExp.bullets) {
      currentExp.bullets = [...currentExp.bullets, "New bullet point - add your accomplishment here"];
    } else if (currentExp.accomplishments) {
      currentExp.accomplishments = [...currentExp.accomplishments, "New accomplishment - add details here"];
    } else {
      currentExp.bullets = ["New bullet point - add your accomplishment here"];
    }
    updatedExperiences[expIndex] = currentExp;
    updateResumeField('work_experience', updatedExperiences);
  };
  
  // Always allow bullet deletion, even if it's the last bullet
  const handleDeleteBullet = (expIndex: number, bulletIndex: number) => {
    const updatedExperiences = [...experiences];
    const currentExp = { ...updatedExperiences[expIndex] };
    if (currentExp.bullets) {
      currentExp.bullets = currentExp.bullets.filter((_, index) => index !== bulletIndex);
    } else if (currentExp.accomplishments) {
      currentExp.accomplishments = currentExp.accomplishments.filter((_, index) => index !== bulletIndex);
    }
    updatedExperiences[expIndex] = currentExp;
    updateResumeField('work_experience', updatedExperiences);
  };
  
  // Delete an entire work experience
  const handleDeleteExperience = (index: number) => {
    if (!experiences || experiences.length <= 1) {
      console.warn("Cannot delete the only remaining experience");
      return;
    }
    const updatedExperiences = experiences.filter((_, i) => i !== index);
    updateResumeField('work_experience', updatedExperiences);
    setActiveExpIndex(null);
    setEditing(false);
  };

  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold text-gray-900">Work Experience</h3>
        {isEditMode && (
          <div className="flex items-center gap-2">
            <Button 
              onClick={() => {
                if (editing) {
                  setEditing(false);
                  setActiveExpIndex(null);
                } else {
                  setEditing(true);
                }
              }}
              variant={editing ? "default" : "outline"}
              size="sm"
              className={`${editing ? 'bg-blue-600 hover:bg-blue-700' : ''}`}
            >
              {editing ? 'Done Editing' : 'Edit Experience'}
              <Edit className="ml-1 h-3 w-3" />
            </Button>
            
            <Button
              onClick={handleAddExperience}
              variant="outline"
              size="sm"
              className="text-green-600 border-green-200 hover:bg-green-50"
            >
              <Plus className="h-3 w-3 mr-1" /> Add
            </Button>
          </div>
        )}
      </div>
      
      <div className={`${isEditMode ? 'relative' : ''}`}>
        {isEditMode && editing && (
          <div className="absolute -left-3 -right-3 -top-4 -bottom-4 bg-blue-50/30 rounded-lg border border-blue-100 -z-10"></div>
        )}
        
        <div className="space-y-6">
          {experiences.map((exp, index) => {
            const isActiveExp = activeExpIndex === index && editing;
            const bulletItems = exp.bullets || exp.accomplishments || [];
            
            return (
              <div 
                key={index} 
                className={`p-4 border rounded-md ${
                  isActiveExp ? 'border-blue-300 bg-blue-50/50 shadow-sm' : 'border-gray-200'
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-2">
                  <div className="flex-1">
                    {isActiveExp ? (
                      <div className="mb-2">
                        <label htmlFor={`title-${index}`} className="block text-sm font-medium text-gray-700 mb-1">
                          Job Title
                        </label>
                        <Input
                          id={`title-${index}`}
                          value={exp.title || exp.role || ""}
                          onChange={(e) => handleUpdateField(index, 'title', e.target.value)}
                          className="w-full"
                          placeholder="Job Title"
                        />
                      </div>
                    ) : (
                      <h4 className="text-lg font-semibold text-gray-800">
                        {exp.title || exp.role || "Position"}
                      </h4>
                    )}
                    
                    {isActiveExp ? (
                      <div className="mb-2">
                        <label htmlFor={`company-${index}`} className="block text-sm font-medium text-gray-700 mb-1">
                          Company
                        </label>
                        <Input
                          id={`company-${index}`}
                          value={exp.company}
                          onChange={(e) => handleUpdateField(index, 'company', e.target.value)}
                          className="w-full"
                          placeholder="Company Name"
                        />
                      </div>
                    ) : (
                      <div className="flex items-center text-gray-600 mt-1">
                        <Briefcase className="h-4 w-4 mr-1.5" />
                        <span>{exp.company}</span>
                      </div>
                    )}
                    
                    {isActiveExp ? (
                      <div className="mb-2">
                        <label htmlFor={`location-${index}`} className="block text-sm font-medium text-gray-700 mb-1">
                          Location
                        </label>
                        <Input
                          id={`location-${index}`}
                          value={exp.location || ""}
                          onChange={(e) => handleUpdateField(index, 'location', e.target.value)}
                          className="w-full"
                          placeholder="City, Country"
                        />
                      </div>
                    ) : (
                      exp.location && (
                        <div className="flex items-center text-gray-600 mt-1">
                          <MapPin className="h-4 w-4 mr-1.5" />
                          <span>{exp.location}</span>
                        </div>
                      )
                    )}
                  </div>
                  
                  <div className="self-start">
                    {isActiveExp ? (
                      <div className="mb-2">
                        <label htmlFor={`dates-${index}`} className="block text-sm font-medium text-gray-700 mb-1">
                          Dates
                        </label>
                        <Input
                          id={`dates-${index}`}
                          value={exp.dates || exp.date_range || ""}
                          onChange={(e) => handleUpdateField(index, 'dates', e.target.value)}
                          className="w-full"
                          placeholder="Start - End Date"
                        />
                      </div>
                    ) : (
                      <div className="flex items-center text-gray-600">
                        <Calendar className="h-4 w-4 mr-1.5" />
                        <span>{exp.dates || exp.date_range || ""}</span>
                      </div>
                    )}
                  </div>
                  
                  {isEditMode && isActiveExp && (
                    <div className="self-start flex">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteExperience(index)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
                
                <div className="mt-4">
                  {isActiveExp && (
                    <div className="flex justify-between items-center mb-2">
                      <h5 className="text-sm font-medium text-gray-700">Accomplishments</h5>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleAddBullet(index)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <Plus className="h-3 w-3 mr-1" /> Add Bullet
                      </Button>
                    </div>
                  )}
                  
                  <ul className="space-y-2 mt-2">
                    {bulletItems.map((bullet, bulletIndex) => (
                      <li key={bulletIndex} className="pl-5 relative">
                        {isActiveExp ? (
                          <div className="flex items-start group">
                            <span className="absolute left-0 top-2 w-3 h-3 rounded-full bg-blue-200"></span>
                            <Textarea
                              value={getBulletValue(index, bulletIndex, bullet)}
                              onChange={(e) => handleUpdateBullet(index, bulletIndex, e.target.value)}
                              className="flex-1 min-h-[60px] text-sm border border-blue-200 focus:ring-blue-500"
                              placeholder="Describe your accomplishment..."
                            />
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteBullet(index, bulletIndex)}
                              className="mt-1 ml-1 text-red-400 hover:text-red-600 md:opacity-0 md:group-hover:opacity-100 transition-opacity"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        ) : (
                          <>
                            <span className="absolute left-0 top-2 w-1.5 h-1.5 rounded-full bg-gray-400"></span>
                            <p className="text-gray-700">{bullet}</p>
                          </>
                        )}
                      </li>
                    ))}
                  </ul>
                  
                  {isEditMode && !isActiveExp && (
                    <div className="mt-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditExperience(index)}
                        className="text-blue-600 border-blue-200 hover:bg-blue-50"
                      >
                        <Edit className="h-3 w-3 mr-1" /> Edit
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}

export function normalizeWorkExperienceItem(item: ExtendedWorkExperience): WorkExperience {
  return {
    company: item.company || "",
    title: item.title || item.role || "",
    dates: item.dates || item.date_range || "",
    bullets: item.bullets || item.accomplishments || [],
    location: item.location || ""
  };
} 