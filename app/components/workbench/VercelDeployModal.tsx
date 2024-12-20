import { useState } from 'react';
import type { ChangeEvent } from 'react';
import * as RadixDialog from '@radix-ui/react-dialog';
import { motion } from 'framer-motion';
import { IconButton } from '~/components/ui/IconButton';
import { classNames } from '~/utils/classNames';
import { workbenchStore } from '~/lib/stores/workbench';
import { useGit } from '~/lib/hooks/useGit';
import { toast } from 'react-toastify';
import { dialogBackdropVariants, dialogVariants } from '~/components/ui/Dialog';

type DeploymentType = 'direct' | 'new-github' | 'existing-github';

interface DeploymentOptions {
  type: DeploymentType;
  projectName: string;
  githubRepo?: string;
  createGithubRepo?: boolean;
}

interface VercelDeployModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function VercelDeployModal({ isOpen, onClose }: VercelDeployModalProps) {
  const { ready: gitReady, gitClone } = useGit();
  const [deploymentType, setDeploymentType] = useState<DeploymentType>('direct');
  const [projectName, setProjectName] = useState('');
  const [githubRepo, setGithubRepo] = useState('');
  const [isDeploying, setIsDeploying] = useState(false);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    switch (name) {
      case 'projectName':
        setProjectName(value);
        break;
      case 'githubRepo':
        setGithubRepo(value);
        break;
    }
  };

  const handleDeploy = async () => {
    if (!projectName.trim()) {
      toast.error('Please enter a project name');
      return;
    }

    if (deploymentType === 'existing-github' && !githubRepo.trim()) {
      toast.error('Please enter a GitHub repository URL');
      return;
    }

    if (deploymentType === 'existing-github' && !gitReady) {
      toast.error('Git system is not ready. Please try again in a moment.');
      return;
    }

    setIsDeploying(true);

    try {
      let deploymentResult;

      switch (deploymentType) {
        case 'direct':
          deploymentResult = await workbenchStore.deployToVercel(projectName);
          break;
        case 'new-github':
          // First push to GitHub
          await workbenchStore.pushToGitHub(projectName);

          // Then deploy from GitHub
          deploymentResult = await workbenchStore.deployToVercel(projectName, { fromGithub: true });
          break;
        case 'existing-github':
          // Clone the repo first
          await gitClone(githubRepo);

          // Then deploy from the cloned repo
          deploymentResult = await workbenchStore.deployToVercel(projectName, {
            fromGithub: true,
            githubRepo,
          });
          break;
      }

      // Only close the modal if deployment started successfully
      if (deploymentResult?.url) {
        onClose();
      }
    } catch (error) {
      console.error('Deployment error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to deploy to Vercel');
    } finally {
      setIsDeploying(false);
    }
  };

  return (
    <RadixDialog.Root open={isOpen}>
      <RadixDialog.Portal>
        <RadixDialog.Overlay asChild>
          <motion.div
            className="bg-black/50 fixed inset-0 z-max backdrop-blur-sm"
            onClick={onClose}
            initial="closed"
            animate="open"
            exit="closed"
            variants={dialogBackdropVariants}
          />
        </RadixDialog.Overlay>
        <RadixDialog.Content asChild>
          <motion.div
            className="fixed top-[50%] left-[50%] z-max max-w-[500px] w-[90vw] translate-x-[-50%] translate-y-[-50%] border border-bolt-elements-borderColor rounded-lg shadow-lg focus:outline-none overflow-hidden"
            initial="closed"
            animate="open"
            exit="closed"
            variants={dialogVariants}
          >
            <div className="bg-bolt-elements-background-depth-2 p-6">
              <RadixDialog.Title className="text-lg font-semibold text-bolt-elements-textPrimary mb-4">
                Deploy to Vercel
              </RadixDialog.Title>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-bolt-elements-textSecondary mb-2">Deployment Type:</label>
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="deploymentType"
                        value="direct"
                        checked={deploymentType === 'direct'}
                        onChange={(e) => setDeploymentType(e.target.value as DeploymentType)}
                        className="mr-2"
                      />
                      Direct Deploy (files only)
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="deploymentType"
                        value="new-github"
                        checked={deploymentType === 'new-github'}
                        onChange={(e) => setDeploymentType(e.target.value as DeploymentType)}
                        className="mr-2"
                      />
                      Create new GitHub repo and deploy
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="deploymentType"
                        value="existing-github"
                        checked={deploymentType === 'existing-github'}
                        onChange={(e) => setDeploymentType(e.target.value as DeploymentType)}
                        className="mr-2"
                      />
                      Use existing GitHub repo
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-bolt-elements-textSecondary mb-2">Project Name:</label>
                  <input
                    type="text"
                    name="projectName"
                    value={projectName}
                    onChange={handleInputChange}
                    placeholder="Enter project name"
                    className="w-full bg-white dark:bg-bolt-elements-background-depth-4 px-3 py-2 rounded-md focus:outline-none placeholder-bolt-elements-textTertiary text-bolt-elements-textPrimary border border-bolt-elements-borderColor"
                    disabled={isDeploying}
                  />
                </div>

                {deploymentType === 'existing-github' && (
                  <div>
                    <label className="block text-sm text-bolt-elements-textSecondary mb-2">
                      GitHub Repository URL:
                    </label>
                    <input
                      type="text"
                      name="githubRepo"
                      value={githubRepo}
                      onChange={handleInputChange}
                      placeholder="https://github.com/username/repo"
                      className="w-full bg-white dark:bg-bolt-elements-background-depth-4 px-3 py-2 rounded-md focus:outline-none placeholder-bolt-elements-textTertiary text-bolt-elements-textPrimary border border-bolt-elements-borderColor"
                      disabled={isDeploying}
                    />
                  </div>
                )}

                <div className="flex justify-end gap-2 mt-6">
                  <button
                    onClick={onClose}
                    className="px-4 py-2 rounded-md text-bolt-elements-textSecondary hover:text-bolt-elements-textPrimary transition-colors"
                    disabled={isDeploying}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeploy}
                    disabled={
                      isDeploying || !projectName.trim() || (deploymentType === 'existing-github' && !githubRepo.trim())
                    }
                    className={classNames(
                      'bg-bolt-elements-button-primary-background px-4 py-2 rounded-md text-bolt-elements-button-primary-text transition-colors flex items-center gap-2',
                      {
                        'hover:bg-bolt-elements-button-primary-backgroundHover': !isDeploying,
                        'opacity-50 cursor-not-allowed':
                          isDeploying ||
                          !projectName.trim() ||
                          (deploymentType === 'existing-github' && !githubRepo.trim()),
                      },
                    )}
                  >
                    {isDeploying ? (
                      <>
                        <div className="i-ph:spinner animate-spin" />
                        Deploying...
                      </>
                    ) : (
                      'Deploy'
                    )}
                  </button>
                </div>
              </div>
            </div>

            <RadixDialog.Close asChild>
              <IconButton icon="i-ph:x" className="absolute top-[10px] right-[10px]" onClick={onClose} />
            </RadixDialog.Close>
          </motion.div>
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  );
}
