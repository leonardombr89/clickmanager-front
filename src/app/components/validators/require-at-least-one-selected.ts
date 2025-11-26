import { AbstractControl, ValidationErrors } from '@angular/forms';

export function requireAtLeastOneSelected(control: AbstractControl): ValidationErrors | null {
    const value = control.value;
    return value && Array.isArray(value) && value.length > 0 ? null : { required: true };
}
