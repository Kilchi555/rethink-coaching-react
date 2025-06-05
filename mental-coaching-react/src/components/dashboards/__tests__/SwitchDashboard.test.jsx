import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useNavigate } from 'react-router-dom';
import SwitchDashboard from '../SwitchDashboard';
import { AuthContext } from '../../../context/AuthContext';

const mockNavigate = vi.fn();

// 👉 mock useNavigate
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('SwitchDashboard', () => {
  beforeEach(() => {
    mockNavigate.mockReset();
  });

  it('navigates to /staff if user is staff', async () => {
    const mockUser = { role: 'staff', email: 'staff@example.com' };

    render(
      <AuthContext.Provider value={{ user: mockUser, loading: false }}>
        <MemoryRouter initialEntries={['/dashboard']}>
          <Routes>
            <Route path="/dashboard" element={<SwitchDashboard />} />
          </Routes>
        </MemoryRouter>
      </AuthContext.Provider>
    );

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/staff', { replace: true });
    });
  });
});
