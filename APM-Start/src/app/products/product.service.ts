import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';

import { BehaviorSubject, catchError, combineLatest, filter, forkJoin, map, merge, Observable, of, scan, shareReplay, Subject, switchMap, tap, throwError } from 'rxjs';

import { Product } from './product';
import { ProductCategoryService } from '../product-categories/product-category.service';
import { SupplierService } from '../suppliers/supplier.service';
import { Supplier } from '../suppliers/supplier';

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private productsUrl = 'api/products';
  private suppliersUrl = 'api/suppliers';

  products$ = this.http.get<Product[]>(this.productsUrl)
    .pipe(
      tap(data => console.log('Products: ', JSON.stringify(data))),
      shareReplay(1), // caching,
      catchError(this.handleError)
    );

  productsWithCategory$ = combineLatest([
    this.products$,
    this.productCategoryService.productCategories$
  ]).pipe(
    map(([products, categories]) =>
      products.map(product => ({
        ...product,
        price: product.price ? product.price * 1.5 : 0,
        category: categories.find(c => product.categoryId === c.id)?.name,
        searchKey: [product.productName]
      } as Product))
    )
 //   shareReplay(1), // caching, 
  );

  private productSelectedSubject = new BehaviorSubject<number>(0);
  productSelectedAction$ = this.productSelectedSubject.asObservable();

  private productInsertedSubject = new Subject<Product>();
  productInsertedAction$ = this.productInsertedSubject.asObservable();

  productsWithAdd$ = merge(
    this.productsWithCategory$,
    this.productInsertedAction$
  ).pipe(
    scan((acc, value) =>
      (value instanceof Array) ? [...value] : [...acc, value], [] as Product[]),
    tap(products => console.log(`producten`, products))
  )

  selectedProduct$ = combineLatest([
    this.productsWithCategory$,
    this.productSelectedAction$
    ])
    .pipe(
      map(([products, selectedProductId]) => products.find(product => product.id === selectedProductId)),
      tap(product => console.log(`selectedProduct`, product))
//      shareReplay(1), // caching, 
  );

  selectedProductSuppliersAlle$ = combineLatest([
    this.selectedProduct$,
    this.supplierService.suppliers$]
  )
    .pipe(
      map(([selectedProduct, suppliers]) => suppliers.filter(supplier => selectedProduct?.supplierIds?.includes(supplier.id))),
      tap(data => console.log('selectedProductSupplier', data))
    );

  // just in time
  selectedProductSuppliers$ = this.selectedProduct$
    .pipe(
      filter(product => Boolean(product)), // true als Product gedefinieerd, false bij undefined of null
      switchMap(selectedProduct => {
        if (selectedProduct?.supplierIds) {
          return forkJoin(selectedProduct.supplierIds.map(supplierId =>
            this.http.get<Supplier>(`${this.suppliersUrl}/${supplierId}`)))
        }
          else {
            return of([]);
          }
        }
      ));
      //map(([selectedProduct, suppliers]) => suppliers.filter(supplier => selectedProduct?.supplierIds?.includes(supplier.id))),
     // tap(data => console.log('selectedProductSupplier', data))
  

  addProduct(newProduct?: Product) {
    newProduct = newProduct || this.fakeProduct();
    this.productInsertedSubject.next(newProduct);
  }


  selectedProductChanged(selectedProductId: number): void {
    this.productSelectedSubject.next(selectedProductId);
  }

  constructor(private http: HttpClient, private productCategoryService: ProductCategoryService,
    private supplierService: SupplierService) { }

  private fakeProduct(): Product {
    return {
      id: 42,
      productName: 'Another One',
      productCode: 'TBX-0042',
      description: 'Our new product',
      price: 8.9,
      categoryId: 3,
      // category: 'Toolbox',
      quantityInStock: 30
    };
  }

  private handleError(err: HttpErrorResponse): Observable<never> {
    // in a real world app, we may send the server to some remote logging infrastructure
    // instead of just logging it to the console
    let errorMessage: string;
    if (err.error instanceof ErrorEvent) {
      // A client-side or network error occurred. Handle it accordingly.
      errorMessage = `An error occurred: ${err.error.message}`;
    } else {
      // The backend returned an unsuccessful response code.
      // The response body may contain clues as to what went wrong,
      errorMessage = `Backend returned code ${err.status}: ${err.message}`;
    }
    console.error(err);
    return throwError(() => errorMessage);
  }

}
