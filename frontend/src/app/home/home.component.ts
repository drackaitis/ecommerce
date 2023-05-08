import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { Product, ProductService } from '../product.service';
import { Subscription } from 'rxjs';
import { MatButtonToggleChange, MatButtonToggleGroup } from '@angular/material/button-toggle';
import { Category, CategoryService } from '../category.service';
import { Order, OrderItem, OrderService } from '../order.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit, OnDestroy {
  products: Product[] = [];
  categories: Category[] = [];
  categorySelection: string = '';
  private subscription: Subscription = new Subscription;

  constructor(private productService: ProductService, private categoryService: CategoryService, private orderService: OrderService) { }

  @ViewChild('toggleGroup') toggleGroup!: MatButtonToggleGroup;

  ngOnInit(): void {
    this.getCategories();
    this.getProducts();
  }

  getProducts(): void {
    if (!this.categorySelection) {
      console.log("Fetching products without category.")
      this.subscription = this.productService.getProducts().subscribe(products => {
        this.products = products;
      }); 
    } else {
      console.log("Fetching products with category ", this.categorySelection)
      this.subscription = this.productService.getProductsByCategory(this.categorySelection).subscribe(products => {
        this.products = products;
      }); 
    }
  }

  getCategories() {
    this.categoryService.getCategories().subscribe(
      categories => this.categories = categories
    );
  }

  updateCategoryFilter(selectedCategoryId: string) {
    console.log("Template returned category: ", this.categorySelection)
    this.categorySelection = selectedCategoryId;
    console.log("Changing to new category: ", this.categorySelection);
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
    this.getProducts();
  }

  addItemToCart(product: Product) {
    const item: OrderItem = {
      product,
      quantity: 1,
      price: product.price
    }
    this.orderService.addItemToCart(item);
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }
}
