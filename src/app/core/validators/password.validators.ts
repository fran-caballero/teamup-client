import { AbstractControl } from '@angular/forms';

export function usernamePasswordEqualityValidator(group: AbstractControl) {
  const username = group.get('username')?.value;
  const password = group.get('password')?.value;
  const isValid = username !== password;

  return isValid ? null : { matchingUsernamePassword: true };
}

export function specialCharacterValidator(control: AbstractControl) {
  const password = control.value;
  const pattern = /[!"#$%&'()*+,\-./:;<=>?@[\]^_`{|}~]/;

  return pattern.test(password) ? null : { specialCharacter: true };
}

export function lowercaseLetterValidator(control: AbstractControl) {
  const password = control.value;
  const pattern = /[a-z]/;

  return pattern.test(password) ? null : { lowercaseLetter: true };
}

export function uppercaseLetterValidator(control: AbstractControl) {
  const password = control.value;
  const pattern = /[A-Z]/;

  return pattern.test(password) ? null : { uppercaseLetter: true };
}
