
# Document Q&A Backend

This is a Node.js Express backend for the Document Q&A application.

## Setup Instructions

1. Install dependencies:
   ```
   npm install
   ```

2. Start the server:
   ```
   npm start
   ```
   
   For development with auto-restart:
   ```
   npm run dev
   ```

3. The server will run on port 5000 by default.

## API Endpoints

### 1. Upload Document
- **URL**: `/api/upload`
- **Method**: `POST`
- **Content-Type**: `multipart/form-data`
- **Parameters**:
  - `file`: Document file (PDF, DOCX, or TXT)
- **Response**: JSON with extracted document content

### 2. Generate Questions
- **URL**: `/api/generate-questions`
- **Method**: `POST`
- **Content-Type**: `application/json`
- **Parameters**:
  - `document_content`: String with document text
  - `num_questions`: Number of questions to generate (1-10)
  - `difficulty`: Difficulty level (EASY, MEDIUM, or HARD)
- **Response**: JSON with array of questions and model answers

### 3. Evaluate Answer
- **URL**: `/api/evaluate-answer`
- **Method**: `POST`
- **Content-Type**: `application/json`
- **Parameters**:
  - `question`: Question text
  - `user_answer`: User's answer text
  - `model_answer`: Model answer text
  - `difficulty`: Difficulty level (EASY, MEDIUM, or HARD)
- **Response**: JSON with score and feedback
