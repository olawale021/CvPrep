import { Calendar, Edit, MapPin, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "../../../../../components/ui/Button";
import { Input } from "../../../../../components/ui/Input";
import { useResumeEdit } from "../../context/ResumeEditContext";
import { ApiEducationItem, Education } from "../../types/index";

interface EducationProps {
  education?: Education[] | ApiEducationItem[];
  isEditMode?: boolean;
}

// Define an extended type that supports multiple field formats
type ExtendedEducation = Education & {
  institution?: string;
  graduation_date?: string;
};

// Function to normalize education data to ensure consistent field names
const normalizeEducationData = (item: ExtendedEducation): Education => {
  return {
    school: item.school || item.institution || "",
    degree: item.degree || "",
    dates: item.dates || item.graduation_date || "",
    location: item.location || ""
  };
};

export default function EducationSection({ education = [], isEditMode = false }: EducationProps) {
  const { editableResume, updateResumeField } = useResumeEdit();
  const [editing, setEditing] = useState(false);
  const [activeEduIndex, setActiveEduIndex] = useState<number | null>(null);
  
  // Initialize from props if needed
  useEffect(() => {
    if (education && education.length > 0 && 
        (!editableResume.education || editableResume.education.length === 0)) {
      // Normalize all education items before saving to context
      const normalizedEducation = education.map(edu => normalizeEducationData(edu as ExtendedEducation));
      updateResumeField('education', normalizedEducation);
    }
    
    // Log props when component mounts or props change
    
  }, [education, editableResume.education, updateResumeField, isEditMode]);

  const educationItems = (editableResume.education || []) as Education[];
  
  // Function to handle education field updates
  const handleUpdateField = (index: number, field: string, value: string) => {

    
    const updatedEducation = [...educationItems];
    updatedEducation[index] = {
      ...updatedEducation[index],
      [field]: value
    };
    
    updateResumeField('education', updatedEducation);
  };
  
  // Function to add new education entry
  const handleAddEducation = () => {
    const newEducation = {
      school: "University Name",
      degree: "Degree Title",
      dates: "Start Year - End Year",
      location: "City, Country"
    };
    
    const updatedEducation = [...educationItems, newEducation];
    updateResumeField('education', updatedEducation);
    
    // Set new education as active for editing
    setActiveEduIndex(updatedEducation.length - 1);
    setEditing(true);
  };
  
  // Function to delete an education entry
  const handleDeleteEducation = (index: number) => {
    if (confirm("Are you sure you want to delete this education item?")) {
      const updatedEducation = educationItems.filter((_, i) => i !== index);
      updateResumeField('education', updatedEducation);
      
      if (activeEduIndex === index) {
        setEditing(false);
        setActiveEduIndex(null);
      }
    }
  };
  
  // Toggle edit mode for a specific education item
  const handleEditEducation = (index: number) => {
    if (editing && activeEduIndex === index) {
      setEditing(false);
      setActiveEduIndex(null);
    } else {
      setActiveEduIndex(index);
      setEditing(true);
    }
  };

  if (!educationItems || educationItems.length === 0) {
    return (
      <>
        <h3 className="text-xl font-semibold mb-4 text-gray-900">Education</h3>
        {isEditMode && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleAddEducation}
            className="mb-4"
          >
            <Plus className="h-4 w-4 mr-2" /> Add Education
          </Button>
        )}
        <p className="text-gray-500 italic">No education information available</p>
      </>
    );
  }

  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold text-gray-900">Education</h3>
        {isEditMode && (
          <div className="flex gap-2">
            {!editing && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  if (educationItems.length > 0 && activeEduIndex === null) {
                    setActiveEduIndex(0);
                    setEditing(true);
                  }
                }}
                className="text-xs bg-blue-50 text-blue-700 border-blue-200"
              >
                <Edit className="h-4 w-4 mr-2" /> Edit Education
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={handleAddEducation}
              className="text-xs"
            >
              <Plus className="h-4 w-4 mr-2" /> Add Education
            </Button>
          </div>
        )}
      </div>
      <div className="space-y-6">
        {educationItems.map((edu, index) => {
          const isEditing = editing && activeEduIndex === index;
          
          return (
            <div key={index} className="border-l-2 border-gray-200 pl-4 py-1 hover:border-blue-500 transition-colors">
              {isEditing ? (
                <div className="space-y-3">
                  <div className="flex justify-between items-start">
                    <Input 
                      value={edu.degree}
                      onChange={(e) => handleUpdateField(index, 'degree', e.target.value)}
                      className="font-semibold text-lg bg-white border border-gray-200"
                      placeholder="Degree Title"
                    />
                    
                    <div className="flex gap-1">
                      <Button 
                        onClick={() => handleEditEducation(index)}
                        variant="ghost"
                        size="sm"
                      >
                        Done
                      </Button>
                      <Button
                        onClick={() => handleDeleteEducation(index)}
                        variant="ghost" 
                        size="sm"
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <Input 
                      value={edu.school}
                      onChange={(e) => handleUpdateField(index, 'school', e.target.value)}
                      className="bg-white border border-gray-200"
                      placeholder="University Name"
                    />
                    <Input 
                      value={edu.dates}
                      onChange={(e) => handleUpdateField(index, 'dates', e.target.value)}
                      className="bg-white border border-gray-200"
                      placeholder="Graduation Year"
                    />
                    <Input 
                      value={edu.location || ''}
                      onChange={(e) => handleUpdateField(index, 'location', e.target.value)}
                      className="bg-white border border-gray-200"
                      placeholder="Location (City, Country)"
                    />
                  </div>
                </div>
              ) : (
                <div className="flex justify-between">
                  <div className="w-full">
                    <h4 className="font-semibold text-gray-900">{edu.degree}</h4>
                    {edu.school && <p className="text-gray-800 font-medium">{edu.school}</p>}
                    <div className="text-sm text-gray-600 mt-1 flex items-center flex-wrap">
                      {edu.dates && (
                        <>
                          <Calendar className="h-3 w-3 mr-1" /> {edu.dates}
                        </>
                      )}
                      {edu.location && (
                        <>
                          <span className="mx-2">•</span>
                          <MapPin className="h-3 w-3 mr-1" /> {edu.location}
                        </>
                      )}
                    </div>
                  </div>
                  {isEditMode && !isEditing && (
                    <Button
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleEditEducation(index)}
                    >
                      Edit
                    </Button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
} 