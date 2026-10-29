/* eslint-disable jsx-a11y/no-autofocus -- fixture: autoFocus is the prop under test */
// An ErrorSummary that isn't the kit's must not be touched.
import { ErrorSummary } from './legacy-errors';

export function Legacy() {
  return <ErrorSummary autoFocus />;
}
