import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChefChatDetailComponent } from './chef-chat-detail.component';

describe('ChefChatDetailComponent', () => {
  let component: ChefChatDetailComponent;
  let fixture: ComponentFixture<ChefChatDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChefChatDetailComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ChefChatDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
