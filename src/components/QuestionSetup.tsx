
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { Settings, Lock } from 'lucide-react';
import { cn } from "@/lib/utils";

interface QuestionSetupProps {
  onGenerateQuestions: (numberOfQuestions: string, difficulty: string, model: string) => void;
  className?: string;
}

type ModelType = {
  name: string;
  paid: boolean;
  description: string;
};

const models: ModelType[] = [
  { 
    name: 'OPENAI', 
    paid: true, 
    description: 'Powered by GPT-4 for high-quality, nuanced questions and evaluations.' 
  },
  { 
    name: 'TRANSFORMERS', 
    paid: false, 
    description: 'Open-source model with good performance on a wide range of documents.' 
  },
  { 
    name: 'ANTHROPIC', 
    paid: true, 
    description: 'Claude model known for thoughtful, helpful, and harmless responses.' 
  }
];

const QuestionSetup: React.FC<QuestionSetupProps> = ({ 
  onGenerateQuestions,
  className 
}) => {
  const [numberOfQuestions, setNumberOfQuestions] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [selectedModel, setSelectedModel] = useState('');
  
  const isFormComplete = numberOfQuestions && difficulty && selectedModel;
  
  const handleSubmit = () => {
    if (isFormComplete) {
      if ((selectedModel === 'OPENAI' || selectedModel === 'ANTHROPIC')) {
        // In a real app, check subscription status before showing the subscription modal
        // For now, let's assume the user isn't subscribed
        setShowSubscriptionRequired(true);
      } else {
        onGenerateQuestions(numberOfQuestions, difficulty, selectedModel);
      }
    }
  };
  
  const [showSubscriptionRequired, setShowSubscriptionRequired] = useState(false);
  
  if (showSubscriptionRequired) {
    return (
      <Card className="w-full max-w-md mx-auto animate-scale-in">
        <CardContent className="p-6 text-center">
          <Lock className="w-12 h-12 mx-auto mb-4 text-yellow-500" />
          <CardTitle className="text-2xl font-bold mb-4">Subscription Required</CardTitle>
          <p className="mb-6 text-gray-600">
            You need a paid subscription to access this premium model.
            Please upgrade your account or select a free model.
          </p>
          <Button 
            onClick={() => setShowSubscriptionRequired(false)}
            variant="outline"
            className="w-full"
          >
            Go Back
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("w-full max-w-md mx-auto animate-scale-in", className)}>
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-center">Configure Questions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <label className="block mb-2 font-medium text-sm">Number of Questions:</label>
          <Input 
            type="number" 
            value={numberOfQuestions}
            onChange={(e) => setNumberOfQuestions(e.target.value)}
            placeholder="Enter number (1-10)"
            min="1"
            max="10"
            className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
          />
        </div>

        <div>
          <label className="block mb-2 font-medium text-sm">Difficulty Level:</label>
          <div className="grid grid-cols-3 gap-2">
            {['EASY', 'MEDIUM', 'HARD'].map((level) => (
              <Button
                key={level}
                variant={difficulty === level ? "default" : "outline"}
                onClick={() => setDifficulty(level)}
                className={cn(
                  "transition-all duration-200",
                  difficulty === level 
                    ? "shadow-sm" 
                    : "hover:bg-accent hover:text-accent-foreground"
                )}
              >
                {level}
              </Button>
            ))}
          </div>
        </div>

        <div>
          <label className="block mb-2 font-medium text-sm">Select Model:</label>
          <div className="space-y-2">
            {models.map((model) => (
              <HoverCard key={model.name} openDelay={200} closeDelay={100}>
                <HoverCardTrigger asChild>
                  <Button
                    variant={selectedModel === model.name ? "default" : "outline"}
                    onClick={() => setSelectedModel(model.name)}
                    className={cn(
                      "w-full justify-between transition-all duration-200",
                      selectedModel === model.name 
                        ? "shadow-sm" 
                        : "hover:bg-accent hover:text-accent-foreground"
                    )}
                  >
                    <span>{model.name}</span>
                    <span className={cn(
                      "text-xs px-2 py-0.5 rounded-full",
                      model.paid 
                        ? "bg-amber-100 text-amber-700" 
                        : "bg-emerald-100 text-emerald-700"
                    )}>
                      {model.paid ? 'Premium' : 'Free'}
                    </span>
                  </Button>
                </HoverCardTrigger>
                <HoverCardContent className="w-80">
                  <p className="text-sm">{model.description}</p>
                </HoverCardContent>
              </HoverCard>
            ))}
          </div>
        </div>

        <Button 
          onClick={handleSubmit}
          disabled={!isFormComplete}
          className="w-full"
        >
          <Settings className="w-4 h-4 mr-2" />
          Generate Questions
        </Button>
      </CardContent>
    </Card>
  );
};

export default QuestionSetup;
