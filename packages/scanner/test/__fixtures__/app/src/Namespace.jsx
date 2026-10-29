import * as Kit from '@nisakhantalib/my-ui-kit';

export function Panel() {
  return (
    <Kit.Dialog open={false} title="Details">
      <Kit.Button>Close</Kit.Button>
      <select aria-label="Size">
        <option>S</option>
      </select>
    </Kit.Dialog>
  );
}
