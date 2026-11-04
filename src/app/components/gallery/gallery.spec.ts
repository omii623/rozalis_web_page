import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Gallery } from './gallery';
import { GALLERY_IMAGES } from './gallery-images';

describe('Gallery', () => {
  let fixture: ComponentFixture<Gallery>;
  let el: HTMLElement;

  const press = (key: string) => {
    document.dispatchEvent(new KeyboardEvent('keydown', { key }));
    fixture.detectChanges();
  };
  const lightboxSrc = () => el.querySelector('.lightbox img')?.getAttribute('src');

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [Gallery] }).compileComponents();
    fixture = TestBed.createComponent(Gallery);
    fixture.detectChanges();
    el = fixture.nativeElement;
  });

  it('should render one button per image', () => {
    expect(el.querySelectorAll('button.gallery-item').length).toBe(GALLERY_IMAGES.length);
  });

  it('should open the first image (index 0) in the lightbox', () => {
    el.querySelector<HTMLButtonElement>('button.gallery-item')!.click();
    fixture.detectChanges();
    expect(lightboxSrc()).toBe(GALLERY_IMAGES[0]);
  });

  it('should navigate with arrow keys (wrapping) and close with Escape', () => {
    el.querySelector<HTMLButtonElement>('button.gallery-item')!.click();
    fixture.detectChanges();

    press('ArrowLeft');
    expect(lightboxSrc()).toBe(GALLERY_IMAGES[GALLERY_IMAGES.length - 1]);
    press('ArrowRight');
    expect(lightboxSrc()).toBe(GALLERY_IMAGES[0]);

    press('Escape');
    expect(el.querySelector('.lightbox')).toBeNull();
  });
});
