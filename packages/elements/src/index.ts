import {
  Alert,
  AmountInput,
  Badge,
  Button,
  MaskedValue,
  OTPInput,
  Switch,
  TextField,
  type AlertProps,
  type AmountInputProps,
  type BadgeProps,
  type ButtonProps,
  type MaskedValueProps,
  type OTPInputProps,
  type SwitchProps,
  type TextFieldProps,
} from '@nisakhantalib/my-ui-kit';
import '@nisakhantalib/my-ui-kit/styles.css';
import { define } from './define.js';

/**
 * <kit-*> custom elements for teams not on React (Angular, Vue, server-rendered pages).
 * Same components, same accessibility, same tokens; only the API is HTML attributes and DOM events.
 *
 *   <kit-amount-input label="Amount" currency="SGD"></kit-amount-input>
 *   el.addEventListener('kit-change', (e) => e.detail.value)   // minor units
 */

define<ButtonProps>('kit-button', Button, {
  attributes: {
    variant: { prop: 'variant', type: 'string' },
    size: { prop: 'size', type: 'string' },
    loading: { prop: 'loading', type: 'boolean' },
    disabled: { prop: 'disabled', type: 'boolean' },
    type: { prop: 'type', type: 'string' },
    'track-id': { prop: 'trackId', type: 'string' },
  },
  textProp: 'children',
});

define<TextFieldProps>('kit-text-field', TextField, {
  attributes: {
    label: { prop: 'label', type: 'string' },
    hint: { prop: 'hint', type: 'string' },
    error: { prop: 'error', type: 'string' },
    name: { prop: 'name', type: 'string' },
    type: { prop: 'type', type: 'string' },
    autocomplete: { prop: 'autoComplete', type: 'string' },
    required: { prop: 'required', type: 'boolean' },
  },
});

define<AmountInputProps>('kit-amount-input', AmountInput, {
  attributes: {
    label: { prop: 'label', type: 'string' },
    hint: { prop: 'hint', type: 'string' },
    error: { prop: 'error', type: 'string' },
    currency: { prop: 'currency', type: 'string' },
    required: { prop: 'required', type: 'boolean' },
  },
  events: { onValueChange: 'kit-change' },
});

define<OTPInputProps>('kit-otp-input', OTPInput, {
  attributes: {
    label: { prop: 'label', type: 'string' },
    hint: { prop: 'hint', type: 'string' },
    error: { prop: 'error', type: 'string' },
    length: { prop: 'length', type: 'number' },
    'resend-after': { prop: 'resendAfter', type: 'number' },
  },
  events: { onComplete: 'kit-complete', onResend: 'kit-resend' },
});

define<SwitchProps>('kit-switch', Switch, {
  attributes: {
    label: { prop: 'label', type: 'string' },
    description: { prop: 'description', type: 'string' },
    checked: { prop: 'defaultChecked', type: 'boolean' },
  },
  events: { onCheckedChange: 'kit-change' },
});

define<AlertProps>('kit-alert', Alert, {
  attributes: {
    tone: { prop: 'tone', type: 'string' },
    heading: { prop: 'title', type: 'string' },
  },
  textProp: 'children',
});

define<BadgeProps>('kit-badge', Badge, {
  attributes: { tone: { prop: 'tone', type: 'string' } },
  textProp: 'children',
});

define<MaskedValueProps>('kit-masked-value', MaskedValue, {
  attributes: {
    value: { prop: 'value', type: 'string' },
    label: { prop: 'label', type: 'string' },
    visible: { prop: 'visible', type: 'number' },
  },
});
