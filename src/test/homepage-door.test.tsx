import { act, cleanup, fireEvent, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Index } from '@/routes/index';

vi.mock('@tanstack/react-router', async importOriginal => {
  const original = await importOriginal<typeof import('@tanstack/react-router')>();
  return { ...original, Link: ({ to, children }: { to: string; children: import('react').ReactNode }) => <a href={to}>{children}</a> };
});

afterEach(() => { cleanup(); sessionStorage.clear(); vi.useRealTimers(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });

function mountDoor() {
  vi.useFakeTimers();
  vi.stubGlobal('matchMedia', () => ({ matches: false }));
  vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue();
  const { container } = render(<Index />);
  const door = container.querySelector('.rope');
  const shelves = container.querySelector('.page-wrapper');
  if (!door || !shelves) throw new Error('Missing door or shelves');
  return { door, shelves };
}

describe('Homepage door gestures', () => {
  it.each(['click', 'touchEnd'] as const)('plays the opening sound on %s even after an early playback attempt', (gesture) => {
    const { door } = mountDoor();
    const audio = document.getElementById('audiocracker');
    if (!(audio instanceof HTMLAudioElement)) throw new Error('Missing door audio');
    audio.setAttribute('data-early-played', '');
    fireEvent[gesture](door);
    expect(audio.play).toHaveBeenCalledTimes(1);
    expect(audio.hasAttribute('data-early-played')).toBe(false);
    fireEvent.click(door);
    expect(audio.play).toHaveBeenCalledTimes(1);
  });

  it('absorbs a touch gesture and opens on release without exposing books during the gesture', () => {
    const { door, shelves } = mountDoor();
    fireEvent.touchStart(door);
    fireEvent.touchMove(door);
    expect(door).not.toHaveClass('door-open');
    expect(shelves).toHaveAttribute('inert');
    expect(fireEvent.touchEnd(door)).toBe(false);
    expect(door).toHaveClass('door-open');
    expect(shelves).not.toHaveAttribute('inert');
  });

  it('waits for a completed mouse click rather than opening under a held pointer', () => {
    const { door } = mountDoor();
    fireEvent.pointerDown(door);
    expect(door).not.toHaveClass('door-open');
    fireEvent.click(door);
    expect(door).toHaveClass('door-open');
  });
});