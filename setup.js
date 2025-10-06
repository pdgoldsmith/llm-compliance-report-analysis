#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 SOC1 Analysis Tool - Automated Setup');
console.log('=====================================\n');

// Check if we're in the right directory
const packageJsonPath = path.join(__dirname, 'package.json');
if (!fs.existsSync(packageJsonPath)) {
  console.error('❌ Error: package.json not found. Please run this script from the project root directory.');
  process.exit(1);
}

try {
  // Step 1: Install root dependencies
  console.log('📦 Installing root dependencies...');
  execSync('npm install', { stdio: 'inherit', cwd: __dirname });
  console.log('✅ Root dependencies installed\n');

  // Step 2: Setup backend
  console.log('🔧 Setting up backend server...');
  execSync('npm run setup', { stdio: 'inherit', cwd: __dirname });
  console.log('✅ Backend setup complete\n');

  // Step 3: Create .env file if it doesn't exist
  const envPath = path.join(__dirname, '.env');
  if (!fs.existsSync(envPath)) {
    console.log('📝 Creating .env file...');
    const envContent = `# AI Model Configuration
# Set to 'true' to use local/private OpenAI-compatible endpoints (Ollama, llama.cpp, etc.)
# Set to 'false' or leave empty to use OpenRouter cloud service
VITE_USE_LOCAL_MODEL=true

# OpenRouter API Key (required when VITE_USE_LOCAL_MODEL=false)
# Get your key from: https://openrouter.ai/keys
VITE_API_KEY=

# Local endpoint configuration (used when VITE_USE_LOCAL_MODEL=true)
# URL of your local OpenAI-compatible endpoint
VITE_LOCAL_ENDPOINT_URL=http://localhost:11434/v1

# Model name as recognized by your local endpoint
VITE_LOCAL_MODEL_NAME=llama3.1:8b

# Common local endpoint examples:
# Ollama: http://localhost:11434/v1
# llama.cpp server: http://localhost:8080/v1
# LM Studio: http://localhost:1234/v1
# Text Generation WebUI: http://localhost:5000/v1

# Backend Configuration (for local models)
# URL of your local LLM server (FastFlowLM, Ollama, etc.)
LOCAL_LLM_URL=http://localhost:11434

# Timeout for local LLM requests (in milliseconds)
LOCAL_LLM_TIMEOUT=300000

# Backend server port
PORT=3001

# CORS allowed origins (comma-separated)
ALLOWED_ORIGINS=http://localhost:8080,http://localhost:8081,http://localhost:3000
`;
    fs.writeFileSync(envPath, envContent);
    console.log('✅ .env file created\n');
  } else {
    console.log('✅ .env file already exists\n');
  }

  console.log('🎉 Setup complete!');
  console.log('\n📋 Next steps:');
  console.log('1. Configure your API keys in the .env file (optional)');
  console.log('2. Start your local LLM server (Ollama, FastFlowLM, etc.) if using local models');
  console.log('3. Run the application:');
  console.log('   npm run dev:full    # Run both frontend and backend');
  console.log('   npm run dev         # Run frontend only');
  console.log('   npm run dev:backend # Run backend only');
  console.log('\n🌐 The application will be available at:');
  console.log('   Frontend: http://localhost:8080');
  console.log('   Backend:  http://localhost:3001');

} catch (error) {
  console.error('❌ Setup failed:', error.message);
  process.exit(1);
}


