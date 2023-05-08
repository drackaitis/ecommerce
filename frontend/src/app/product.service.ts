import { Injectable } from '@angular/core';
import { Apollo, gql } from 'apollo-angular'
import { Observable } from 'rxjs';
import { catchError, map } from 'rxjs/operators'
import { User } from './user.service';
import { Category } from './category.service';

// Shape of the Product data
export interface Product {
  id: string;
  productName: string;
  description?: string;
  price: number;
  imageUrl?: string;
  category?: Category;
  seller?: User;
  createdAt: string;
  updatedAt: string;
};

// Define the shape of the expected response.
export interface ProductsResponse {
  getProducts: Product[];
}

export interface ProductResponse {
  getProduct: Product;
}

export interface ProductsByCategoryResponse {
  getProductsByCategory: Product[];
}


/*
  Using Apollo Client's query method, an Observer is returned that emits data once.
  If you want an Observer that emits data and listens to changes made on the server,
  then you need to use ".watchQuery" and ".valueChanges" instead. This requires that
  you have implemented subscription logic on the backend.
*/
@Injectable({
  providedIn: 'root'
})
export class ProductService {
  constructor(private apollo: Apollo) {}

  getProducts(): Observable<Product[]> {
    return this.apollo.query<ProductsResponse>({
      query: gql`
        query getProducts {
          getProducts {
            id
            productName
            description
            price
            imageUrl,
            createdAt,
            updatedAt
          }
        }
      `
    }).pipe(
      map(result => result.data.getProducts)
    );
  }

  getProduct(id: string): Observable<Product> {
    return this.apollo.query<ProductResponse>({
      query: gql`
        query getProduct($id: ID!) {
          getProduct(id: $id) {
            id
            productName
            description
            price
            imageUrl,
            createdAt,
            updatedAt
          }
        }
      `,
      variables: {
        id
      }
    }).pipe(
      map(result => result.data.getProduct)
    );
  }

  getProductsByCategory(id: string): Observable<Product[]> {
    return this.apollo.query<ProductsByCategoryResponse>({
      query: gql`
        query getProductsByCategory($id: ID!) {
          getProductsByCategory(id: $id) {
            id
            productName
            description
            price
            imageUrl,
            createdAt,
            updatedAt
          }
        }
      `,
      variables: {
        id
      }
    }).pipe(
      map(result => result.data.getProductsByCategory)
    );
  }
}