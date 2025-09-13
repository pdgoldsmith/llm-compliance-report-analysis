# SOC1 Compliance Report Analysis Tool

A powerful AI-powered tool for analyzing SOC1 compliance reports using OpenRouter's latest language models.

## Features

- **Real PDF Processing**: Accurate page counting and text extraction using PDF.js
- **Latest AI Models**: Access to current OpenRouter models including free options
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
- **Free Models**: Llama 3.3 70B, Gemini 2.0 Flash, Phi-3.5 Mini
- **Premium Models**: GPT-4o, Claude 3.5 Sonnet, Gemini 2.0 Flash

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

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
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
