# ContentForge Backend Documentation

## Overview
ContentForge Backend is an Express-based Node.js server that powers the ContentForge application. It provides endpoints for:
- AI content generation
- PDF processing (including caption extraction)
- File uploading (via Cloudinary)
- Health checks and more

This document covers the basic setup, API endpoints, and instructions to connect your frontend project to this backend service.

## Table of Contents
- [Setup & Installation](#setup--installation)
- [Environment Variables](#environment-variables)
- [Running the Application](#running-the-application)
- [API Endpoints](#api-endpoints)
  - [Health Check](#health-check)
  - [AI Content Generation](#ai-content-generation)
  - [PDF Processing](#pdf-processing)
  - [File Upload](#file-upload)
- [Error Handling](#error-handling)
- [Connecting Your Frontend](#connecting-your-frontend)
- [Deployment](#deployment)

## Setup & Installation
1. **Clone the Repository**
   ```bash
   git clone <repository-url>
   cd contentforge-be
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Build the Project**
   ```bash
   npm run build
   ```

## Environment Variables
Create a `.env` file in the project root with the following keys (adjust values as needed):

```
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
CLOUDINARY_UPLOAD_PRESET=your_upload_preset
DEEPSEEK_API_KEY=your_deepseek_api_key
PORT=3000
CORS_ORIGIN=http://localhost:3000   # Change this to your frontend domain in production
NODE_ENV=development
```

> **Note:** In production, ensure `NODE_ENV` is set to `production` and that `CORS_ORIGIN` matches your frontend's URL.

## Running the Application
- **Development Mode:**
  ```bash
  npm run dev
  ```
  *Uses `nodemon` for automatic restarts on code changes.*

- **Production Mode:**
  First, build the project:
  ```bash
  npm run build
  ```
  Then start:
  ```bash
  npm run start
  ```

## API Endpoints

### Base URL
The base URL is where your backend is hosted (e.g., `http://localhost:3000` in development). API endpoints are typically prefixed with `/api`.

### Health Check
- **Endpoint:** `GET /health`
- **Description:** Returns a basic status to verify that the server is alive.
- **Response Example:**
  ```json
  {
    "status": "ok",
    "environment": "development",
    "timestamp": "2023-10-12T12:34:56.789Z"
  }
  ```

### AI Content Generation
- **Endpoint:** `POST /api/ai`
- **Description:** Generates AI content based on request parameters.
- **Request Body Example:**
  ```json
  {
    "type": "summary",          // Options: summary, expertise, variation, captions, script
    "content": "Your input text here",
    "language": "en-US",        // Options: en-US, es-ES, pt-BR
    "count": 1,                 // Number of content variations (except for script)
    "tone": "Casual",           // Example tones: Casual, Formal, etc.
    "niche": "general"
  }
  ```
- **Response Example:**
  ```json
  {
    "success": true,
    "summary": ["Generated content..."]
  }
  ```
  > The response key (e.g., `summary`) corresponds to the requested `type`.

### PDF Processing
- **Endpoint:** `POST /api/pdf`
- **Description:** Processes a PDF file by fetching it from a URL, extracting text, or generating captions.
- **Request Body Example:**
  ```json
  {
    "pdfUrl": "https://example.com/your.pdf",
    "language": "en-US",
    "tone": "casual",
    "niche": "general"
  }
  ```
- **Response:** Varies by implementation, typically returns extracted text or captions from the PDF.

### File Upload
- **Endpoint:** `POST /api/upload`
- **Description:** Uploads a file (e.g., a PDF) to Cloudinary.
- **Request:** Uses `multipart/form-data` with a file field (e.g., `file`).
- **Response Example:**
  ```json
  {
    "success": true,
    "secure_url": "https://res.cloudinary.com/youraccount/yourfile.pdf",
    "public_id": "timestamp-originalfilename"
  }
  ```

## Error Handling
Errors are returned in a consistent JSON format with an appropriate HTTP status code. For example, a validation error might return:
```json
{
  "error": "Invalid AI request parameters"
}
```
Ensure your frontend handles these errors gracefully.

## Connecting Your Frontend
To connect your frontend project to the ContentForge Backend:

- **Base URL Configuration:**  
  Set your API client to use the backend's base URL (e.g., `http://localhost:3000` in development or your live domain in production).

- **CORS Considerations:**  
  The backend features CORS. Ensure the `CORS_ORIGIN` environment variable includes your frontend's domain.

- **Making API Requests:**  
  Use libraries like `axios` or the built-in `fetch` API. For example:
  ```javascript
  fetch('http://localhost:3000/api/ai', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      type: 'summary',
      content: 'Your request content here',
      language: 'en-US'
    })
  })
    .then(response => response.json())
    .then(data => console.log(data))
    .catch(error => console.error(error));
  ```

- **Authentication:**  
  If authentication is added later, ensure the frontend includes any required tokens in the request headers.

## Deployment
The project is configured to deploy on Render. Key points include:
- **render.yaml:**  
  Specifies the build and start commands, ensuring the entry point is `./dist/server.js`.
- **Engines:**  
  Requires Node.js v18.x.
- **Environment Variables:**  
  Set the appropriate variables in Render's environment settings.

## Conclusion
This documentation serves as a guide for connecting your frontend project to the ContentForge Backend service. It covers setup instructions, available endpoints, and best practices for integration and deployment.

Happy Coding!
