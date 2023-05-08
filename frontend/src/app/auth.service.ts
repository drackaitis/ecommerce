import { Injectable, inject } from '@angular/core';
import { Apollo, gql } from 'apollo-angular';
import { User, UserRole } from './user.service';
import { Observable, BehaviorSubject, map, tap } from 'rxjs';
import { CanActivateFn, Router } from '@angular/router';

// Shape of the authentication data.
export interface AuthPayload {
  user: User,
  token: string,
  expiresAt: number
};

// Define response types that are anticipated.
export interface SignUpResponse {
  signUp: User
};

export interface SignInResponse {
  signIn: AuthPayload
};

// GraphQL request documents to pass to Apollo Client.
const signUpGQL = gql`
  mutation signUp($firstName: String!, $lastName: String, $email: String!, $password: String!, $role: UserRole!) {
    signUp(firstName: $firstName, lastName: $lastName, email: $email, password: $password, role: $role) {
      id,
      firstName,
      lastName,
      email,
      password,
      role,
      createdAt,
      updatedAt
    }
  }
`;

const signInGQL = gql`
  mutation signIn($email: String!, $password: String!) {
    signIn(email: $email, password: $password) {
      user {
        id,
        role
      },
      token,
      expiresAt
    }
  }
`

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  // Define auth related states that can be modified.
  private isLoggedIn = new BehaviorSubject<boolean>(false);
  private userRole = new BehaviorSubject<UserRole>(UserRole.CUSTOMER);
  private authData: AuthPayload | null = null;

  // Log in user across sessions if token is valid.
  constructor(private apollo: Apollo, private router: Router) {
    const storedAuthData = localStorage.getItem('auth');
    if (storedAuthData) {
      this.authData = JSON.parse(storedAuthData);
      // Log out user if token is expired
      if (Date.now() > this.authData!.expiresAt * 1000) {
        this.signOut();
      } else {
        this.isLoggedIn.next(true);
        this.userRole.next(this.authData!.user.role);
      }
    }
  }

  // Get observables of the BehaviorSubjects, which can be subscribed to.
  get isLoggedIn$(): Observable<boolean> {
    return this.isLoggedIn.asObservable();
  }
  
  get userRole$(): Observable<UserRole> {
    return this.userRole.asObservable();
  }

  // Route Guard related methods that aid authorization.
  isCustomer(): boolean {
    return this.isLoggedIn.getValue() && this.userRole.getValue() === UserRole.CUSTOMER;
  }

  isAdmin(): boolean {
    return this.isLoggedIn.getValue() && this.userRole.getValue() === UserRole.ADMIN;
  }
  
  signUp(firstName: string, lastName: string | null = null, email: string, password: string, role: UserRole): Observable<User> {
    return this.apollo.mutate<SignUpResponse>({
      mutation: signUpGQL,
      variables: {
        firstName,
        lastName,
        email,
        password,
        role
      }
    }).pipe(
      map(result => result.data!.signUp)
    )
  }

  signIn(email: string, password: string): Observable<AuthPayload> {
    return this.apollo.mutate<SignInResponse>({
      mutation: signInGQL,
      variables: {
        email,
        password
      }
    }).pipe(
      map(result => result.data!.signIn),
      tap(result => {
        localStorage.setItem("auth", JSON.stringify(result));
        this.authData = result;
        this.isLoggedIn.next(true);
        this.userRole.next(result.user.role);
        this.router.navigateByUrl('/home');
      }))
  }

  signOut(): void {
    this.isLoggedIn.next(false);
    this.clearAuthorizationData();
    this.router.navigateByUrl('/home')
  }

  getAuthorizationToken(): string {
    return this.authData ? this.authData.token : "";
  }

  getStoredUser(): User | null {
    return this.authData ? this.authData.user : null;
  }

  clearAuthorizationData(): void {
    localStorage.removeItem('auth');
  }
};

// Auth guard that is used in the routing module.
export function authGuard(isCustomer: boolean = true): CanActivateFn {
  return () => {
    const authService: AuthService = inject(AuthService);
    
    if ((isCustomer && authService.isCustomer()) || (!isCustomer && authService.isAdmin())) {
      return true;
    }
    alert("You need to be logged in.");
    return inject(Router).createUrlTree(["/login"]);
  };
}