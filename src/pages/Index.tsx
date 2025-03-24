
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Book, AlertCircle } from 'lucide-react';
import { generateQuestions, evaluateAnswer } from '@/api/api';
import DocumentUploader from '@/components/DocumentUploader';
import QuestionSetup from '@/components/QuestionSetup';
import QuestionAnswering from '@/components/QuestionAnswering';
import FeedbackDisplay from '@/components/FeedbackDisplay';
import MainLayout from '@/layouts/MainLayout';
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface Question {
  id: number;
  text: string;
}

const Index = () => {
  const { toast } = useToast();
  const [stage, setStage] = useState<'landing' | 'upload' | 'questionSetup' | 'qa' | 'feedback' | 'completed'>('landing');
  const [fileName, setFileName] = useState('');
  const [documentContent, setDocumentContent] = useState('');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [modelAnswers, setModelAnswers] = useState<Record<number, { modelAnswer: string }>>({});
  const [savedAnswers, setSavedAnswers] = useState<Record<number, string>>({});
  const [feedback, setFeedback] = useState<Record<number, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Handle navigating back
  const handleBack = () => {
    const stages: Array<'landing' | 'upload' | 'questionSetup' | 'qa' | 'feedback' | 'completed'> = [
      'landing', 'upload', 'questionSetup', 'qa', 'feedback', 'completed'
    ];
    const currentIndex = stages.indexOf(stage);
    if (currentIndex > 0) {
      setStage(stages[currentIndex - 1]);
      // Scroll to top when changing stages
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Handle document upload
  const handleDocumentUploaded = (content: string, name: string) => {
    setDocumentContent(content);
    setFileName(name);
    // Move to the question setup stage
    setStage('questionSetup');
    // Scroll to top when changing stages
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handle generating questions
  const handleGenerateQuestions = async (
    numberOfQuestions: string,
    difficulty: string,
    model: string
  ) => {
    setIsLoading(true);
    setError('');
    
    try {
      const response = await generateQuestions(documentContent, numberOfQuestions, difficulty);
      
      // Create questions array based on API response
      const questionsArray = response.questions.map((q, idx) => ({
        id: idx + 1,
        text: q.question
      }));

      // Store model answers separately
      const modelAnswersMap = response.questions.reduce<Record<number, { modelAnswer: string }>>((acc, q, idx) => {
        acc[idx + 1] = { modelAnswer: q.model_answer };
        return acc;
      }, {});

      setQuestions(questionsArray);
      setModelAnswers(modelAnswersMap);
      setStage('qa');
      
      toast({
        title: "Questions Generated",
        description: `${questionsArray.length} questions have been generated based on your document.`,
      });
    } catch (err) {
      setError('Failed to generate questions. Please try again.');
      console.error(err);
      
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to generate questions. Please try again.",
      });
    } finally {
      setIsLoading(false);
      // Scroll to top when changing stages
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Handle submitting answers
  const handleSubmitAnswers = async (answers: Record<number, string>) => {
    setIsLoading(true);
    setSavedAnswers(answers);
    setError('');
    
    try {
      const feedbackPromises = questions.map(async (question) => {
        const userAnswer = answers[question.id];
        const modelAnswer = modelAnswers[question.id]?.modelAnswer;
        
        // Call API to evaluate each answer
        const response = await evaluateAnswer(
          question.text,
          userAnswer,
          modelAnswer,
          'MEDIUM' // Default to medium difficulty if not set
        );

        return {
          questionId: question.id,
          feedback: response.feedback,
          score: response.score
        };
      });

      const feedbackResults = await Promise.all(feedbackPromises);
      
      // Update feedback state with API responses
      const newFeedback = feedbackResults.reduce<Record<number, string>>((acc, result) => {
        acc[result.questionId] = `Score: ${result.score}/100. ${result.feedback}`;
        return acc;
      }, {});

      setFeedback(newFeedback);
      setStage('feedback');
      
      toast({
        title: "Answers Evaluated",
        description: "Your answers have been evaluated. Check out your feedback!",
      });
    } catch (err) {
      setError('Failed to evaluate answers. Please try again.');
      console.error(err);
      
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to evaluate answers. Please try again.",
      });
    } finally {
      setIsLoading(false);
      // Scroll to top when changing stages
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Handle finishing the assessment
  const handleFinish = () => {
    setStage('completed');
    // Reset states for a new assessment
    setQuestions([]);
    setSavedAnswers({});
    setFeedback({});
    setModelAnswers({});
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <MainLayout stage={stage} onBack={handleBack}>
      {/* Loading overlay */}
      {isLoading && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-white p-6 rounded-xl shadow-hard flex flex-col items-center">
            <div className="loading-spinner mb-4"></div>
            <p className="text-gray-800 font-medium">Processing your request...</p>
          </div>
        </div>
      )}

      {/* Error display */}
      {error && (
        <Alert variant="destructive" className="mb-6 animate-slide-up">
          <AlertCircle className="h-4 w-4 mr-2" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Landing stage */}
      {stage === 'landing' && (
        <div className="flex flex-col items-center justify-center min-h-[80vh] animate-fade-in">
          <Card className="max-w-2xl mx-auto bg-white/90 backdrop-blur-sm border-white/40 shadow-soft">
            <CardHeader className="text-center pb-2">
              <CardTitle className="text-4xl font-bold text-gray-800 tracking-tight">
                Document Analysis & Assessment
              </CardTitle>
              <CardDescription className="text-xl text-gray-600 mt-2">
                Transform your documents into interactive learning experiences
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center pt-6 pb-8">
              <p className="text-gray-600 mb-8 max-w-xl mx-auto">
                Upload any document to generate custom questions and receive detailed feedback on your answers.
                Perfect for studying, training, or testing your knowledge.
              </p>
              <Button 
                onClick={() => setStage('upload')}
                size="lg"
                className="px-8 py-6 text-lg font-medium transition-all duration-300 hover:shadow-medium"
              >
                <Book className="w-5 h-5 mr-2" />
                Get Started
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Upload stage */}
      {stage === 'upload' && (
        <DocumentUploader 
          onDocumentUploaded={handleDocumentUploaded} 
          className="mt-8 animate-scale-in"
        />
      )}

      {/* Question setup stage */}
      {stage === 'questionSetup' && (
        <QuestionSetup 
          onGenerateQuestions={handleGenerateQuestions} 
          className="mt-8 animate-scale-in"
        />
      )}

      {/* Q&A stage */}
      {stage === 'qa' && (
        <QuestionAnswering 
          questions={questions} 
          onSubmitAnswers={handleSubmitAnswers} 
          className="mt-8 animate-scale-in"
        />
      )}

      {/* Feedback stage */}
      {stage === 'feedback' && (
        <FeedbackDisplay 
          questions={questions}
          userAnswers={savedAnswers}
          feedback={feedback}
          onFinish={handleFinish}
          className="mt-8 animate-scale-in"
        />
      )}

      {/* Completed stage */}
      {stage === 'completed' && (
        <div className="flex flex-col items-center justify-center min-h-[80vh] animate-fade-in">
          <Card className="max-w-lg mx-auto bg-white/90 backdrop-blur-sm border-white/40 shadow-soft">
            <CardContent className="p-10 text-center">
              <div className="w-20 h-20 mx-auto mb-6 bg-primary/10 text-primary rounded-full flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-12 h-12">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <CardTitle className="text-4xl font-bold mb-4 text-gray-800">Thank You</CardTitle>
              <p className="text-gray-600 mb-8">
                Your assessment has been completed successfully. Would you like to start a new assessment?
              </p>
              <Button 
                onClick={() => setStage('upload')}
                size="lg"
                className="px-6 py-5 text-base font-medium"
              >
                Start New Assessment
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </MainLayout>
  );
};

export default Index;
