import path from 'node:path';

export const sanitizePath = (inputPath: string, baseDir?: string): string => {
  if (!inputPath) {
    throw new Error('Path is required.');
  }

  const normalized = path.normalize(inputPath);
  if (normalized.startsWith('..') || normalized.includes(`..${path.sep}`)) {
    throw new Error('Path traversal detected.');
  }

  if (!baseDir) {
    return normalized;
  }

  const resolvedBase = path.resolve(baseDir);
  const resolvedPath = path.resolve(resolvedBase, normalized);
  if (!resolvedPath.startsWith(resolvedBase)) {
    throw new Error('Resolved path escapes base directory.');
  }

  return resolvedPath;
};
