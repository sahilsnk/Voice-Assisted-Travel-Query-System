import React, { useState, useEffect } from 'react';

const BusManagementSystem = () => {
  const [routes, setRoutes] = useState([]);
  const [showRouteForm, setShowRouteForm] = useState(false);
  const [showBusForm, setShowBusForm] = useState(false);
  const [formData, setFormData] = useState({
    route: { start_location: '', end_location: '', distance: '', total_duration: '' },
    bus: { route_id: '', bus_number: '', bus_type: '', capacity: '', timing: '' }
  });

  useEffect(() => {
    fetchRoutes();
  }, []);

  const fetchRoutes = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/routes');
      const data = await response.json();
      setRoutes(data);
    } catch (error) {
      console.error('Error fetching routes:', error);
    }
  };

  const handleRouteSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:5000/api/routes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData.route)
      });
      if (response.ok) {
        setShowRouteForm(false);
        setFormData({ ...formData, route: { start_location: '', end_location: '', distance: '', total_duration: '' }});
        fetchRoutes();
      }
    } catch (error) {
      console.error('Error adding route:', error);
    }
  };

  const handleBusSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:5000/api/buses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData.bus)
      });
      if (response.ok) {
        setShowBusForm(false);
        setFormData({ ...formData, bus: { route_id: '', bus_number: '', bus_type: '', capacity: '', timing: '' }});
      }
    } catch (error) {
      console.error('Error adding bus:', error);
    }
  };

  const styles = {
    container: {
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '20px'
    },
    header: {
      textAlign: 'center',
      marginBottom: '30px'
    },
    grid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
      gap: '20px'
    },
    card: {
      border: '1px solid #ddd',
      borderRadius: '8px',
      padding: '20px',
      backgroundColor: 'white'
    },
    button: {
      backgroundColor: '#007bff',
      color: 'white',
      border: 'none',
      padding: '10px 20px',
      borderRadius: '5px',
      cursor: 'pointer',
      marginBottom: '10px'
    },
    form: {
      display: 'flex',
      flexDirection: 'column',
      gap: '10px'
    },
    input: {
      padding: '8px',
      borderRadius: '4px',
      border: '1px solid #ddd'
    },
    select: {
      padding: '8px',
      borderRadius: '4px',
      border: '1px solid #ddd'
    },
    submitButton: {
      backgroundColor: '#28a745',
      color: 'white',
      border: 'none',
      padding: '10px',
      borderRadius: '5px',
      cursor: 'pointer'
    },
    routeItem: {
      backgroundColor: '#f8f9fa',
      padding: '10px',
      marginTop: '5px',
      borderRadius: '4px'
    }
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.header}>Bus Management System</h1>
      
      <div style={styles.grid}>
        {/* Route Management */}
        <div style={styles.card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2>Route Management</h2>
            <button 
              style={styles.button}
              onClick={() => setShowRouteForm(!showRouteForm)}
            >
              Add Route
            </button>
          </div>

          {showRouteForm && (
            <form onSubmit={handleRouteSubmit} style={styles.form}>
              <input
                type="text"
                placeholder="Start Location"
                style={styles.input}
                value={formData.route.start_location}
                onChange={(e) => setFormData({
                  ...formData,
                  route: { ...formData.route, start_location: e.target.value }
                })}
              />
              <input
                type="text"
                placeholder="End Location"
                style={styles.input}
                value={formData.route.end_location}
                onChange={(e) => setFormData({
                  ...formData,
                  route: { ...formData.route, end_location: e.target.value }
                })}
              />
              <input
                type="number"
                placeholder="Distance (km)"
                style={styles.input}
                value={formData.route.distance}
                onChange={(e) => setFormData({
                  ...formData,
                  route: { ...formData.route, distance: e.target.value }
                })}
              />
              <input
                type="time"
                placeholder="Total Duration"
                style={styles.input}
                value={formData.route.total_duration}
                onChange={(e) => setFormData({
                  ...formData,
                  route: { ...formData.route, total_duration: e.target.value }
                })}
              />
              <button type="submit" style={styles.submitButton}>
                Submit Route
              </button>
            </form>
          )}
          
          <div style={{ marginTop: '20px' }}>
            <h3>Existing Routes:</h3>
            {routes.map((route) => (
              <div key={route.Route_Id} style={styles.routeItem}>
                {route.Start_Location} → {route.End_Location}
              </div>
            ))}
          </div>
        </div>

        {/* Bus Management */}
        <div style={styles.card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2>Bus Management</h2>
            <button 
              style={styles.button}
              onClick={() => setShowBusForm(!showBusForm)}
            >
              Add Bus
            </button>
          </div>

          {showBusForm && (
            <form onSubmit={handleBusSubmit} style={styles.form}>
              <select
                style={styles.select}
                value={formData.bus.route_id}
                onChange={(e) => setFormData({
                  ...formData,
                  bus: { ...formData.bus, route_id: e.target.value }
                })}
              >
                <option value="">Select Route</option>
                {routes.map((route) => (
                  <option key={route.Route_Id} value={route.Route_Id}>
                    {route.Start_Location} → {route.End_Location}
                  </option>
                ))}
              </select>
              <input
                type="text"
                placeholder="Bus Number"
                style={styles.input}
                value={formData.bus.bus_number}
                onChange={(e) => setFormData({
                  ...formData,
                  bus: { ...formData.bus, bus_number: e.target.value }
                })}
              />
              <select
                style={styles.select}
                value={formData.bus.bus_type}
                onChange={(e) => setFormData({
                  ...formData,
                  bus: { ...formData.bus, bus_type: e.target.value }
                })}
              >
                <option value="">Select Bus Type</option>
                <option value="Regular">Regular</option>
                <option value="Express">Express</option>
                <option value="Luxury">Luxury</option>
              </select>
              <input
                type="number"
                placeholder="Capacity"
                style={styles.input}
                value={formData.bus.capacity}
                onChange={(e) => setFormData({
                  ...formData,
                  bus: { ...formData.bus, capacity: e.target.value }
                })}
              />
              <input
                type="time"
                placeholder="Timing"
                style={styles.input}
                value={formData.bus.timing}
                onChange={(e) => setFormData({
                  ...formData,
                  bus: { ...formData.bus, timing: e.target.value }
                })}
              />
              <button type="submit" style={styles.submitButton}>
                Submit Bus
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default BusManagementSystem;