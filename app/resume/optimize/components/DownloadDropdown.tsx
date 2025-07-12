import { ChevronDown, Download, FileText } from 'lucide-react';
import { useState } from 'react';
import { Button } from '../../../../components/ui/base/Button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../../../../components/ui/composite/DropdownMenu';
import { useWordxDownload } from '../../../../hooks/ui/useWordxDownload';
import { ResumeData, ResumeResponse } from '../types';

interface DownloadDropdownProps {
  editableResume?: ResumeData;
  resumeResponse: ResumeResponse | null;
  handleDownloadPdf: (editableResume?: ResumeData) => void;
  isPdfGenerating: boolean;
  selectedTemplate: "classic" | "modern" | "professional";
  className?: string;
}

export function DownloadDropdown({
  editableResume,
  resumeResponse,
  handleDownloadPdf,
  isPdfGenerating,
  selectedTemplate,
  className = ""
}: DownloadDropdownProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const { downloadResumeAsWord } = useWordxDownload();

  const handleWordDownload = async () => {
    if (!editableResume) return;
    
    setIsDownloading(true);
    try {
      await downloadResumeAsWord(editableResume, resumeResponse, selectedTemplate);
    } catch (error) {
      console.error('Error downloading Word document:', error);
    } finally {
      setIsDownloading(false);
    }
  };

  const handlePdfDownload = () => {
    handleDownloadPdf(editableResume);
  };

  const isAnyDownloadInProgress = isPdfGenerating || isDownloading;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="default"
          size="sm"
          className={`whitespace-nowrap items-center text-xs sm:text-sm px-2 sm:px-3 py-1.5 sm:py-2 ${className}`}
          disabled={isAnyDownloadInProgress}
        >
          <Download className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
          <span className="hidden sm:inline">
            {isAnyDownloadInProgress ? "Downloading..." : "Download"}
          </span>
          <span className="sm:hidden">
            {isAnyDownloadInProgress ? "..." : "Download"}
          </span>
          <ChevronDown className="h-3 w-3 sm:h-4 sm:w-4 ml-1 sm:ml-2" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem
          onClick={handlePdfDownload}
          disabled={isAnyDownloadInProgress}
          className="flex items-center gap-2 cursor-pointer"
        >
          <FileText className="h-4 w-4 text-red-500" />
          <span>Download as PDF</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={handleWordDownload}
          disabled={isAnyDownloadInProgress}
          className="flex items-center gap-2 cursor-pointer"
        >
          <FileText className="h-4 w-4 text-blue-500" />
          <span>Download as DOCX</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
} 