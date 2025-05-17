"use client";

import { FileText, Layout } from "lucide-react";
import { Button } from "../../../components/ui/Button";
import { Card, CardContent } from "../../../components/ui/Card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../../components/ui/Tabs";
import { ResumeTemplate } from "../hooks/usePdfGenerator";

interface TemplateSelectorProps {
  selectedTemplate: ResumeTemplate;
  onTemplateSelect: (template: ResumeTemplate) => void;
}

export default function TemplateSelector({ 
  selectedTemplate,
  onTemplateSelect 
}: TemplateSelectorProps) {
  return (
    <div className="w-full my-4">
      <div className="flex items-center gap-2 mb-3">
        <Layout className="h-4 w-4 text-gray-600" />
        <h3 className="text-sm font-medium">Resume Template</h3>
      </div>
      
      <Tabs 
        value={selectedTemplate}
        defaultValue={selectedTemplate} 
        onValueChange={(value) => onTemplateSelect(value as ResumeTemplate)}
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-2 mb-4">
          <TabsTrigger value="classic">Classic</TabsTrigger>
          <TabsTrigger value="modern">Modern</TabsTrigger>
        </TabsList>
        
        <TabsContent value="classic">
          <Card className="border border-gray-200">
            <CardContent className="p-3">
              <div className="w-full aspect-[3/4] bg-gray-50 rounded-md border border-gray-200 flex flex-col overflow-hidden">
                {/* Classic Template Mockup */}
                <div className="w-full h-1/6 bg-white p-2 flex flex-col items-center justify-center border-b border-gray-200">
                  <div className="w-1/2 h-4 bg-blue-100 rounded-md mb-2"></div>
                  <div className="w-3/4 h-2 bg-gray-100 rounded-md"></div>
                </div>
                <div className="flex-1 p-2">
                  <div className="w-full h-3 bg-blue-100 rounded-md mb-3"></div>
                  <div className="w-full h-2 bg-gray-100 rounded-md mb-1"></div>
                  <div className="w-full h-2 bg-gray-100 rounded-md mb-1"></div>
                  <div className="w-3/4 h-2 bg-gray-100 rounded-md mb-3"></div>
                  
                  <div className="w-full h-3 bg-blue-100 rounded-md mb-3"></div>
                  <div className="flex mb-2">
                    <div className="w-1/2 h-2 bg-gray-200 rounded-md"></div>
                    <div className="w-1/4 h-2 bg-gray-200 rounded-md ml-auto"></div>
                  </div>
                  <div className="w-2/3 h-2 bg-gray-100 rounded-md mb-2"></div>
                  <div className="pl-3 mb-3">
                    <div className="w-full h-2 bg-gray-100 rounded-md mb-1"></div>
                    <div className="w-full h-2 bg-gray-100 rounded-md mb-1"></div>
                  </div>
                  
                  <div className="w-full h-3 bg-blue-100 rounded-md mb-3"></div>
                  <div className="flex mb-2">
                    <div className="w-1/2 h-2 bg-gray-200 rounded-md"></div>
                  </div>
                  <div className="w-full h-2 bg-gray-100 rounded-md mb-1"></div>
                </div>
              </div>
              <div className="mt-3 text-center">
                <p className="text-xs text-gray-500">Traditional one-column layout</p>
                <Button 
                  variant="default" 
                  size="sm" 
                  className="mt-2 w-full"
                  onClick={() => onTemplateSelect("classic")}
                >
                  <FileText className="h-3 w-3 mr-1" />
                  Select Classic
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="modern">
          <Card className="border border-gray-200">
            <CardContent className="p-3">
              <div className="w-full aspect-[3/4] bg-gray-50 rounded-md border border-gray-200 flex flex-col overflow-hidden">
                {/* Modern Template Mockup */}
                <div className="w-full h-1/6 bg-white p-2 flex flex-col items-center justify-center border-b border-gray-200">
                  <div className="w-1/2 h-4 bg-gray-200 rounded-md mb-2"></div>
                  <div className="w-3/4 h-2 bg-gray-100 rounded-md"></div>
                </div>
                <div className="flex-1 flex">
                  {/* Side column */}
                  <div className="w-1/3 h-full bg-gray-100 p-2">
                    <div className="w-full h-3 bg-gray-200 rounded-md mb-2"></div>
                    <div className="w-full h-2 bg-white rounded-md mb-1"></div>
                    <div className="w-full h-2 bg-white rounded-md mb-1"></div>
                    <div className="w-3/4 h-2 bg-white rounded-md mb-3"></div>
                    
                    <div className="w-full h-3 bg-gray-200 rounded-md mb-2"></div>
                    <div className="w-full h-2 bg-white rounded-md mb-1"></div>
                    <div className="w-3/4 h-2 bg-white rounded-md mb-3"></div>
                  </div>
                  
                  {/* Main column */}
                  <div className="w-2/3 p-2">
                    <div className="w-full h-3 bg-gray-200 rounded-md mb-2"></div>
                    <div className="w-full h-2 bg-gray-100 rounded-md mb-1"></div>
                    <div className="w-full h-2 bg-gray-100 rounded-md mb-3"></div>
                    
                    <div className="w-full h-3 bg-gray-200 rounded-md mb-2"></div>
                    <div className="flex mb-1">
                      <div className="w-1/2 h-2 bg-gray-200 rounded-md"></div>
                      <div className="w-1/4 h-2 bg-gray-200 rounded-md ml-auto"></div>
                    </div>
                    <div className="w-2/3 h-2 bg-gray-100 rounded-md mb-1"></div>
                    <div className="pl-2 mb-3">
                      <div className="w-full h-2 bg-gray-100 rounded-md mb-1"></div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-3 text-center">
                <p className="text-xs text-gray-500">Modern two-column layout</p>
                <Button 
                  variant="default" 
                  size="sm" 
                  className="mt-2 w-full"
                  onClick={() => onTemplateSelect("modern")}
                >
                  <Layout className="h-3 w-3 mr-1" />
                  Select Modern
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 