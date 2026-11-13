import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { DocumentGallery } from '@/components/document-gallery';

vi.mock('@tanstack/react-router', () => ({
  useLocation: () => ({ pathname: '/PrimaryFiveClassPastPapers.html' }),
  Link: ({ children, params }: { children: React.ReactNode; params: { slug: string } }) => <a href={`/doc/${params.slug}`}>{children}</a>,
}));
const thumbnails = vi.hoisted(() => ({ load: vi.fn(async (): Promise<string | null> => null) }));
vi.mock('@/lib/pdf-thumbs', () => ({ pdfThumbnail: thumbnails.load, pdfPageCount: () => undefined, preloadPdfJs: () => undefined }));
vi.mock('@/lib/file-sizes', () => ({ fileSize: async () => null, formatSize: () => '' }));
afterEach(() => { cleanup(); vi.unstubAllGlobals(); vi.useRealTimers(); thumbnails.load.mockReset(); });

it('shows the thumbnail spinner from the first paint and removes it once the image loads', async () => {
  vi.useFakeTimers();
  thumbnails.load.mockResolvedValue('data:image/png;base64,ready');
  vi.stubGlobal('IntersectionObserver', class {
    constructor(private callback: (entries: { isIntersecting: boolean }[]) => void) {}
    observe() { this.callback([{ isIntersecting: true }]); }
    disconnect() {}
  });
  const view = render(<DocumentGallery items={[{ pdfUrl: 'https://fresh-teacher.github.io/instant.pdf', description: '', price: 5000 }]} />);
  await act(async () => {});
  const image = view.container.querySelector<HTMLImageElement>('.dg-thumb-cover');
  expect(image?.getAttribute('src')).toBe('data:image/png;base64,ready');
  expect(screen.getByRole('status', { name: 'Loading document thumbnail…' })).toBeTruthy();
  if (!image) throw new Error('Ready thumbnail missing');
  fireEvent.load(image);
  act(() => { vi.advanceTimersByTime(1000); });
  expect(screen.queryByRole('status', { name: 'Loading document thumbnail…' })).toBeNull();
});

it('clears an unfinished thumbnail spinner immediately when the image loads', async () => {
  vi.useFakeTimers();
  let finish: ((result: string) => void) | undefined;
  thumbnails.load.mockImplementation(() => new Promise(resolve => { finish = resolve; }));
  vi.stubGlobal('IntersectionObserver', class {
    constructor(private callback: (entries: { isIntersecting: boolean }[]) => void) {}
    observe() { this.callback([{ isIntersecting: true }]); }
    disconnect() {}
  });
  const view = render(<DocumentGallery items={[{ pdfUrl: 'https://fresh-teacher.github.io/pending.pdf', description: '', price: 5000 }]} />);
  act(() => { vi.advanceTimersByTime(150); });
  expect(screen.queryByRole('status', { name: 'Loading document thumbnail…' })).not.toBeNull();
  await act(async () => { finish?.('data:image/png;base64,ready'); });
  const image = view.container.querySelector<HTMLImageElement>('.dg-thumb-cover');
  if (!image) throw new Error('Ready thumbnail missing');
  fireEvent.load(image);
  expect(screen.queryByRole('status', { name: 'Loading document thumbnail…' })).toBeNull();
});

