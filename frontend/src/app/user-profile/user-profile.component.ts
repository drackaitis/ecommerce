import { Component, OnInit, OnDestroy } from '@angular/core';
import { User, UserService } from '../user.service';
import { AuthService } from '../auth.service';
import { Observable, Subscription } from 'rxjs';
import { Order, OrderService } from '../order.service';

@Component({
  selector: 'app-user-profile',
  templateUrl: './user-profile.component.html',
  styleUrls: ['./user-profile.component.css']
})
export class UserProfileComponent implements OnInit, OnDestroy {
  user$: Observable<User> | null = null;
  userId = this.authService.getStoredUser()!.id;
  subscription: Subscription | undefined;
  orders: Order[] = [];

  constructor(private userService: UserService, private authService: AuthService, private orderService: OrderService) { }

  ngOnInit(): void {
    this.user$ = this.userService.getUser(this.userId);
    this.subscription = this.orderService.getOrdersByCustomer(this.userId).subscribe(orders => this.orders = orders);
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
    console.log("At destruction, these orders: ", JSON.stringify(this.orders))
  }
}
