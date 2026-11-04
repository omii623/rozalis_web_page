import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LinkTree } from './link-tree';

describe('LinkTree', () => {
  let fixture: ComponentFixture<LinkTree>;
  let el: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [LinkTree] }).compileComponents();
    fixture = TestBed.createComponent(LinkTree);
    await fixture.whenStable();
    el = fixture.nativeElement;
  });

  it('should render the three social links opening in a new tab safely', () => {
    const links = Array.from(el.querySelectorAll<HTMLAnchorElement>('.social-links a'));
    expect(links.map((a) => a.textContent?.trim())).toEqual(['Instagram', 'Facebook', 'Etsy']);
    for (const a of links) {
      expect(a.target).toBe('_blank');
      expect(a.rel).toContain('noopener');
    }
  });

  it('should render the logo as the page heading', () => {
    expect(el.querySelector('h1 img')?.getAttribute('alt')).toBe('ROZALIS ékszer');
  });
});
