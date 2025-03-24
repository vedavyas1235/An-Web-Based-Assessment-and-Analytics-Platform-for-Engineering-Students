
import React, { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";

interface Question {
  id: number;
  text: string;
}

interface FeedbackDisplayProps {
  questions: Question[];
  userAnswers: Record<number, string>;
  feedback: Record<number, string>;
  onFinish: () => void;
  className?: string;
}

const FeedbackDisplay: React.FC<FeedbackDisplayProps> = ({ 
  questions, 
  userAnswers, 
  feedback,
  onFinish,
  className 
}) => {
  const [activeQuestion, setActiveQuestion] = useState<number | null>(
    questions.length > 0 ? questions[0].id : null
  );

  // Extract scores from feedback strings
  const getScoreFromFeedback = (feedbackText: string) => {
    const match = feedbackText.match(/Score: (\d+)/);
    return match ? parseInt(match[1], 10) : 0;
  };
  
  const scores = Object.entries(feedback).reduce<Record<number, number>>((acc, [questionId, feedbackText]) => {
    acc[parseInt(questionId)] = getScoreFromFeedback(feedbackText);
    return acc;
  }, {});

  // Calculate average score
  const totalScore = Object.values(scores).reduce((sum, score) => sum + score, 0);
  const averageScore = totalScore / Object.values(scores).length || 0;
  
  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-emerald-600";
    if (score >= 80) return "text-emerald-500";
    if (score >= 70) return "text-amber-500";
    return "text-red-500";
  };
  
  const getFeedbackText = (feedbackString: string) => {
    // Remove the "Score: XX/100. " prefix to get just the feedback text
    return feedbackString.replace(/Score: \d+\/100\.\s*/, '');
  };
  
  const scrollToQuestion = (questionId: number) => {
    setActiveQuestion(questionId);
    const element = document.getElementById(`feedback-${questionId}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className={cn("w-full max-w-3xl mx-auto", className)}>
      <Card className="mb-6 overflow-hidden">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Final Results</h2>
            <div className="text-right">
              <div className="text-sm text-gray-600 mb-1">Average Score</div>
              <div className={cn(
                "text-3xl font-bold",
                getScoreColor(averageScore)
              )}>
                {Math.round(averageScore)}
              </div>
            </div>
          </div>
          
          <div className="mt-6 flex overflow-x-auto py-1 -mx-1 no-scrollbar">
            {questions.map((question) => {
              const score = scores[question.id] || 0;
              return (
                <button
                  key={question.id}
                  onClick={() => scrollToQuestion(question.id)}
                  className={cn(
                    "flex flex-col items-center mr-3 p-2 rounded-lg transition-all duration-200",
                    activeQuestion === question.id
                      ? "bg-gray-100"
                      : "hover:bg-gray-50"
                  )}
                >
                  <div className="text-sm text-gray-600 mb-1">Q{question.id}</div>
                  <div className={cn(
                    "font-bold text-lg",
                    getScoreColor(score)
                  )}>
                    {score}
                  </div>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <div className="space-y-6">
        {questions.map((question) => (
          <Card 
            key={question.id} 
            id={`feedback-${question.id}`} 
            className={cn(
              "scroll-mt-24 transition-all duration-300",
              activeQuestion === question.id 
                ? "ring-2 ring-primary/10" 
                : "hover:shadow-soft"
            )}
          >
            <CardContent className="p-6">
              <h3 className="text-xl font-bold mb-2">Question {question.id}</h3>
              <p className="text-lg mb-4 text-gray-700">{question.text}</p>
              
              <div className="space-y-4">
                <div>
                  <label className="block mb-2 font-medium text-sm">Your Answer:</label>
                  <div className="w-full p-4 border rounded-lg min-h-32 bg-gray-50 text-gray-800">
                    {userAnswers[question.id] || "No answer provided"}
                  </div>
                </div>
                
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="font-medium text-sm">Feedback:</label>
                    <div className={cn(
                      "text-sm font-semibold px-2 py-0.5 rounded-full",
                      getScoreColor(scores[question.id] || 0),
                      (scores[question.id] || 0) >= 70 ? "bg-emerald-50" : "bg-red-50"
                    )}>
                      Score: {scores[question.id] || 0}/100
                    </div>
                  </div>
                  <Alert className="bg-accent/50 border border-accent">
                    <AlertDescription className="text-sm">
                      {getFeedbackText(feedback[question.id] || "")}
                    </AlertDescription>
                  </Alert>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        <Card className="mb-8">
          <CardContent className="p-6">
            <Button
              onClick={onFinish}
              variant="default"
              className="w-full"
            >
              Finish Assessment
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default FeedbackDisplay;
