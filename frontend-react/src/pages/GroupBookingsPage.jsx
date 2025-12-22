import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import {
  Loader2,
  Search,
  Users,
  Building2,
  Calendar,
  Eye,
  X,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Phone,
  Mail,
  MapPin,
  User,
  FileText,
  DollarSign,
  Ticket,
  Film,
  RefreshCcw,
  MessageSquare,
  Save,
  Plus,
  Monitor,
  Send
} from 'lucide-react';
import api from '../config/api';
import { toast } from 'sonner';
import { socket, connectSocket, SOCKET_EVENTS } from '../config/socket';
import { useAuth } from '../contexts/AuthContext';

// Fetch bookings
const fetchBookings = async (filters) => {
  const params = new URLSearchParams();
  if (filters.status) params.append('status', filters.status);
  if (filters.serviceType) params.append('serviceType', filters.serviceType);
  if (filters.search) params.append('search', filters.search);
  if (filters.startDate) params.append('startDate', filters.startDate);
  if (filters.endDate) params.append('endDate', filters.endDate);
  params.append('page', filters.page || 1);
  params.append('limit', filters.limit || 20);
  const response = await api.get(`/group-bookings/admin/all?${params.toString()}`);
  return response.data;
};

// Fetch stats
const fetchStats = async () => {
  const response = await api.get('/group-bookings/admin/stats');
  return response.data.data;
};

// Fetch theaters
const fetchTheaters = async () => {
  const response = await api.get('/theaters');
  return response.data.theaters || [];
};

// Fetch rooms by theater
const fetchRooms = async (theaterId) => {
  if (!theaterId) return [];
  const response = await api.get(`/group-bookings/theaters/${theaterId}/rooms`);
  return response.data.data || [];
};

// Fetch showtimes by room and date
const fetchShowtimes = async (roomId, date) => {
  if (!roomId || !date) return [];
  const response = await api.get(`/group-bookings/admin/rooms/${roomId}/showtimes?date=${date}`);
  return response.data.data || [];
};

// Fetch available seats
const fetchAvailableSeats = async (showtimeId) => {
  if (!showtimeId) return null;
  const response = await api.get(`/group-bookings/admin/showtimes/${showtimeId}/seats`);
  return response.data.data;
};

// Fetch booking detail (with reserved_seat_ids)
const fetchBookingDetail = async (bookingId) => {
  const response = await api.get(`/group-bookings/admin/${bookingId}`);
  return response.data.data;
};

// Fetch active movies
const fetchActiveMovies = async () => {
  const response = await api.get('/group-bookings/admin/movies');
  return response.data.data || [];
};

const statusConfig = {
  Requested: {
    label: 'Chờ xử lý',
    color: 'bg-yellow-100 text-yellow-700 border-yellow-300',
    icon: Clock
  },
  Processing: {
    label: 'Đang xử lý',
    color: 'bg-blue-100 text-blue-700 border-blue-300',
    icon: RefreshCcw
  },
  Approved: {
    label: 'Đã duyệt',
    color: 'bg-green-100 text-green-700 border-green-300',
    icon: CheckCircle
  },
  Rejected: {
    label: 'Từ chối',
    color: 'bg-red-100 text-red-700 border-red-300',
    icon: XCircle
  },
  Completed: {
    label: 'Hoàn thành',
    color: 'bg-purple-100 text-purple-700 border-purple-300',
    icon: CheckCircle
  },
  Cancelled: {
    label: 'Đã hủy',
    color: 'bg-gray-100 text-gray-700 border-gray-300',
    icon: XCircle
  }
};

const serviceTypeConfig = {
  group_booking: { 
    label: 'Đặt vé nhóm', 
    icon: Users,
    color: 'bg-blue-100 text-blue-700',
    description: 'Chọn suất chiếu và ghế cho nhóm'
  },
  private_show: { 
    label: 'Chiếu riêng', 
    icon: Film,
    color: 'bg-purple-100 text-purple-700',
    description: 'Tạo suất chiếu riêng cho khách'
  },
  hall_rental: { 
    label: 'Thuê hội trường', 
    icon: Building2,
    color: 'bg-orange-100 text-orange-700',
    description: 'Tạo lịch thuê phòng'
  },
  voucher: { 
    label: 'Voucher doanh nghiệp', 
    icon: Ticket,
    color: 'bg-green-100 text-green-700',
    description: 'Xử lý qua mục Voucher'
  }
};