it('opens catalog PDFs through the original overlay callback but keeps Word viewing on its dedicated page', async () => {
  vi.stubGlobal('IntersectionObserver', class { observe() {} disconnect() {} });
  const pdf = { pdfUrl: 'https://fresh-teacher.github.io/lesson.pdf', description: '', price: 5000 };
  const word = { ...pdf, pdfUrl: 'https://fresh-teacher.github.io/lesson.docx' };
  const onView = vi.fn();
  await act(async () => { render(<DocumentGallery items={[pdf, word]} onView={onView} />); });
  const view = screen.getByRole('button', { name: /^View$/ });
  fireEvent.click(view);
  expect(onView).toHaveBeenCalledWith(view, pdf);
  expect(screen.getByRole('link', { name: /^View$/ }).getAttribute('href')).toMatch(/^\/doc\//);
  expect(onView).toHaveBeenCalledTimes(1);
});

it('does not request off-screen thumbnails until they approach the viewport', async () => {
  let intersect: ((entries: { isIntersecting: boolean }[]) => void) | undefined;
  vi.stubGlobal('IntersectionObserver', class {
    constructor(callback: (entries: { isIntersecting: boolean }[]) => void) { intersect = callback; }
    observe() {}
    disconnect() {}
  });
  thumbnails.load.mockResolvedValue('data:image/jpeg;base64,ready');
  render(<DocumentGallery items={[{ pdfUrl: 'https://fresh-teacher.github.io/offscreen.pdf', description: '', price: 5000 }]} />);
  await act(async () => {});
  expect(thumbnails.load).not.toHaveBeenCalled();
  await act(async () => { intersect?.([{ isIntersecting: false }]); });
  expect(thumbnails.load).not.toHaveBeenCalled();
  await act(async () => { intersect?.([{ isIntersecting: true }]); });
  expect(thumbnails.load).toHaveBeenCalledExactlyOnceWith('https://fresh-teacher.github.io/offscreen.pdf');
});

it('shows initial PDF feedback before observer delivery without starting downloads', async () => {
  vi.stubGlobal('IntersectionObserver', class { observe() {} disconnect() {} });
  render(<DocumentGallery items={Array.from({ length: 12 }, (_, index) => ({ pdfUrl: `https://fresh-teacher.github.io/first-${index}.pdf`, description: '', price: 5000 }))} />);
  expect(screen.getAllByRole('status', { name: 'Loading document thumbnail…' })).toHaveLength(4);
  await act(async () => {});
  expect(thumbnails.load).not.toHaveBeenCalled();
});

it('switches initial feedback to viewport visibility while keeping offscreen PDF work stopped', async () => {
  let intersect: ((entries: { isIntersecting: boolean }[]) => void) | undefined;
  vi.stubGlobal('IntersectionObserver', class {
    constructor(callback: (entries: { isIntersecting: boolean }[]) => void) { intersect = callback; }
    observe() {} disconnect() {}
  });
  thumbnails.load.mockImplementation(() => new Promise(() => {}));
  render(<DocumentGallery items={[{ pdfUrl: 'https://fresh-teacher.github.io/visibility.pdf', description: '', price: 5000 }]} />);
  expect(screen.getByRole('status', { name: 'Loading document thumbnail…' })).toBeTruthy();
  await act(async () => { intersect?.([{ isIntersecting: false }]); });
  expect(screen.queryByRole('status', { name: 'Loading document thumbnail…' })).toBeNull();
  expect(thumbnails.load).not.toHaveBeenCalled();
  await act(async () => { intersect?.([{ isIntersecting: true }]); });
  expect(screen.getByRole('status', { name: 'Loading document thumbnail…' })).toBeTruthy();
  expect(thumbnails.load).toHaveBeenCalledExactlyOnceWith('https://fresh-teacher.github.io/visibility.pdf');
});

it('never starts PDF thumbnail work or its spinner for Office files', async () => {
  await act(async () => { render(<DocumentGallery items={['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'].map(extension => ({ pdfUrl: `https://fresh-teacher.github.io/lesson.${extension}`, description: '', price: 5000 }))} />); });
  expect(thumbnails.load).not.toHaveBeenCalled();
  expect(screen.queryByRole('status', { name: 'Loading document thumbnail…' })).toBeNull();
});

it('ends PDF loading when thumbnail generation fails', async () => {
  thumbnails.load.mockResolvedValue(null);
  vi.stubGlobal('IntersectionObserver', class {
    constructor(private callback: (entries: { isIntersecting: boolean }[]) => void) {}
    observe() { this.callback([{ isIntersecting: true }]); }
    disconnect() {}
  });
  await act(async () => { render(<DocumentGallery items={[{ pdfUrl: 'https://fresh-teacher.github.io/missing.pdf', description: '', price: 5000 }]} />); });
  expect(thumbnails.load).toHaveBeenCalledExactlyOnceWith('https://fresh-teacher.github.io/missing.pdf');
  expect(screen.queryByRole('status', { name: 'Loading document thumbnail…' })).toBeNull();
});