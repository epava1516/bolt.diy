import { rmSync, existsSync } from 'fs';
import { join } from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dirsToRemove = ['node_modules/.vite', 'node_modules/.cache', '.cache', 'dist'];

console.log('🧹 Cleaning project...');

// Remove directories
for (const dir of dirsToRemove) {
  const fullPath = join(__dirname, '..', dir);

  try {
    if (existsSync(fullPath)) {
      console.log(`Removing ${dir}...`);
      try {
        rmSync(fullPath, { recursive: true, force: true });
      } catch (err) {
        console.error(`Error removing ${dir}:`, err.message);
      }
    }
  } catch (err) {
    console.error(`Error removing ${dir}:`, err.message);
  }
}

// Run pnpm commands
console.log('\n📦 Reinstalling dependencies...');

try {
  execSync('pnpm install', { stdio: 'inherit' });
  console.log('\n🗑️  Clearing pnpm cache...');
  execSync('pnpm cache clean', { stdio: 'inherit' });
  console.log('\n🏗️  Rebuilding project...');
  execSync('pnpm build', { stdio: 'inherit' });
  console.log('\n✨ Clean completed! You can now run pnpm dev');
} catch (err) {
  console.error('\n❌ Error during cleanup:', err.message);
  process.exit(1);
}
