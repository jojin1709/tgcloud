// Auto-Update Engine for TGCloud (Desktop & Mobile)
// Queries GitHub Releases API directly for sovereign, zero-server updates

export interface ReleaseAsset {
  name: string;
  downloadUrl: string;
  size: number;
}

export interface UpdateInfo {
  updateAvailable: boolean;
  currentVersion: string;
  latestVersion: string;
  releaseName: string;
  releaseNotes: string;
  publishedAt: string;
  htmlUrl: string;
  windowsSetupUrl: string | null;
  windowsExeUrl: string | null;
  androidApkUrl: string | null;
}

export const CURRENT_APP_VERSION = '1.0.0';
const GITHUB_REPO = 'jojin1709/tgcloud';

/**
 * Compares two semantic version strings (e.g., '1.0.1' > '1.0.0')
 */
export function isNewerVersion(remoteTag: string, localVersion: string): boolean {
  const cleanRemote = remoteTag.replace(/^[vV]/, '').trim();
  const cleanLocal = localVersion.replace(/^[vV]/, '').trim();

  const remoteParts = cleanRemote.split('.').map((p) => parseInt(p, 10) || 0);
  const localParts = cleanLocal.split('.').map((p) => parseInt(p, 10) || 0);

  for (let i = 0; i < Math.max(remoteParts.length, localParts.length); i++) {
    const r = remoteParts[i] || 0;
    const l = localParts[i] || 0;
    if (r > l) return true;
    if (r < l) return false;
  }
  return false;
}

/**
 * Checks GitHub Releases API for the latest TGCloud release
 */
export async function checkAppUpdates(): Promise<UpdateInfo> {
  try {
    const response = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/releases/latest`, {
      headers: {
        Accept: 'application/vnd.github.v3+json',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      // Fallback: try releases list if latest release is draft/prerelease
      const listResponse = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/releases?per_page=1`, {
        headers: { Accept: 'application/vnd.github.v3+json' },
        cache: 'no-store',
      });
      if (!listResponse.ok) {
        throw new Error(`Failed to query releases: ${listResponse.statusText}`);
      }
      const releases = await listResponse.json();
      if (!releases || releases.length === 0) {
        return createNoUpdateResult();
      }
      return parseReleaseData(releases[0]);
    }

    const data = await response.json();
    return parseReleaseData(data);
  } catch (error) {
    console.warn('Update check failed:', error);
    return createNoUpdateResult();
  }
}

function parseReleaseData(data: any): UpdateInfo {
  const rawTag = data.tag_name || 'v1.0.0';
  const latestVersion = rawTag.replace(/^[vV]/, '');
  const updateAvailable = isNewerVersion(rawTag, CURRENT_APP_VERSION);

  let windowsSetupUrl: string | null = null;
  let windowsExeUrl: string | null = null;
  let androidApkUrl: string | null = null;

  if (Array.isArray(data.assets)) {
    for (const asset of data.assets) {
      const name = (asset.name || '').toLowerCase();
      const url = asset.browser_download_url;
      if (name.includes('setup') && name.endsWith('.exe')) {
        windowsSetupUrl = url;
      } else if (name.endsWith('.exe')) {
        windowsExeUrl = url;
      } else if (name.endsWith('.apk')) {
        androidApkUrl = url;
      }
    }
  }

  // Fallback defaults to standard release URLs if asset name patterns differ
  if (!windowsSetupUrl && windowsExeUrl) windowsSetupUrl = windowsExeUrl;

  return {
    updateAvailable,
    currentVersion: CURRENT_APP_VERSION,
    latestVersion,
    releaseName: data.name || rawTag,
    releaseNotes: data.body || 'Performance enhancements and bug fixes.',
    publishedAt: data.published_at || new Date().toISOString(),
    htmlUrl: data.html_url || `https://github.com/${GITHUB_REPO}/releases`,
    windowsSetupUrl,
    windowsExeUrl,
    androidApkUrl,
  };
}

function createNoUpdateResult(): UpdateInfo {
  return {
    updateAvailable: false,
    currentVersion: CURRENT_APP_VERSION,
    latestVersion: CURRENT_APP_VERSION,
    releaseName: `v${CURRENT_APP_VERSION}`,
    releaseNotes: '',
    publishedAt: new Date().toISOString(),
    htmlUrl: `https://github.com/${GITHUB_REPO}/releases`,
    windowsSetupUrl: null,
    windowsExeUrl: null,
    androidApkUrl: null,
  };
}

/**
 * Triggers download or installation of the update
 */
export function triggerUpdateDownload(url: string, filename?: string) {
  if (typeof window !== 'undefined') {
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || url.split('/').pop() || 'update';
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }
}
