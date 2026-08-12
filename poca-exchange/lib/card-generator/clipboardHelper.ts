export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
      await navigator.clipboard.writeText(text);
      return true;
    }

    // Fallback for older browsers
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();

    try {
      const success = document.execCommand('copy');
      document.body.removeChild(textarea);
      return success;
    } catch {
      document.body.removeChild(textarea);
      return false;
    }
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    return false;
  }
};

export const generateHashtagText = (hashtags: string[]): string => {
  return hashtags.map((tag) => (tag.startsWith('#') ? tag : `#${tag}`)).join(' ');
};
