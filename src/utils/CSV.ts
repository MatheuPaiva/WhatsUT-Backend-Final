import * as fs from 'fs';
import * as path from 'path';

interface IensureCsvFileExists {
  CSV_FILE: string;
  CSV_HEADERS: string;
}

export async function ensureCsvFileExists({
  CSV_FILE,
  CSV_HEADERS,
}: IensureCsvFileExists) {
  try {
    await fs.promises.access(CSV_FILE);
  } catch {
    await fs.promises.mkdir(path.dirname(CSV_FILE), { recursive: true });
    await fs.promises.writeFile(CSV_FILE, CSV_HEADERS);
  }
}
