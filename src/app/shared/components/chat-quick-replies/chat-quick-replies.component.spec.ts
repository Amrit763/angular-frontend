import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChatQuickRepliesComponent } from './chat-quick-replies.component';

describe('ChatQuickRepliesComponent', () => {
  let component: ChatQuickRepliesComponent;
  let fixture: ComponentFixture<ChatQuickRepliesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChatQuickRepliesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ChatQuickRepliesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
