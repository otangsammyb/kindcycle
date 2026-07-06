import axios from 'axios';
import { AppError } from '../../utils/AppError';
import { config } from '../../config/env';

interface FileNode {
  path: string;
  type: 'blob' | 'tree';
  url: string;
}

export const fetchRepoContents = async (repoUrl: string, token?: string) => {
  try {
    // Parse github URL to get owner and repo
    const match = repoUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/);
    if (!match) {
      throw new AppError('Invalid GitHub URL format', 400);
    }
    
    const owner = match[1];
    const repo = match[2].replace('.git', '');
    
    const headers: Record<string, string> = {
      'Accept': 'application/vnd.github.v3+json',
    };
    
    if (token || config.github.token) {
      headers['Authorization'] = `token ${token || config.github.token}`;
    }

    // 1. Get default branch
    const repoMetaRes = await axios.get(`https://api.github.com/repos/${owner}/${repo}`, { headers });
    const defaultBranch = repoMetaRes.data.default_branch;
    
    // 2. Get tree (recursive)
    const treeRes = await axios.get(`https://api.github.com/repos/${owner}/${repo}/git/trees/${defaultBranch}?recursive=1`, { headers });
    
    const allFiles: FileNode[] = treeRes.data.tree;
    
    // 3. Filter down to interesting files to fetch content (avoiding node_modules, binary files, etc)
    const interestingExtensions = ['.ts', '.tsx', '.js', '.jsx', '.json', '.md', '.py', '.go', '.rs', '.java', '.yml', '.yaml'];
    const skipDirs = ['node_modules/', 'dist/', 'build/', '.git/', 'venv/', '__pycache__/'];
    
    const filesToFetch = allFiles.filter(item => {
      if (item.type !== 'blob') return false;
      if (skipDirs.some(dir => item.path.includes(dir))) return false;
      
      const ext = item.path.substring(item.path.lastIndexOf('.'));
      return interestingExtensions.includes(ext) || item.path.toLowerCase().includes('dockerfile');
    }).slice(0, 50); // Cap at 50 files to prevent huge token usage
    
    // 4. Fetch file contents
    const fileContents = await Promise.all(
      filesToFetch.map(async (file) => {
        try {
          const res = await axios.get(`https://api.github.com/repos/${owner}/${repo}/contents/${file.path}`, { headers });
          const content = Buffer.from(res.data.content, 'base64').toString('utf-8');
          return {
            path: file.path,
            content
          };
        } catch (e) {
          return { path: file.path, content: '<Error fetching file>' };
        }
      })
    );

    // Build tree structure string for context
    const treeString = allFiles.map(f => f.path).join('\n');

    return {
      repoName: `${owner}/${repo}`,
      description: repoMetaRes.data.description || 'No description provided',
      language: repoMetaRes.data.language || 'Unknown',
      tree: treeString,
      files: fileContents
    };
    
  } catch (err: any) {
    if (err.response?.status === 404) {
      throw new AppError('Repository not found or requires a personal access token.', 404);
    }
    if (err.response?.status === 403) {
      throw new AppError('GitHub API rate limit exceeded.', 429);
    }
    throw new AppError('Failed to fetch from GitHub: ' + err.message, 500);
  }
};
