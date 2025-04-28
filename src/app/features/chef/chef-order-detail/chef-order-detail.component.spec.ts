import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChefOrderDetailComponent } from './chef-order-detail.component';

describe('ChefOrderDetailComponent', () => {
  let component: ChefOrderDetailComponent;
  let fixture: ComponentFixture<ChefOrderDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChefOrderDetailComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ChefOrderDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
