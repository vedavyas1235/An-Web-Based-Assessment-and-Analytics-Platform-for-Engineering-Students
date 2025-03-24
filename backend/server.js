const express = require('express');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');

const app = express();
const PORT = process.env.PORT || 5000;

// Enhanced CORS configuration for GitHub Codespaces
app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps, curl requests)
    if (!origin) return callback(null, true);
    
    console.log('Request origin:', origin);
    
    // Allow all GitHub Codespaces domains
    if (origin.includes('github.dev') || origin.includes('app.github.dev')) {
      return callback(null, true);
    }
    
    // Allow localhost for development
    if (origin.includes('localhost')) {
      return callback(null, true);
    }
    
    callback(null, true); // Allow all origins for now - replace with specific origins in production
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  credentials: false,
  maxAge: 86400 // 24 hours - cache preflight requests
}));

// Increase JSON payload size limit
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Debug middleware - log all requests
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} request to ${req.url} from ${req.headers.origin || 'Unknown origin'}`);
  next();
});

// Middleware to add CORS headers as a fallback
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: { fileSize: 20 * 1024 * 1024 } // 20MB limit
});

// Root route
app.get('/', (req, res) => {
  res.json({ message: 'Document Q&A API is running' });
});

// API health check route
app.get('/api', (req, res) => {
  res.json({ status: 'ok', message: 'Document Q&A API is running' });
});

// Helper function to extract text from documents
async function extractTextFromDocument(file) {
  const { originalname, buffer } = file;
  
  if (originalname.endsWith('.pdf')) {
    try {
      const pdfData = await pdfParse(buffer);
      return pdfData.text;
    } catch (error) {
      console.error('Error parsing PDF:', error);
      throw new Error('Failed to parse PDF document');
    }
  } 
  else if (originalname.endsWith('.docx')) {
    try {
      const result = await mammoth.extractRawText({ buffer });
      return result.value;
    } catch (error) {
      console.error('Error parsing DOCX:', error);
      throw new Error('Failed to parse DOCX document');
    }
  } 
  else {
    // Assume it's a text file
    return buffer.toString('utf8');
  }
}

// Clean text by removing excessive punctuation and unwanted patterns
function cleanText(text) {
  // Remove excessive question marks, dots, etc.
  let cleaned = text.replace(/([.!?])\1+/g, '$1');
  // Remove other potentially repeated characters
  cleaned = cleaned.replace(/([a-zA-Z])\1{3,}/g, '$1');
  // Ensure proper space after punctuation
  cleaned = cleaned.replace(/([.!?])([a-zA-Z])/g, '$1 $2');
  // Remove random special characters
  cleaned = cleaned.replace(/[^\w\s.,?!;:\-'"]/g, '');
  return cleaned.trim();
}

// Improved question generation function that creates complete, meaningful questions
function generateQuestionByDifficulty(chunk, difficulty) {
  // If chunk is too short, use a generic question format
  if (chunk.length < 50) {
    return `What is the significance of "${chunk}" in the context of the document?`;
  }

  // Define question templates based on difficulty
  const templates = {
    'EASY': [
      `What does the document explain about "${chunk}"?`,
      `According to the document, what is the main concept of "${chunk}"?`,
      `Explain in your own words what "${chunk}" refers to in the document.`
    ],
    'MEDIUM': [
      `How does "${chunk}" relate to the main concepts in the document?`,
      `What are the implications of "${chunk}" as described in the document?`,
      `Compare and contrast "${chunk}" with other concepts mentioned in the document.`
    ],
    'HARD': [
      `Critically analyze the significance of "${chunk}" in the broader context of the document.`,
      `Evaluate how "${chunk}" contributes to the overall thesis of the document.`,
      `What theoretical frameworks might explain the role of "${chunk}" as described in the document?`
    ]
  };

  // Choose a random template based on difficulty
  const selectedTemplates = templates[difficulty] || templates['MEDIUM'];
  const randomTemplate = selectedTemplates[Math.floor(Math.random() * selectedTemplates.length)];
  
  // Return the complete question
  return randomTemplate;
}

// Generate a model answer for a question
function generateModelAnswer(question, documentContent) {
  // In a real app, we'd use an actual AI model here
  // For now, generate a simple model answer
  const sentences = documentContent.split(/[.!?]+/).filter(s => s.trim().length > 20);
  
  if (sentences.length === 0) {
    return "This is a model answer that would normally be generated by an AI model.";
  }
  
  // Pick a few random sentences from the document to create a model answer
  const numSentences = Math.floor(Math.random() * 3) + 2; // 2-4 sentences
  let modelAnswer = "The document explains that ";
  
  for (let i = 0; i < numSentences && i < sentences.length; i++) {
    const randomIndex = Math.floor(Math.random() * sentences.length);
    modelAnswer += sentences[randomIndex].trim() + ". ";
  }
  
  return cleanText(modelAnswer);
}

// Extract better chunks from document content for question generation
function extractChunks(text, numChunks = 10) {
  // Split text into sentences, filtering out very short ones
  const sentenceDelimiters = /[.!?]+/;
  const sentences = text.split(sentenceDelimiters)
    .map(s => s.trim())
    .filter(s => s.length > 30 && s.split(/\s+/).length > 5);
  
  if (sentences.length === 0) {
    return ["The document appears to contain limited or poorly formatted content."];
  }
  
  // If we have fewer sentences than needed chunks, use paragraphs instead
  if (sentences.length < numChunks) {
    const paragraphs = text.split(/\n\n+/)
      .map(p => p.trim())
      .filter(p => p.length > 50);
      
    if (paragraphs.length >= numChunks) {
      // Select random paragraphs
      const chunks = [];
      const used = new Set();
      
      for (let i = 0; i < numChunks && i < paragraphs.length; i++) {
        let index;
        do {
          index = Math.floor(Math.random() * paragraphs.length);
        } while (used.has(index) && used.size < paragraphs.length);
        
        used.add(index);
        chunks.push(paragraphs[index]);
      }
      
      return chunks;
    }
    
    // Use the sentences we have and repeat if necessary
    const chunks = [];
    for (let i = 0; i < numChunks; i++) {
      chunks.push(sentences[i % sentences.length]);
    }
    return chunks;
  }
  
  // Select diverse sentences that are well-separated in the document
  const chunks = [];
  const step = Math.max(1, Math.floor(sentences.length / numChunks));
  
  for (let i = 0; i < numChunks && i * step < sentences.length; i++) {
    chunks.push(sentences[i * step]);
  }
  
  // If we still need more chunks, add random sentences
  while (chunks.length < numChunks) {
    const randomIndex = Math.floor(Math.random() * sentences.length);
    if (!chunks.includes(sentences[randomIndex])) {
      chunks.push(sentences[randomIndex]);
    }
  }
  
  return chunks;
}

// Analyze answer content for evaluation
function analyzeAnswerContent(userAnswer, modelAnswer) {
  const userWords = new Set(userAnswer.toLowerCase().split(/\s+/));
  const modelWords = new Set(modelAnswer.toLowerCase().split(/\s+/));
  const commonWords = new Set(['the', 'is', 'at', 'which', 'on', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for']);
  
  // Filter out common words
  const userConcepts = [...userWords].filter(word => !commonWords.has(word));
  const modelConcepts = [...modelWords].filter(word => !commonWords.has(word));
  
  // Find concepts in model answer that are missing from user answer
  return modelConcepts.filter(concept => !userConcepts.includes(concept));
}

// Generate specific feedback for a user's answer
function generateSpecificFeedback(userAnswer, modelAnswer, question, difficulty) {
  const feedback = [];
  
  // Length analysis
  const answerLength = userAnswer.split(/\s+/).length;
  const modelLength = modelAnswer.split(/\s+/).length;
  
  if (answerLength < modelLength * 0.6) {
    feedback.push("Your answer could benefit from more detail and explanation.");
  }
  
  // Concept analysis
  const missingConcepts = analyzeAnswerContent(userAnswer, modelAnswer);
  if (missingConcepts.length > 0) {
    const importantConcepts = missingConcepts
      .filter(concept => concept.length > 4)
      .slice(0, 3);
      
    if (importantConcepts.length > 0) {
      feedback.push(`Consider discussing these key concepts: ${importantConcepts.join(', ')}`);
    }
  }
  
  // Explanation patterns
  const explanationMarkers = ['because', 'therefore', 'since', 'as a result'];
  if (!explanationMarkers.some(marker => userAnswer.toLowerCase().includes(marker))) {
    feedback.push("Include clear explanations showing cause-and-effect relationships");
  }
  
  // Examples
  const exampleMarkers = ['for example', 'such as', 'instance'];
  if (!exampleMarkers.some(marker => userAnswer.toLowerCase().includes(marker))) {
    feedback.push("Support your answer with specific examples");
  }
  
  if (feedback.length === 0) {
    feedback.push("Good job! Your answer covers the main points.");
  }
  
  return feedback.join("\n");
}

// Improved evaluate answer function for broader evaluation and more generous scoring
function evaluateAnswer(userAnswer, modelAnswer, difficulty) {
  // If the answer is extremely short, still assign a low score
  if (userAnswer.split(/\s+/).length < 5) {
    return 20;
  }
  
  // Calculate similarity score with improved weighting
  const userWords = new Set(userAnswer.toLowerCase().split(/\s+/));
  const modelWords = new Set(modelAnswer.toLowerCase().split(/\s+/));
  
  const commonWords = new Set(['the', 'is', 'at', 'which', 'on', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for']);
  
  // Filter out common words
  const userConcepts = [...userWords].filter(word => !commonWords.has(word) && word.length > 3);
  const modelConcepts = [...modelWords].filter(word => !commonWords.has(word) && word.length > 3);
  
  // Calculate concept coverage (how many model concepts are covered by user)
  const conceptsFound = modelConcepts.filter(word => userConcepts.includes(word)).length;
  const conceptCoverage = modelConcepts.length > 0 ? conceptsFound / modelConcepts.length : 0;
  
  // Calculate vocabulary richness (additional relevant words beyond model concepts)
  const uniqueUserConcepts = userConcepts.filter(word => !modelConcepts.includes(word)).length;
  const vocabularyBonus = Math.min(0.2, uniqueUserConcepts / 20); // Max 20% bonus
  
  // More generous base score calculation
  let baseScore = conceptCoverage * 70; // 70% of score from concept coverage
  
  // Apply difficulty multipliers (slightly reduced impact)
  const multipliers = { 'EASY': 1.1, 'MEDIUM': 1.15, 'HARD': 1.2 };
  let score = Math.round(baseScore * (multipliers[difficulty] || 1.1));
  
  // Add length bonus (max 20 points)
  // More generous for answers of decent length
  const wordCount = userAnswer.split(/\s+/).length;
  let lengthBonus = 0;
  
  if (wordCount >= 100) {
    lengthBonus = 20;
  } else if (wordCount >= 75) {
    lengthBonus = 18;
  } else if (wordCount >= 50) {
    lengthBonus = 15;
  } else if (wordCount >= 30) {
    lengthBonus = 10;
  } else if (wordCount >= 20) {
    lengthBonus = 5;
  }
  
  score += lengthBonus;
  
  // Add vocabulary richness bonus
  score += Math.round(vocabularyBonus * 100);
  
  // Add semantic coherence bonus (simplified)
  // Check if answer contains explanation markers, examples, etc.
  const explanationMarkers = ['because', 'therefore', 'since', 'as a result', 'consequently'];
  const exampleMarkers = ['for example', 'such as', 'instance', 'specifically'];
  const coherenceMarkers = ['however', 'although', 'nevertheless', 'moreover', 'additionally'];
  
  let coherenceScore = 0;
  
  // Check for explanation patterns
  if (explanationMarkers.some(marker => userAnswer.toLowerCase().includes(marker))) {
    coherenceScore += 3;
  }
  
  // Check for examples
  if (exampleMarkers.some(marker => userAnswer.toLowerCase().includes(marker))) {
    coherenceScore += 3;
  }
  
  // Check for coherence markers
  if (coherenceMarkers.some(marker => userAnswer.toLowerCase().includes(marker))) {
    coherenceScore += 3;
  }
  
  // Add coherence bonus
  score += coherenceScore;
  
  // Establish a minimum score for answers with decent length
  if (wordCount >= 50 && score < 60) {
    score = Math.max(score, 60); // Minimum 60 for answers with 50+ words
  } else if (wordCount >= 30 && score < 50) {
    score = Math.max(score, 50); // Minimum 50 for answers with 30+ words
  }
  
  // Make sure score is within bounds (0-100)
  score = Math.max(0, Math.min(100, score));
  
  // Add some randomness to make it feel more natural (reduced range)
  const randomness = Math.floor(Math.random() * 6) - 2; // -2 to +3
  score = Math.max(0, Math.min(100, score + randomness));
  
  console.log(`Evaluation: Word count: ${wordCount}, Concept coverage: ${conceptCoverage.toFixed(2)}, Final score: ${score}`);
  
  return score;
}

// API Routes

// 1. Upload document route
app.post('/api/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    console.log('File received:', req.file.originalname, 'Size:', req.file.size);
    
    const text = await extractTextFromDocument(req.file);
    return res.json({ content: text });
  } catch (error) {
    console.error('Error uploading document:', error);
    return res.status(500).json({ error: 'Failed to process document' });
  }
});

// 2. Generate questions route
app.post('/api/generate-questions', async (req, res) => {
  try {
    const { document_content, num_questions, difficulty } = req.body;
    
    if (!document_content || !num_questions || !difficulty) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }
    
    console.log(`Generating ${num_questions} questions at ${difficulty} difficulty`);
    console.log(`Document content length: ${document_content.length} characters`);
    
    const numQuestionsInt = parseInt(num_questions);
    if (isNaN(numQuestionsInt) || numQuestionsInt < 1 || numQuestionsInt > 10) {
      return res.status(400).json({ error: 'Number of questions must be between 1 and 10' });
    }
    
    if (!['EASY', 'MEDIUM', 'HARD'].includes(difficulty)) {
      return res.status(400).json({ error: 'Invalid difficulty level' });
    }
    
    // Extract chunks for question generation
    const chunks = extractChunks(document_content, numQuestionsInt);
    console.log(`Generated ${chunks.length} text chunks for questions`);
    
    // Generate questions
    const questions = chunks.map((chunk, index) => {
      const question = generateQuestionByDifficulty(chunk, difficulty);
      const modelAnswer = generateModelAnswer(question, document_content);
      console.log(`Question ${index + 1}: ${question.substring(0, 100)}...`);
      return { question, model_answer: modelAnswer };
    }).slice(0, numQuestionsInt);
    
    return res.json({ questions });
  } catch (error) {
    console.error('Error generating questions:', error);
    return res.status(500).json({ error: 'Failed to generate questions' });
  }
});

// 3. Evaluate answer route
app.post('/api/evaluate-answer', async (req, res) => {
  try {
    const { question, user_answer, model_answer, difficulty } = req.body;
    
    if (!question || !user_answer || !model_answer || !difficulty) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }
    
    if (!['EASY', 'MEDIUM', 'HARD'].includes(difficulty)) {
      return res.status(400).json({ error: 'Invalid difficulty level' });
    }
    
    // Calculate score
    const score = evaluateAnswer(user_answer, model_answer, difficulty);
    
    // Generate feedback
    const feedbackText = generateSpecificFeedback(user_answer, model_answer, question, difficulty);
    
    return res.json({ 
      score, 
      feedback: feedbackText
    });
  } catch (error) {
    console.error('Error evaluating answer:', error);
    return res.status(500).json({ error: 'Failed to evaluate answer' });
  }
});

// Start the server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`API root: http://localhost:${PORT}/`);
  console.log(`Document upload endpoint: http://localhost:${PORT}/api/upload`);
});