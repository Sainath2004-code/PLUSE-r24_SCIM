import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { MOCK_NEWS_ITEMS } from '../src/constants';
import { generateNewsPdfDoc, type LoadedImage } from '../src/services/newsPdfCore';
import { getPdfDateString, mapNewsItemsToPdfArticles } from '../src/services/newsPdfMapper';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');

function getPngDimensions(buffer: Buffer) {
  if (buffer.toString('ascii', 1, 4) !== 'PNG') {
    throw new Error('Only PNG assets are supported for sample generation.');
  }

  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20),
  };
}

async function loadPngFromFile(filePath: string): Promise<LoadedImage> {
  const buffer = await readFile(filePath);
  const { width, height } = getPngDimensions(buffer);

  return {
    dataUrl: `data:image/png;base64,${buffer.toString('base64')}`,
    width,
    height,
  };
}

async function main() {
  const publishedItems = MOCK_NEWS_ITEMS.filter((item) => item.status === 'published');
  if (publishedItems.length === 0) {
    throw new Error('No published mock items available for sample PDF generation.');
  }

  const articles = mapNewsItemsToPdfArticles(publishedItems, 'http://localhost:5173');
  const dateStr = getPdfDateString(publishedItems);
  const [header, footer] = await Promise.all([
    loadPngFromFile(path.join(repoRoot, 'src', 'assets', 'pdf', 'pdf-header.png')),
    loadPngFromFile(path.join(repoRoot, 'src', 'assets', 'pdf', 'pdf-footer.png')),
  ]);

  const doc = await generateNewsPdfDoc(articles, 'India', dateStr, { header, footer });
  const outputDir = path.join(repoRoot, 'tmp');
  const outputPath = path.join(outputDir, 'sample-pulse-r.pdf');

  await mkdir(outputDir, { recursive: true });
  await writeFile(outputPath, Buffer.from(doc.output('arraybuffer')));
  console.log(outputPath);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
