
import React, { ReactNode } from 'react';
import { Button } from "@/components/ui/button";
import { ChevronLeft } from 'lucide-react';
import ProgressIndicator from '@/components/ProgressIndicator';
import { cn } from "@/lib/utils";

interface MainLayoutProps {
  children: ReactNode;
  stage: 'landing' | 'upload' | 'questionSetup' | 'qa' | 'feedback' | 'completed';
  onBack?: () => void;
  hideProgress?: boolean;
  className?: string;
}

const MainLayout: React.FC<MainLayoutProps> = ({ 
  children, 
  stage, 
  onBack,
  hideProgress = false,
  className 
}) => {
  // Only show back button for stages other than landing and completed
  const showBackButton = stage !== 'landing' && stage !== 'completed' && onBack;
  
  // Only show progress for stages other than landing and completed
  const showProgress = !hideProgress && stage !== 'landing' && stage !== 'completed';
  
  return (
    <div className={cn(
      "min-h-screen bg-gradient-to-b from-blue-50 to-white",
      "flex flex-col items-center p-4 sm:p-6",
      className
    )}>
      {showBackButton && (
        <Button
          onClick={onBack}
          variant="ghost"
          size="sm"
          className="fixed top-4 left-4 z-20 bg-white/80 backdrop-blur-sm shadow-sm
                    hover:bg-white/90 transition-all duration-200"
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Back
        </Button>
      )}
      
      {showProgress && (
        <div className="w-full max-w-md mx-auto sticky top-0 pt-4 pb-2 z-10 bg-gradient-to-b from-blue-50 to-blue-50/95 backdrop-blur-sm">
          <ProgressIndicator currentStage={stage} />
        </div>
      )}
      
      <div className="w-full max-w-5xl mx-auto pt-4">
        {children}
      </div>
    </div>
  );
};

export default MainLayout;
