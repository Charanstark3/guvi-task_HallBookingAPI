const express = require('express');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json());

// Data Storage (in-memory arrays)
let rooms = [];
let bookings = [];

// Helper function to check if room exists
const findRoomById = (roomId) => rooms.find(room => room.roomId === roomId);

// Helper function to check if room is available
const isRoomAvailable = (roomId, date, startTime, endTime) => {
    return !bookings.some(booking => 
        booking.roomId === roomId &&
        booking.date === date &&
        ((startTime >= booking.startTime && startTime < booking.endTime) ||
        (endTime > booking.startTime && endTime <= booking.endTime))
    );
};

// 1. Create a Room
app.post('/create-room', (req, res) => {
    const { roomName, seats, amenities, pricePerHour } = req.body;

    // Validate request body
    if (!roomName || !seats || !amenities || !pricePerHour) {
        return res.status(400).json({ message: 'All fields are required' });
    }

    const roomId = rooms.length + 1;
    rooms.push({ roomId, roomName, seats, amenities, pricePerHour });
    res.status(201).json({ message: 'Room created successfully', roomId });
});

// 2. Book a Room
app.post('/book-room', (req, res) => {
    const { customerName, date, startTime, endTime, roomId } = req.body;

    // Validate request body
    if (!customerName || !date || !startTime || !endTime || !roomId) {
        return res.status(400).json({ message: 'All fields are required' });
    }

    // Check if room exists
    if (!findRoomById(roomId)) {
        return res.status(404).json({ message: 'Room not found' });
    }

    // Check if room is available
    if (!isRoomAvailable(roomId, date, startTime, endTime)) {
        return res.status(400).json({ message: 'Room is already booked at the requested time' });
    }

    const bookingId = bookings.length + 1;
    bookings.push({ bookingId, customerName, date, startTime, endTime, roomId });
    res.status(201).json({ message: 'Room booked successfully', bookingId });
});

// 3. List all Rooms with Booked Data
app.get('/rooms', (req, res) => {
    const roomData = rooms.map(room => {
        const roomBookings = bookings.filter(booking => booking.roomId === room.roomId);
        return {
            roomName: room.roomName,
            bookings: roomBookings.map(booking => ({
                customerName: booking.customerName,
                date: booking.date,
                startTime: booking.startTime,
                endTime: booking.endTime,
            }))
        };
    });
    res.json(roomData);
});

// 4. List all Customers with Booked Data
app.get('/customers', (req, res) => {
    const customerData = bookings.map(booking => ({
        customerName: booking.customerName,
        roomName: rooms.find(room => room.roomId === booking.roomId).roomName,
        date: booking.date,
        startTime: booking.startTime,
        endTime: booking.endTime,
    }));
    res.json(customerData);
});

// 5. List how many times a customer has booked rooms
app.get('/customer-bookings/:customerName', (req, res) => {
    const { customerName } = req.params;
    console.log("Requested customer name:", customerName); // Debugging line
    const customerBookings = bookings.filter(booking => booking.customerName === customerName);

    console.log("Found bookings:", customerBookings); // Debugging line

    if (customerBookings.length === 0) {
        return res.status(404).json({ message: 'No bookings found for this customer' });
    }

    const bookingDetails = customerBookings.map(booking => ({
        roomName: rooms.find(room => room.roomId === booking.roomId).roomName,
        date: booking.date,
        startTime: booking.startTime,
        endTime: booking.endTime,
        bookingId: booking.bookingId,
        bookingStatus: 'Confirmed',
        bookingDate: new Date().toISOString(), // You may want to store the actual booking date
    }));

    res.json({ customerName, bookingCount: customerBookings.length, bookings: bookingDetails });
});


// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
