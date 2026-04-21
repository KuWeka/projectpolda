const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const pool = require('../config/db');
const auth = require('../middleware/auth');
const role = require('../middleware/role');
const { asyncHandler } = require('../middleware/errorHandler');
const { validateQuery } = require('../middleware/validation');
const { ticketSchemas } = require('../utils/validationSchemas');
const { ApiResponse } = require('../utils/apiResponse');
const TicketService = require('../services/TicketService');
const { invalidateAllDashboardCaches } = require('../utils/dashboardCache');

// Get all tickets
router.get('/', auth, validateQuery(ticketSchemas.list), asyncHandler(async (req, res) => {
  const { status, urgency, user_id, assigned_technician_id, unassigned, search, page, perPage, sort, order } = req.query;

  // Role-based filtering
  let effectiveUserId = user_id;
  let effectiveAssignedTechnicianId = assigned_technician_id;

  if (req.user.role === 'User') {
    // Users can only see their own tickets
    effectiveUserId = req.user.id;
  } else if (req.user.role === 'Teknisi') {
    // Technicians default to their own assigned tickets.
    // Use unassigned=true to access queue tickets not assigned to any technician.
    if (unassigned === true) {
      effectiveAssignedTechnicianId = '';
    } else if (assigned_technician_id === undefined) {
      effectiveAssignedTechnicianId = req.user.id;
    }
  }
  // Admin can see all tickets

  const result = await TicketService.getTickets(
    {
      status,
      urgency,
      user_id: effectiveUserId,
      assigned_technician_id: effectiveAssignedTechnicianId,
      search,
      sort,
      order
    },
    { page, perPage }
  );

  res.json(ApiResponse.paginated(result.tickets, result.pagination));
}));

// Get ticket details
router.get('/:id', auth, asyncHandler(async (req, res) => {
  const [rows] = await pool.query(`
      SELECT t.*, 
             u.name as reporter_name, 
             u.email as reporter_email,
             u.phone as reporter_phone,
             d.name as reporter_division_name,
             tech.name as technician_name 
      FROM tickets t
      LEFT JOIN users u ON t.user_id = u.id
      LEFT JOIN divisions d ON u.division_id = d.id
      LEFT JOIN users tech ON t.assigned_technician_id = tech.id
      WHERE t.id = ?
    `, [req.params.id]);

  if (rows.length === 0) return res.status(404).json({ message: 'Ticket not found' });

  const ticket = rows[0];
  if (req.user.role === 'User' && ticket.user_id !== req.user.id) {
    return res.status(403).json({ message: 'Forbidden' });
  }

  ticket.expand = {
    user_id: { name: ticket.reporter_name },
    assigned_technician_id: ticket.assigned_technician_id ? { name: ticket.technician_name } : null
  };
  ticket.created = ticket.created_at;
  ticket.updated = ticket.updated_at;

  res.json(ticket);
}));

// Create ticket
const logger = require('../utils/logger');
const { validate } = require('../middleware/validation');
router.post('/', auth, validate(ticketSchemas.create), asyncHandler(async (req, res) => {
  const { title, description, location, urgency, category } = req.body;
  const id = uuidv4();
  const prefix = 'TKT';
  const numStr = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  const ticket_number = `${prefix}-${Date.now().toString().slice(-4)}${numStr}`;

  await pool.query(
    'INSERT INTO tickets (id, ticket_number, title, description, location, urgency, category, status, user_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [id, ticket_number, title, description, location || '', urgency || 'Sedang', category, 'Pending', req.user.id]
  );

  await invalidateAllDashboardCaches();

  const io = req.app.get('io');
  io.to('technicians').emit('new_ticket', { id, ticket_number, title, urgency, category, status: 'Pending' });

  res.status(201).json({ id, ticket_number });
}));

// Update ticket
router.patch('/:id', auth, asyncHandler(async (req, res) => {
  const { status, assigned_technician_id, closed_at, title, description } = req.body;
  const querySets = [];
  const queryArgs = [];

  if (status !== undefined) { querySets.push('status = ?'); queryArgs.push(status); }
  if (assigned_technician_id !== undefined) { querySets.push('assigned_technician_id = ?'); queryArgs.push(assigned_technician_id); }
  if (closed_at !== undefined) {
    // Convert ISO format to MySQL datetime format
    const date = new Date(closed_at);
    const mysqlDate = date.toISOString().slice(0, 19).replace('T', ' ');
    querySets.push('closed_at = ?');
    queryArgs.push(mysqlDate);
  }
  if (title !== undefined) { querySets.push('title = ?'); queryArgs.push(title); }
  if (description !== undefined) { querySets.push('description = ?'); queryArgs.push(description); }

  if (querySets.length === 0) return res.json({ message: 'No updates' });

  queryArgs.push(req.params.id);
  await pool.query(`UPDATE tickets SET ${querySets.join(', ')} WHERE id = ?`, queryArgs);

  await invalidateAllDashboardCaches();

  // Emit update event
  const io = req.app.get('io');
  io.emit('ticket_updated', {
    id: req.params.id,
    status,
    assigned_technician_id,
    updated_by: req.user.id,
    updated_by_role: req.user.role
  });

  res.json({ message: 'Updated' });
}));

// Delete ticket
router.delete('/:id', auth, role('Admin'), asyncHandler(async (req, res) => {
  await pool.query('DELETE FROM tickets WHERE id = ?', [req.params.id]);
  await invalidateAllDashboardCaches();
  res.json({ message: 'Deleted' });
}));

// Notes endpoints
router.get('/:id/notes', auth, asyncHandler(async (req, res) => {
  const [rows] = await pool.query('SELECT n.*, u.name as technician_name, u.role FROM ticket_notes n JOIN users u ON n.technician_id = u.id WHERE n.ticket_id = ? ORDER BY n.created_at ASC', [req.params.id]);
  rows.forEach((r) => {
    r.created = r.created_at;
    r.updated = r.created_at;
    r.expand = { technician_id: { name: r.technician_name, role: r.role } };
  });
  res.json(rows);
}));

router.post('/:id/notes', auth, role('Admin', 'Teknisi'), asyncHandler(async (req, res) => {
  const { note_content } = req.body;
  await pool.query('INSERT INTO ticket_notes (ticket_id, technician_id, note_content) VALUES (?, ?, ?)', [req.params.id, req.user.id, note_content]);
  res.status(201).json({ message: 'Note added' });
}));

module.exports = router;
