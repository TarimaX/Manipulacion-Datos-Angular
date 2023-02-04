//Bryan Miguel Morales Saa
//Manipulación de flujos de datos asíncronos con operadores como filter debounceTime
//04/02/2023
import { Component, OnInit, ViewChild, ElementRef, Input, EventEmitter, Output } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Observable, fromEvent, merge } from 'rxjs';
import { map, filter, debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';

@Component({
  selector: 'app-search-component',
  template: `
    <form [formGroup]="searchForm">
      <input formControlName="searchInput" placeholder="Enter search term">
      <button type="submit" [disabled]="searchForm.invalid">Search</button>
    </form>
    <ng-container *ngIf="results$ | async as results; else loading">
      <ul *ngIf="results.length; else noResults">
        <li *ngFor="let result of results">
          {{ result }}
        </li>
      </ul>
      <ng-template #noResults>No results found</ng-template>
    </ng-container>
    <ng-template #loading>Loading results...</ng-template>
  `
})
export class SearchComponent implements OnInit {
  @Input() searchApi: (term: string) => Observable<string[]>;
  @Output() search = new EventEmitter<string[]>();
  @ViewChild('searchInput', { static: true }) searchInput: ElementRef<HTMLInputElement>;

  searchForm = new FormGroup({
    searchInput: new FormControl('', Validators.required)
  });

  results$: Observable<string[]>;

  ngOnInit() {
    const input$ = fromEvent(this.searchInput.nativeElement, 'input')
      .pipe(
        map((event: Event) => (event.target as HTMLInputElement).value),
        filter(term => term.length > 2),
        debounceTime(300),
        distinctUntilChanged()
      );

    this.results$ = merge(
      input$,
      this.searchForm.get('searchInput').valueChanges
    )
    .pipe(
      switchMap(term => this.searchApi(term))
    );

    this.results$.subscribe(results => {
      this.search.emit(results);
    });
  }

  submitForm() {
    if (this.searchForm.valid) {
      this.searchInput.nativeElement.dispatchEvent(new Event('input'));
    }
  }
}