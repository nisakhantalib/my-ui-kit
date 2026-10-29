import '@fontsource-variable/inter';
import '../src/index';

// Plain DOM code: this is all a non-React team writes.
const log = document.querySelector<HTMLOutputElement>('#log')!;
const amount = document.querySelector('#amount')!;
const form = document.querySelector<HTMLFormElement>('#transfer')!;
let lastAmount: number | null = null;

amount.addEventListener('kit-change', (e) => {
  lastAmount = (e as CustomEvent<{ value: number | null }>).detail.value;
  log.textContent = `kit-change → ${lastAmount === null ? 'null' : `${lastAmount} minor units`}`;
});

document.querySelector('#notify')!.addEventListener('kit-change', (e) => {
  log.textContent = `kit-change (switch) → ${(e as CustomEvent<{ value: boolean }>).detail.value}`;
});

document.querySelector('kit-otp-input')!.addEventListener('kit-complete', (e) => {
  log.textContent = `kit-complete → ${(e as CustomEvent<{ value: string }>).detail.value}`;
});

form.addEventListener('submit', (e) => {
  e.preventDefault();
  // Errors are attributes too: the element re-renders and the message is announced.
  if (lastAmount) amount.removeAttribute('error');
  else amount.setAttribute('error', 'Enter an amount');
  log.textContent = lastAmount ? `submit → ${lastAmount} minor units` : 'submit → missing amount';
});
