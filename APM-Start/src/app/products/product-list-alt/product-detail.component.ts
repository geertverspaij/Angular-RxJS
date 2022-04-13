import { ChangeDetectionStrategy, Component } from '@angular/core';
import { catchError, combineLatest, EMPTY, filter, map } from 'rxjs';
import { Supplier } from 'src/app/suppliers/supplier';
import { Product } from '../product';

import { ProductService } from '../product.service';

@Component({
  selector: 'pm-product-detail',
  templateUrl: './product-detail.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProductDetailComponent {



  errorMessage = '';

    product$ = this.productService.selectedProduct$
    .pipe(
      catchError(err => {
        this.errorMessage = err;
        return EMPTY; // of([]);
      })
  );

  pageTitle$ = this.product$
    .pipe(
      map(product => product?.productName),
      catchError(err => {
        this.errorMessage = err;
        return EMPTY; // of([]);
      })
    );

  productSuppliers$ = this.productService.selectedProductSuppliers$
    .pipe(
      catchError(err => {
        this.errorMessage = err;
        return EMPTY; // of([]);
      })
  );

  // ViewModel
  // Pasop errormessage kan niet omdat combineLatest wacht tot alle variable gevuld zijn!
  vm$ = combineLatest([
    this.product$,
    this.pageTitle$,
    this.productSuppliers$
  ])
    .pipe(
      filter(([product]) => Boolean(product)),
      map(([product, pageTitle, productSuppliers]) =>
        ({ product, pageTitle, productSuppliers})
      )
    );
  constructor(private productService: ProductService) { }

}
