import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, map } from 'rxjs';
import { User } from './user.service';
import { Product } from './product.service';
import { Apollo, gql } from 'apollo-angular';


// Define the shapes of an Order and its components
export interface Order {
  id: string,
  customer: User,
  items: OrderItem[],
  total: number,
  status: OrderStatus,
  createdAt: string,
  updatedAt: string
}

export interface OrderItem {
  id?: string,
  product: Product,
  quantity: number,
  price: number,
  createdAt?: string,
  updatedAt?: string
}

export interface OrderItemInput {
  id: string,
  quantity: number
}

export enum OrderStatus {
  PENDING = "PENDING",
  PROCESSING = "PROCESSING",
  SHIPPED = "SHIPPED",
  DELIVERED = "DELIVERED",
  CANCELLED = "CANCELLED"
}

export interface OrderResponse {
  getOrdersByCustomer: Order[]
}

// The format of the response object can be altered according to the required fields.
const getOrdersByCustomerGQL = gql`
  query getOrdersByCustomer($id: ID!) {
    getOrdersByCustomer(id: $id) {
      id,
      customer {
        id
      },
      items {
        id,
        product {
          id,
          productName
        },
        quantity,
        price
      },
      total,
      status,
      createdAt,
      updatedAt
    }
  }
`

const createOrderGQL = gql`
  mutation createOrder($userId: ID!, $items: [OrderItemInput!]!) {
        createOrder(userId: $userId, items: $items) {
            id,
            status
        }
    }
`

@Injectable({
  providedIn: 'root'
})
export class OrderService {
  // Hold the state of the shopping cart here.
  private cartItems = new BehaviorSubject<OrderItem[]>([]);

  constructor(private apollo: Apollo) { }

  addItemToCart(item: OrderItem) {
    const oldCart = this.cartItems.getValue();
    if (oldCart.find(cartItem => cartItem.product.id === item.product.id)) {
      return;
    }
    // Use spread operator to merge old cart and the added item, then update state.
    const newCart = [...oldCart, item]
    this.cartItems.next(newCart);
    console.log("Order Service Cart: ", this.cartItems.getValue());
  }

  removeItemFromCart(item: OrderItem) {
    const currCart = this.cartItems.getValue();
    const updatedCart = currCart.filter(cartItem => cartItem !== item);
    console.log("UpdatedCart: ", updatedCart)
    this.cartItems.next(updatedCart);
    if (updatedCart.length === 0) {
      // Handle the case when the cart becomes empty.
      // For example, you can display a message or perform any necessary actions.
      // For now there is nothing.
    }
  }

  // Return the BehaviorSubject as an Observable that can be subscribed to.
  get cartItems$ (): Observable<OrderItem[]> {
    return this.cartItems.asObservable();
  }

  getOrdersByCustomer(id: string): Observable<Order[]> {
    console.log("Fetching orders.")
    return this.apollo.query<OrderResponse>({
      query: getOrdersByCustomerGQL,
      variables: {
        id
      }
    }).pipe(map(result => result.data.getOrdersByCustomer))
  }

  createOrder(userId: string, items: OrderItemInput[]) {
    return this.apollo.mutate<OrderResponse>({
      mutation: createOrderGQL,
      variables: {
        userId,
        items
      }
    })
  }

}
