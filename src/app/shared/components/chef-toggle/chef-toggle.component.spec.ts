import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChefToggleComponent } from './chef-toggle.component';

describe('ChefToggleComponent', () => {
  let component: ChefToggleComponent;
  let fixture: ComponentFixture<ChefToggleComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChefToggleComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ChefToggleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
