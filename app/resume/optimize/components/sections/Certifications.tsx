import { Award, Check, Edit, Plus, Trash2, X } from "lucide-react";
import React, { useState } from "react";
import { Button } from "../../../../../components/ui/base/Button";
import { Input } from "../../../../../components/ui/base/Input";
import { useResumeEdit } from "../../context/ResumeEditContext";

interface CertificationsProps {
  certifications?: string[];
  isEditMode?: boolean;
}

export default function Certifications({ certifications, isEditMode = false }: CertificationsProps) {
  const { editableResume, updateResumeField } = useResumeEdit();
  const [editing, setEditing] = useState(false);
  const [newCertificate, setNewCertificate] = useState("");
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [editValue, setEditValue] = useState("");
  
  // Initialize from props if needed
  React.useEffect(() => {
    if (certifications && certifications.length > 0 && 
        (!editableResume.certifications || editableResume.certifications.length === 0)) {
      updateResumeField('certifications', certifications);
    }
    // Log props when component mounts or props change
  
  }, [certifications, editableResume.certifications, updateResumeField, isEditMode]);

  const certList = editableResume.certifications || [];

  // Function to add a new certification
  const handleAddCertification = () => {
    if (!newCertificate.trim()) return;
    
    const updatedCertifications = [...certList, newCertificate];
    updateResumeField('certifications', updatedCertifications);
    setNewCertificate("");
  };
  
  // Function to delete a certification
  const handleDeleteCertification = (index: number) => {
    const updatedCertifications = certList.filter((_, i) => i !== index);
    updateResumeField('certifications', updatedCertifications);
    
    // Reset editing state if needed
    if (editIndex === index) {
      setEditIndex(null);
      setEditValue("");
    }
  };
  
  // Function to start editing a certification
  const handleStartEdit = (index: number, value: string) => {
    setEditIndex(index);
    setEditValue(value);
  };
  
  // Function to save edited certification
  const handleSaveEdit = () => {
    if (editIndex === null || !editValue.trim()) return;
    
    const updatedCertifications = [...certList];
    updatedCertifications[editIndex] = editValue.trim();
    updateResumeField('certifications', updatedCertifications);
    
    // Reset editing state
    setEditIndex(null);
    setEditValue("");
  };
  
  // Function to cancel editing
  const handleCancelEdit = () => {
    setEditIndex(null);
    setEditValue("");
  };

  if (!certList || certList.length === 0) {
    return (
      <>
        <h3 className="text-xl font-semibold mb-4 text-gray-900">Certifications</h3>
        {isEditMode && (
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <Input
                value={newCertificate}
                onChange={(e) => setNewCertificate(e.target.value)}
                placeholder="Add a certification..."
                className="text-sm"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddCertification();
                  }
                }}
              />
              <Button 
                size="sm" 
                onClick={handleAddCertification}
                disabled={!newCertificate.trim()}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="h-4 w-4 mr-1" /> Add
              </Button>
            </div>
          </div>
        )}
        <p className="text-gray-500 italic">No certifications available</p>
      </>
    );
  }

  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold text-gray-900">Certifications</h3>
        {isEditMode && (
          <Button 
            variant={editing ? "default" : "outline"} 
            size="sm" 
            onClick={() => setEditing(!editing)}
            className={`${editing ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'text-gray-600'}`}
          >
            {editing ? 'Done Editing' : 'Edit Certifications'}
            <Edit className="ml-1 h-3 w-3" />
          </Button>
        )}
      </div>
      
      {isEditMode && editing && (
        <div className="bg-blue-50 border border-blue-100 rounded-md p-3 mb-4 text-sm text-blue-800">
          <p className="flex items-center">
            <Edit className="h-4 w-4 mr-2 text-blue-600" />
            Edit mode is active. Click on certifications to edit or remove them.
          </p>
        </div>
      )}
      
      <div className={`space-y-4 ${isEditMode && editing ? 'relative' : ''}`}>
        {isEditMode && editing && (
          <div className="absolute -left-3 -right-3 -top-4 -bottom-4 bg-blue-50/30 rounded-lg border border-blue-100 -z-10"></div>
        )}
        
        {certList.map((cert, index) => (
          <div 
            key={index} 
            className={`flex items-center p-3 rounded-lg border ${
              editing 
                ? 'bg-blue-50/50 border-blue-200 hover:bg-blue-100/50 transition-colors' 
                : 'bg-gray-50 border-gray-100 hover:shadow-sm transition-shadow'
            }`}
          >
            {editIndex === index ? (
              <div className="flex items-center w-full gap-2">
                <Award className="h-5 w-5 text-yellow-500 mr-3 flex-shrink-0" />
                <Input
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  className="flex-1 border-blue-200 focus:ring-blue-500"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleSaveEdit();
                    }
                  }}
                />
                <Button 
                  size="sm" 
                  variant="ghost" 
                  onClick={handleSaveEdit}
                  className="text-green-600"
                >
                  <Check className="h-4 w-4" />
                </Button>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  onClick={handleCancelEdit}
                  className="text-gray-600"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <>
                <Award className="h-5 w-5 text-yellow-500 mr-3 flex-shrink-0" />
                <span className="text-gray-800 font-medium flex-1">{cert}</span>
                
                {isEditMode && editing && (
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleStartEdit(index, cert)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteCertification(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        ))}
        
        {isEditMode && editing && (
          <div className="flex items-center gap-2 mt-4">
            <Input
              value={newCertificate}
              onChange={(e) => setNewCertificate(e.target.value)}
              placeholder="Add a certification..."
              className="text-sm border-blue-200 focus:ring-blue-500"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddCertification();
                }
              }}
            />
            <Button 
              size="sm" 
              onClick={handleAddCertification}
              disabled={!newCertificate.trim()}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="h-4 w-4 mr-1" /> Add
            </Button>
          </div>
        )}
      </div>
    </>
  );
} 