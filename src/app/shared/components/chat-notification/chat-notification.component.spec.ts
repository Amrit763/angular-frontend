import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChatNotificationComponent } from './chat-notification.component';

describe('ChatNotificationComponent', () => {
  let component: ChatNotificationComponent;
  let fixture: ComponentFixture<ChatNotificationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChatNotificationComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ChatNotificationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
