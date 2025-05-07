import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UserChatNotificationComponent } from './user-chat-notification.component';

describe('UserChatNotificationComponent', () => {
  let component: UserChatNotificationComponent;
  let fixture: ComponentFixture<UserChatNotificationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserChatNotificationComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UserChatNotificationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
