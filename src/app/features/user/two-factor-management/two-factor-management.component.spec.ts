import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TwoFactorManagementComponent } from './two-factor-management.component';

describe('TwoFactorManagementComponent', () => {
  let component: TwoFactorManagementComponent;
  let fixture: ComponentFixture<TwoFactorManagementComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TwoFactorManagementComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TwoFactorManagementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
