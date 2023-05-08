import { Component, OnInit, OnDestroy, AfterViewInit, ChangeDetectorRef } from '@angular/core';
import { OrderItem, OrderService } from '../order.service';
import { AuthService } from '../auth.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-shopping-cart',
  templateUrl: './shopping-cart.component.html',
  styleUrls: ['./shopping-cart.component.css']
})
export class ShoppingCartComponent implements OnInit, OnDestroy, AfterViewInit {
  cartItems: OrderItem[] = [];
  total: number = 0;
  subscription: Subscription = new Subscription;

  constructor(private authService: AuthService, private orderService: OrderService, private cdr: ChangeDetectorRef ) { }

  ngOnInit(): void {
    const savedCartItems = localStorage.getItem('cartItems');
    if (savedCartItems && JSON.parse(savedCartItems).length > 0) {
      this.cartItems = JSON.parse(savedCartItems);
      this.calcTotal();
    }
    this.subscription = this.orderService.cartItems$.subscribe(cart => this.cartItems = cart);
  }
  
  ngAfterViewInit(): void {
    this.calcTotal()
    this.cdr.detectChanges();
  }
  
  ngOnDestroy(): void {
    this.saveCartItems();
  }

  updateQuantity(item: OrderItem, quantity: number): void {
    item.quantity = quantity;
    if (item.quantity === 0) {
      this.removeItem(item);
    } else {
      item.price = item.product.price * item.quantity;
      this.saveCartItems();
    }
  }

  removeItem(item: OrderItem): void {
   this.orderService.removeItemFromCart(item);
   this.saveCartItems(); 
  }

  saveCartItems(): void {
    localStorage.setItem('cartItems', JSON.stringify(this.cartItems));
    this.calcTotal()
  }

  calcTotal(): void {
    this.total = this.cartItems.reduce((total, item) => total + item.price, 0);
  }

  createOrder(): void {
    const userId = this.authService.getStoredUser()!.id;
    const orderItems = this.cartItems.map(item => ({
      id: item.product.id,
      quantity: item.quantity
    }))
    localStorage.removeItem('cartItems');
    this.subscription.unsubscribe();
  };
}