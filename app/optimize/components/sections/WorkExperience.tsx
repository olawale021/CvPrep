import { Briefcase, Calendar, MapPin, Plus, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "../../../../components/ui/Button";
import { Input } from "../../../../components/ui/Input";
import { Textarea } from "../../../../components/ui/Textarea";
import { useResumeEdit } from "../../context/ResumeEditContext";
import { Project, WorkExperience } from "../../types";

interface WorkExperienceProps {
  isEditMode?: boolean;
  work_experience?: WorkExperience[];
}

export default function WorkExperienceSection({ 
  isEditMode = true,
  work_experience = []
}: WorkExperienceProps) {
  const { editableResume, updateWorkExperience, updateResumeField } = useResumeEdit();
  const [editing, setEditing] = useState(false);
  const [activeExpIndex, setActiveExpIndex] = useState<number | null>(null);
  const [bulletEdits, setBulletEdits] = useState<{[key: string]: string}>({});
  const bulletUpdateTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Initialize from props if needed
  useEffect(() => {
    if (work_experience && work_experience.length > 0 && 
        (!editableResume.work_experience || editableResume.work_experience.length === 0)) {
      updateResumeField('work_experience', work_experience);
    }
  }, [work_experience, editableResume.work_experience, updateResumeField]);
  
  // Only use experiences from the editable resume
  const experiences = editableResume.work_experience || [];

  // Add debugging to help identify issues
  console.log("isEditMode:", isEditMode);
  console.log("editableResume:", editableResume);
  console.log("experiences:", experiences);

  // Add new work experience - moved up before first usage
  const handleAddExperience = () => {
    const newExperience = {
      title: "New Position Title",
      company: "Company Name",
      dates: "Month Year - Present",
      location: "City, State",
      bullets: ["Add your accomplishments here"]
    };
    
    const updatedExperiences = [...experiences, newExperience];
    
    const newIndex = updatedExperiences.length - 1;
    updateWorkExperience(newIndex, 'work_experience' as keyof Project, updatedExperiences);
    
    // Set this new experience as active for editing
    handleEditExperience(newIndex);
  };

  if (!experiences || experiences.length === 0) {
    return (
      <>
        <h3 className="text-xl font-semibold mb-4">Work Experience</h3>
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
    console.log("Edit experience triggered for index:", index);
    
    if (editing && activeExpIndex === index) {
      // User is clicking "Done" - ensure all edits are committed
      console.log("Finishing edits for experience:", index);
      
      // Apply any pending bullet edits to the work experience
      const updatedExperiences = [...experiences];
      const currentExp = updatedExperiences[index];
      
      // Check if there are any bullet edits for this experience
      const bulletKeys = Object.keys(bulletEdits).filter(key => key.startsWith(`${index}-`));
      
      if (bulletKeys.length > 0) {
        console.log("Committing bullet edits:", bulletKeys);
        
        // Apply each edit to the final object
        bulletKeys.forEach(key => {
          const bulletIndex = parseInt(key.split('-')[1]);
          currentExp.bullets[bulletIndex] = bulletEdits[key];
        });
        
        // Commit the final state
        updateWorkExperience(index, 'work_experience' as keyof Project, updatedExperiences);
        
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

  // Add check for updateWorkExperience function
  const handleUpdateField = (index: number, field: string, value: string) => {
    console.log("Updating field:", field, "with value:", value);
    if (!updateWorkExperience) {
      console.error("updateWorkExperience function is not available");
      return;
    }
    
    const updatedExperiences = [...experiences];
    updatedExperiences[index] = {
      ...updatedExperiences[index],
      [field]: value
    };
    
    try {
      // Check if updateWorkExperience expects more parameters
      console.log("Calling updateWorkExperience with:", updatedExperiences);
      updateWorkExperience(index, 'work_experience' as keyof Project, updatedExperiences);
    } catch (error) {
      console.error("Error updating work experience:", error);
    }
  };

  // Update the function to handle bullet point editing
  const handleUpdateBullet = (expIndex: number, bulletIndex: number, value: string) => {
    console.log("Updating bullet at index:", bulletIndex, "in experience:", expIndex);
    console.log("New value:", value);
    
    // Store the edit in local state first for immediate UI feedback
    const editKey = `${expIndex}-${bulletIndex}`;
    setBulletEdits({
      ...bulletEdits,
      [editKey]: value
    });
    
    // Delay the actual update to prevent UI lag
    // Only update the context after user finishes typing (300ms delay)
    if (bulletUpdateTimeoutRef.current) {
      clearTimeout(bulletUpdateTimeoutRef.current);
    }
    
    bulletUpdateTimeoutRef.current = setTimeout(() => {
      const updatedExperiences = [...experiences];
      const bullets = [...updatedExperiences[expIndex].bullets];
      bullets[bulletIndex] = value;
      updatedExperiences[expIndex] = {
        ...updatedExperiences[expIndex],
        bullets
      };
      
      // Call the update function from context
      updateWorkExperience(expIndex, 'work_experience' as keyof Project, updatedExperiences);
    }, 300);
  };

  // Function to get the current value of a bullet (either from edits or original)
  const getBulletValue = (expIndex: number, bulletIndex: number, originalValue: string) => {
    const editKey = `${expIndex}-${bulletIndex}`;
    return bulletEdits[editKey] !== undefined ? bulletEdits[editKey] : originalValue;
  };
  
  // Add new bullet point to an experience
  const handleAddBullet = (expIndex: number) => {
    console.log("handleAddBullet called with index:", expIndex);
    
    // Create a deep copy of the experiences
    const updatedExperiences = JSON.parse(JSON.stringify(experiences));
    const currentExp = updatedExperiences[expIndex];
    
    // Initialize bullets array if it doesn't exist
    if (!currentExp.bullets) {
      currentExp.bullets = [];
    }
    
    // Add the new bullet
    currentExp.bullets.push("New bullet point - add your accomplishment here");
    
    // Update the context
    updateWorkExperience(expIndex, 'work_experience' as keyof Project, updatedExperiences);
    
    // Pre-populate the bullet edit state for the new item to improve responsiveness
    const newBulletIndex = currentExp.bullets.length - 1;
    const editKey = `${expIndex}-${newBulletIndex}`;
    setBulletEdits({
      ...bulletEdits,
      [editKey]: "New bullet point - add your accomplishment here"
    });
    
    console.log("Added new bullet. Total bullets:", currentExp.bullets.length);
  };
  
  // Delete a bullet point
  const handleDeleteBullet = (expIndex: number, bulletIndex: number) => {
    console.log("Deleting bullet at index:", bulletIndex, "from experience:", expIndex);
    
    if (experiences[expIndex].bullets.length <= 1) {
      alert("You need to keep at least one bullet point.");
      return;
    }
    
    // Create a deep copy of the experiences
    const updatedExperiences = JSON.parse(JSON.stringify(experiences));
    const currentExp = updatedExperiences[expIndex];
    
    // Remove the bullet
    currentExp.bullets.splice(bulletIndex, 1);
    
    console.log("After delete, bullets array:", currentExp.bullets);
    
    // Remove any edits for this bullet
    const newBulletEdits = {...bulletEdits};
    const editKey = `${expIndex}-${bulletIndex}`;
    delete newBulletEdits[editKey];
    
    // Shift the keys for bullets after the deleted one
    Object.keys(newBulletEdits).forEach(key => {
      const [expIdx, bulletIdx] = key.split('-').map(Number);
      if (expIdx === expIndex && bulletIdx > bulletIndex) {
        // Move edits for bullets after the deleted one to one index earlier
        delete newBulletEdits[key];
        newBulletEdits[`${expIdx}-${bulletIdx-1}`] = bulletEdits[key];
      }
    });
    
    setBulletEdits(newBulletEdits);
    
    // Update the context
    updateWorkExperience(expIndex, 'work_experience' as keyof Project, updatedExperiences);
  };
  
  // Delete an entire work experience
  const handleDeleteExperience = (index: number) => {
    if (confirm("Are you sure you want to delete this work experience?")) {
      console.log("Deleting experience at index:", index);

      // Create a new array without the item at the specified index
      const updatedExperiences = experiences.filter((_, i) => i !== index);
      console.log("Updated experiences after deletion:", updatedExperiences);

      // Add the missing 'work_experience' field parameter
      updateWorkExperience(index, 'work_experience' as keyof Project, updatedExperiences);
      
      // Reset editing state if needed
      if (editing && activeExpIndex === index) {
        setEditing(false);
        setActiveExpIndex(null);
      }
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold">Work Experience</h3>
        {isEditMode && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleAddExperience}
          >
            <Plus className="h-4 w-4 mr-2" /> Add
          </Button>
        )}
      </div>

      <div className="grid gap-6">
        {experiences.map((exp, index) => {
          const isEditing = editing && activeExpIndex === index;
          
          return (
            <div key={index} className="bg-gray-50 p-4 rounded-lg">
              <div className="flex justify-between items-start mb-2">
                <div className="flex-1">
                  {isEditing ? (
                    <Input
                      value={exp.title}
                      onChange={(e) => handleUpdateField(index, 'title', e.target.value)}
                      className="font-semibold text-lg mb-2"
                      placeholder="Position title"
                    />
                  ) : (
                    <h4 className="font-semibold text-lg">{exp.title}</h4>
                  )}
                  
                  <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 text-gray-600 text-sm">
                    {isEditing ? (
                      <>
                        <div className="flex items-center">
                          <Briefcase className="h-3 w-3 mr-1" />
                          <Input
                            value={exp.company}
                            onChange={(e) => handleUpdateField(index, 'company', e.target.value)}
                            className="h-7 text-sm"
                            placeholder="Company name"
                          />
                        </div>
                        <div className="flex items-center">
                          <Calendar className="h-3 w-3 mr-1" />
                          <Input
                            value={exp.dates}
                            onChange={(e) => handleUpdateField(index, 'dates', e.target.value)}
                            className="h-7 text-sm"
                            placeholder="Dates (e.g. Jan 2020 - Present)"
                          />
                        </div>
                        <div className="flex items-center">
                          <MapPin className="h-3 w-3 mr-1" />
                          <Input
                            value={exp.location || ''}
                            onChange={(e) => handleUpdateField(index, 'location', e.target.value)}
                            className="h-7 text-sm"
                            placeholder="Location (optional)"
                          />
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex items-center">
                          <Briefcase className="h-3 w-3 mr-1" />
                          <span>{exp.company}</span>
                        </div>
                        <div className="flex items-center">
                          <Calendar className="h-3 w-3 mr-1" />
                          <span>{exp.dates}</span>
                        </div>
                        {exp.location && (
                          <div className="flex items-center">
                            <MapPin className="h-3 w-3 mr-1" />
                            <span>{exp.location}</span>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
                
                {/* Edit/Delete buttons */}
                {isEditMode && (
                  <div className="flex space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditExperience(index)}
                    >
                      {isEditing ? "Done" : "Edit"}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-500 hover:text-red-700"
                      onClick={() => handleDeleteExperience(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
              
              {/* Bullet points */}
              <div className="ml-2 mt-3">
                {exp.bullets && exp.bullets.map((bullet, bulletIndex) => (
                  <div key={bulletIndex} className="mb-2 flex">
                    <div className="text-gray-400 mr-2 mt-1">•</div>
                    <div className="flex-1">
                      {isEditing ? (
                        <Textarea
                          value={getBulletValue(index, bulletIndex, bullet)}
                          onChange={(e) => handleUpdateBullet(index, bulletIndex, e.target.value)}
                          className="min-h-[70px] text-sm"
                          placeholder="Describe your accomplishment"
                        />
                      ) : (
                        <p className="text-gray-700">{bullet}</p>
                      )}
                    </div>
                    
                    {/* Delete bullet button (only shown in edit mode) */}
                    {isEditing && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-500 hover:text-red-700 h-8 w-8 p-0 mt-2"
                        onClick={() => handleDeleteBullet(index, bulletIndex)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                ))}
                
                {/* Add bullet button (only shown in edit mode) */}
                {isEditing && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="ml-5 text-blue-600"
                    onClick={() => handleAddBullet(index)}
                  >
                    <Plus className="h-3 w-3 mr-1" /> Add bullet
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
} 