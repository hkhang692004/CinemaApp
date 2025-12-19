import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';

// ==================== MOVIES ====================

// Get all movies
export const useMovies = (params = {}) => {
  return useQuery({
    queryKey: ['movies', params],
    queryFn: async () => {
      const { data } = await api.get('/movies', { params });
      return data;
    },
  });
};

// Get single movie
export const useMovie = (id) => {
  return useQuery({
    queryKey: ['movies', id],
    queryFn: async () => {
      const { data } = await api.get(`/movies/${id}`);
      return data;
    },
    enabled: !!id,
  });
};

// Create movie
export const useCreateMovie = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (movieData) => {
      const { data } = await api.post('/movies', movieData);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['movies'] });
    },
  });
};

// Update movie
export const useUpdateMovie = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...movieData }) => {
      const { data } = await api.put(`/movies/${id}`, movieData);
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['movies'] });
      queryClient.invalidateQueries({ queryKey: ['movies', variables.id] });
    },
  });
};

// Delete movie
export const useDeleteMovie = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id) => {
      const { data } = await api.delete(`/movies/${id}`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['movies'] });
    },
  });
};

// ==================== SHOWTIMES ====================

export const useShowtimes = (params = {}) => {
  return useQuery({
    queryKey: ['showtimes', params],
    queryFn: async () => {
      const { data } = await api.get('/showtimes', { params });
      return data;
    },
  });
};

// ==================== ORDERS ====================

export const useOrders = (params = {}) => {
  return useQuery({
    queryKey: ['orders', params],
    queryFn: async () => {
      const { data } = await api.get('/orders', { params });
      return data;
    },
  });
};

// ==================== GROUP BOOKINGS ====================

export const useGroupBookings = (params = {}) => {
  return useQuery({
    queryKey: ['group-bookings', params],
    queryFn: async () => {
      const { data } = await api.get('/group-bookings', { params });
      return data;
    },
  });
};

export const useUpdateGroupBooking = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...data }) => {
      const { data: response } = await api.put(`/group-bookings/${id}`, data);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['group-bookings'] });
    },
  });
};

// ==================== COMBOS ====================

export const useCombos = () => {
  return useQuery({
    queryKey: ['combos'],
    queryFn: async () => {
      const { data } = await api.get('/combos');
      return data;
    },
  });
};

// ==================== NEWS ====================

export const useNews = (params = {}) => {
  return useQuery({
    queryKey: ['news', params],
    queryFn: async () => {
      const { data } = await api.get('/news', { params });
      return data;
    },
  });
};

// ==================== DASHBOARD STATS ====================

export const useDashboardStats = () => {
  return useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const { data } = await api.get('/statistics/dashboard');
      return data;
    },
  });
};

// ==================== THEATERS ====================

export const useTheaters = () => {
  return useQuery({
    queryKey: ['theaters'],
    queryFn: async () => {
      const { data } = await api.get('/theaters');
      return data;
    },
  });
};

// ==================== GENRES ====================

export const useGenres = () => {
  return useQuery({
    queryKey: ['genres'],
    queryFn: async () => {
      const { data } = await api.get('/genres');
      return data;
    },
  });
};
