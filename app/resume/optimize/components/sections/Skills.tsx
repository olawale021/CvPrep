import { Check, Edit, Plus, X } from "lucide-react";
import React, { useState } from "react";
import { Button } from "../../../../../components/ui/base/Button";
import { Input } from "../../../../../components/ui/base/Input";
import { useResumeEdit } from "../../context/ResumeEditContext";

interface SkillsProps {
  isEditMode?: boolean;
  skills?: {
    [key: string]: string[] | undefined;
    technical_skills?: string[];
    soft_skills?: string[];
  };
}

export default function Skills({ isEditMode, skills }: SkillsProps) {
  const { editableResume, updateSkills } = useResumeEdit();
  const [newSkill, setNewSkill] = useState<string>("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [editingSkill, setEditingSkill] = useState<{category: string, index: number, value: string} | null>(null);
  
  // Log props and state when component mounts or props change
  React.useEffect(() => {
    
  }, [isEditMode, skills, editableResume.skills]);
  
  // Initialize from props if needed
  React.useEffect(() => {
    if (skills && Object.keys(skills).length > 0 && 
        (!editableResume.skills || Object.keys(editableResume.skills).length === 0)) {
      // Copy all skills categories from props to editable state
      Object.entries(skills).forEach(([category, skillList]) => {
        if (skillList && skillList.length > 0) {
          updateSkills(category, skillList);
        }
      });
    }
  }, [skills, editableResume.skills, updateSkills]);
  
  const handleAddSkill = (category: string) => {
    if (!newSkill.trim()) return;
    
    const currentSkills = editableResume.skills?.[category] || [];
    updateSkills(category, [...currentSkills, newSkill.trim()]);
    setNewSkill("");
  };
  
  const handleRemoveSkill = (category: string, skillToRemove: string) => {
    const currentSkills = editableResume.skills?.[category] || [];
    updateSkills(
      category, 
      currentSkills.filter(skill => skill !== skillToRemove)
    );
  };
  
  const startEditingSkill = (category: string, skillIndex: number, skillValue: string) => {
    setEditingSkill({
      category,
      index: skillIndex,
      value: skillValue
    });
  };
  
  const updateSkillText = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!editingSkill) return;
    
    setEditingSkill({
      ...editingSkill,
      value: e.target.value
    });
  };
  
  const saveEditedSkill = () => {
    if (!editingSkill || !editingSkill.value.trim()) return;
    
    const { category, index, value } = editingSkill;
    const currentSkills = [...(editableResume.skills?.[category] || [])];
    currentSkills[index] = value.trim();
    
    updateSkills(category, currentSkills);
    setEditingSkill(null);
  };

  const handleCategoryEdit = (category: string) => {
    if (activeCategory === category) {
      // If this category is already active, deactivate it
      setActiveCategory(null);
    } else {
      // Set this category as active
      setActiveCategory(category);
    }
    // Reset any in-progress skill editing
    setEditingSkill(null);
  };

  const handleGlobalEditToggle = () => {
    setEditing(!editing);
    if (!editing) {
      // When starting edit mode, clear any active category
      setActiveCategory(null);
      setEditingSkill(null);
    }
  };
  
  // Render categories from the editable resume, not the original props
  const categories = editableResume.skills ? Object.keys(editableResume.skills) : [];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">Skills</h3>
        {isEditMode && (
          <Button 
            onClick={handleGlobalEditToggle}
            variant={editing ? "default" : "outline"} 
            size="sm"
            className={`${editing ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'text-gray-600'}`}
          >
            {editing ? 'Done Editing' : 'Edit Skills'}
            <Edit className="ml-1 h-3 w-3" />
          </Button>
        )}
      </div>
      
      {isEditMode && editing && (
        <div className="bg-blue-50 border border-blue-100 rounded-md p-3 mb-4 text-sm text-blue-800">
          <p className="flex items-center">
            <Edit className="h-4 w-4 mr-2 text-blue-600" />
            Skills edit mode is active. Click &quot;Edit&quot; next to a category to edit skills, or click on individual skills to edit them.
          </p>
        </div>
      )}
      
      <div className={`${isEditMode && editing ? 'relative' : ''}`}>
        {isEditMode && editing && (
          <div className="absolute -left-3 -right-3 -top-4 -bottom-4 bg-blue-50/30 rounded-lg border border-blue-100 -z-10"></div>
        )}
        
        {categories.map(category => {
          const categorySkills = editableResume.skills?.[category] || [];
          const isActive = editing && activeCategory === category;
          
          return (
            <div key={category} className={`space-y-3 p-4 ${isActive ? 'bg-blue-50/50 border border-blue-200 rounded-md' : ''}`}>
              <div className="flex justify-between items-center">
                <h4 className="font-medium text-base capitalize text-gray-800">
                  {category.replace(/_/g, ' ')}
                </h4>
                {isEditMode && editing && (
                  <Button 
                    onClick={() => handleCategoryEdit(category)}
                    variant={isActive ? "default" : "outline"} 
                    size="sm"
                    className={isActive ? "bg-blue-600 hover:bg-blue-700 text-white" : "text-gray-600"}
                  >
                    {isActive ? "Done" : "Edit"}
                  </Button>
                )}
              </div>
              
              <div className="flex flex-wrap gap-2">
                {categorySkills.map((skill, index) => (
                  <div 
                    key={`${category}-${index}`} 
                    className={`px-3 py-1.5 rounded-full text-sm flex items-center ${
                      isActive 
                        ? "bg-blue-100 text-blue-800 border border-blue-200 shadow-sm" 
                        : editing
                          ? "bg-gray-100 text-gray-900 border border-gray-200"
                          : "bg-gray-100 text-gray-900"
                    }`}
                  >
                    {editingSkill && 
                    editingSkill.category === category && 
                    editingSkill.index === index ? (
                      <div className="flex items-center">
                        <Input
                          value={editingSkill.value}
                          onChange={updateSkillText}
                          className="text-sm w-32 h-6 py-0 px-1 border-blue-300 focus:ring-blue-500"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              saveEditedSkill();
                            }
                          }}
                        />
                        <button
                          onClick={saveEditedSkill}
                          className="ml-1 text-green-500 hover:text-green-700"
                          title="Save"
                        >
                          <Check className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ) : (
                      <>
                        {skill}
                        {isEditMode && editing && (
                          <div className="flex ml-1.5">
                            <button 
                              onClick={() => startEditingSkill(category, index, skill)}
                              className="text-gray-500 hover:text-blue-500 mr-1"
                              title="Edit skill"
                            >
                              <Edit className="h-3.5 w-3.5" />
                            </button>
                            <button 
                              onClick={() => handleRemoveSkill(category, skill)}
                              className="text-gray-500 hover:text-red-500"
                              title="Remove skill"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                ))}
                
                {isEditMode && isActive && (
                  <div className="flex items-center gap-2 mt-2 w-full">
                    <Input
                      value={newSkill}
                      onChange={(e) => setNewSkill(e.target.value)}
                      placeholder="Add a skill..."
                      className="text-sm border-blue-200 focus:ring-blue-500"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddSkill(category);
                        }
                      }}
                    />
                    <Button 
                      size="sm" 
                      onClick={() => handleAddSkill(category)}
                      disabled={!newSkill.trim()}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
} 