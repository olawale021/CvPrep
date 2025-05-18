import { Check, Edit, FolderPlus, Plus, Trash2 } from "lucide-react";
import React, { useState } from "react";
import { Button } from "../../../../../components/ui/Button";
import { Input } from "../../../../../components/ui/Input";
import { Textarea } from "../../../../../components/ui/Textarea";
import { useResumeEdit } from "../../context/ResumeEditContext";
import { Project } from "../../types/index";

interface ProjectsProps {
  projects?: Project[];
  isEditMode?: boolean;
}

export default function Projects({ projects, isEditMode }: ProjectsProps) {
  const { editableResume, updateProjects } = useResumeEdit();
  const [activeProjectIndex, setActiveProjectIndex] = useState<number | null>(null);
  const [editing, setEditing] = useState(false);
  
  // Log props and state when component mounts or props change
  React.useEffect(() => {
    console.log("Projects component props:", { projects, isEditMode });
    console.log("Projects component state:", { editableResumeProjects: editableResume.projects });
  }, [projects, isEditMode, editableResume.projects]);
  
  // Use projects from editableResume if available
  const projectsData = editableResume.projects || projects || [];

  if (!projectsData || projectsData.length === 0) {
    return (
      <>
        <h3 className="text-xl font-semibold mb-4">Projects</h3>
        {isEditMode && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              // Add empty project and start editing it
              const newProject = {
                title: "New Project",
                description: "Describe your project here...",
                technologies: []
              };
              
              updateProjects([...projectsData, newProject]);
              setActiveProjectIndex(0);
              setEditing(true);
            }}
            className="mb-4 text-green-600 border-green-200 hover:bg-green-50"
          >
            <Plus className="h-3 w-3 mr-1" /> Add Project
          </Button>
        )}
        <p className="text-gray-500 italic">No projects available</p>
      </>
    );
  }
  
  const handleUpdateProject = (index: number, field: keyof Project, value: string | string[]) => {
    const updatedProjects = [...projectsData];
    
    if (field === 'technologies' && typeof value === 'string') {
      // Split comma-separated technologies into an array
      updatedProjects[index] = {
        ...updatedProjects[index],
        technologies: value.split(',').map(tech => tech.trim()).filter(Boolean)
      };
    } else {
      updatedProjects[index] = {
        ...updatedProjects[index],
        [field]: value
      };
    }
    
    updateProjects(updatedProjects);
  };
  
  // Add delete project functionality
  const handleDeleteProject = (index: number) => {
    const updatedProjects = [...projectsData];
    updatedProjects.splice(index, 1);
    updateProjects(updatedProjects);
    
    // Reset editing state if the active project was deleted
    if (activeProjectIndex === index) {
      setActiveProjectIndex(null);
      setEditing(false);
    }
  };
  
  const handleEditProject = (index: number) => {
    setActiveProjectIndex(index);
    setEditing(true);
  };
  
  const handleSaveProject = () => {
    setEditing(false);
    setActiveProjectIndex(null);
  };
  
  // Helper function to convert technologies to string for editing
  const technologiesToString = (technologies: string[] | string | undefined): string => {
    if (!technologies) return '';
    if (Array.isArray(technologies)) return technologies.join(', ');
    return technologies;
  };
  
  // Add a new project
  const handleAddProject = () => {
    const newProject = {
      title: "New Project",
      description: "Describe your project here...",
      technologies: []
    };
    
    const updatedProjects = [...projectsData, newProject];
    updateProjects(updatedProjects);
    
    // Set this new project as active for editing
    setActiveProjectIndex(updatedProjects.length - 1);
    setEditing(true);
  };

  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold text-gray-900">Projects</h3>
        {isEditMode && (
          <div className="flex items-center gap-2">
            <Button 
              variant={editing ? "default" : "outline"} 
              size="sm" 
              onClick={() => {
                if (editing) {
                  setEditing(false);
                  setActiveProjectIndex(null);
                } else {
                  setEditing(true);
                }
              }}
              className={`${editing ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'text-gray-600'}`}
            >
              {editing ? 'Done Editing' : 'Edit Projects'}
              <Edit className="ml-1 h-3 w-3" />
            </Button>
            
            {editing && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleAddProject}
                className="text-green-600 border-green-200 hover:bg-green-50"
              >
                <Plus className="h-3 w-3 mr-1" /> Add
              </Button>
            )}
          </div>
        )}
      </div>
      
      {isEditMode && editing && (
        <div className="bg-blue-50 border border-blue-100 rounded-md p-3 mb-4 text-sm text-blue-800">
          <p className="flex items-center">
            <Edit className="h-4 w-4 mr-2 text-blue-600" />
            Project edit mode is active. Select a project to edit or add a new one.
          </p>
        </div>
      )}
      
      <div className={`space-y-6 ${isEditMode && editing ? 'relative' : ''}`}>
        {isEditMode && editing && (
          <div className="absolute -left-3 -right-3 -top-4 -bottom-4 bg-blue-50/30 rounded-lg border border-blue-100 -z-10"></div>
        )}
        
        {projectsData.map((project, index) => {
          const isActive = editing && activeProjectIndex === index;
          
          return (
            <div 
              key={index} 
              className={`rounded-lg p-4 border transition-shadow ${
                isActive 
                  ? 'bg-blue-50/50 border-blue-300 shadow-sm' 
                  : 'bg-gray-50 border-gray-100 hover:shadow-md'
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                {isActive ? (
                  <div className="w-full">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Project Title
                    </label>
                    <Input
                      value={project.title}
                      onChange={(e) => handleUpdateProject(index, 'title', e.target.value)}
                      className="font-semibold text-gray-800 mb-2 border-blue-200 focus:ring-blue-500"
                    />
                  </div>
                ) : (
                  <h4 className="font-semibold text-gray-800 mb-2 flex items-center">
                    <FolderPlus className="h-4 w-4 mr-2 text-blue-500" />
                    {project.title}
                  </h4>
                )}
                
                {isEditMode && (
                  <div className="flex">
                    {isActive ? (
                      <Button 
                        size="sm" 
                        variant="default" 
                        onClick={handleSaveProject}
                        className="ml-2 bg-blue-600 hover:bg-blue-700"
                      >
                        <Check className="h-4 w-4 mr-1" /> Done
                      </Button>
                    ) : editing && (
                      <>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => handleEditProject(index)}
                          className="ml-2 text-blue-600 border-blue-200 hover:bg-blue-50"
                        >
                          <Edit className="h-4 w-4 mr-1" /> Edit
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          onClick={() => handleDeleteProject(index)}
                          className="ml-2 text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                )}
              </div>
              
              {isActive ? (
                <div className="mb-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Project Description
                  </label>
                  <Textarea
                    value={project.description}
                    onChange={(e) => handleUpdateProject(index, 'description', e.target.value)}
                    className="text-gray-800 min-h-[80px] border-blue-200 focus:ring-blue-500"
                  />
                </div>
              ) : (
                <p className="text-gray-700 mb-3">{project.description}</p>
              )}
              
              {isActive ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Technologies (comma-separated)
                  </label>
                  <Input
                    value={technologiesToString(project.technologies)}
                    onChange={(e) => handleUpdateProject(index, 'technologies', e.target.value)}
                    placeholder="e.g. React, TypeScript, Node.js"
                    className="mb-2 border-blue-200 focus:ring-blue-500"
                  />
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {project.technologies && Array.isArray(project.technologies) ?
                    project.technologies.map((tech, techIndex) => (
                      <span key={techIndex} className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs">
                        {tech}
                      </span>
                    )) :
                    project.technologies && typeof project.technologies === 'string' ?
                      <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs">
                        {project.technologies}
                      </span>
                    : null
                  }
                </div>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
} 