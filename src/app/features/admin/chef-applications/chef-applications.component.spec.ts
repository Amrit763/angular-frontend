import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChefApplicationsComponent } from './chef-applications.component';

describe('ChefApplicationsComponent', () => {
  let component: ChefApplicationsComponent;
  let fixture: ComponentFixture<ChefApplicationsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChefApplicationsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ChefApplicationsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
