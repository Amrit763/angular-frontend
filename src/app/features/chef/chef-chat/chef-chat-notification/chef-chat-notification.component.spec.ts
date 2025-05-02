import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChefChatNotificationComponent } from './chef-chat-notification.component';

describe('ChefChatNotificationComponent', () => {
  let component: ChefChatNotificationComponent;
  let fixture: ComponentFixture<ChefChatNotificationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChefChatNotificationComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ChefChatNotificationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
