/* eslint-disable jsx-a11y/no-autofocus -- fixture: deprecated autoFocus is what the scanner must find */
import { Button, ErrorSummary as Summary, TextField, type ButtonProps } from '@nisakhantalib/my-ui-kit';

export function Form({ variant }: Pick<ButtonProps, 'variant'>) {
  return (
    <form>
      <Summary errors={[]} autoFocus />
      <TextField label="Name" required />
      <TextField label="Email" type="email" hint="For the receipt" />
      <input type="checkbox" aria-label="Remember me" />
      <input aria-label="Search" />
      <Button variant={variant}>Save</Button>
      <Button {...{ type: 'submit' }}>Send</Button>
      <button type="button">Cancel</button>
    </form>
  );
}
