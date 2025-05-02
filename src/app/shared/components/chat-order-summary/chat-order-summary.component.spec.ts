import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChatOrderSummaryComponent } from './chat-order-summary.component';

describe('ChatOrderSummaryComponent', () => {
  let component: ChatOrderSummaryComponent;
  let fixture: ComponentFixture<ChatOrderSummaryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChatOrderSummaryComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ChatOrderSummaryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
