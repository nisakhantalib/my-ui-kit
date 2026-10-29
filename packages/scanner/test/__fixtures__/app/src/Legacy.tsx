/* eslint-disable jsx-a11y/no-autofocus -- fixture: must not count, the kit is not imported here */
// Doesn't import the kit, so its raw controls and lookalike ErrorSummary are not counted.
import { ErrorSummary } from './legacy-errors';

export function Legacy() {
  return (
    <div>
      <ErrorSummary autoFocus />
      <button type="button">Old</button>
    </div>
  );
}
