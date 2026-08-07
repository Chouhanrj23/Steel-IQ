import { forwardRef } from 'react';
import MuiButton, { type ButtonProps as MuiButtonProps } from '@mui/material/Button';

export type ButtonProps = MuiButtonProps;

export const Button = forwardRef<HTMLButtonElement, ButtonProps>((props, ref) => {
  return <MuiButton ref={ref} variant="contained" disableElevation {...props} />;
});

Button.displayName = 'Button';
