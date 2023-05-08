import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { NotFoundComponent } from './not-found/not-found.component';
import { AdminDashboardComponent } from './admin-dashboard/admin-dashboard.component';
import { ShoppingCartComponent } from './shopping-cart/shopping-cart.component';
import { UserProfileComponent } from './user-profile/user-profile.component';
import { RegisterComponent } from './register/register.component';
import { LoginComponent } from './login/login.component';
import { CheckoutComponent } from './checkout/checkout.component';
import { authGuard } from './auth.service';


// Define routing with authorization guards (canActivate) for restricted pages.
const routes: Routes = [
    { path: '', redirectTo: '/home', pathMatch: 'full' },
    { path: 'home', component: HomeComponent },
    { path: 'checkout', component: CheckoutComponent, canActivate: [authGuard()] }, // Not implemented yet.
    { path: 'shopping-cart', component: ShoppingCartComponent, canActivate: [authGuard()] },
    { path: 'profile', component: UserProfileComponent, canActivate: [authGuard()] },
    { path: 'register', component: RegisterComponent },
    { path: 'login', component: LoginComponent },
    { path: 'admin-dashboard', component: AdminDashboardComponent, canActivate: [authGuard(false)]}, // Not implemented yet.
    { path: '**', component: NotFoundComponent} // Not implemented yet.
];

// Configures NgModule imports and exports.
@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }