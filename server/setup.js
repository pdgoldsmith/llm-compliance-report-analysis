import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Default environment configuration
const defaultEnvConfig = `# Local LLM Configuration
LOCAL_LLM_URL=http://localhost:11434
LOCAL_LLM_TIMEOUT=300000

# Server Configuration
PORT=3001
NODE_ENV=development

# CORS Configuration
ALLOWED_ORIGINS=http://localhost:8080,http://localhost:8081,http://localhost:3000
`;

function setupEnvironment() {
  const envPath = path.join(__dirname, '.env');
  const envExamplePath = path.join(__dirname, 'env.example');

  try {
    // Check if .env file exists
    if (!fs.existsSync(envPath)) {
      console.log('📝 Creating .env file from defaults...');
      
      // Create .env file with default configuration
      fs.writeFileSync(envPath, defaultEnvConfig);
      console.log('✅ .env file created successfully');
    } else {
      console.log('✅ .env file already exists');
    }

    // Ensure env.example exists for reference
    if (!fs.existsSync(envExamplePath)) {
      console.log('📝 Creating env.example file...');
      fs.writeFileSync(envExamplePath, defaultEnvConfig);
      console.log('✅ env.example file created successfully');
    }

    console.log('🚀 Environment setup complete!');
    return true;
  } catch (error) {
    console.error('❌ Error setting up environment:', error.message);
    return false;
  }
}

// Run setup if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  setupEnvironment();
}

export { setupEnvironment };

