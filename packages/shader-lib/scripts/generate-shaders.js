const fs = require('fs-extra');
const path = require('path');
const glob = require('glob');

const srcDir = path.join(__dirname, '../src/shaders');
const outDir = path.join(__dirname, '../src/generated');

async function generateShaders() {
  await fs.ensureDir(outDir);
  const shaderFiles = glob.sync(`${srcDir}/**/*.glsl`);

  const exports = [];

  for (const file of shaderFiles) {
    const content = await fs.readFile(file, 'utf-8');
    const fileName = path.basename(file, '.glsl');
    const variableName = fileName.replace(/-./g, (x) => x[1].toUpperCase());
    const outPath = path.join(outDir, `${variableName}.glsl.js`);
    
    const jsContent = `export default \`\n${content}\`;\n`;
    
    await fs.writeFile(outPath, jsContent);
    console.log(`Generated ${outPath}`);
    exports.push({
      name: variableName,
      path: `./generated/${variableName}.glsl.js`
    });
  }

  // Create index.ts
  const indexContent = exports.map(e => `export { default as ${e.name} } from '${e.path}';`).join('\n');
  const indexPath = path.join(__dirname, '../src/index.ts');
  await fs.writeFile(indexPath, indexContent + '\n');
  console.log(`Generated ${indexPath}`);
}

generateShaders().catch(err => {
  console.error(err);
  process.exit(1);
}); 