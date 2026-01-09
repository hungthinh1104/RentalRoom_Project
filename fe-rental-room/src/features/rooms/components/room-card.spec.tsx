import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';

// Mocks for hooks and modal
let mockIsLoggedIn = false;
const requireLogin = vi.fn();
vi.mock('@/features/auth/hooks/use-require-auth', () => ({
  useRequireAuth: () => ({ requireLogin, isLoggedIn: mockIsLoggedIn }),
}));

let mockIsFavorite = false;
const toggle = vi.fn();
vi.mock('../hooks/use-favorite', () => ({
  useFavorite: (id: string) => ({ isFavorite: mockIsFavorite, toggle, loading: false }),
}));

const toast = vi.fn();
vi.mock('@/hooks/use-toast', () => ({ useToast: () => ({ toast }) }));

// Render a simple placeholder for the modal so tests can detect when it is open
vi.mock('@/features/contracts/components/contact-landlord-modal', () => ({
  ContactLandlordModal: ({ open }: any) => (open ? <div>CONTACT_MODAL_OPEN</div> : null),
}));

import { RoomCard } from './room-card';
import { RoomStatus } from '@/types/enums';

const baseRoom = {
  id: 'room-1',
  roomNumber: '101',
  pricePerMonth: 1000000,
  area: 30,
  maxOccupants: 2,
  images: [{ imageUrl: '/img-1.jpg', isPrimary: true }],
  status: RoomStatus.AVAILABLE,
  property: { name: 'Test Property', landlord: { user: { id: 'land-1', fullName: 'Landlord' } } },
};

describe('RoomCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIsLoggedIn = false;
    mockIsFavorite = false;
  });

  afterEach(() => cleanup());

  it('renders room details (number, property, price, area, occupants)', () => {
    render(<RoomCard room={baseRoom as any} />);

    expect(screen.getByText(/Phòng 101/)).toBeDefined();
    expect(screen.getByText(/Test Property/)).toBeDefined();
    // Price formatted with thousands separator (vi-VN) should show dots
    expect(screen.getByText(/1\.000\.000/)).toBeDefined();
    expect(screen.getByText(/30 m²/)).toBeDefined();
    expect(screen.getByText(/Tối đa 2 người/)).toBeDefined();
  });

  it("shows 'Không có sẵn' overlay when room is not available", () => {
    const rented = { ...baseRoom, status: 'RENTED' };
    render(<RoomCard room={rented as any} />);

    expect(screen.getByText(/Không có sẵn/)).toBeDefined();
  });

  it('calls requireLogin when clicking favorite while not logged in', async () => {
    mockIsLoggedIn = false;
    render(<RoomCard room={baseRoom as any} />);

    const favBtn = screen.getByLabelText(/Thêm vào yêu thích/);
    fireEvent.click(favBtn);

    expect(requireLogin).toHaveBeenCalledWith(`/rooms/${baseRoom.id}`);
  });

  it('opens contact modal when clicking contact while logged in', async () => {
    mockIsLoggedIn = true;
    render(<RoomCard room={baseRoom as any} />);

    expect(screen.queryByText('CONTACT_MODAL_OPEN')).toBeNull();
    const contactBtn = screen.getByText(/Liên hệ chủ nhà/);
    fireEvent.click(contactBtn);

    expect(await screen.findByText('CONTACT_MODAL_OPEN')).toBeDefined();
  });

  it('calls toggle and shows toast when favoriting while logged in', async () => {
    mockIsLoggedIn = true;
    mockIsFavorite = false;
    toggle.mockResolvedValue(undefined);

    render(<RoomCard room={baseRoom as any} />);

    const favBtn = screen.getByLabelText(/Thêm vào yêu thích/);
    fireEvent.click(favBtn);

    expect(toggle).toHaveBeenCalled();
    // toast called with title 'Đã thêm vào yêu thích' because isFavorite was false
    expect(toast).toHaveBeenCalledWith(expect.objectContaining({ title: 'Đã thêm vào yêu thích' }));
  });
});
