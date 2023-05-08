import { Component } from '@angular/core';
import { AuthService } from '../auth.service';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { switchMap, tap } from 'rxjs';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  loginForm: FormGroup;

  constructor(private authService: AuthService) { 
    this.loginForm = new FormGroup({
      email: new FormControl('', [
        Validators.required,
        Validators.email
      ]),
      password: new FormControl('', [
        Validators.required
      ])
    })
  }

  onSubmit() {
    const { email, password } = this.loginForm.value;
    this.authService.signIn(email, password).subscribe({
      next: response => {
        console.log('User logged in successfully.');
      },
      error: error => {
        console.log("There's been an error during login: ", error);
      }
    });
  }
}
