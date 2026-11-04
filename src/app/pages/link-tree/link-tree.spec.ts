import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LinkTree } from './link-tree';

describe('LinkTree', () => {
  let component: LinkTree;
  let fixture: ComponentFixture<LinkTree>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LinkTree],
    }).compileComponents();

    fixture = TestBed.createComponent(LinkTree);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
