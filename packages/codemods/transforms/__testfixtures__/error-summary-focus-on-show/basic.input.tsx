/* eslint-disable jsx-a11y/no-autofocus -- fixture: autoFocus is the prop under test */
import { ErrorSummary, TextField } from '@nisakhantalib/my-ui-kit';

type Props = { errors: { id: string; message: string }[] };

export function Form({ errors }: Props) {
  return (
    <form>
      <ErrorSummary errors={errors} autoFocus />
      <ErrorSummary errors={errors} autoFocus={false} title="Fix these" />
      {/* TextField's autoFocus is the native input prop and must stay. */}
      <TextField label="Name" autoFocus />
    </form>
  );
}
