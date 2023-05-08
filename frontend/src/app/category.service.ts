import { Injectable } from '@angular/core';
import { Apollo, gql } from 'apollo-angular';
import { Observable, map } from 'rxjs';

// Shape of the Category data.
export interface Category {
  id: string;
  categoryName: string;
  createdAt: string;
  updatedAt: string;
}

export interface CategoriesResponse {
  getCategories: Category[]
};

export interface CategoryResponse {
  getCategory: Category
}

@Injectable({
  providedIn: 'root'
})
export class CategoryService {

  constructor(private apollo: Apollo) { }

  getCategories(): Observable<Category[]> {
    return this.apollo.watchQuery<CategoriesResponse>({
      query: gql`
        query getCategories {
          getCategories {
            id,
            categoryName,
            createdAt,
            updatedAt
          }
        }
      `
    }).valueChanges.pipe(
      map(result => result.data.getCategories)
    );
  }

  getCategory(id: string): Observable<Category> {
    return this.apollo.watchQuery<CategoryResponse>({
      query: gql`
        query getCategory($id: ID!) {
          getCategories(id: $id) {
            id,
            categoryName,
            createdAt,
            updatedAt
          }
        }
      `
    }).valueChanges.pipe(
      map(result => result.data.getCategory)
    );
  }
}
