
import React, { useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { FileUp, Upload, FileText } from 'lucide-react';
import { uploadDocument } from '@/api/api';
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface DocumentUploaderProps {
  onDocumentUploaded: (content: string, fileName: string) => void;
  className?: string;
}

const DocumentUploader: React.FC<DocumentUploaderProps> = ({ 
  onDocumentUploaded,
  className 
}) => {
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const [fileName, setFileName] = useState('');
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFileName(file.name);
      setIsUploading(true);
      setError('');
      
      try {
        console.log('Uploading file:', file.name, file.type, file.size);
        const content = await uploadDocument(file);
        onDocumentUploaded(content, file.name);
        toast({
          title: "Document Processed",
          description: "Your document has been successfully processed.",
        });
      } catch (err) {
        setError('Failed to upload document. Please ensure the backend server is running.');
        console.error('Upload error:', err);
        toast({
          variant: "destructive",
          title: "Upload Failed",
          description: "Unable to process your document. Please ensure the backend server is running.",
        });
      } finally {
        setIsUploading(false);
      }
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <Card className={cn("w-full max-w-md mx-auto animate-scale-in", className)}>
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-center">Upload Your Document</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div 
          onClick={() => fileInputRef.current?.click()}
          className={cn(
            "border-2 border-dashed rounded-xl p-8 text-center cursor-pointer",
            "transition-all duration-300 ease-in-out",
            "hover:border-primary hover:bg-primary/5",
            isUploading ? "bg-blue-50 border-blue-200" : "border-gray-200"
          )}
        >
          {isUploading ? (
            <div className="flex flex-col items-center">
              <div className="loading-spinner mb-3"></div>
              <p>Processing your document...</p>
            </div>
          ) : (
            <>
              <Upload className="w-10 h-10 mx-auto mb-2 text-primary" />
              <p className="font-medium text-gray-800">Click to upload or drag and drop</p>
              <p className="text-sm text-gray-500 mt-2">PDF, DOCX, or TXT (max 20MB)</p>
            </>
          )}
        </div>
        
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
          accept=".txt,.pdf,.docx"
          disabled={isUploading}
        />
        
        {fileName && !error && (
          <Alert className="bg-accent/50 border border-accent">
            <FileText className="w-4 h-4 text-primary" />
            <AlertDescription className="ml-2">{fileName}</AlertDescription>
          </Alert>
        )}
        
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        <Button 
          onClick={handleButtonClick}
          className="w-full"
          disabled={isUploading}
        >
          <FileUp className="w-4 h-4 mr-2" />Select Document
        </Button>
      </CardContent>
    </Card>
  );
};

export default DocumentUploader;
