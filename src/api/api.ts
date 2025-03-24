
import axios from 'axios';

// Determine the API base URL based on the environment
const getApiBaseUrl = () => {
  // Check if running in GitHub Codespaces
  if (window.location.hostname.includes('github.dev') || window.location.hostname.includes('app.github.dev')) {
    // Extract the Codespace name from the hostname
    const hostname = window.location.hostname;
    console.log('Current hostname:', hostname);
    
    // Get the main part of the hostname (before first dot)
    // This is the unique identifier for the codespace
    const codespaceMatch = hostname.match(/^([^.]+)/);
    const codespace = codespaceMatch ? codespaceMatch[1] : '';
    console.log('Extracted codespace identifier:', codespace);
    
    // Get the preview domain (everything after the first dot)
    const previewDomain = hostname.substring(hostname.indexOf('.'));
    console.log('Preview domain:', previewDomain);
    
    // Construct the backend URL for GitHub Codespaces
    // Replace the port number in the URL (from 8080 to 5000)
    const apiUrl = `https://${codespace.replace('-8080', '-5000')}${previewDomain}/api`;
    console.log('Constructed API URL:', apiUrl);
    return apiUrl;
  }
  
  // Default to localhost for local development
  return 'http://localhost:5000/api';
};

const API_BASE_URL = getApiBaseUrl();
console.log('API URL configured as:', API_BASE_URL);

// Set to true during development if the backend is not available
// This will use mock data instead of making real API calls
const IS_MOCK_MODE = false;

// Upload a document and extract its content
export const uploadDocument = async (file: File): Promise<string> => {
  try {
    if (IS_MOCK_MODE) {
      console.log('MOCK MODE: Simulating document upload');
      // Return mock data after a short delay to simulate network request
      await new Promise(resolve => setTimeout(resolve, 1000));
      return "This is sample document content for testing. The application extracts text from uploaded documents and generates questions based on the content. Users can then answer these questions and receive AI-generated feedback on their responses. This system is useful for educational purposes, self-assessment, and training.";
    }

    const formData = new FormData();
    formData.append('file', file);
    
    console.log('Uploading to:', `${API_BASE_URL}/upload`);
    
    const response = await axios.post(`${API_BASE_URL}/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      withCredentials: false,
      timeout: 30000, // 30-second timeout
    });
    
    console.log('Upload response:', response.data);
    return response.data.content;
  } catch (error) {
    console.error('Error uploading document:', error);
    if (axios.isAxiosError(error)) {
      console.error('Axios error details:', {
        message: error.message,
        code: error.code,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data
      });
    }
    throw new Error('Failed to upload document. Please ensure the backend server is running.');
  }
};

// Generate questions based on document content
export const generateQuestions = async (
  documentContent: string,
  numberOfQuestions: string,
  difficulty: string
): Promise<{
  questions: Array<{
    question: string;
    model_answer: string;
  }>;
}> => {
  try {
    if (IS_MOCK_MODE) {
      console.log('MOCK MODE: Generating mock questions');
      // Wait a moment to simulate network delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Return mock questions
      return {
        questions: [
          {
            question: "What is the main purpose of the document Q&A application?",
            model_answer: "The main purpose of the document Q&A application is to extract text from uploaded documents, generate questions based on the content, allow users to answer these questions, and provide AI-generated feedback on their responses. This system is designed for educational purposes, self-assessment, and training."
          },
          {
            question: "How does the application evaluate user answers?",
            model_answer: "The application evaluates user answers by comparing them to model answers generated from the document content. It analyzes the user's response for key concepts, completeness, and correctness. The evaluation process considers the difficulty level set by the user and provides a score along with specific feedback on areas of improvement."
          },
          {
            question: "What file formats does the application support for document upload?",
            model_answer: "The application supports multiple document formats including PDF, DOCX (Microsoft Word), and plain text (TXT) files. These files are processed to extract the textual content, which is then used for generating questions and model answers."
          }
        ]
      };
    }

    const response = await axios.post(`${API_BASE_URL}/generate-questions`, {
      document_content: documentContent,
      num_questions: numberOfQuestions,
      difficulty: difficulty
    });
    
    return response.data;
  } catch (error) {
    console.error('Error generating questions:', error);
    throw new Error('Failed to generate questions. Please try again.');
  }
};

// Evaluate a user's answer against the model answer
export const evaluateAnswer = async (
  question: string,
  userAnswer: string,
  modelAnswer: string,
  difficulty: string
): Promise<{
  feedback: string;
  score: number;
}> => {
  try {
    if (IS_MOCK_MODE) {
      console.log('MOCK MODE: Evaluating mock answer');
      // Wait a moment to simulate network delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Simple mock evaluation
      const wordCount = userAnswer.split(/\s+/).filter(Boolean).length;
      const score = Math.min(Math.max(Math.floor(wordCount * 5 + Math.random() * 20), 50), 100);
      
      let feedback;
      if (score > 85) {
        feedback = "Excellent response! You covered most of the key points and showed a thorough understanding of the material.";
      } else if (score > 70) {
        feedback = "Good answer. You addressed the main concepts but could expand on some areas for more depth.";
      } else {
        feedback = "Your answer covers some important points, but consider adding more specific details and examples from the material to strengthen your response.";
      }
      
      return {
        feedback: `Score: ${score}/100. ${feedback}`,
        score
      };
    }

    const response = await axios.post(`${API_BASE_URL}/evaluate-answer`, {
      question,
      user_answer: userAnswer,
      model_answer: modelAnswer,
      difficulty
    });
    
    return {
      feedback: response.data.feedback,
      score: response.data.score
    };
  } catch (error) {
    console.error('Error evaluating answer:', error);
    throw new Error('Failed to evaluate answer. Please try again.');
  }
};
