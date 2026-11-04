import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Gallery, GALLERY_MANIFEST_URL } from './gallery';

const IMAGES = ['/images/photo-a.webp', '/images/photo-b.webp', '/images/photo-c.webp'];

describe('Gallery', () => {
  let fixture: ComponentFixture<Gallery>;
  let el: HTMLElement;
  const originalFetch = globalThis.fetch;
  let requested: string[];

  const settle = async () => {
    await new Promise((r) => setTimeout(r));
    await fixture.whenStable();
    fixture.detectChanges();
  };
  const press = async (key: string) => {
    document.dispatchEvent(new KeyboardEvent('keydown', { key }));
    await settle();
  };
  const lightboxSrc = () => el.querySelector('.lightbox img')?.getAttribute('src');

  async function create(response: Response | Error) {
    requested = [];
    globalThis.fetch = ((url: string) => {
      requested.push(url);
      return response instanceof Error ? Promise.reject(response) : Promise.resolve(response);
    }) as typeof fetch;
    await TestBed.configureTestingModule({ imports: [Gallery] }).compileComponents();
    fixture = TestBed.createComponent(Gallery);
    el = fixture.nativeElement;
    await settle();
  }

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  describe('with images', () => {
    beforeEach(() => create(new Response(JSON.stringify({ images: IMAGES }))));

    it('should load the manifest and render one button per image', () => {
      expect(requested).toEqual([GALLERY_MANIFEST_URL]);
      expect(el.querySelectorAll('button.gallery-item').length).toBe(IMAGES.length);
    });

    it('should open the first image (index 0) in the lightbox', async () => {
      el.querySelector<HTMLButtonElement>('button.gallery-item')!.click();
      await settle();
      expect(lightboxSrc()).toBe(IMAGES[0]);
    });

    it('should navigate with arrow keys (wrapping) and close with Escape', async () => {
      el.querySelector<HTMLButtonElement>('button.gallery-item')!.click();
      await settle();

      await press('ArrowLeft');
      expect(lightboxSrc()).toBe(IMAGES[IMAGES.length - 1]);
      await press('ArrowRight');
      expect(lightboxSrc()).toBe(IMAGES[0]);

      await press('Escape');
      expect(el.querySelector('.lightbox')).toBeNull();
    });
  });

  it('should show the empty message when the manifest is missing', async () => {
    await create(new Response('not found', { status: 404 }));
    expect(el.querySelector('.empty-message')).not.toBeNull();
  });

  it('should show the empty message when the request fails', async () => {
    await create(new Error('offline'));
    expect(el.querySelector('.empty-message')).not.toBeNull();
  });
});
