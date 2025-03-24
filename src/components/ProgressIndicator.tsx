
import React from 'react';
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface ProgressIndicatorProps {
  currentStage: 'landing' | 'upload' | 'questionSetup' | 'qa' | 'feedback' | 'completed';
  className?: string;
}

const stageToProgress = {
  landing: 0,
  upload: 20,
  questionSetup: 40,
  qa: 60,
  feedback: 80,
  completed: 100,
};

const stages = [
  { id: 'upload', label: 'Upload' },
  { id: 'questionSetup', label: 'Setup' },
  { id: 'qa', label: 'Questions' },
  { id: 'feedback', label: 'Feedback' },
  { id: 'completed', label: 'Complete' },
];

const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({ currentStage, className }) => {
  return (
    <div className={cn("w-full max-w-md mx-auto pt-4 pb-2 z-10", className)}>
      <Progress 
        value={stageToProgress[currentStage]} 
        className="h-2 bg-blue-100"
      />
      <div className="flex justify-between mt-2 text-xs text-gray-600">
        {stages.map((stage) => {
          const isActive = stageToProgress[currentStage as keyof typeof stageToProgress] >= 
                          stageToProgress[stage.id as keyof typeof stageToProgress];
          
          return (
            <span 
              key={stage.id} 
              className={cn(
                "transition-colors duration-300",
                isActive ? "font-medium text-primary" : "text-gray-400"
              )}
            >
              {stage.label}
            </span>
          );
        })}
      </div>
    </div>
  );
};

export default ProgressIndicator;
