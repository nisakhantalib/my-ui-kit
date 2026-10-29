/* eslint-disable jsx-a11y/no-autofocus -- fixture: autoFocus is the prop under test */
import { ErrorSummary as Summary, type ErrorSummaryProps } from '@nisakhantalib/my-ui-kit';
import * as Kit from '@nisakhantalib/my-ui-kit';

export function Errors({ errors }: Pick<ErrorSummaryProps, 'errors'>) {
  return (
    <>
      <Summary errors={errors} autoFocus />
      <Kit.ErrorSummary errors={errors} autoFocus={errors.length > 0} />
      <Kit.Dialog open={false} title="Unrelated" onClose={() => {}}>
        <input aria-label="Search" autoFocus />
      </Kit.Dialog>
    </>
  );
}
