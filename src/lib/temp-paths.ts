import os from 'node:os';
import path from 'node:path';

const APP_TEMP_ROOT = path.join(os.tmpdir(), 'rss-parse-next');

export function getAppTempPath(...segments: string[]) {
  return path.join(APP_TEMP_ROOT, ...segments);
}

export function getJobTmpDir() {
  return getAppTempPath('.job_tmp');
}

export function getDownloadsCompressDir(programTitle: string) {
  return getAppTempPath('downloads_compress', programTitle);
}
