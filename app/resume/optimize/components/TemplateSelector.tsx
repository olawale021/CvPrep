"use client";

import { Check, FileText, Lock } from "lucide-react";
import React, { useEffect, useState } from 'react';
import { useAuth } from "../../../../context/AuthContext";
import { ResumeTemplate } from "../hooks/usePdfGenerator";
import UpgradeModal from "./UpgradeModal";

type TemplateSelectorProps = {
  selectedTemplate: ResumeTemplate;
  setSelectedTemplate: (template: ResumeTemplate) => void;
};

const TemplateSelector: React.FC<TemplateSelectorProps> = ({
  selectedTemplate,
  setSelectedTemplate,
}) => {
  const templates: Array<{ id: ResumeTemplate; name: string; description: string }> = [
    {
      id: 'classic',
      name: 'Classic',
      description: 'Traditional layout with clear sections',
    },
    {
      id: 'modern',
      name: 'Modern',
      description: 'Contemporary design with side column',
    },
    {
      id: 'professional',
      name: 'Professional',
      description: 'Clean format with horizontal dividers',
    },
  ];

  // const { user } = useUser();
  const { appUser } = useAuth();
  const isPremium = appUser?.type === "premium";
  const [showUpgrade, setShowUpgrade] = useState(false);
  
  // Reset to classic template if non-premium user somehow has modern template selected
  useEffect(() => {
    if (!isPremium && selectedTemplate === 'modern') {
      setSelectedTemplate('classic');
    }
  }, [isPremium, selectedTemplate, setSelectedTemplate]);

  return (
    <div className="mt-4 mb-6">
      <h3 className="text-base font-medium text-gray-800 mb-3">Template Style</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {templates.map((template) => {
          const isModern = template.id === "modern";
          const locked = isModern && !isPremium;
          return (
            <div
              key={template.id}
              className={`
                relative p-3 rounded-lg border-2 cursor-pointer transition-all
                ${selectedTemplate === template.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}
                ${locked ? 'opacity-60 pointer-events-auto' : ''}
              `}
              onClick={() => {
                if (locked) {
                  setShowUpgrade(true);
                } else {
                  setSelectedTemplate(template.id);
                }
              }}
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 flex items-center justify-center bg-white rounded-full shadow-sm">
                  <FileText size={18} className="text-blue-500" />
                  {locked && (
                    <Lock className="absolute top-0 right-0 h-4 w-4 text-yellow-500 bg-white rounded-full p-0.5" />
                  )}
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 flex items-center">
                    {template.name}
                    {locked && <Lock className="ml-2 h-4 w-4 text-yellow-500" />}
                  </h4>
                  <p className="text-sm text-gray-600">{template.description}</p>
                  {locked && (
                    <span className="text-xs text-yellow-600 font-medium">Premium</span>
                  )}
                </div>
                {selectedTemplate === template.id && !locked && (
                  <div className="absolute top-2 right-2">
                    <div className="w-5 h-5 flex items-center justify-center rounded-full bg-blue-500">
                      <Check size={12} className="text-white" />
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
      <UpgradeModal open={showUpgrade} onClose={() => setShowUpgrade(false)} />
    </div>
  );
};

export default TemplateSelector; 