
import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Save } from 'lucide-react';
import { cn } from "@/lib/utils";

interface Question {
  id: number;
  text: string;
}

interface QuestionAnsweringProps {
  questions: Question[];
  onSubmitAnswers: (savedAnswers: Record<number, string>) => void;
  className?: string;
}

const QuestionAnswering: React.FC<QuestionAnsweringProps> = ({ 
  questions, 
  onSubmitAnswers,
  className 
}) => {
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [savedAnswers, setSavedAnswers] = useState<Record<number, string>>({});
  const [activeQuestion, setActiveQuestion] = useState<number | null>(
    questions.length > 0 ? questions[0].id : null
  );

  useEffect(() => {
    if (questions.length > 0 && !activeQuestion) {
      setActiveQuestion(questions[0].id);
    }
  }, [questions, activeQuestion]);

  const handleAnswerChange = useCallback((questionId: number, value: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: value
    }));
  }, []);

  const handleSaveAnswer = useCallback((questionId: number) => {
    if (answers[questionId]) {
      setSavedAnswers(prev => ({
        ...prev,
        [questionId]: answers[questionId]
      }));
    }
  }, [answers]);

  const isAnswerSaved = useCallback((questionId: number) => {
    return savedAnswers[questionId] === answers[questionId] && !!answers[questionId];
  }, [savedAnswers, answers]);

  const allAnswersSaved = questions.every(q => !!savedAnswers[q.id]);
  
  const scrollToQuestion = (questionId: number) => {
    setActiveQuestion(questionId);
    const element = document.getElementById(`question-${questionId}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className={cn("w-full max-w-3xl mx-auto", className)}>
      <div className="flex mb-6 overflow-x-auto py-1 px-1 -mx-1 no-scrollbar">
        {questions.map((question) => (
          <button
            key={question.id}
            onClick={() => scrollToQuestion(question.id)}
            className={cn(
              "min-w-10 h-10 rounded-full mr-2 flex items-center justify-center",
              "transition-all duration-300 text-sm font-medium",
              activeQuestion === question.id
                ? "bg-primary text-white shadow-sm"
                : isAnswerSaved(question.id)
                  ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            )}
          >
            {question.id}
          </button>
        ))}
      </div>

      <div className="space-y-6">
        {questions.map((question) => (
          <Card 
            key={question.id} 
            id={`question-${question.id}`} 
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
                <Textarea
                  value={answers[question.id] || ''}
                  onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                  placeholder="Type your answer here..."
                  className="min-h-32 transition-all duration-200 focus:border-primary/50 focus:ring-2 focus:ring-primary/20"
                />
                <Button
                  onClick={() => handleSaveAnswer(question.id)}
                  disabled={isAnswerSaved(question.id)}
                  className={cn(
                    "w-full transition-all duration-300",
                    isAnswerSaved(question.id) 
                      ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-100" 
                      : ""
                  )}
                >
                  <Save className="w-4 h-4 mr-2" />
                  {isAnswerSaved(question.id) ? "Answer Saved" : "Save Answer"}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}

        <Card className="sticky bottom-6 shadow-medium animate-fade-in">
          <CardContent className="p-4">
            <Button
              onClick={() => onSubmitAnswers(savedAnswers)}
              disabled={!allAnswersSaved}
              variant="default"
              className="w-full bg-emerald-600 hover:bg-emerald-700 transition-all duration-300"
            >
              Submit All Answers
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default QuestionAnswering;
