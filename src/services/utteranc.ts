import React from 'react';
import { useTheme } from 'next-themes';

// username/repo format
const REPO_NAME = 'danielmenezes/desafio02-capitulo03-ignite';

export const useUtterances = (commentNodeId: string): void => {
  const { theme } = useTheme();
  const utterancesTheme = theme === 'light' ? 'github-light' : 'photon-dark';

  React.useEffect(() => {
    const scriptParentNode = document.getElementById(commentNodeId);
    if (!scriptParentNode) return;

    // docs - https://utteranc.es/
    const script = document.createElement('script');
    script.src = 'https://utteranc.es/client.js';
    script.async = true;
    script.setAttribute('repo', REPO_NAME);
    script.setAttribute('issue-term', 'pathname');
    script.setAttribute('label', 'comment :speech_balloon:');
    script.setAttribute('theme', utterancesTheme);
    script.setAttribute('crossorigin', 'anonymous');

    scriptParentNode.appendChild(script);

    return () => {
      // cleanup - remove the older script with previous theme
      scriptParentNode.removeChild(scriptParentNode.firstChild as Node);
    };
  }, [commentNodeId]);
};
