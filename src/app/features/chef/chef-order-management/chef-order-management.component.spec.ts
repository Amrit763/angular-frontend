import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChefOrderManagementComponent } from './chef-order-management.component';

describe('ChefOrderManagementComponent', () => {
  let component: ChefOrderManagementComponent;
  let fixture: ComponentFixture<ChefOrderManagementComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChefOrderManagementComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ChefOrderManagementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
