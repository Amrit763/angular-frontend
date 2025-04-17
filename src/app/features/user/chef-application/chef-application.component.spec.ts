import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChefApplicationComponent } from './chef-application.component';

describe('ChefApplicationComponent', () => {
  let component: ChefApplicationComponent;
  let fixture: ComponentFixture<ChefApplicationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChefApplicationComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ChefApplicationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
