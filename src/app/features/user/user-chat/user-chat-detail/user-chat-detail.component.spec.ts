import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UserChatDetailComponent } from './user-chat-detail.component';

describe('UserChatDetailComponent', () => {
  let component: UserChatDetailComponent;
  let fixture: ComponentFixture<UserChatDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserChatDetailComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UserChatDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
