# Frontend Web Quick Reference Guide

## Quick Implementation Guide for Web Dashboard Updates

This guide provides quick code snippets and examples for implementing the new features in the web frontend.

---

## 🚗 Driver Dashboard Updates

### 1. Student List with Action Buttons

```jsx
import { useState, useEffect } from 'react';
import { api } from '../services/api';

function StudentList({ routeId, students }) {
  const [studentStatuses, setStudentStatuses] = useState({});

  const markAsBoarded = async (studentId) => {
    try {
      await api.post('/driver/student/pickup', { studentId });
      setStudentStatuses(prev => ({
        ...prev,
        [studentId]: { ...prev[studentId], boarded: true, boardedAt: new Date() }
      }));
    } catch (error) {
      console.error('Error marking student as boarded:', error);
    }
  };

  const markAsDropped = async (studentId) => {
    try {
      await api.post('/driver/student/drop', { studentId });
      setStudentStatuses(prev => ({
        ...prev,
        [studentId]: { ...prev[studentId], dropped: true, droppedAt: new Date() }
      }));
    } catch (error) {
      console.error('Error marking student as dropped:', error);
    }
  };

  return (
    <div className="student-list">
      {students.map(student => (
        <div key={student.id} className="student-card">
          <div className="student-info">
            <img src={student.photo} alt={student.name} />
            <div>
              <h3>{student.name}</h3>
              <p>{student.grade}</p>
            </div>
          </div>
          <div className="student-status">
            {student.pickup ? (
              <span className="status-badge boarded">✓ Boarded</span>
            ) : (
              <button 
                onClick={() => markAsBoarded(student.id)}
                className="btn btn-primary"
              >
                Mark as Boarded
              </button>
            )}
            {student.dropped ? (
              <span className="status-badge dropped">✓ Dropped</span>
            ) : (
              <button 
                onClick={() => markAsDropped(student.id)}
                className="btn btn-secondary"
                disabled={!student.pickup}
              >
                Mark as Dropped
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
```

### 2. Journey Controls

```jsx
import { useState } from 'react';
import { api } from '../services/api';

function JourneyControls({ routeId }) {
  const [journeyStatus, setJourneyStatus] = useState('idle');
  const [journeyProgress, setJourneyProgress] = useState(null);

  const startJourney = async () => {
    try {
      const response = await api.post('/driver/journey/start');
      setJourneyStatus('active');
      alert(`Journey started! ${response.data.notificationsSent} parents notified.`);
    } catch (error) {
      console.error('Error starting journey:', error);
    }
  };

  const getJourneyStatus = async () => {
    try {
      const response = await api.get('/driver/journey/status');
      setJourneyProgress(response.data.status);
    } catch (error) {
      console.error('Error fetching journey status:', error);
    }
  };

  useEffect(() => {
    if (journeyStatus === 'active') {
      const interval = setInterval(getJourneyStatus, 5000);
      return () => clearInterval(interval);
    }
  }, [journeyStatus]);

  return (
    <div className="journey-controls">
      <div className="journey-status">
        <span>Status: {journeyStatus}</span>
        {journeyProgress && (
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${journeyProgress.progress}%` }}
            >
              {journeyProgress.completed} / {journeyProgress.total}
            </div>
          </div>
        )}
      </div>
      {journeyStatus === 'idle' && (
        <button onClick={startJourney} className="btn btn-primary">
          Start Journey
        </button>
      )}
    </div>
  );
}
```

### 3. Socket.io Integration for Real-time Updates

```jsx
import { useEffect } from 'react';
import { io } from 'socket.io-client';

function useDriverSocket(token, routeId) {
  useEffect(() => {
    const socket = io('http://your-backend-url', {
      auth: { token }
    });

    socket.emit('join-route-room', { routeId });
    socket.emit('join-driver-room', { driverId: 'your_driver_id' });

    socket.on('journey-started', (data) => {
      console.log('Journey started:', data);
      // Update UI
    });

    socket.on('student-picked-up', (data) => {
      console.log('Student picked up:', data);
      // Update student status in UI
    });

    socket.on('student-dropped', (data) => {
      console.log('Student dropped:', data);
      // Update student status in UI
    });

    return () => socket.disconnect();
  }, [token, routeId]);
}
```

---

## 👨‍👩‍👧 Parent Dashboard Updates

### 1. Diary Signing Component

```jsx
import { useState, useRef } from 'react';
import { api } from '../services/api';

function DiarySigning({ diaryEntryId }) {
  const [signature, setSignature] = useState('');
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);

  const startDrawing = (e) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    const canvas = canvasRef.current;
    const signatureData = canvas.toDataURL('image/png');
    setSignature(signatureData);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setSignature('');
  };

  const submitSignature = async () => {
    if (!signature) {
      alert('Please provide a signature');
      return;
    }

    try {
      await api.post(`/parent/diary/${diaryEntryId}/sign`, {
        signature: signature
      });
      alert('Diary entry signed successfully!');
    } catch (error) {
      console.error('Error signing diary:', error);
    }
  };

  return (
    <div className="diary-signing">
      <h3>Sign Diary Entry</h3>
      <canvas
        ref={canvasRef}
        width={400}
        height={200}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        style={{ border: '1px solid #000', cursor: 'crosshair' }}
      />
      <div className="signature-actions">
        <button onClick={clearSignature} className="btn btn-secondary">
          Clear
        </button>
        <button onClick={submitSignature} className="btn btn-primary">
          Sign & Submit
        </button>
      </div>
    </div>
  );
}
```

### 2. Message to Driver Component

```jsx
import { useState } from 'react';
import { api } from '../services/api';

