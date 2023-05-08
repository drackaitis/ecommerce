import { Injectable } from '@angular/core';
import { Observable, catchError, map, throwError } from 'rxjs';
import { Apollo, gql } from 'apollo-angular';

export enum UserRole {
  CUSTOMER = "CUSTOMER",
  SELLER = "SELLER",
  ADMIN = "ADMIN"
}

export interface User {
  id: string;
  firstName: string;
  lastName?: string;
  email: string;
  password: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
}

export interface UserResponse {
  getUser: User
}

@Injectable({
  providedIn: 'root'
})
export class UserService {

  constructor(private apollo: Apollo) { }

  getUser(id: string): Observable<User> {
    return this.apollo.query<UserResponse>({
      query: gql`
        query getUser($id: ID!) {
          getUser(id: $id) {
            id,
            firstName,
            lastName,
            email,
            role,
            createdAt,
            updatedAt
          }
        }`,
        variables: {
          id
        }
    }).pipe(
      map(result => result.data.getUser)
    )
  }
}
