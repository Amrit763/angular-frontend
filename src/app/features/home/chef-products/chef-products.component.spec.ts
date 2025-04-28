import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChefProductsComponent } from './chef-products.component';

describe('ChefProductsComponent', () => {
  let component: ChefProductsComponent;
  let fixture: ComponentFixture<ChefProductsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChefProductsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ChefProductsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
