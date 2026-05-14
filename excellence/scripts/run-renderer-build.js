const { execSync } = require('child_process');

const rendererPath = "d:\\UNIVER\\UNI\\GIT CLONE SSB PROJ\\Excel-Ai-platform\\excellence\\apps\\renderer";
console.log('Building renderer at', rendererPath);
try {
  execSync(`npm --prefix "${rendererPath}" run build`, { stdio: 'inherit' });
  console.log('Renderer build finished');
} catch (err) {
  console.error('Renderer build failed');
  process.exit(1);
}
