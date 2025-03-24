
# Document Q&A Application

This application allows users to upload documents, generate questions based on the content, answer those questions, and receive AI-based feedback on their answers.

## Project Structure

- `frontend/`: React frontend application
- `backend/`: Node.js Express backend application

## Setup Instructions

### Backend Setup

1. Navigate to the backend directory:
   ```
   cd backend
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Start the backend server:
   ```
   npm start
   ```
   
   The backend will run on port 5000 by default.

### Frontend Setup

1. In a new terminal, navigate to the project root directory

2. Install dependencies:
   ```
   npm install
   ```

3. Start the frontend development server:
   ```
   npm run dev
   ```

4. Open your browser and navigate to `http://localhost:5173`

## Features

- Document upload (PDF, DOCX, TXT)
- AI-generated questions based on document content
- Question difficulty levels (Easy, Medium, Hard)
- Answer evaluation with scores and feedback
- Progress tracking through assessment stages

## Technologies Used

- Frontend: React, TypeScript, Tailwind CSS, shadcn/ui
- Backend: Node.js, Express, multer, pdf-parse, mammoth
- Data Processing: Custom text extraction and analysis algorithms

## License

This project is licensed under the MIT License.
