import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChefChatListComponent } from './chef-chat-list.component';

describe('ChefChatListComponent', () => {
  let component: ChefChatListComponent;
  let fixture: ComponentFixture<ChefChatListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChefChatListComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ChefChatListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
