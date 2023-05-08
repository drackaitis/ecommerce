import { Component } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../auth.service';
import { switchMap, tap } from 'rxjs';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent {
  registrationForm: FormGroup;

  constructor(private authService: AuthService) {
    this.registrationForm = new FormGroup({
      firstName: new FormControl('', [
        Validators.required,
        Validators.minLength(2)
      ]),
      lastName: new FormControl('', [
        Validators.minLength(2)
      ]),
      email: new FormControl('', [
        Validators.required,
        Validators.email
      ]),
      password: new FormControl('', [
        Validators.required,
        Validators.minLength(8)
      ]),
      role: new FormControl('',
        Validators.required
      )
    });
  }

  onSubmit() {
    try {
      const { firstName, lastName, email, password, role } = this.registrationForm.value;
      this.authService.signUp(firstName, lastName, email, password, role)
        .pipe(
          tap(response => console.log('Registration successful')),
          switchMap(() => this.authService.signIn(email, password))
        )
        .subscribe({
          next: response => console.log("Login successful"),
          error: error => console.log(error)
        })
    } catch (error) {
      console.log("There's been an error submitting the registration: ", error)
    }
  }
}
