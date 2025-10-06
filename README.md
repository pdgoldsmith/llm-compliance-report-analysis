# SOC1 Compliance Report Analysis Tool

A powerful AI-powered tool for analyzing SOC1 compliance reports using both OpenRouter's cloud models and local OpenAI-compatible endpoints.

## Features

- **Real PDF Processing**: Accurate page counting and text extraction using PDF.js
- **Dual Model Support**: Use OpenRouter cloud models or local endpoints (Ollama, llama.cpp, etc.)
- **Latest AI Models**: Access to current OpenRouter models including free options
- **Local Model Support**: Run analysis on your own hardware with OpenAI-compatible APIs
- **Comprehensive Analysis**: Extracts executive summary, controls, findings, and compliance status
- **Progress Tracking**: Real-time progress updates during analysis
- **Automatic Excel Export**: Generates comprehensive Excel reports with multiple sheets

## Recent Fixes (2024-2025)

### Issues Resolved:
1. **PDF Page Counting**: Fixed incorrect page detection (was showing random numbers, now shows actual page count)
2. **API Integration**: Replaced mock API calls with real OpenRouter API integration
3. **Model Selection**: Updated to current OpenRouter models with free options
4. **PDF Processing**: Implemented real PDF text extraction and processing

### Available Models:

#### OpenRouter Cloud Models:
- **Free Models**: Llama 3.3 70B, Gemini 2.0 Flash, Phi-3.5 Mini
- **Premium Models**: GPT-4o, Claude 3.5 Sonnet, Gemini 2.0 Flash

#### Local Models (OpenAI-compatible):
- **Llama Models**: Llama 3.1 8B/70B, Code Llama 7B/13B
- **Mistral Models**: Mistral 7B, Mixtral 8x7B
- **Other Models**: Qwen 2.5 7B, Gemma 2 9B
- **Custom Models**: Any model supported by your local endpoint

## Configuration

### Environment Variables

You can configure the application using environment variables. Copy `env.example` to `.env` and modify as needed:

```bash
# Use local models instead of OpenRouter
VITE_USE_LOCAL_MODEL=true

# OpenRouter API Key (required for cloud models)
VITE_API_KEY=your_openrouter_api_key_here

# Local endpoint configuration
VITE_LOCAL_ENDPOINT_URL=http://localhost:11434/v1
VITE_LOCAL_MODEL_NAME=llama3.1:8b
```

### Local Endpoint Setup

The application supports any OpenAI-compatible API endpoint. Here are some popular options:

#### Ollama
```bash
# Install Ollama
curl -fsSL https://ollama.ai/install.sh | sh

# Pull a model
ollama pull llama3.1:8b

# Start the API server
ollama serve
```

#### llama.cpp server
```bash
# Build llama.cpp with server support
make server

# Start the server
./server -m your_model.gguf --port 8080
```

#### LM Studio
1. Download and install LM Studio
2. Load your preferred model
3. Start the local server (usually on port 1234)

### UI Configuration

You can also configure everything through the web interface:
1. Toggle between "OpenRouter" and "Local" using the provider switch
2. **For OpenRouter**: Enter your API key and select your preferred model from the dropdown
3. **For Local**: Enter your endpoint URL and specify the exact model name as recognized by your local endpoint
4. Test the connection before starting analysis

The interface automatically adapts based on your provider choice - when using local models, the model selection dropdown is hidden since you specify the exact model name directly.

### Backend Proxy (CORS Resolution)

The application includes a backend proxy server to resolve CORS issues when using local models:

- **OpenRouter calls**: Go directly from frontend to OpenRouter (no proxy needed)
- **Local model calls**: Go from frontend → Vite proxy → Backend server → Local LLM server
- **CORS resolved**: Backend server handles CORS and forwards requests to local LLM

#### Running the Application

```bash
# Option 1: Run both frontend and backend together
npm run dev:full

# Option 2: Run them separately
# Terminal 1 (Backend):
cd server && npm run dev

# Terminal 2 (Frontend):
npm run dev
```

The backend server runs on port 3001 and provides these endpoints:
- `GET /health` - Health check
- `GET /api/local/v1/models` - Proxy to local LLM models endpoint
- `POST /api/local/v1/chat/completions` - Proxy to local LLM chat completions

### Automated Setup

The project includes an automated setup system that eliminates manual configuration steps:

- **Auto-creates `.env` files** with sensible defaults
- **Installs all dependencies** (frontend and backend)
- **Configures environment** automatically
- **No manual steps required** for basic setup

Simply run `npm run setup` after cloning the repository, and everything will be configured automatically!

## Project info

**URL**: https://lovable.dev/projects/a0050f51-a25e-4873-a95e-19e984ecc5b0

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/a0050f51-a25e-4873-a95e-19e984ecc5b0) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Run the automated setup (installs dependencies and configures environment).
npm run setup

# Step 4: Start the application.
npm run dev:full    # Run both frontend and backend
# OR
npm run dev         # Run frontend only (if backend not needed)
```

### Alternative Manual Setup

If you prefer manual setup:

```sh
# Install dependencies
npm install

# Setup backend
cd server && npm install

# Start the application
npm run dev:full
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## Setup Instructions

1. **Get OpenRouter API Key**:
   - Visit [OpenRouter](https://openrouter.ai/keys)
   - Create an account and generate an API key
   - Free models are available with credits

2. **Configure the Application**:
   - Enter your OpenRouter API key in the configuration panel
   - Select a model (free models are marked with "FREE" badge)
   - Test the connection

3. **Analyze Reports**:
   - Upload a SOC1 PDF report (up to 20MB)
   - Click "Start Analysis" to begin processing
   - Excel file will be automatically downloaded upon completion

## Technical Details

- **PDF Processing**: Uses PDF.js for accurate page counting and text extraction
- **AI Integration**: OpenRouter API with support for multiple model providers
- **Excel Generation**: Automatic Excel file creation with multiple sheets (Executive Summary, Controls, Findings, Compliance Status, Summary Dashboard)
- **Error Handling**: Comprehensive error handling with user-friendly messages
- **Progress Tracking**: Real-time updates during PDF processing and AI analysis

## Excel Output Format

The generated Excel file contains the following sheets:

1. **Executive Summary**: Report period, service organization, auditor, and opinion
2. **Controls**: Detailed control analysis with effectiveness ratings, page numbers, and confidence scores
3. **Findings**: Identified issues with severity levels, recommendations, page numbers, and confidence scores
4. **Compliance Status**: Overall compliance assessment, scoring, page numbers, and confidence scores
5. **Summary Dashboard**: High-level statistics and counts

### Enhanced Features:
- **Page Numbers**: Each extracted item includes the page numbers where the information was found
- **Confidence Scores**: AI confidence levels (0-1) for each extraction to indicate reliability
- **Comprehensive Attributes**: Extracts all SOC1 attributes including:
  - Control objectives and activities
  - Control effectiveness assessments
  - Significant deficiencies and material weaknesses
  - Subservice organization information
  - Management assertions and auditor responsibilities

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/a0050f51-a25e-4873-a95e-19e984ecc5b0) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/tips-tricks/custom-domain#step-by-step-guide)