function MessageDriver({ driverId, studentId }) {
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const sendMessage = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await api.post('/parent/messages/driver', {
        driverId,
        studentId: studentId || null,
        subject: subject || undefined,
        message
      });
      alert('Message sent successfully!');
      setSubject('');
      setMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={sendMessage} className="message-form">
      <h3>Message Driver</h3>
      <input
        type="text"
        placeholder="Subject (optional)"
        value={subject}
        onChange={(e) => setSubject(e.target.value)}
      />
      <textarea
        placeholder="Your message..."
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        required
        rows={5}
      />
      <button type="submit" disabled={loading || !message.trim()}>
        {loading ? 'Sending...' : 'Send Message'}
      </button>
    </form>
  );
}
```

### 3. Message to Teacher Component

```jsx
import { useState } from 'react';
import { api } from '../services/api';

function MessageTeacher({ teacherId, studentId }) {
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const sendMessage = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await api.post('/parent/messages/teacher', {
        teacherId,
        studentId: studentId || null,
        subject: subject || undefined,
        message
      });
      alert('Message sent successfully!');
      setSubject('');
      setMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={sendMessage} className="message-form">
      <h3>Message Teacher</h3>
      <input
        type="text"
        placeholder="Subject (optional)"
        value={subject}
        onChange={(e) => setSubject(e.target.value)}
      />
      <textarea
        placeholder="Your message..."
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        required
        rows={5}
      />
      <button type="submit" disabled={loading || !message.trim()}>
        {loading ? 'Sending...' : 'Send Message'}
      </button>
    </form>
  );
}
```

### 4. Socket.io Integration for Parents

```jsx
import { useEffect } from 'react';
import { io } from 'socket.io-client';

function useParentSocket(token, parentId, routeId) {
  useEffect(() => {
    const socket = io('http://your-backend-url', {
      auth: { token }
    });

    socket.emit('join-parent-room', { parentId });
    if (routeId) {
      socket.emit('join-route-room', { routeId });
    }

    socket.on('notification', (data) => {
      console.log('Notification received:', data);
      // Show notification to user
      // Update UI based on notification type
    });

    socket.on('journey-started', (data) => {
      console.log('Journey started:', data);
      // Show notification
    });

    socket.on('student-picked-up', (data) => {
      console.log('Student picked up:', data);
      // Update student status
    });

    socket.on('student-dropped', (data) => {
      console.log('Student dropped:', data);
      // Update student status
    });

    return () => socket.disconnect();
  }, [token, parentId, routeId]);
}
```

---

## 📝 API Service Configuration

Make sure your API service includes authentication:

```javascript
// services/api.js
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://your-backend-url/api',
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export { api };
```

---

## 🎨 CSS Styling Examples

```css
/* Student List */
.student-list {
  display: grid;
  gap: 1rem;
}

.student-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  border: 1px solid #ddd;
  border-radius: 8px;
}

.student-info {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.status-badge {
  padding: 0.5rem 1rem;
  border-radius: 4px;
  font-weight: bold;
}

.status-badge.boarded {
  background-color: #4CAF50;
  color: white;
}

.status-badge.dropped {
  background-color: #2196F3;
  color: white;
}

/* Journey Controls */
.journey-controls {
  padding: 1rem;
  background: #f5f5f5;
  border-radius: 8px;
}

.progress-bar {
  width: 100%;
  height: 24px;
  background-color: #e0e0e0;
  border-radius: 12px;
  overflow: hidden;
  margin-top: 0.5rem;
}

.progress-fill {
  height: 100%;
  background-color: #4CAF50;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: bold;
  transition: width 0.3s;
}

/* Diary Signing */
.diary-signing {
  padding: 1rem;
}

.diary-signing canvas {
  background: white;
  border: 2px solid #333;
  border-radius: 4px;
}

.signature-actions {
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
}

/* Message Form */
.message-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1rem;
}

.message-form input,
.message-form textarea {
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
}

.message-form button {
  padding: 0.75rem;
  background-color: #2196F3;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
}

.message-form button:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}
```

---

## ✅ Implementation Checklist

### Driver Dashboard
- [ ] Add student list component
- [ ] Add "Mark as Boarded" button
- [ ] Add "Mark as Dropped" button
- [ ] Add journey start button
- [ ] Add journey status display
- [ ] Add progress indicator
- [ ] Integrate Socket.io for real-time updates

### Parent Dashboard
- [ ] Add diary signing component
- [ ] Add signature canvas
- [ ] Add "Message Driver" button/form
- [ ] Add "Message Teacher" button/form
- [ ] Add message history view
- [ ] Add notification center
- [ ] Integrate Socket.io for real-time updates

---

## 🚀 Next Steps

1. Copy the code snippets above
2. Adapt to your existing component structure
3. Style according to your design system
4. Test all functionality
5. Deploy to production

For complete API documentation, see `MOBILE_APP_INTEGRATION_DOCUMENTATION.md`

