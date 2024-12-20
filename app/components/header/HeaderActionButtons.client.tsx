import { useState, useCallback, useMemo } from 'react';
import { PanelHeaderButton } from '~/components/ui/PanelHeaderButton';
import { Button } from '~/components/ui/Button';
import { workbenchStore } from '~/lib/stores/workbench';
import { chatStore } from '~/lib/stores/chat';
import { useStore } from '@nanostores/react'; // Confirm this path;
import useViewport from '~/lib/hooks';
import { toast } from 'react-toastify';
import Cookies from 'js-cookie';
import { VercelDeployModal } from '../workbench/VercelDeployModal';
import { classNames } from '~/utils/classNames';

interface HeaderActionButtonsProps {}

export function HeaderActionButtons({}: HeaderActionButtonsProps) {
  const showWorkbench = useStore(workbenchStore.showWorkbench);
  const { showChat } = useStore(chatStore);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isVercelChecking, setIsVercelChecking] = useState(false);
  const selectedView = useStore(workbenchStore.currentView);
  const currentDocument = useStore(workbenchStore.currentDocument);
  const unsavedFiles = useStore(workbenchStore.unsavedFiles);
  const [showVercelModal, setShowVercelModal] = useState(false);

  const isSmallViewport = useViewport(1024);
  const canHideChat = showWorkbench || !showChat;

  const handleSyncFiles = useCallback(async () => {
    setIsSyncing(true);

    try {
      const directoryHandle = await window.showDirectoryPicker();
      await workbenchStore.syncFiles(directoryHandle);
      toast.success('Files synced successfully');
    } catch (error) {
      
      toast.error('Failed to sync files');
    } finally {
      setIsSyncing(false);
    }
  }, []);

  const activeFileUnsaved = useMemo(() => {
    return currentDocument !== undefined && unsavedFiles?.has(currentDocument.filePath);
  }, [currentDocument, unsavedFiles]);

  const handleFileSave = useCallback(() => {
    workbenchStore.saveCurrentDocument().catch(() => {
      toast.error('Failed to update file content');
    });
  }, []);

  const handleFileReset = useCallback(() => {
    workbenchStore.resetCurrentDocument();
  }, []);

  return (
    <div className="flex items-center gap-2">
      {showWorkbench && selectedView === 'code' && (
        <>
          {activeFileUnsaved && currentDocument && (
            <div className="flex mr-2">
              <PanelHeaderButton className="mr-1" onClick={handleFileSave}>
                <div className="i-ph:floppy-disk-duotone" />
                Save
              </PanelHeaderButton>
              <PanelHeaderButton onClick={handleFileReset}>
                <div className="i-ph:clock-counter-clockwise-duotone" />
                Reset
              </PanelHeaderButton>
            </div>
          )}
          <div className="flex">
            <PanelHeaderButton
              className="mr-1 text-sm"
              onClick={() => {
                workbenchStore.downloadZip();
              }}
            >
              <div className="i-ph:code" />
              Download Project
            </PanelHeaderButton>
            <PanelHeaderButton className="mr-1 text-sm" onClick={handleSyncFiles} disabled={isSyncing}>
              {isSyncing ? <div className="i-ph:spinner" /> : <div className="i-ph:cloud-arrow-down" />}
              {isSyncing ? 'Syncing...' : 'Sync Files'}
            </PanelHeaderButton>
            <PanelHeaderButton
              className="mr-1 text-sm"
              onClick={() => {
                workbenchStore.toggleTerminal(!workbenchStore.showTerminal.get());
              }}
            >
              <div className="i-ph:terminal" />
              Toggle Terminal
            </PanelHeaderButton>
            <PanelHeaderButton
              className="mr-1 text-sm"
              onClick={() => {
                const repoName = prompt(
                  'Enter a name for your new GitHub repository:',
                  'promptcreate-generated-project',
                );
                if (repoName) {
                  workbenchStore.createGitHubRepo(repoName);
                }
              }}
            >
              <div className="i-ph:github-logo" />
              Create GitHub Repo
            </PanelHeaderButton>
            <PanelHeaderButton
              className="mr-1 text-sm"
              onClick={async () => {
                setIsVercelChecking(true);
                try {
                  const vercelToken = Cookies.get('vercelToken');
                  if (!vercelToken) {
                    toast.error('Connect your Vercel account in Settings first');
                    return;
                  }
                  setShowVercelModal(true);
                } finally {
                  setIsVercelChecking(false);
                }
              }}
              disabled={isVercelChecking}
            >
              {isVercelChecking ? (
                <>
                  <div className="i-ph:spinner animate-spin" />
                  Checking...
                </>
              ) : (
                <>
                  <div className="i-ph:cloud-arrow-up" />
                  Deploy to Vercel
                </>
              )}
            </PanelHeaderButton>
          </div>
        </>
      )}
      <div className="flex border border-bolt-elements-borderColor rounded-md overflow-hidden">
        <Button
          active={showChat}
          disabled={!canHideChat || isSmallViewport}
          onClick={() => {
            if (canHideChat) {
              chatStore.setKey('showChat', !showChat);
            }
          }}
        >
          <div className="i-bolt:chat text-sm" />
        </Button>
        <div className="w-[1px] bg-bolt-elements-borderColor" />
        <Button
          active={showWorkbench}
          onClick={() => {
            if (showWorkbench && !showChat) {
              chatStore.setKey('showChat', true);
            }

            workbenchStore.showWorkbench.set(!showWorkbench);
          }}
        >
          <div className="i-ph:code-bold" />
        </Button>
      </div>
      <VercelDeployModal isOpen={showVercelModal} onClose={() => setShowVercelModal(false)} />
    </div>
  );
}
