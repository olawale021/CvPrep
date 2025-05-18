"use client";

import { Check, FileText } from "lucide-react";
import React from 'react';
import { ResumeTemplate } from "../hooks/usePdfGenerator";

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
  ];

  return (
    <div className="mt-4 mb-6">
      <h3 className="text-base font-medium text-gray-800 mb-3">Template Style</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {templates.map((template) => (
          <div
            key={template.id}
            className={`
              relative p-3 rounded-lg border-2 cursor-pointer transition-all
              ${
                selectedTemplate === template.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }
            `}
            onClick={() => setSelectedTemplate(template.id)}
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 flex items-center justify-center bg-white rounded-full shadow-sm">
                <FileText size={18} className="text-blue-500" />
              </div>
              <div>
                <h4 className="font-medium text-gray-900">{template.name}</h4>
                <p className="text-sm text-gray-600">{template.description}</p>
              </div>
              {selectedTemplate === template.id && (
                <div className="absolute top-2 right-2">
                  <div className="w-5 h-5 flex items-center justify-center rounded-full bg-blue-500">
                    <Check size={12} className="text-white" />
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TemplateSelector; 