const GroupBookingsPage = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  // Check if user is manager
  const isManager = user?.role === 'manager';
  const managedTheaterIds = useMemo(() => 
    user?.managedTheaters?.map(t => t.id) || [], 
    [user?.managedTheaters]
  );
  
  const [filters, setFilters] = useState({
    status: '',
    serviceType: '',
    search: '',
    startDate: '',
    endDate: '',
    page: 1,
    limit: 20
  });
  const [searchInput, setSearchInput] = useState('');
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  
  // Form state
  const [editForm, setEditForm] = useState({
    status: '',
    adminNotes: '',
    price: '',
    theaterId: '',
    roomId: '',
    showtimeId: '',
    selectedSeats: [],
    // Private show / Hall rental
    movieId: '',
    privateShowDate: '',
    privateShowTime: '',
    customDuration: '180', // Default 3 hours for hall rental without movie
    // Rejection/Cancellation
    rejectionReason: '',
    // Voucher
    voucherCustomCode: '',
    voucherQuantity: 1,
    voucherDiscountType: 'Percentage',
    voucherDiscountValue: 10,
    voucherMaxDiscount: '',
    voucherValidDays: 30,
    voucherUsagePerCode: 1
  });

  // Voucher state
  const [createdVouchers, setCreatedVouchers] = useState([]);
  const [creatingVouchers, setCreatingVouchers] = useState(false);
  const [sendingVoucherEmail, setSendingVoucherEmail] = useState(false);

  // Dynamic data
  const [rooms, setRooms] = useState([]);
  const [showtimes, setShowtimes] = useState([]);
  const [seatsData, setSeatsData] = useState(null);
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [loadingShowtimes, setLoadingShowtimes] = useState(false);
  const [loadingSeats, setLoadingSeats] = useState(false);
  // Private show - existing showtimes
  const [existingShowtimes, setExistingShowtimes] = useState([]);
  const [loadingExistingShowtimes, setLoadingExistingShowtimes] = useState(false);
  // Available showtimes by movie (for private show)
  const [availableMovieShowtimes, setAvailableMovieShowtimes] = useState([]);
  const [loadingAvailableShowtimes, setLoadingAvailableShowtimes] = useState(false);

  // Queries
  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['group-bookings', filters],
    queryFn: () => fetchBookings(filters),
    placeholderData: keepPreviousData
  });

  const { data: stats } = useQuery({
    queryKey: ['group-booking-stats'],
    queryFn: fetchStats
  });

  const { data: allTheaters = [] } = useQuery({
    queryKey: ['theaters'],
    queryFn: fetchTheaters
  });

  // Filter theaters for manager
  const theaters = useMemo(() => {
    if (isManager && managedTheaterIds.length > 0) {
      return allTheaters.filter(t => managedTheaterIds.includes(t.id));
    }
    return allTheaters;
  }, [allTheaters, isManager, managedTheaterIds]);

  const { data: movies = [] } = useQuery({
    queryKey: ['active-movies'],
    queryFn: fetchActiveMovies
  });

  const bookings = data?.bookings || [];
  const pagination = data?.pagination || { total: 0, pages: 1 };

  // Mutations
  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => api.put(`/group-bookings/admin/${id}`, data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['group-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['group-booking-stats'] });
      toast.success(response.data.message || 'Cập nhật thành công');
      setShowDetailModal(false);
      setSelectedBooking(null);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Lỗi cập nhật');
    }
  });

  const createShowtimeMutation = useMutation({
    mutationFn: (data) => api.post('/group-bookings/admin/private-showtime', data),
    onSuccess: (response) => {
      toast.success('Tạo suất chiếu thành công');
      setEditForm(prev => ({ ...prev, showtimeId: response.data.data.id }));
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Lỗi tạo suất chiếu');
    }
  });

  const resendEmailMutation = useMutation({
    mutationFn: (bookingId) => api.post(`/group-bookings/admin/${bookingId}/resend-email`),
    onSuccess: (response) => {
      toast.success(response.data.message || 'Đã gửi email xác nhận');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Lỗi gửi email');
    }
  });

  // Search debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters(prev => ({ ...prev, search: searchInput, page: 1 }));
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Socket realtime updates
  useEffect(() => {
    connectSocket();

    const handleUpdate = () => {
      queryClient.invalidateQueries({ queryKey: ['group-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['group-booking-stats'] });
    };

    socket.on(SOCKET_EVENTS.GROUP_BOOKING_CREATED, handleUpdate);
    socket.on(SOCKET_EVENTS.GROUP_BOOKING_UPDATED, handleUpdate);

    return () => {
      socket.off(SOCKET_EVENTS.GROUP_BOOKING_CREATED, handleUpdate);
      socket.off(SOCKET_EVENTS.GROUP_BOOKING_UPDATED, handleUpdate);
    };
  }, [queryClient]);

  // Load rooms when theater changes
  const loadRoomsForTheater = async (theaterId) => {
    if (!theaterId) {
      setRooms([]);
      return [];
    }
    setLoadingRooms(true);
    try {
      const roomsData = await fetchRooms(theaterId);
      setRooms(roomsData);
      return roomsData;
    } catch (err) {
      console.error('Error loading rooms:', err);
      setRooms([]);
      return [];
    } finally {
      setLoadingRooms(false);
    }
  };

  // Load showtimes when room changes
  const loadShowtimesForRoom = async (roomId, date) => {
    if (!roomId || !date) {
      setShowtimes([]);
      return;
    }
    setLoadingShowtimes(true);
    try {
      const showtimesData = await fetchShowtimes(roomId, date);
      setShowtimes(showtimesData);
    } catch (err) {
      console.error('Error loading showtimes:', err);
      setShowtimes([]);
    } finally {
      setLoadingShowtimes(false);
    }
  };

  // Load seats when showtime changes
  // Use ref to track if this is initial load (when opening modal with existing seats)
  const isInitialLoadRef = useRef(false);
  
  useEffect(() => {
    if (editForm.showtimeId) {
      setLoadingSeats(true);
      fetchAvailableSeats(editForm.showtimeId)
        .then(setSeatsData)
        .finally(() => setLoadingSeats(false));
      
      // Only reset selectedSeats if NOT initial load
      if (!isInitialLoadRef.current) {
        setEditForm(prev => ({ ...prev, selectedSeats: [] }));
      }
      isInitialLoadRef.current = false;
    } else {
      setSeatsData(null);
      setEditForm(prev => ({ ...prev, selectedSeats: [] }));
    }
  }, [editForm.showtimeId]);

  // Open detail modal
  const openDetail = async (booking) => {
    // Fetch fresh booking data from server to get reserved_seat_ids
    let bookingData = booking;
    try {
      const freshData = await fetchBookingDetail(booking.id);
      bookingData = { ...booking, ...freshData };
    } catch (err) {
      console.error('Error fetching booking detail:', err);
    }
    
    // Mark as initial load if there are reserved seats - prevent useEffect from resetting
    if (bookingData.reserved_seat_ids?.length > 0) {
      isInitialLoadRef.current = true;
    }
    
    setSelectedBooking(bookingData);
    setEditForm({
      status: bookingData.status,
      adminNotes: bookingData.admin_notes || '',
      price: bookingData.price || '',
      theaterId: bookingData.theater_id?.toString() || '',
      roomId: '',
      showtimeId: bookingData.assigned_showtime_id?.toString() || '',
      selectedSeats: bookingData.reserved_seat_ids || [],
      movieId: '',
      privateShowDate: bookingData.preferred_date || '',
      privateShowTime: '10:00',
      customDuration: '180',
      rejectionReason: bookingData.rejection_reason || '',
      // Voucher defaults
      voucherCustomCode: '',
      voucherQuantity: bookingData.voucher_quantity || bookingData.guest_count || 10,
      voucherDiscountType: 'Percentage',
      voucherDiscountValue: 10,
      voucherMaxDiscount: '',
      voucherValidDays: 30,
      voucherUsagePerCode: 1
    });
    setShowtimes([]);
    setSeatsData(null);
    setRooms([]);
    // Load existing vouchers if any
    setCreatedVouchers(bookingData.voucher_codes || []);
    setShowDetailModal(true);

    // Nếu đã có theater_id, auto load rooms và thông tin đã lưu
    if (bookingData.theater_id) {
      const roomsData = await loadRoomsForTheater(bookingData.theater_id);
      
      // Nếu đã có assigned_showtime_id, tìm room của showtime đó
      if (bookingData.assigned_showtime_id && bookingData.Showtime) {
        const roomId = bookingData.Showtime.room_id?.toString();
        if (roomId) {
          setEditForm(prev => ({ ...prev, roomId }));
          // Load showtimes cho room đó
          if (bookingData.preferred_date) {
            await loadShowtimesForRoom(roomId, bookingData.preferred_date);
          }
        }
      }
    }
  };

  // Toggle seat selection
  const toggleSeat = (seatId) => {
    setEditForm(prev => {
      const isSelected = prev.selectedSeats.includes(seatId);
      if (isSelected) {
        return { ...prev, selectedSeats: prev.selectedSeats.filter(id => id !== seatId) };
      } else {
        // Check if we've reached the guest count limit
        if (prev.selectedSeats.length >= (selectedBooking?.guest_count || 0)) {
          toast.error(`Chỉ được chọn tối đa ${selectedBooking?.guest_count} ghế`);
          return prev;
        }
        return { ...prev, selectedSeats: [...prev.selectedSeats, seatId] };
      }
    });
  };

  // Auto select seats - Smart algorithm
  const autoSelectSeats = () => {
    if (!seatsData?.seatsByRow) return;
    
    const count = selectedBooking?.guest_count || 0;
    if (count <= 0) {
      toast.error('Số lượng khách không hợp lệ');
      return;
    }

    // Get all rows with their available seats
    const rowLabels = Object.keys(seatsData.seatsByRow).sort();
    const rowsData = rowLabels.map(label => {
      const seats = seatsData.seatsByRow[label];
      const availableSeats = seats.filter(s => s.is_available).sort((a, b) => a.seat_number - b.seat_number);
      return {
        label,
        seats: availableSeats,
        availableCount: availableSeats.length,
        totalCount: seats.length
      };
    });

    // Calculate total available
    const totalAvailable = rowsData.reduce((sum, r) => sum + r.availableCount, 0);
    if (totalAvailable < count) {
      toast.error(`Không đủ ghế trống! Chỉ còn ${totalAvailable} ghế`);
      return;
    }

    // Priority: middle rows first (better viewing experience)
    // For rows A-J: E, F, D, G, C, H, B, I, A, J
    const middleIndex = Math.floor(rowLabels.length / 2);
    const prioritizedRows = [...rowsData].sort((a, b) => {
      const aIndex = rowLabels.indexOf(a.label);
      const bIndex = rowLabels.indexOf(b.label);
      const aDistance = Math.abs(aIndex - middleIndex);
      const bDistance = Math.abs(bIndex - middleIndex);
      return aDistance - bDistance; // Closer to middle = higher priority
    });

    const selectedSeats = [];
    let remaining = count;

    // Strategy 1: Try to find consecutive seats in best rows
    for (const row of prioritizedRows) {
      if (remaining <= 0) break;
      if (row.availableCount === 0) continue;

      // Find longest consecutive sequence in this row
      const sequences = findConsecutiveSequences(row.seats);
      
      // Sort by: length desc, then position (prefer middle)
      sequences.sort((a, b) => {
        if (b.seats.length !== a.seats.length) return b.seats.length - a.seats.length;
        // Prefer sequences closer to middle of row
        const rowMiddle = row.totalCount / 2;
        const aMid = (a.seats[0].seat_number + a.seats[a.seats.length - 1].seat_number) / 2;
        const bMid = (b.seats[0].seat_number + b.seats[b.seats.length - 1].seat_number) / 2;
        return Math.abs(aMid - rowMiddle) - Math.abs(bMid - rowMiddle);
      });

      for (const seq of sequences) {
        if (remaining <= 0) break;
        
        // Take seats from middle of sequence outward for best positions
        const seatsToTake = Math.min(seq.seats.length, remaining);
        const middleStart = Math.floor((seq.seats.length - seatsToTake) / 2);
        const taken = seq.seats.slice(middleStart, middleStart + seatsToTake);
        
        selectedSeats.push(...taken.map(s => s.id));
        remaining -= taken.length;
      }
    }

    if (selectedSeats.length < count) {
      toast.error('Không thể chọn đủ ghế liền kề');
      return;
    }

    setEditForm(prev => ({ ...prev, selectedSeats }));
    
    // Show which rows were selected
    const selectedRows = [...new Set(selectedSeats.map(id => {
      for (const [label, seats] of Object.entries(seatsData.seatsByRow)) {
        if (seats.find(s => s.id === id)) return label;
      }
      return null;
    }))].filter(Boolean).sort();
    
    toast.success(`Đã chọn ${count} ghế tại hàng ${selectedRows.join(', ')}`);
  };

  // Helper: Find consecutive seat sequences
  const findConsecutiveSequences = (seats) => {
    if (seats.length === 0) return [];
    
    const sequences = [];
    let currentSeq = [seats[0]];
    
    for (let i = 1; i < seats.length; i++) {
      if (seats[i].seat_number === seats[i-1].seat_number + 1) {
        currentSeq.push(seats[i]);
      } else {
        if (currentSeq.length > 0) sequences.push({ seats: [...currentSeq] });
        currentSeq = [seats[i]];
      }
    }
    if (currentSeq.length > 0) sequences.push({ seats: currentSeq });
    
    return sequences;
  };

  // Load existing showtimes for private show
  const loadExistingShowtimes = async (roomId, date) => {
    if (!roomId || !date) {
      setExistingShowtimes([]);
      return;
    }
    setLoadingExistingShowtimes(true);
    try {
      const response = await api.get(`/group-bookings/admin/rooms/${roomId}/showtimes?date=${date}`);
      setExistingShowtimes(response.data.data || []);
    } catch (err) {
      console.error('Error loading existing showtimes:', err);
      setExistingShowtimes([]);
    } finally {
      setLoadingExistingShowtimes(false);
    }
  };

  // Load available showtimes by movie (showtimes with no bookings)
  const loadAvailableShowtimesByMovie = async (movieId, theaterId = null, date = null) => {
    if (!movieId) {
      setAvailableMovieShowtimes([]);
      return;
    }
    setLoadingAvailableShowtimes(true);
    try {
      let url = `/group-bookings/admin/movies/${movieId}/showtimes`;
      const params = new URLSearchParams();
      if (theaterId) params.append('theaterId', theaterId);
      if (date) params.append('date', date);
      if (params.toString()) url += `?${params.toString()}`;
      const response = await api.get(url);
      setAvailableMovieShowtimes(response.data.data || []);
    } catch (err) {
      console.error('Error loading available showtimes:', err);
      setAvailableMovieShowtimes([]);
    } finally {
      setLoadingAvailableShowtimes(false);
    }
  };

  // Select an existing showtime (use instead of creating new)
  const selectExistingShowtime = (showtime) => {
    setEditForm(prev => ({ 
      ...prev, 
      showtimeId: showtime.id.toString(),
      theaterId: showtime.CinemaRoom?.theater_id?.toString() || '',
      roomId: showtime.room_id?.toString() || ''
    }));
    toast.success(`Đã chọn suất chiếu ${formatTime(showtime.start_time)} tại ${showtime.CinemaRoom?.name}`);
  };

  // Get selected movie duration
  const getSelectedMovieDuration = () => {
    if (!editForm.movieId) {
      return parseInt(editForm.customDuration) || 180; // Use custom duration for hall rental
    }
    const movie = movies.find(m => m.id.toString() === editForm.movieId);
    return movie?.duration_min || 120;
  };

  // Calculate estimated end time (movie end + 15 min gap)
  const getEstimatedEndTime = () => {
    if (!editForm.privateShowTime || !editForm.privateShowDate) return null;
    const duration = getSelectedMovieDuration();
    const startDateTime = new Date(`${editForm.privateShowDate}T${editForm.privateShowTime}:00`);
    const movieEndTime = new Date(startDateTime.getTime() + duration * 60000);
    const endWithGap = new Date(movieEndTime.getTime() + 15 * 60000); // +15 min gap
    return { movieEnd: movieEndTime, withGap: endWithGap };
  };

  // Check if new showtime conflicts with existing (within 15 min)
  const checkShowtimeConflict = (newTime) => {
    if (!newTime || existingShowtimes.length === 0) return null;
    
    const newStart = new Date(`${editForm.privateShowDate}T${newTime}:00`);
    const duration = getSelectedMovieDuration();
    const minGapMinutes = 15;
    const newEnd = new Date(newStart.getTime() + duration * 60000); // Phim kết thúc
    const newEndWithGap = new Date(newEnd.getTime() + minGapMinutes * 60000); // + 15 phút gap
    
    for (const showtime of existingShowtimes) {
      const existingStart = new Date(showtime.start_time);
      const existingEnd = new Date(showtime.end_time);
      
      // Check overlap: new showtime (with gap) overlaps with existing start
      // Suất mới kết thúc (bao gồm gap) phải trước suất hiện có bắt đầu
      if (newStart < existingEnd && newEndWithGap > existingStart) {
        if (newEnd <= existingStart && newEndWithGap > existingStart) {
          // Phim kết thúc trước nhưng gap bị chồng
          return `Kết thúc ${formatTime(newEnd)} quá gần suất ${formatTime(existingStart)} (cần cách 15 phút, tức trước ${formatTime(new Date(existingStart.getTime() - minGapMinutes * 60000))})`;
        }
        return `Trùng với suất chiếu ${formatTime(existingStart)} - ${formatTime(existingEnd)}`;
      }
      
      // Check if new showtime starts too close after existing ends
      // Suất mới bắt đầu phải cách suất hiện có kết thúc ít nhất 15 phút
      const gapAfter = (newStart - existingEnd) / 60000; // minutes
      if (gapAfter >= 0 && gapAfter < minGapMinutes) {
        return `Bắt đầu ${formatTime(newStart)} quá gần suất kết thúc lúc ${formatTime(existingEnd)} (cần cách 15 phút, tức sau ${formatTime(new Date(existingEnd.getTime() + minGapMinutes * 60000))})`;
      }
    }
    return null;
  };

  // Create private showtime
  const handleCreatePrivateShowtime = () => {
    if (!editForm.roomId) {
      toast.error('Vui lòng chọn phòng');
      return;
    }
    // Require movie for private_show
    if (selectedBooking?.service_type === 'private_show' && !editForm.movieId) {
      toast.error('Vui lòng chọn phim chiếu');
      return;
    }
    if (!editForm.privateShowDate || !editForm.privateShowTime) {
      toast.error('Vui lòng chọn ngày giờ');
      return;
    }

    // Check conflict
    const conflict = checkShowtimeConflict(editForm.privateShowTime);
    if (conflict) {
      toast.error(conflict);
      return;
    }

    const startTime = `${editForm.privateShowDate}T${editForm.privateShowTime}:00`;
    
    createShowtimeMutation.mutate({
      roomId: parseInt(editForm.roomId),
      movieId: editForm.movieId ? parseInt(editForm.movieId) : null,
      startTime,
      isPrivate: true,
      groupBookingId: selectedBooking?.id,
      customDuration: !editForm.movieId ? parseInt(editForm.customDuration) : null
    });
  };

  // Handle update
  const handleUpdate = () => {
    if (!selectedBooking) return;
    
    // Validate rejection reason
    if (['Rejected', 'Cancelled'].includes(editForm.status) && !editForm.rejectionReason.trim()) {
      toast.error('Vui lòng nhập lý do từ chối/hủy');
      return;
    }

    // Validate before approving - must have all required info
    if (editForm.status === 'Approved') {
      const serviceType = selectedBooking.service_type;
      
      // Voucher type không cần showtime
      if (serviceType !== 'voucher') {
        // All other types need showtime
        if (!editForm.showtimeId) {
          if (serviceType === 'group_booking') {
            toast.error('Vui lòng chọn suất chiếu và ghế trước khi duyệt');
          } else if (serviceType === 'private_show') {
            toast.error('Vui lòng chọn hoặc tạo suất chiếu riêng trước khi duyệt');
          } else if (serviceType === 'hall_rental') {
            toast.error('Vui lòng tạo lịch thuê phòng trước khi duyệt');
          }
          return;
        }
        
        // Group booking needs selected seats
        if (serviceType === 'group_booking' && editForm.selectedSeats.length === 0) {
          toast.error('Vui lòng chọn ghế cho nhóm trước khi duyệt');
          return;
        }
      }

      // Need price
      if (!editForm.price || parseFloat(editForm.price) <= 0) {
        toast.error('Vui lòng nhập giá báo cho khách trước khi duyệt');
        return;
      }
    }
    
    const data = {
      status: editForm.status,
      adminNotes: editForm.adminNotes,
      price: editForm.price ? parseFloat(editForm.price) : null,
      theaterId: editForm.theaterId || null,
      assignedShowtimeId: editForm.showtimeId || null,
      selectedSeats: editForm.selectedSeats,
      rejectionReason: ['Rejected', 'Cancelled'].includes(editForm.status) ? editForm.rejectionReason : null
    };
    
    updateMutation.mutate({ id: selectedBooking.id, data });
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount || 0);
  };

  // Format date
  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatDateTime = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatTime = (date) => {
    if (!date) return '';
    return new Date(date).toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Đặt vé nhóm</h1>
          <p className="text-gray-500">Quản lý yêu cầu đặt vé nhóm và dịch vụ doanh nghiệp</p>
        </div>
        {isFetching && !isLoading && (
          <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FileText className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Tổng yêu cầu</p>
              <p className="text-xl font-bold text-gray-900">{stats?.total || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Clock className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Chờ xử lý</p>
              <p className="text-xl font-bold text-yellow-600">{stats?.requested || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <RefreshCcw className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Đang xử lý</p>
              <p className="text-xl font-bold text-blue-600">{stats?.processing || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Đã duyệt</p>
              <p className="text-xl font-bold text-green-600">{stats?.approved || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <CheckCircle className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Hoàn thành</p>
              <p className="text-xl font-bold text-purple-600">{stats?.completed || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <XCircle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Từ chối/Hủy</p>
              <p className="text-xl font-bold text-red-600">{(stats?.rejected || 0) + (stats?.cancelled || 0)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-100 rounded-lg">
              <DollarSign className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Doanh thu</p>
              <p className="text-lg font-bold text-emerald-600">{formatCurrency(stats?.revenue)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <div className="flex flex-wrap gap-4">
          {/* Search */}
          <div className="flex-1 min-w-[250px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Tìm theo tên, email, SĐT, công ty..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Status filter */}
          <select
            value={filters.status}
            onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value, page: 1 }))}
            className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Tất cả trạng thái</option>
            {Object.entries(statusConfig).map(([key, { label }]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>

          {/* Service type filter */}
          <select
            value={filters.serviceType}
            onChange={(e) => setFilters(prev => ({ ...prev, serviceType: e.target.value, page: 1 }))}
            className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Tất cả dịch vụ</option>
            {Object.entries(serviceTypeConfig).map(([key, { label }]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>

          {/* Date filters */}
          <input
            type="date"
            value={filters.startDate}
            onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value, page: 1 }))}
            className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="date"
            value={filters.endDate}
            onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value, page: 1 }))}
            className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          {/* Clear filters */}
          {(filters.status || filters.serviceType || filters.search || filters.startDate || filters.endDate) && (
            <button
              onClick={() => {
                setFilters({
                  status: '',
                  serviceType: '',
                  search: '',
                  startDate: '',
                  endDate: '',
                  page: 1,
                  limit: 20
                });
                setSearchInput('');
              }}
              className="px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Xóa bộ lọc
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          </div>
        ) : bookings.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-500">
            <AlertCircle className="w-12 h-12 mb-4 text-gray-300" />
            <p>Không có yêu cầu nào</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left py-4 px-4 text-sm font-semibold text-gray-600">Khách hàng</th>
                  <th className="text-left py-4 px-4 text-sm font-semibold text-gray-600">Dịch vụ</th>
                  <th className="text-left py-4 px-4 text-sm font-semibold text-gray-600">Số khách</th>
                  <th className="text-left py-4 px-4 text-sm font-semibold text-gray-600">Ngày mong muốn</th>
                  <th className="text-left py-4 px-4 text-sm font-semibold text-gray-600">Rạp</th>
                  <th className="text-left py-4 px-4 text-sm font-semibold text-gray-600">Suất chiếu</th>
                  <th className="text-left py-4 px-4 text-sm font-semibold text-gray-600">Giá</th>
                  <th className="text-left py-4 px-4 text-sm font-semibold text-gray-600">Trạng thái</th>
                  <th className="text-center py-4 px-4 text-sm font-semibold text-gray-600">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {bookings.map((booking) => {
                  const status = statusConfig[booking.status] || statusConfig.Requested;
                  const StatusIcon = status.icon;
                  const serviceType = serviceTypeConfig[booking.service_type] || serviceTypeConfig.group_booking;
                  const ServiceIcon = serviceType.icon;

                  return (
                    <tr key={booking.id} className="hover:bg-gray-50 transition-colors">
                      <td className="py-4 px-4">
                        <div className="space-y-1">
                          <p className="font-medium text-gray-900">{booking.full_name}</p>
                          <p className="text-sm text-gray-500">{booking.phone}</p>
                          {booking.company_name && (
                            <p className="text-sm text-blue-600">{booking.company_name}</p>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium ${serviceType.color}`}>
                          <ServiceIcon className="w-3 h-3" />
                          {serviceType.label}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-gray-400" />
                          <span className="font-medium">{booking.guest_count}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <span className="text-sm">{formatDate(booking.preferred_date)}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        {booking.Theater ? (
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-gray-400" />
                            <span className="text-sm">{booking.Theater.name}</span>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">Chưa chọn</span>
                        )}
                      </td>
                      <td className="py-4 px-4">
                        {booking.Showtime ? (
                          <div className="space-y-1">
                            <div className="flex items-center gap-1 text-sm">
                              <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                              <span className="font-medium text-gray-700">{formatDate(booking.Showtime.start_time)}</span>
                            </div>
                            <div className="flex items-center gap-1 text-xs text-gray-500">
                              <Clock className="w-3 h-3" />
                              <span>
                                {formatTime(booking.Showtime.start_time)} - {formatTime(booking.Showtime.end_time)}
                              </span>
                            </div>
                            {booking.Showtime.CinemaRoom && (
                              <div className="text-xs text-indigo-600 font-medium">
                                {booking.Showtime.CinemaRoom.name}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400 italic">Chưa có suất chiếu</span>
                        )}
                      </td>
                      <td className="py-4 px-4">
                        {booking.price ? (
                          <span className="font-medium text-emerald-600">{formatCurrency(booking.price)}</span>
                        ) : (
                          <span className="text-sm text-gray-400">Chưa báo giá</span>
                        )}
                      </td>
                      <td className="py-4 px-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${status.color}`}>
                          <StatusIcon className="w-3 h-3" />
                          {status.label}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => openDetail(booking)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Xem chi tiết"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <p className="text-sm text-gray-500">
              Hiển thị {bookings.length} / {pagination.total} yêu cầu
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setFilters(prev => ({ ...prev, page: prev.page - 1 }))}
                disabled={filters.page === 1}
                className="p-2 rounded-lg border border-gray-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm text-gray-600">
                Trang {filters.page} / {pagination.pages}
              </span>
              <button
                onClick={() => setFilters(prev => ({ ...prev, page: prev.page + 1 }))}
                disabled={filters.page >= pagination.pages}
                className="p-2 rounded-lg border border-gray-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {showDetailModal && selectedBooking && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between z-10">
              <h2 className="text-xl font-bold text-gray-900">Chi tiết yêu cầu #{selectedBooking.id}</h2>
              <button
                onClick={() => {
                  setShowDetailModal(false);
                  setSelectedBooking(null);
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Status badge */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border ${statusConfig[selectedBooking.status]?.color}`}>
                    {statusConfig[selectedBooking.status]?.label}
                  </span>
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${serviceTypeConfig[selectedBooking.service_type]?.color}`}>
                    {serviceTypeConfig[selectedBooking.service_type]?.label}
                  </span>
                </div>
                <span className="text-sm text-gray-500">
                  Tạo lúc: {formatDateTime(selectedBooking.created_at)}
                </span>
              </div>

              {/* Customer Info */}
              <div className="bg-gray-50 rounded-xl p-4">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <User className="w-5 h-5 text-blue-500" />
                  Thông tin khách hàng
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Họ tên</p>
                    <p className="font-medium">{selectedBooking.full_name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Điện thoại</p>
                    <p className="font-medium flex items-center gap-1">
                      <Phone className="w-4 h-4 text-gray-400" />
                      {selectedBooking.phone}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="font-medium flex items-center gap-1">
                      <Mail className="w-4 h-4 text-gray-400" />
                      {selectedBooking.email}
                    </p>
                  </div>
                  {selectedBooking.company_name && (
                    <div>
                      <p className="text-sm text-gray-500">Công ty</p>
                      <p className="font-medium flex items-center gap-1">
                        <Building2 className="w-4 h-4 text-gray-400" />
                        {selectedBooking.company_name}
                      </p>
                    </div>
                  )}
                  {selectedBooking.address && (
                    <div className="col-span-2">
                      <p className="text-sm text-gray-500">Địa chỉ</p>
                      <p className="font-medium flex items-center gap-1">
                        <MapPin className="w-4 h-4 text-gray-400" />
                        {selectedBooking.address}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Service Info */}
              <div className="bg-blue-50 rounded-xl p-4">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-500" />
                  Thông tin dịch vụ
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Số khách dự kiến</p>
                    <p className="font-medium text-lg text-blue-600">{selectedBooking.guest_count} người</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Ngày mong muốn</p>
                    <p className="font-medium">{formatDate(selectedBooking.preferred_date)}</p>
                  </div>
                  {selectedBooking.region && (
                    <div>
                      <p className="text-sm text-gray-500">Khu vực</p>
                      <p className="font-medium flex items-center gap-1">
                        <MapPin className="w-4 h-4 text-blue-400" />
                        {selectedBooking.region}
                      </p>
                    </div>
                  )}
                  {selectedBooking.Theater && (
                    <div>
                      <p className="text-sm text-gray-500">Rạp đã chọn</p>
                      <p className="font-medium flex items-center gap-1">
                        <Building2 className="w-4 h-4 text-blue-400" />
                        {selectedBooking.Theater.name}
                      </p>
                    </div>
                  )}
                </div>
                {selectedBooking.notes && (
                  <div className="mt-4 pt-4 border-t border-blue-100">
                    <p className="text-sm text-gray-500">Ghi chú của khách</p>
                    <p className="mt-1 text-gray-700 whitespace-pre-wrap bg-white p-3 rounded-lg">{selectedBooking.notes}</p>
                  </div>
                )}
              </div>

              {/* Voucher type - Form tạo voucher */}
              {selectedBooking.service_type === 'voucher' && (
                <div className="bg-purple-50 rounded-xl p-4">
                  <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Ticket className="w-5 h-5 text-purple-500" />
                    Voucher doanh nghiệp
                  </h3>
                  
                  {/* Hiển thị voucher đã tạo */}
                  {createdVouchers.length > 0 && (
                    <div className="mb-4 bg-white rounded-lg p-4 border border-purple-200">
                      <p className="text-sm font-medium text-purple-700 mb-2">
                        ✓ Đã tạo {createdVouchers.length} mã voucher
                      </p>
                      <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                        {createdVouchers.map((v, idx) => (
                          <span key={idx} className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs font-mono">
                            {v.code}
                          </span>
                        ))}
                      </div>
                      {/* Chỉ hiện nút gửi lại email khi đã Completed */}
                      {selectedBooking.status === 'Completed' && (
                        <div className="mt-3 flex gap-2">
                          <button
                            onClick={async () => {
                              setSendingVoucherEmail(true);
                              try {
                                await api.post(`/group-bookings/admin/${selectedBooking.id}/send-voucher-email`);
                                toast.success('Đã gửi email voucher cho khách hàng');
                              } catch (error) {
                                toast.error(error.response?.data?.message || 'Gửi email thất bại');
                              } finally {
                                setSendingVoucherEmail(false);
                              }
                            }}
                            disabled={sendingVoucherEmail}
                            className="flex items-center gap-2 px-3 py-1.5 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700 disabled:opacity-50"
                          >
                            {sendingVoucherEmail ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
                            Gửi lại email voucher
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Form tạo voucher (chỉ hiện khi Processing hoặc Approved và chưa có voucher) */}
                  {['Processing', 'Approved'].includes(selectedBooking.status) && createdVouchers.length === 0 && (
                    <div className="space-y-4">
                      {/* Custom prefix */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Prefix mã voucher (tuỳ chọn)
                        </label>
                        <input
                          type="text"
                          value={editForm.voucherCustomCode}
                          onChange={(e) => setEditForm(prev => ({ ...prev, voucherCustomCode: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '') }))}
                          placeholder="VD: NOEL2025, SUMMER (để trống nếu không cần)"
                          maxLength="20"
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 font-mono text-lg tracking-wider"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          {editForm.voucherCustomCode 
                            ? `Mã sẽ có dạng: ABS-${editForm.voucherCustomCode}-A2XQ3`
                            : 'Mã sẽ có dạng: ABS-A2XQ3 (5 ký tự ngẫu nhiên)'}
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Số lượng voucher
                          </label>
                          <input
                            type="number"
                            value={editForm.voucherQuantity || ''}
                            onChange={(e) => setEditForm(prev => ({ ...prev, voucherQuantity: e.target.value === '' ? '' : parseInt(e.target.value) }))}
                            min="1"
                            max="100"
                            placeholder="VD: 10"
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Loại giảm giá
                          </label>
                          <select
                            value={editForm.voucherDiscountType}
                            onChange={(e) => setEditForm(prev => ({ ...prev, voucherDiscountType: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                          >
                            <option value="Percentage">Giảm theo %</option>
                            <option value="FixedAmount">Giảm số tiền cố định</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            {editForm.voucherDiscountType === 'Percentage' ? 'Phần trăm giảm (%)' : 'Số tiền giảm (VNĐ)'}
                          </label>
                          <input
                            type="number"
                            value={editForm.voucherDiscountValue === 0 ? '' : editForm.voucherDiscountValue}
                            onChange={(e) => setEditForm(prev => ({ ...prev, voucherDiscountValue: e.target.value === '' ? 0 : parseFloat(e.target.value) }))}
                            min="0"
                            max={editForm.voucherDiscountType === 'Percentage' ? 100 : 10000000}
                            step={editForm.voucherDiscountType === 'Percentage' ? 1 : 1000}
                            placeholder={editForm.voucherDiscountType === 'Percentage' ? 'VD: 10' : 'VD: 50000'}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                          />
                        </div>
                        {editForm.voucherDiscountType === 'Percentage' && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Giảm tối đa (VNĐ)
                            </label>
                            <input
                              type="number"
                              value={editForm.voucherMaxDiscount}
                              onChange={(e) => setEditForm(prev => ({ ...prev, voucherMaxDiscount: e.target.value }))}
                              placeholder="Không giới hạn"
                              min="0"
                              step="10000"
                              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                            />
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Hiệu lực (ngày)
                          </label>
                          <input
                            type="number"
                            value={editForm.voucherValidDays || ''}
                            onChange={(e) => setEditForm(prev => ({ ...prev, voucherValidDays: e.target.value === '' ? '' : parseInt(e.target.value) }))}
                            min="1"
                            max="365"
                            placeholder="VD: 30"
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Số lần dùng/mã
                          </label>
                          <input
                            type="number"
                            value={editForm.voucherUsagePerCode || ''}
                            onChange={(e) => setEditForm(prev => ({ ...prev, voucherUsagePerCode: e.target.value === '' ? '' : parseInt(e.target.value) }))}
                            min="1"
                            max="100"
                            placeholder="VD: 1"
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                          />
                        </div>
                      </div>

                      <button
                        onClick={async () => {
                          setCreatingVouchers(true);
                          try {
                            const response = await api.post(`/group-bookings/admin/${selectedBooking.id}/vouchers`, {
                              custom_prefix: editForm.voucherCustomCode || '',
                              quantity: editForm.voucherQuantity,
                              discount_type: editForm.voucherDiscountType,
                              discount_value: editForm.voucherDiscountValue,
                              max_discount: editForm.voucherMaxDiscount ? parseFloat(editForm.voucherMaxDiscount) : null,
                              valid_days: editForm.voucherValidDays,
                              usage_per_code: editForm.voucherUsagePerCode
                            });
                            setCreatedVouchers(response.data.vouchers);
                            toast.success(`Đã tạo ${response.data.vouchers.length} mã voucher`);
                            // Refresh booking data
                            queryClient.invalidateQueries({ queryKey: ['group-bookings'] });
                          } catch (error) {
                            toast.error(error.response?.data?.message || 'Tạo voucher thất bại');
                          } finally {
                            setCreatingVouchers(false);
                          }
                        }}
                        disabled={creatingVouchers}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors"
                      >
                        {creatingVouchers ? <Loader2 className="w-4 h-4 animate-spin" /> : <Ticket className="w-4 h-4" />}
                        Tạo {editForm.voucherQuantity} voucher
                      </button>
                    </div>
                  )}

                  {/* Thông báo khi đã hoàn thành */}
                  {selectedBooking.status === 'Completed' && createdVouchers.length > 0 && (
                    <p className="text-sm text-green-600 mt-2">
                      ✓ Đã gửi email voucher cho khách hàng khi hoàn thành đơn
                    </p>
                  )}
                </div>
              )}

              {/* Group Booking - Hiển thị thông tin đã chọn (khi Approved/Completed/Cancelled) */}
              {selectedBooking.service_type === 'group_booking' && ['Approved', 'Completed', 'Cancelled'].includes(selectedBooking.status) && selectedBooking.Showtime && (
                <div className="bg-green-50 rounded-xl p-4">
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    Thông tin đã xác nhận
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Rạp</p>
                      <p className="font-medium">{selectedBooking.Theater?.name || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Phòng</p>
                      <p className="font-medium">{selectedBooking.Showtime?.CinemaRoom?.name || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Phim</p>
                      <p className="font-medium">{selectedBooking.Showtime?.Movie?.title || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Suất chiếu</p>
                      <p className="font-medium">{formatDateTime(selectedBooking.Showtime?.start_time)}</p>
                    </div>
                    {selectedBooking.price && (
                      <div>
                        <p className="text-sm text-gray-500">Giá</p>
                        <p className="font-medium text-green-600">{formatCurrency(selectedBooking.price)}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Group Booking - Select showtime & seats (chỉ hiện khi Processing) */}
              {selectedBooking.service_type === 'group_booking' && selectedBooking.status === 'Processing' && (
                <div className="bg-indigo-50 rounded-xl p-4">
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Users className="w-5 h-5 text-indigo-500" />
                    Chọn suất chiếu và ghế
                  </h3>
                  
                  <div className="space-y-4">
                    {/* Theater & Room selection */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Rạp {selectedBooking.region && <span className="text-indigo-500">(KV: {selectedBooking.region})</span>}
                        </label>
                        <select
                          value={editForm.theaterId}
                          onChange={(e) => {
                            const newTheaterId = e.target.value;
                            setEditForm(prev => ({ ...prev, theaterId: newTheaterId, roomId: '', showtimeId: '', movieId: '', selectedSeats: [] }));
                            setShowtimes([]);
                            setSeatsData(null);
                            loadRoomsForTheater(newTheaterId);
                          }}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                          <option value="">Chọn rạp</option>
                          {/* Filter theaters by region if available, otherwise show all */}
                          {theaters
                            .filter(t => !selectedBooking.region || t.city?.toLowerCase().includes(selectedBooking.region.toLowerCase()))
                            .map((theater) => (
                              <option key={theater.id} value={theater.id}>
                                {theater.name} - {theater.city}
                                {selectedBooking.theater_id === theater.id && ' ✓ (Khách chọn)'}
                              </option>
                            ))}
                          {/* Show all theaters option if region filter is active */}
                          {selectedBooking.region && theaters.filter(t => t.city?.toLowerCase().includes(selectedBooking.region.toLowerCase())).length === 0 && (
                            theaters.map((theater) => (
                              <option key={theater.id} value={theater.id}>
                                {theater.name} - {theater.city}
                              </option>
                            ))
                          )}
                        </select>
                        {selectedBooking.region && theaters.filter(t => t.city?.toLowerCase().includes(selectedBooking.region.toLowerCase())).length === 0 && (
                          <p className="text-xs text-orange-500 mt-1">Không tìm thấy rạp tại khu vực "{selectedBooking.region}", hiển thị tất cả</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Phòng chiếu</label>
                        <select
                          value={editForm.roomId}
                          onChange={(e) => {
                            const newRoomId = e.target.value;
                            setEditForm(prev => ({ ...prev, roomId: newRoomId, showtimeId: '', movieId: '', selectedSeats: [] }));
                            setSeatsData(null);
                            if (newRoomId && selectedBooking?.preferred_date) {
                              loadShowtimesForRoom(newRoomId, selectedBooking.preferred_date);
                            } else {
                              setShowtimes([]);
                            }
                          }}
                          disabled={!editForm.theaterId || loadingRooms}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100"
                        >
                          <option value="">{loadingRooms ? 'Đang tải...' : 'Chọn phòng'}</option>
                          {rooms.map((room) => (
                            <option key={room.id} value={room.id}>
                              {room.name} ({room.seat_count} ghế)
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Movie filter for showtimes */}
                    {editForm.roomId && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Lọc theo phim <span className="text-gray-400 font-normal">(tùy chọn)</span>
                        </label>
                        <select
                          value={editForm.movieId}
                          onChange={(e) => setEditForm(prev => ({ ...prev, movieId: e.target.value, showtimeId: '' }))}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                          <option value="">Tất cả phim</option>
                          {/* Get unique movies from showtimes */}
                          {[...new Map(showtimes.filter(s => s.Movie).map(s => [s.Movie.id, s.Movie])).values()].map((movie) => (
                            <option key={movie.id} value={movie.id}>
                              {movie.title}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {/* Showtime selection */}
                    {editForm.roomId && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Suất chiếu ngày {formatDate(selectedBooking.preferred_date)}
                          {editForm.movieId && showtimes.filter(s => s.Movie?.id?.toString() === editForm.movieId).length > 0 && (
                            <span className="text-indigo-500 ml-2">
                              ({showtimes.filter(s => s.Movie?.id?.toString() === editForm.movieId).length} suất)
                            </span>
                          )}
                        </label>
                        {loadingShowtimes ? (
                          <div className="flex items-center gap-2 text-gray-500">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Đang tải...
                          </div>
                        ) : showtimes.length === 0 ? (
                          <p className="text-sm text-gray-500">Không có suất chiếu nào trong ngày này</p>
                        ) : (
                          <div className="flex flex-wrap gap-2">
                            {showtimes
                              .filter(showtime => !editForm.movieId || showtime.Movie?.id?.toString() === editForm.movieId)
                              .map((showtime) => (
                              <button
                                key={showtime.id}
                                onClick={() => setEditForm(prev => ({ ...prev, showtimeId: showtime.id.toString() }))}
                                className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                                  editForm.showtimeId === showtime.id.toString()
                                    ? 'bg-indigo-500 text-white border-indigo-500'
                                    : 'bg-white border-gray-200 hover:border-indigo-300'
                                }`}
                              >
                                <div>{formatTime(showtime.start_time)}</div>
                                <div className="text-xs opacity-75">{showtime.Movie?.title}</div>
                              </button>
                            ))}
                            {editForm.movieId && showtimes.filter(s => s.Movie?.id?.toString() === editForm.movieId).length === 0 && (
                              <p className="text-sm text-gray-500">Không có suất chiếu phim này trong ngày</p>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Seat selection */}
                    {editForm.showtimeId && (
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className="block text-sm font-medium text-gray-700">
                            Chọn ghế ({editForm.selectedSeats.length}/{selectedBooking.guest_count})
                          </label>
                          <button
                            onClick={autoSelectSeats}
                            className="text-sm text-indigo-600 hover:text-indigo-700"
                          >
                            Tự động chọn {selectedBooking.guest_count} ghế
                          </button>
                        </div>

                        {loadingSeats ? (
                          <div className="flex items-center gap-2 text-gray-500">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Đang tải sơ đồ ghế...
                          </div>
                        ) : seatsData ? (
                          <div className="bg-white rounded-lg p-4 border border-gray-200">
                            {/* Screen */}
                            <div className="text-center mb-4">
                              <div className="inline-block px-16 py-2 bg-gray-200 rounded text-sm text-gray-600">
                                <Monitor className="w-4 h-4 inline mr-2" />
                                Màn hình
                              </div>
                            </div>

                            {/* Seats grid */}
                            <div className="space-y-2">
                              {Object.entries(seatsData.seatsByRow).map(([row, seats]) => (
                                <div key={row} className="flex items-center gap-2">
                                  <span className="w-6 text-sm font-medium text-gray-500">{row}</span>
                                  <div className="flex gap-1 flex-wrap">
                                    {seats.map((seat) => {
                                      const isSelected = editForm.selectedSeats.includes(seat.id);
                                      const isAvailable = seat.is_available;
                                      return (
                                        <button
                                          key={seat.id}
                                          onClick={() => isAvailable && toggleSeat(seat.id)}
                                          disabled={!isAvailable}
                                          className={`w-7 h-7 rounded text-xs font-medium transition-colors ${
                                            !isAvailable
                                              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                              : isSelected
                                              ? 'bg-indigo-500 text-white'
                                              : 'bg-green-100 text-green-700 hover:bg-green-200'
                                          }`}
                                          title={`${row}${seat.seat_number}`}
                                        >
                                          {seat.seat_number}
                                        </button>
                                      );
                                    })}
                                  </div>
                                </div>
                              ))}
                            </div>

                            {/* Legend */}
                            <div className="flex items-center gap-4 mt-4 pt-4 border-t border-gray-100 text-sm">
                              <div className="flex items-center gap-1">
                                <div className="w-5 h-5 rounded bg-green-100"></div>
                                <span>Trống</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <div className="w-5 h-5 rounded bg-indigo-500"></div>
                                <span>Đã chọn</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <div className="w-5 h-5 rounded bg-gray-300"></div>
                                <span>Đã đặt</span>
                              </div>
                              <div className="ml-auto text-gray-500">
                                Còn trống: {seatsData.availableCount}/{seatsData.totalSeats}
                              </div>
                            </div>
                          </div>
                        ) : null}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Private Show / Hall Rental - Create showtime (chỉ hiện khi Processing) */}
              {(selectedBooking.service_type === 'private_show' || selectedBooking.service_type === 'hall_rental') && selectedBooking.status === 'Processing' && (
                <div className="bg-purple-50 rounded-xl p-4">
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    {selectedBooking.service_type === 'private_show' ? (
                      <><Film className="w-5 h-5 text-purple-500" /> Tạo suất chiếu riêng</>
                    ) : (
                      <><Building2 className="w-5 h-5 text-orange-500" /> Tạo lịch thuê phòng</>
                    )}
                  </h3>

                  <div className="space-y-4">
                    {/* Theater & Room */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Rạp {selectedBooking.region && <span className="text-purple-500">(KV: {selectedBooking.region})</span>}
                        </label>
                        <select
                          value={editForm.theaterId}
                          onChange={(e) => {
                            const newTheaterId = e.target.value;
                            setEditForm(prev => ({ ...prev, theaterId: newTheaterId, roomId: '' }));
                            loadRoomsForTheater(newTheaterId);
                          }}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                        >
                          <option value="">Chọn rạp</option>
                          {theaters
                            .filter(t => !selectedBooking.region || t.city?.toLowerCase().includes(selectedBooking.region.toLowerCase()))
                            .map((theater) => (
                              <option key={theater.id} value={theater.id}>
                                {theater.name} - {theater.city}
                                {selectedBooking.theater_id === theater.id && ' ✓ (Khách chọn)'}
                              </option>
                            ))}
                          {selectedBooking.region && theaters.filter(t => t.city?.toLowerCase().includes(selectedBooking.region.toLowerCase())).length === 0 && (
                            theaters.map((theater) => (
                              <option key={theater.id} value={theater.id}>
                                {theater.name} - {theater.city}
                              </option>
                            ))
                          )}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Phòng</label>
                        <select
                          value={editForm.roomId}
                          onChange={(e) => {
                            const newRoomId = e.target.value;
                            setEditForm(prev => ({ ...prev, roomId: newRoomId }));
                            // Load existing showtimes when room changes
                            if (newRoomId && editForm.privateShowDate) {
                              loadExistingShowtimes(newRoomId, editForm.privateShowDate);
                            } else {
                              setExistingShowtimes([]);
                            }
                          }}
                          disabled={!editForm.theaterId || loadingRooms}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:bg-gray-100"
                        >
                          <option value="">{loadingRooms ? 'Đang tải...' : 'Chọn phòng'}</option>
                          {rooms.map((room) => (
                            <option key={room.id} value={room.id}>
                              {room.name} ({room.seat_count} ghế)
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Movie (required for private_show, optional for hall_rental) */}
                    {(selectedBooking.service_type === 'private_show' || selectedBooking.service_type === 'hall_rental') && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Phim chiếu {selectedBooking.service_type === 'private_show' && <span className="text-red-500">*</span>}
                          {selectedBooking.service_type === 'hall_rental' && <span className="text-gray-400 text-xs ml-1">(tùy chọn)</span>}
                        </label>
                        <select
                          value={editForm.movieId}
                          onChange={(e) => {
                            const newMovieId = e.target.value;
                            setEditForm(prev => ({ ...prev, movieId: newMovieId }));
                            // Load available showtimes when movie changes (with preferred date)
                            if (newMovieId) {
                              loadAvailableShowtimesByMovie(newMovieId, editForm.theaterId || null, editForm.privateShowDate || null);
                            } else {
                              setAvailableMovieShowtimes([]);
                            }
                          }}
                          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                            selectedBooking.service_type === 'private_show' && !editForm.movieId ? 'border-orange-300 bg-orange-50' : 'border-gray-200'
                          }`}
                        >
                          <option value="">{selectedBooking.service_type === 'private_show' ? '-- Chọn phim (bắt buộc) --' : '-- Chọn phim (nếu có) --'}</option>
                          {movies.map((movie) => (
                            <option key={movie.id} value={movie.id}>
                              {movie.title} ({movie.duration_min} phút)
                            </option>
                          ))}
                        </select>
                        {editForm.movieId && (
                          <p className="text-xs text-purple-600 mt-1">
                            Thời lượng: {getSelectedMovieDuration()} phút
                          </p>
                        )}
                        {selectedBooking.service_type === 'hall_rental' && !editForm.movieId && (
                          <div className="mt-2">
                            <label className="block text-xs text-gray-600 mb-1">Thời lượng thuê (phút)</label>
                            <select
                              value={editForm.customDuration}
                              onChange={(e) => setEditForm(prev => ({ ...prev, customDuration: e.target.value }))}
                              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                            >
                              <option value="60">1 tiếng (60 phút)</option>
                              <option value="90">1.5 tiếng (90 phút)</option>
                              <option value="120">2 tiếng (120 phút)</option>
                              <option value="150">2.5 tiếng (150 phút)</option>
                              <option value="180">3 tiếng (180 phút)</option>
                              <option value="210">3.5 tiếng (210 phút)</option>
                              <option value="240">4 tiếng (240 phút)</option>
                              <option value="300">5 tiếng (300 phút)</option>
                              <option value="360">6 tiếng (360 phút)</option>
                              <option value="480">8 tiếng (480 phút)</option>
                            </select>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Available Showtimes (existing, no bookings) */}
                    {(selectedBooking.service_type === 'private_show' || selectedBooking.service_type === 'hall_rental') && editForm.movieId && (
                      <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                        <p className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                          <Film className="w-4 h-4 text-green-500" />
                          Suất chiếu có sẵn ngày {editForm.privateShowDate ? formatDate(editForm.privateShowDate) : '(chưa chọn ngày)'}
                        </p>
                        {!editForm.privateShowDate ? (
                          <p className="text-sm text-orange-600">Vui lòng chọn ngày bên dưới để xem suất chiếu có sẵn.</p>
                        ) : loadingAvailableShowtimes ? (
                          <div className="flex items-center gap-2 text-gray-500 text-sm">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Đang tải...
                          </div>
                        ) : availableMovieShowtimes.length === 0 ? (
                          <p className="text-sm text-gray-500">Không có suất chiếu nào trống trong ngày này. Vui lòng tạo suất chiếu mới bên dưới.</p>
                        ) : (
                          <div className="space-y-2 max-h-48 overflow-y-auto">
                            {availableMovieShowtimes.map((showtime) => (
                              <div 
                                key={showtime.id}
                                className={`flex items-center justify-between p-2 rounded-lg border cursor-pointer transition-colors ${
                                  editForm.showtimeId === showtime.id.toString()
                                    ? 'bg-green-100 border-green-400'
                                    : 'bg-white border-gray-200 hover:border-green-300'
                                }`}
                                onClick={() => selectExistingShowtime(showtime)}
                              >
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium text-sm">
                                      {formatDate(showtime.start_time)} - {formatTime(showtime.start_time)}
                                    </span>
                                    <span className="text-xs text-gray-500">
                                      đến {formatTime(showtime.end_time)}
                                    </span>
                                  </div>
                                  <div className="text-xs text-gray-500 mt-1">
                                    {showtime.CinemaRoom?.Theater?.name} - {showtime.CinemaRoom?.name}
                                    <span className="ml-2 text-green-600">
                                      ({showtime.available_count} ghế trống)
                                    </span>
                                  </div>
                                </div>
                                {editForm.showtimeId === showtime.id.toString() && (
                                  <CheckCircle className="w-5 h-5 text-green-500" />
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                        {editForm.showtimeId && (
                          <div className="mt-2 pt-2 border-t border-green-200 flex items-center justify-between">
                            <span className="text-sm text-green-700">✓ Đã chọn suất chiếu có sẵn</span>
                            <button
                              onClick={() => setEditForm(prev => ({ ...prev, showtimeId: '' }))}
                              className="text-xs text-red-500 hover:text-red-700"
                            >
                              Hủy chọn
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Divider - Create new showtime section */}
                    {(selectedBooking.service_type === 'private_show' && editForm.movieId && !editForm.showtimeId) || 
                     (selectedBooking.service_type === 'hall_rental' && !editForm.showtimeId) ? (
                      <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                          <div className="w-full border-t border-gray-300"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                          <span className="px-2 bg-purple-50 text-gray-500">
                            {selectedBooking.service_type === 'hall_rental' && !editForm.movieId ? 'Tạo lịch thuê phòng' : 'Hoặc tạo suất chiếu mới'}
                          </span>
                        </div>
                      </div>
                    ) : null}

                    {/* Date & Time - Only show if no existing showtime selected */}
                    {!editForm.showtimeId && (
                    <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Ngày</label>
                        <input
                          type="date"
                          value={editForm.privateShowDate}
                          onChange={(e) => {
                            const newDate = e.target.value;
                            setEditForm(prev => ({ ...prev, privateShowDate: newDate }));
                            // Load existing showtimes when date changes
                            if (editForm.roomId && newDate) {
                              loadExistingShowtimes(editForm.roomId, newDate);
                            } else {
                              setExistingShowtimes([]);
                            }
                            // Also reload available showtimes by movie for new date
                            if (editForm.movieId && newDate) {
                              loadAvailableShowtimesByMovie(editForm.movieId, editForm.theaterId || null, newDate);
                            }
                          }}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Giờ bắt đầu</label>
                        <input
                          type="time"
                          value={editForm.privateShowTime}
                          onChange={(e) => setEditForm(prev => ({ ...prev, privateShowTime: e.target.value }))}
                          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                            editForm.privateShowTime && checkShowtimeConflict(editForm.privateShowTime)
                              ? 'border-red-300 bg-red-50'
                              : 'border-gray-200'
                          }`}
                        />
                        {editForm.privateShowTime && checkShowtimeConflict(editForm.privateShowTime) && (
                          <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            {checkShowtimeConflict(editForm.privateShowTime)}
                          </p>
                        )}
                        {/* Show estimated end time */}
                        {editForm.privateShowTime && !checkShowtimeConflict(editForm.privateShowTime) && getEstimatedEndTime() && (
                          <p className="text-xs text-green-600 mt-1">
                            ✓ Kết thúc: {formatTime(getEstimatedEndTime().withGap)} ({getSelectedMovieDuration()} phút + 15 phút)
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Warning if room not selected */}
                    {!editForm.roomId && editForm.privateShowDate && (
                      <div className="bg-orange-50 rounded-lg p-3 border border-orange-200">
                        <p className="text-sm text-orange-600 flex items-center gap-2">
                          <AlertCircle className="w-4 h-4" />
                          Vui lòng chọn phòng chiếu bên trên để xem suất chiếu trong ngày
                        </p>
                      </div>
                    )}

                    {/* Existing Showtimes Display */}
                    {editForm.roomId && editForm.privateShowDate && (
                      <div className="bg-white rounded-lg p-3 border border-purple-200">
                        <p className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-purple-500" />
                          Suất chiếu hiện có ngày {formatDate(editForm.privateShowDate)}
                        </p>
                        {loadingExistingShowtimes ? (
                          <div className="flex items-center gap-2 text-gray-500 text-sm">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Đang tải...
                          </div>
                        ) : existingShowtimes.length === 0 ? (
                          <p className="text-sm text-green-600">✓ Chưa có suất chiếu nào - có thể tạo bất kỳ giờ nào</p>
                        ) : (
                          <div className="space-y-2">
                            <div className="flex flex-wrap gap-2">
                              {existingShowtimes.map((showtime) => (
                                <div 
                                  key={showtime.id} 
                                  className="px-3 py-1.5 bg-purple-100 text-purple-700 rounded-lg text-sm"
                                >
                                  <span className="font-medium">{formatTime(showtime.start_time)}</span>
                                  <span className="mx-1">-</span>
                                  <span>{formatTime(showtime.end_time)}</span>
                                  {showtime.Movie && (
                                    <span className="text-purple-500 ml-1">({showtime.Movie.title})</span>
                                  )}
                                </div>
                              ))}
                            </div>
                            <p className="text-xs text-orange-600 mt-2">
                              ⚠️ Suất chiếu mới cần cách các suất hiện có ít nhất 15 phút
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                    
                    {/* Create button - only show when no existing showtime selected */}
                    <div className="flex items-center gap-3">
                      <button
                        onClick={handleCreatePrivateShowtime}
                        disabled={createShowtimeMutation.isPending || !editForm.roomId || !editForm.privateShowDate || !editForm.privateShowTime}
                        className="flex items-center gap-2 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {createShowtimeMutation.isPending ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Plus className="w-4 h-4" />
                        )}
                        Tạo suất chiếu mới
                      </button>
                      {(!editForm.roomId || !editForm.privateShowDate || !editForm.privateShowTime) && (
                        <span className="text-xs text-gray-500">
                          {!editForm.roomId ? '(Chọn phòng)' : !editForm.privateShowDate ? '(Chọn ngày)' : '(Chọn giờ)'}
                        </span>
                      )}
                    </div>
                    </> 
                    )}

                    {/* Show selected showtime info */}
                    {editForm.showtimeId && (
                      <div className="flex items-center gap-2 text-green-600 bg-green-50 px-3 py-2 rounded-lg">
                        <CheckCircle className="w-4 h-4" />
                        <span>Đã chọn suất chiếu #{editForm.showtimeId}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Private Show / Hall Rental - Hiển thị thông tin đã xác nhận */}
              {(selectedBooking.service_type === 'private_show' || selectedBooking.service_type === 'hall_rental') && 
               ['Approved', 'Completed', 'Cancelled'].includes(selectedBooking.status) && 
               selectedBooking.Showtime && (
                <div className="bg-purple-50 rounded-xl p-4">
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    Thông tin đã xác nhận
                  </h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-600">Rạp:</span>
                      <span className="font-medium">{selectedBooking.Showtime?.CinemaRoom?.Theater?.name || 'N/A'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-600">Phòng:</span>
                      <span className="font-medium">{selectedBooking.Showtime?.CinemaRoom?.name || 'N/A'}</span>
                    </div>
                    {selectedBooking.service_type === 'private_show' && selectedBooking.Showtime?.Movie && (
                      <div className="flex items-center gap-2">
                        <Film className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-600">Phim:</span>
                        <span className="font-medium">{selectedBooking.Showtime.Movie.title}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-600">Ngày:</span>
                      <span className="font-medium">
                        {formatDate(selectedBooking.Showtime?.start_time)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-600">Giờ chiếu:</span>
                      <span className="font-medium">
                        {formatTime(selectedBooking.Showtime?.start_time)} - {formatTime(selectedBooking.Showtime?.end_time)}
                      </span>
                    </div>
                    {selectedBooking.final_price && (
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-600">Giá:</span>
                        <span className="font-medium text-green-600">
                          {Number(selectedBooking.final_price).toLocaleString('vi-VN')}đ
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Admin Edit Form - Common fields */}
              <div className="bg-orange-50 rounded-xl p-4">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-orange-500" />
                  Xử lý yêu cầu
                </h3>
                <div className="space-y-4">
                  {/* Status */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Trạng thái
                    </label>
                    <select
                      value={editForm.status}
                      onChange={(e) => setEditForm(prev => ({ ...prev, status: e.target.value }))}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    >
                      {/* Show status options based on current status */}
                      {selectedBooking.status === 'Requested' && (
                        <>
                          <option value="Requested">{statusConfig.Requested.label}</option>
                          <option value="Processing">{statusConfig.Processing.label}</option>
                        </>
                      )}
                      {selectedBooking.status === 'Processing' && (
                        <>
                          <option value="Processing">{statusConfig.Processing.label}</option>
                          <option value="Approved">{statusConfig.Approved.label}</option>
                          <option value="Rejected">{statusConfig.Rejected.label}</option>
                        </>
                      )}
                      {selectedBooking.status === 'Approved' && (
                        <>
                          <option value="Approved">{statusConfig.Approved.label}</option>
                          <option value="Completed">{statusConfig.Completed.label}</option>
                          <option value="Cancelled">{statusConfig.Cancelled.label}</option>
                        </>
                      )}
                      {['Rejected', 'Completed', 'Cancelled'].includes(selectedBooking.status) && (
                        <option value={selectedBooking.status}>{statusConfig[selectedBooking.status]?.label}</option>
                      )}
                    </select>
                    {/* Status flow hint */}
                    <p className="text-xs text-gray-500 mt-1">
                      {selectedBooking.status === 'Requested' && '→ Chuyển sang "Đang xử lý" để nhập thông tin'}
                      {selectedBooking.status === 'Processing' && '→ Nhập thông tin xong, chuyển sang "Đã duyệt" hoặc "Từ chối"'}
                      {selectedBooking.status === 'Approved' && '→ Chuyển sang "Hoàn thành" để gửi email xác nhận cho khách'}
                    </p>
                  </div>

                  {/* Rejection Reason - hiện khi chọn Rejected hoặc Cancelled */}
                  {['Rejected', 'Cancelled'].includes(editForm.status) && selectedBooking.status !== 'Rejected' && selectedBooking.status !== 'Cancelled' && (
                    <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                      <label className="block text-sm font-medium text-red-700 mb-1">
                        <XCircle className="w-4 h-4 inline mr-1" />
                        Lý do {editForm.status === 'Rejected' ? 'từ chối' : 'hủy'} <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        value={editForm.rejectionReason}
                        onChange={(e) => setEditForm(prev => ({ ...prev, rejectionReason: e.target.value }))}
                        placeholder={`Nhập lý do ${editForm.status === 'Rejected' ? 'từ chối' : 'hủy'} yêu cầu này...`}
                        rows={3}
                        className="w-full px-4 py-2 border border-red-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
                      />
                      <p className="text-xs text-red-600 mt-1">
                        * Email thông báo sẽ được gửi cho khách hàng với lý do này
                      </p>
                    </div>
                  )}

                  {/* Hiển thị lý do từ chối/hủy nếu đã có */}
                  {['Rejected', 'Cancelled'].includes(selectedBooking.status) && selectedBooking.rejection_reason && (
                    <div className={`rounded-lg p-4 border ${selectedBooking.status === 'Rejected' ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200'}`}>
                      <p className={`text-sm font-medium mb-1 ${selectedBooking.status === 'Rejected' ? 'text-red-700' : 'text-gray-700'}`}>
                        <XCircle className="w-4 h-4 inline mr-1" />
                        Lý do {selectedBooking.status === 'Rejected' ? 'từ chối' : 'hủy'}:
                      </p>
                      <p className="text-gray-700 whitespace-pre-wrap">{selectedBooking.rejection_reason}</p>
                    </div>
                  )}

                  {/* Price - chỉ edit khi Processing */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Báo giá (VNĐ)
                    </label>
                    <input
                      type="number"
                      value={editForm.price}
                      onChange={(e) => setEditForm(prev => ({ ...prev, price: e.target.value }))}
                      placeholder="Nhập giá báo cho khách"
                      disabled={selectedBooking.status !== 'Processing'}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                    />
                    {editForm.price && (
                      <p className="text-sm text-green-600 mt-1">{formatCurrency(parseFloat(editForm.price))}</p>
                    )}
                  </div>

                  {/* Admin Notes - chỉ edit khi Processing */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Ghi chú nội bộ
                    </label>
                    <textarea
                      value={editForm.adminNotes}
                      onChange={(e) => setEditForm(prev => ({ ...prev, adminNotes: e.target.value }))}
                      placeholder="Ghi chú cho admin..."
                      rows={3}
                      disabled={selectedBooking.status !== 'Processing'}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none disabled:bg-gray-100 disabled:cursor-not-allowed"
                    />
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                {/* Nút gửi lại email (chỉ hiện khi status là Completed) */}
                <div>
                  {selectedBooking.status === 'Completed' && (
                    <button
                      onClick={() => resendEmailMutation.mutate(selectedBooking.id)}
                      disabled={resendEmailMutation.isPending}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
                    >
                      {resendEmailMutation.isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                      Gửi lại email xác nhận
                    </button>
                  )}
                </div>
                
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => {
                      setShowDetailModal(false);
                      setSelectedBooking(null);
                    }}
                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    Đóng
                  </button>
                  {/* Chỉ hiện nút Lưu khi chưa Completed/Cancelled */}
                  {!['Completed', 'Cancelled'].includes(selectedBooking.status) && (
                    <button
                      onClick={handleUpdate}
                      disabled={updateMutation.isPending}
                      className="flex items-center gap-2 px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50"
                    >
                      {updateMutation.isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Save className="w-4 h-4" />
                      )}
                      Lưu thay đổi
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GroupBookingsPage;
