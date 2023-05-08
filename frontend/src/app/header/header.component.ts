import { Component, OnInit } from '@angular/core';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnInit {
  isLoggedIn: boolean = false;

  constructor(private authService: AuthService) { }

  ngOnInit(): void {
    this.authService.isLoggedIn$.subscribe(loggedIn => this.isLoggedIn = loggedIn);
  }

  get userRole$() {
    return this.authService.userRole$
  }

  onClick() {
    this.authService.signOut();
  }
  
}
