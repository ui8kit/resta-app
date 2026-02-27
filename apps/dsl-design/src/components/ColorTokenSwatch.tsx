import { Box } from './ui/Box';

export type ColorTokenSwatchProps = {
  tokenId: string;
  className?: string;
};

function renderTokenBox(tokenId: string, className?: string) {
  switch (tokenId) {
    case 'background':
      return <Box bg="background" rounded="md" className={className}>{' '}</Box>;
    case 'card':
      return <Box bg="card" rounded="md" className={className}>{' '}</Box>;
    case 'popover':
      return <Box bg="popover" rounded="md" className={className}>{' '}</Box>;
    case 'muted':
      return <Box bg="muted" rounded="md" className={className}>{' '}</Box>;
    case 'accent':
      return <Box bg="accent" rounded="md" className={className}>{' '}</Box>;
    case 'primary':
      return <Box bg="primary" rounded="md" className={className}>{' '}</Box>;
    case 'secondary':
      return <Box bg="secondary" rounded="md" className={className}>{' '}</Box>;
    case 'destructive':
      return <Box bg="destructive" rounded="md" className={className}>{' '}</Box>;
    case 'border':
      return <Box bg="border" rounded="md" className={className}>{' '}</Box>;
    case 'input':
      return <Box bg="input" rounded="md" className={className}>{' '}</Box>;
    case 'ring':
      return <Box bg="ring" rounded="md" className={className}>{' '}</Box>;
    case 'foreground':
      return <Box bg="foreground" rounded="md" className={className}>{' '}</Box>;
    case 'muted-foreground':
      return <Box bg="muted-foreground" rounded="md" className={className}>{' '}</Box>;
    case 'primary-foreground':
      return <Box bg="primary-foreground" rounded="md" className={className}>{' '}</Box>;
    case 'secondary-foreground':
      return <Box bg="secondary-foreground" rounded="md" className={className}>{' '}</Box>;
    case 'destructive-foreground':
      return <Box bg="destructive-foreground" rounded="md" className={className}>{' '}</Box>;
    case 'accent-foreground':
      return <Box bg="accent-foreground" rounded="md" className={className}>{' '}</Box>;
    default:
      return <Box bg="background" rounded="md" className={className}>{' '}</Box>;
  }
}

export function ColorTokenSwatch({ tokenId, className }: ColorTokenSwatchProps) {
  return renderTokenBox(tokenId, className);
}
