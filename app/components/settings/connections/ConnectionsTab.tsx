import React, { useState, useEffect } from 'react';
import { Switch } from '~/components/ui/Switch';
import { toast } from 'react-toastify';
import Cookies from 'js-cookie';
import { logStore } from '~/lib/stores/logs';

type GitHubUserResponse = {
  login: string;
};

type VercelUserResponse = {
  user: {
    username: string;
  };
};

export default function ConnectionsTab() {
  // GitHub state
  const [githubUsername, setGithubUsername] = useState(Cookies.get('githubUsername') || '');
  const [githubToken, setGithubToken] = useState(Cookies.get('githubToken') || '');
  const [isGithubConnected, setIsGithubConnected] = useState(false);
  const [isGithubVerifying, setIsGithubVerifying] = useState(false);

  // Vercel state
  const [vercelToken, setVercelToken] = useState(Cookies.get('vercelToken') || '');
  const [isVercelConnected, setIsVercelConnected] = useState(false);
  const [isVercelVerifying, setIsVercelVerifying] = useState(false);

  useEffect(() => {
    // Check GitHub credentials
    if (githubUsername && githubToken) {
      verifyGitHubCredentials();
    }
    // Check Vercel credentials
    if (vercelToken) {
      verifyVercelCredentials();
    }
  }, []);

  // GitHub verification
  const verifyGitHubCredentials = async () => {
    setIsGithubVerifying(true);

    try {
      const response = await fetch('https://api.github.com/user', {
        headers: {
          Authorization: `Bearer ${githubToken}`,
        },
      });

      if (response.ok) {
        const data = (await response.json()) as GitHubUserResponse;

        if (data.login === githubUsername) {
          setIsGithubConnected(true);
          return true;
        }
      }

      setIsGithubConnected(false);
      return false;
    } catch (error) {
      console.error('Error verifying GitHub credentials:', error);
      setIsGithubConnected(false);
      return false;
    } finally {
      setIsGithubVerifying(false);
    }
  };

  // Vercel verification
  const verifyVercelCredentials = async () => {
    setIsVercelVerifying(true);

    try {
      const response = await fetch('https://api.vercel.com/v2/user', {
        headers: {
          Authorization: `Bearer ${vercelToken}`,
        },
      });

      if (response.ok) {
        const data = (await response.json()) as VercelUserResponse;
        if (data.user.username) {
          setIsVercelConnected(true);
          return true;
        }
      }

      setIsVercelConnected(false);
      return false;
    } catch (error) {
      
      setIsVercelConnected(false);
      return false;
    } finally {
      setIsVercelVerifying(false);
    }
  };

  const handleGitHubSaveConnection = async () => {
    if (!githubUsername || !githubToken) {
      toast.error('Please provide both GitHub username and token');
      return;
    }

    setIsGithubVerifying(true);

    const isValid = await verifyGitHubCredentials();

    if (isValid) {
      Cookies.set('githubUsername', githubUsername);
      Cookies.set('githubToken', githubToken);
      logStore.logSystem('GitHub connection settings updated', {
        username: githubUsername,
        hasToken: !!githubToken,
      });
      toast.success('GitHub credentials verified and saved successfully!');
      Cookies.set('git:github.com', JSON.stringify({ username: githubToken, password: 'x-oauth-basic' }));
      setIsGithubConnected(true);
    } else {
      toast.error('Invalid GitHub credentials. Please check your username and token.');
    }
  };

  const handleVercelSaveConnection = async () => {
    if (!vercelToken) {
      toast.error('Please provide a Vercel token');
      return;
    }

    setIsVercelVerifying(true);

    const isValid = await verifyVercelCredentials();

    if (isValid) {
      Cookies.set('vercelToken', vercelToken);
      logStore.logSystem('Vercel connection settings updated', {
        hasToken: !!vercelToken,
      });
      toast.success('Vercel credentials verified and saved successfully!');
      setIsVercelConnected(true);
    } else {
      toast.error('Invalid Vercel token. Please check your token.');
    }
  };

  const handleGitHubDisconnect = () => {
    Cookies.remove('githubUsername');
    Cookies.remove('githubToken');
    Cookies.remove('git:github.com');
    setGithubUsername('');
    setGithubToken('');
    setIsGithubConnected(false);
    logStore.logSystem('GitHub connection removed');
    toast.success('GitHub connection removed successfully!');
  };

  const handleVercelDisconnect = () => {
    Cookies.remove('vercelToken');
    setVercelToken('');
    setIsVercelConnected(false);
    logStore.logSystem('Vercel connection removed');
    toast.success('Vercel connection removed successfully!');
  };

  return (
    <div className="space-y-6">
      {/* GitHub Connection Section */}
      <div className="p-4 border border-bolt-elements-borderColor rounded-lg bg-bolt-elements-background-depth-3">
        <h3 className="text-lg font-medium text-bolt-elements-textPrimary mb-4">GitHub Connection</h3>
        <div className="flex mb-4">
          <div className="flex-1 mr-2">
            <label className="block text-sm text-bolt-elements-textSecondary mb-1">GitHub Username:</label>
            <input
              type="text"
              value={githubUsername}
              onChange={(e) => setGithubUsername(e.target.value)}
              disabled={isGithubVerifying}
              className="w-full bg-white dark:bg-bolt-elements-background-depth-4 relative px-2 py-1.5 rounded-md focus:outline-none placeholder-bolt-elements-textTertiary text-bolt-elements-textPrimary dark:text-bolt-elements-textPrimary border border-bolt-elements-borderColor disabled:opacity-50"
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm text-bolt-elements-textSecondary mb-1">Personal Access Token:</label>
            <input
              type="password"
              value={githubToken}
              onChange={(e) => setGithubToken(e.target.value)}
              disabled={isGithubVerifying}
              className="w-full bg-white dark:bg-bolt-elements-background-depth-4 relative px-2 py-1.5 rounded-md focus:outline-none placeholder-bolt-elements-textTertiary text-bolt-elements-textPrimary dark:text-bolt-elements-textPrimary border border-bolt-elements-borderColor disabled:opacity-50"
            />
          </div>
        </div>
        <div className="flex mb-4 items-center">
          {!isGithubConnected ? (
            <button
              onClick={handleGitHubSaveConnection}
              disabled={isGithubVerifying || !githubUsername || !githubToken}
              className="bg-bolt-elements-button-primary-background rounded-lg px-4 py-2 mr-2 transition-colors duration-200 hover:bg-bolt-elements-button-primary-backgroundHover text-bolt-elements-button-primary-text disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {isGithubVerifying ? (
                <>
                  <div className="i-ph:spinner animate-spin mr-2" />
                  Verifying...
                </>
              ) : (
                'Connect'
              )}
            </button>
          ) : (
            <button
              onClick={handleGitHubDisconnect}
              className="bg-bolt-elements-button-danger-background rounded-lg px-4 py-2 mr-2 transition-colors duration-200 hover:bg-bolt-elements-button-danger-backgroundHover text-bolt-elements-button-danger-text"
            >
              Disconnect
            </button>
          )}
          {isGithubConnected && <span className="text-green-500">✓ Connected</span>}
        </div>
      </div>

      {/* Vercel Connection Section */}
      <div className="p-4 border border-bolt-elements-borderColor rounded-lg bg-bolt-elements-background-depth-3">
        <h3 className="text-lg font-medium text-bolt-elements-textPrimary mb-4">Vercel Connection</h3>
        <div className="flex mb-4">
          <div className="flex-1">
            <label className="block text-sm text-bolt-elements-textSecondary mb-1">Vercel Token:</label>
            <input
              type="password"
              value={vercelToken}
              onChange={(e) => setVercelToken(e.target.value)}
              disabled={isVercelVerifying}
              className="w-full bg-white dark:bg-bolt-elements-background-depth-4 relative px-2 py-1.5 rounded-md focus:outline-none placeholder-bolt-elements-textTertiary text-bolt-elements-textPrimary dark:text-bolt-elements-textPrimary border border-bolt-elements-borderColor disabled:opacity-50"
            />
          </div>
        </div>
        <div className="flex mb-4 items-center">
          {!isVercelConnected ? (
            <button
              onClick={handleVercelSaveConnection}
              disabled={isVercelVerifying || !vercelToken}
              className="bg-bolt-elements-button-primary-background rounded-lg px-4 py-2 mr-2 transition-colors duration-200 hover:bg-bolt-elements-button-primary-backgroundHover text-bolt-elements-button-primary-text disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {isVercelVerifying ? (
                <>
                  <div className="i-ph:spinner animate-spin mr-2" />
                  Verifying...
                </>
              ) : (
                'Connect'
              )}
            </button>
          ) : (
            <button
              onClick={handleVercelDisconnect}
              className="bg-bolt-elements-button-danger-background rounded-lg px-4 py-2 mr-2 transition-colors duration-200 hover:bg-bolt-elements-button-danger-backgroundHover text-bolt-elements-button-danger-text"
            >
              Disconnect
            </button>
          )}
          {isVercelConnected && <span className="text-green-500">✓ Connected</span>}
        </div>
      </div>
    </div>
  );
}
