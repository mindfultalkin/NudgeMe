import { SERVER } from '../utils/constants';

export async function fetchQueue() {
  try {
    const response = await fetch(`${SERVER}/queue`);
    const data = await response.json();
    return data.queue || [];
  } catch (error) {
    console.error('Error fetching queue:', error);
    return [];
  }
}

export async function fetchHistory() {
  try {
    const response = await fetch(`${SERVER}/history-all`);
    const data = await response.json();
    return data.history || [];
  } catch (error) {
    console.error('Error fetching history:', error);
    return [];
  }
}

export async function fetchSchedule() {
  try {
    const response = await fetch(`${SERVER}/schedule`);
    const data = await response.json();
    return data.schedule || [];
  } catch (error) {
    console.error('Error fetching schedule:', error);
    return [];
  }
}

export async function approveNudge(id) {
  const response = await fetch(`${SERVER}/approve/${id}`, { method: 'POST' });
  return response.ok;
}

export async function rejectNudge(id) {
  const response = await fetch(`${SERVER}/reject/${id}`, { method: 'POST' });
  return response.ok;
}

export async function updateNudge(id, nudge) {
  const response = await fetch(`${SERVER}/queue/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nudge }),
  });
  return response.ok;
}

export async function queueNudge(data) {
  const response = await fetch(`${SERVER}/queue-nudge`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return response.ok;
}

export async function updateSchedule(schedule) {
  const response = await fetch(`${SERVER}/schedule`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ schedule }),
  });
  return response.ok;
}

export async function sendNudge(data) {
  const response = await fetch(`${SERVER}/send-nudge`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return response.json();
}

// Generate nudge using backend AI service (recommended)
export async function generateNudge(topic, coacheeName) {
  try {
    const response = await fetch(
      `${SERVER}/generate-nudge?topic=${encodeURIComponent(topic)}&coacheeName=${encodeURIComponent(coacheeName)}`
    );
    const data = await response.json();
    return data.nudge || 'Error generating nudge.';
  } catch (error) {
    console.error('Error generating nudge:', error);
    return 'Error generating nudge.';
  }
}

