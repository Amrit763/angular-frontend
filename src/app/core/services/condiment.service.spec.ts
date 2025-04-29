import { TestBed } from '@angular/core/testing';

import { CondimentService } from './condiment.service';

describe('CondimentService', () => {
  let service: CondimentService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CondimentService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
